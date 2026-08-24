const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldInit = `const admin = require('firebase-admin');
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment');
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Admin:', e.message);
}`;

const newInit = `const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    console.log('✅ Firebase Admin initialized');
  } else if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment');
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Admin:', e.message);
}`;

code = code.replace(oldInit, newInit);

const oldVerify = `    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);`;

const newVerify = `    if (getApps().length > 0) {
      const decodedToken = await getAuth().verifyIdToken(token);`;

code = code.replace(oldVerify, newVerify);

// Fix fallback condition
const oldFallback = `  if (!admin.apps.length && validTokens.has(token)) {`;
const newFallback = `  if (getApps().length === 0 && validTokens.has(token)) {`;

code = code.replace(oldFallback, newFallback);

fs.writeFileSync('server.js', code);
console.log('Fixed Firebase Admin imports for v14!');
