const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

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

    return crypto.timingSafeEqual(storedKeyBuffer, derivedKey);
  } catch {
    return false;
  }
}

async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  
  const hashedPassword = await hashPassword(value.password);

  let user = null;
    
  try {
    user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        hashedPassword,
      },
      select: {
        name: true,
        email: true,
        id: true,
      },
    });
  } catch (err) {
    if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2002"
    ) {
      return res.status(400).json({
        message: "Email already registered",
      });
    } else {
      return next(err);
    }
  }

  global.user_id = user.id;

  return res.status(201).json({
    name: user.name,
    email: user.email,
  });
}

async function logon(req, res, next) {
  try {
    let { email, password } = req.body;

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await comparePassword(
      password,
      user.hashedPassword,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    global.user_id = user.id;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return next(error);
  }
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