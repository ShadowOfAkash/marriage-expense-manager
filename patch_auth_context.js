const fs = require('fs');
let code = fs.readFileSync('client/src/contexts/AuthContext.jsx', 'utf8');

code = code.replace(
  "signOut \n} from 'firebase/auth';",
  "signOut,\n  sendPasswordResetEmail\n} from 'firebase/auth';"
);

code = code.replace(
  "const logout = () => {\n    return signOut(auth);\n  };",
  "const logout = () => {\n    return signOut(auth);\n  };\n\n  const resetPassword = (email) => {\n    return sendPasswordResetEmail(auth, email);\n  };"
);

code = code.replace(
  "logout\n  };",
  "logout,\n    resetPassword\n  };"
);

fs.writeFileSync('client/src/contexts/AuthContext.jsx', code);
console.log('AuthContext patched for password reset');
