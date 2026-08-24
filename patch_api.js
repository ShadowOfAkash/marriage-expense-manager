const fs = require('fs');
let code = fs.readFileSync('client/src/utils/api.js', 'utf8');

code = code.replace(
  "export const api = async (endpoint, options = {}) => {",
  `import { auth } from '../contexts/AuthContext';

export const api = async (endpoint, options = {}) => {
  let token = '';
  if (auth.currentUser) {
    token = await auth.currentUser.getIdToken();
  }`
);

code = code.replace(
  "    headers: { 'Content-Type': 'application/json', ...options.headers },",
  "    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...options.headers },"
);

fs.writeFileSync('client/src/utils/api.js', code);
console.log('api.js patched for auth token injection');
