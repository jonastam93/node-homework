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
  const existingUsers = await pool.query(
    `SELECT id, email
     FROM users
     ORDER BY id`,
  );

  const { error, value } = userSchema.validate(req.body || {}, {
    abortEarly: false,
  });

  if (error) {
    console.log("VALIDATION FAILED", error.details);

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

    global.user_id = result.rows[0].id;

    return res.status(201).json({
      name: result.rows[0].name,
      email: result.rows[0].email,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    return next(err);
  }
}

async function logon(req, res) {
  const { email, password } = req.body || {};

  if (
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, email, name, hashed_password
     FROM users
     WHERE email = $1`,
    [normalizedEmail],
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

  // Store only the numeric database ID.
  global.user_id = user.id;

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