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

const createMockUser = (email) => {
  const uid = email === 'akashtiwari.mnnit@gmail.com' ? 'jzSCJChQ1OTinp3PESQzSNeCGlp1' : `mock-uid-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
  return {
    uid,
    email,
    displayName: email.split('@')[0],
    getIdToken: async () => generateMockToken(uid, email)
  };
};

let app, googleProvider;
export const auth = isMock
  ? {
      get currentUser() {
        const savedUserEmail = localStorage.getItem('mock_user_email');
        return savedUserEmail ? createMockUser(savedUserEmail) : null;
      }
    }
  : (() => {
      app = initializeApp(firebaseConfig);
      googleProvider = new GoogleAuthProvider();
      return getAuth(app);
    })();

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isMock) {
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
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = () => {
    if (isMock) {
      const user = createMockUser('akashtiwari.mnnit@gmail.com');
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return Promise.resolve(user);
    }
    return signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = (email, password) => {
    if (isMock) {
      const user = createMockUser(email);
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return Promise.resolve(user);
    }
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = (email, password) => {
    if (isMock) {
      const user = createMockUser(email);
      localStorage.setItem('mock_user_email', user.email);
      setCurrentUser(user);
      return Promise.resolve(user);
    }
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    if (isMock) {
      localStorage.removeItem('mock_user_email');
      setCurrentUser(null);
      return Promise.resolve();
    }
    return signOut(auth);
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
