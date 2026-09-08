const http = require('http');
function get(url) {
  return new Promise(resolve => {
    http.get(url, { headers: { 'Authorization': 'Bearer mock.eyANCiJ1c2VyX2lkIjogImF1dGhvcml6ZWQiLA0KImVtYWlsIjogImFrYXNodGl3YXJpLm1ubml0QGdtYWlsLmNvbSIsDQoidWlkIjogImF1dGhvcml6ZWQiLA0KInN1YiI6ICJhdXRob3JpemVkIg0KfQ.token' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
  });
}
(async () => {
  console.log("Summary:", await get('http://localhost:3000/api/summary'));
  console.log("Expenses:", await get('http://localhost:3000/api/expenses'));
})();
