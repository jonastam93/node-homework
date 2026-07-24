const { userSchema } = require("../validation/userSchema");

function register(req, res) {
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

  const newUser = {
    id: global.users.length + 1,
    name: value.name,
    email: value.email,
    password: value.password,
  };

  global.users.push(newUser);

  // User is now logged in
  global.user_id = newUser;

  return res.status(201).json({
      name: newUser.name,
      email: newUser.email,
  });
}

function logon(req, res) {
  const { email, password } = req.body;

  const user = global.users.find(
    (currentUser) =>
      currentUser.email === email &&
      currentUser.password === password
  );

  if (!user) {
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