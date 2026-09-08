const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/summary',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJub25lIn0.eyJ1aWQiOiJqelNDSkNoUTFPVGlucDNQRVNRelNOZUNHbHAxIiwiZW1haWwiOiJha2FzaHRpd2FyaS5tbm5pdEBnbWFpbC5jb20ifQ.'
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});
req.end();
