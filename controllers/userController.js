function register(req, res) {
  const { name, email, password } = req.body;

  const newUser = {
    id: global.users.length + 1,
    name,
    email,
    password,
  };

  global.users.push(newUser);

  // User is now logged in
  global.user_id = newUser.id;

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
      error: "Invalid email or password",
    });
  }

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