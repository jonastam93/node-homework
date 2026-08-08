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

    return crypto.timingSafeEqual(storedKeyBuffer, derivedKey);
  } catch {
    return false;
  }
}

async function register(req, res, next) {
  const { error, value } = userSchema.validate(req.body || {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const hashedPassword = await hashPassword(value.password);

    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashedPassword],
    );

    const user = result.rows[0];

    global.user_id = user.id;

    return res.status(201).json({
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    return next(error);
  }
}

async function logon(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `SELECT id, email, name, hashed_password
       FROM users
       WHERE email = $1`,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const passwordMatches = await comparePassword(
      password,
      user.hashed_password,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Unauthorized",
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