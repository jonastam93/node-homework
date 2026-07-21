function register(req, res) {
  const { name, email, password } = req.body;

  // Initialize globals if they don't exist
  global.users = global.users || [];
  global.user_id = global.user_id || 1;

  // Check if email already exists
  const existingUser = global.users.find(
    (user) => user.email === email
  );

  if (existingUser) {
    return res.status(400).json({
      error: "User already exists",
    });
  }

  const newUser = {
    id: global.user_id++,
    name,
    email,
    password,
  };

  global.users.push(newUser);

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    },
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
      error: "Invalid email or password",
    });
  }

  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}

function logoff(req, res) {
  res.status(200).json({
    message: "Logged off successfully",
  });
}

module.exports = {
  register,
  logon,
  logoff,
};