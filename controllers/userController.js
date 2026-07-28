const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = await scrypt(password, salt, 64);

  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  if (
    typeof inputPassword !== "string" ||
    typeof storedHash !== "string"
  ) {
    return false;
  }

  const parts = storedHash.split(":");

  if (parts.length !== 2) {
    return false;
  }

  const [salt, storedKey] = parts;

  if (!salt || !storedKey) {
    return false;
  }

  try {
    const storedKeyBuffer = Buffer.from(storedKey, "hex");
    const derivedKey = await scrypt(inputPassword, salt, 64);

    if (storedKeyBuffer.length !== derivedKey.length) {
      return false;
    }

  return crypto.timingSafeEqual(
    storedKeyBuffer,
    derivedKey,
  );
} catch {
  return false;
}
}

async function register(req, res) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const existingUser = global.users.find(
    (user) => user.email === value.email
  );

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await hashPassword(value.password);

  const newUser = {
    id: global.users.length + 1,
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  global.users.push(newUser);

  // User is now logged in
  global.user_id = newUser;

  return res.status(201).json({
      name: newUser.name,
      email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body || {};

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : email;

  const user = global.users.find(
    (currentUser) => currentUser.email === normalizedEmail,
  );

  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const passwordMatches = await comparePassword(
    password,
    user.hashedPassword,
  );

  if (!passwordMatches) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  global.user_id = user;

  return res.status(200).json({
    name: user.name,
    email: user.email,
  });
}

function logoff(req, res) {
  global.user_id = null;

  return res.status(200).json({});
}

module.exports = {
  register,
  logon,
  logoff,
};