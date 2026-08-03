const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const pool = require("../db/pg-pool");

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

async function register(req, res, next) {
  if (!req.body) {
    req.body = {};
  }

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  value.hashed_password = await hashPassword(value.password);

  let result;

  try {
    result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password],
    );
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({
      message: "User already exists",
    });
  }

    return next(e);
  }

  const newUser = result.rows[0];

  // User is now logged in
  global.user_id = newUser.id;

  return res.status(201).json({
      name: newUser.name,
      email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body || {};

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : email;

  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const user = result.rows[0];

  const passwordMatches = await comparePassword(
    password,
    user.hashed_password,
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