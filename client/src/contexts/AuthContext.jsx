import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

// Will be provided by user
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy"
};

const isMock = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "dummy";

function generateMockToken(uid, email) {
  const payload = {
    user_id: uid,
    email: email,
    uid: uid,
    sub: uid,
    name: email.split('@')[0]
  };
  const str = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `mock.${base64}.token`;
}

export const createMockUser = (email) => {
  const uid = email === 'akashtiwari.mnnit@gmail.com' ? 'jzSCJChQ1OTinp3PESQzSNeCGlp1' : `mock-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
  return {
    uid,
    email,
    displayName: email.split('@')[0],
    getIdToken: async () => generateMockToken(uid, email)
  };
};

let app;
let googleProvider;
export { googleProvider };

export const auth = (() => {
  try {
    app = initializeApp(firebaseConfig);
    googleProvider = new GoogleAuthProvider();
    return getAuth(app);
  } catch (e) {
    console.error("Firebase init error:", e);
    return null;
  }
})();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedUserEmail = localStorage.getItem('mock_user_email');
      if (savedUserEmail) return createMockUser(savedUserEmail);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock || !auth) {
      const savedUserEmail = localStorage.getItem('mock_user_email');
      if (savedUserEmail) {
        setCurrentUser(createMockUser(savedUserEmail));
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      const mockEmail = localStorage.getItem('mock_user_email');
      if (mockEmail) {
        setCurrentUser(createMockUser(mockEmail));
      } else {
        setCurrentUser(user);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (isMock) {
      const user = createMockUser('akashtiwari.mnnit@gmail.com');
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return user;
    }
    const res = await signInWithPopup(auth, googleProvider);
    localStorage.removeItem('mock_user_email');
    setCurrentUser(res.user);
    return res.user;
  };

  const loginWithEmail = async (email, password) => {
    if (isMock) {
      const user = createMockUser(email);
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return user;
    }
    const res = await signInWithEmailAndPassword(auth, email, password);
    localStorage.removeItem('mock_user_email');
    setCurrentUser(res.user);
    return res.user;
  };

  const signupWithEmail = async (email, password) => {
    if (isMock) {
      const user = createMockUser(email);
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return user;
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    localStorage.removeItem('mock_user_email');
    setCurrentUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('mock_user_email');
      if (auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('SignOut error:', err);
    } finally {
      setCurrentUser(null);
    }
  };

  const resetPassword = (email) => {
    if (isMock) {
      return Promise.resolve();
    }
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
