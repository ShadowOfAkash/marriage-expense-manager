const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

let isInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT && getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
    isInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } else if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found in environment');
  } else if (getApps().length > 0) {
    isInitialized = true;
  }
} catch (e) {
  console.error('❌ Failed to initialize Firebase Admin:', e.message);
}

module.exports = {
  getAuth,
  getApps,
  isFirebaseConfigured: () => isInitialized || getApps().length > 0
};
