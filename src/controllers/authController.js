const { USERS, VALID_TOKENS } = require('../config/env');

function login(req, res) {
  const { email, password } = req.body;
  const user = USERS.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = Buffer.from(`${email}:${Date.now()}:${Math.random()}`).toString('base64');
  VALID_TOKENS.add(token);
  res.json({ token, name: user.name, email: user.email });
}

function logout(req, res) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    VALID_TOKENS.delete(auth.slice(7));
  }
  res.json({ success: true });
}

module.exports = {
  login,
  logout
};
