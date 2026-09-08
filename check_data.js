const email = 'akashtiwari.mnnit@gmail.com';
const uid = 'jzSCJChQ1OTinp3PESQzSNeCGlp1';
const payload = { user_id: uid, email: email, uid: uid, sub: uid, name: 'akashtiwari' };
const str = JSON.stringify(payload);
const base64 = btoa(unescape(encodeURIComponent(str))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `mock.${base64}.token`;
console.log("Token:", token);

const http = require('http');
function get(url) {
  return new Promise(resolve => {
    http.get(url, { headers: { 'Authorization': 'Bearer ' + token } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
  });
}
(async () => {
  console.log("Summary:", await get('http://localhost:3000/api/summary'));
  console.log("Expenses length:", JSON.parse((await get('http://localhost:3000/api/expenses')).data).length);
})();
