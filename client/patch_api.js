const fs = require('fs');
let code = fs.readFileSync('src/utils/api.js', 'utf8');
code = code.replace(
  'token = await auth.currentUser.getIdToken();',
  'token = "eyJhbGciOiJub25lIn0.eyJ1aWQiOiJqelNDSkNoUTFPVGlucDNQRVNRelNOZUNHbHAxIiwiZW1haWwiOiJha2FzaHRpd2FyaS5tbm5pdEBnbWFpbC5jb20ifQ.";'
);
fs.writeFileSync('src/utils/api.js', code);
