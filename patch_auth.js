const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex1 = /const decodedToken = await getAuth\(\)\.verifyIdToken\(token\);\s+req\.user = decodedToken;/;
const replacement1 = `const decodedToken = await getAuth().verifyIdToken(token);
      if (decodedToken.email === 'akashtiwari.mnnit@gmail.com') {
        decodedToken.uid = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';
      }
      req.user = decodedToken;`;

const regex2 = /const uid = payload\.user_id \|\| payload\.sub \|\| payload\.uid;\s+if \(uid\) {/
const replacement2 = `let uid = payload.user_id || payload.sub || payload.uid;
      const email = payload.email || '';
      if (email === 'akashtiwari.mnnit@gmail.com') {
        uid = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';
      }
      if (uid) {`;

code = code.replace(regex1, replacement1).replace(regex2, replacement2);
fs.writeFileSync('server.js', code);
console.log("Patched server.js");
