const { getAuth, getApps } = require('../config/firebase');

const LEGACY_ADMIN_EMAIL = 'akashtiwari.mnnit@gmail.com';
const LEGACY_ADMIN_UID   = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = auth.slice(7);

  // ── Path 1: Firebase Admin is initialized — full verification ──
  if (getApps().length > 0) {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      // Map known email to the legacy data UID
      if (decodedToken.email === LEGACY_ADMIN_EMAIL) {
        console.log(`[Auth] Mapping Google UID ${decodedToken.uid} → ${LEGACY_ADMIN_UID} for ${decodedToken.email}`);
        decodedToken.uid = LEGACY_ADMIN_UID;
      }
      req.user = decodedToken;
      return next();
    } catch (error) {
      console.error('Firebase auth error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  }

  // ── Path 2: No Firebase Admin — decode JWT payload locally (dev fallback) ──
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      let uid = payload.user_id || payload.sub || payload.uid;
      const email = payload.email || '';
      if (email === LEGACY_ADMIN_EMAIL) {
        uid = LEGACY_ADMIN_UID;
      }
      if (uid) {
        req.user = { uid, email };
        return next();
      }
    }
  } catch (e) {
    // malformed token — fall through
  }

  return res.status(401).json({ error: 'Invalid or expired session' });
}

module.exports = {
  requireAuth
};
