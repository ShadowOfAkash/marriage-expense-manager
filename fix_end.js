const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
});
req.on('error', e => console.error(e));
req.end();
