const fetch = require('node-fetch'); // wait, use internal fetch
(async () => {
  const res = await fetch('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // Auth logic says: let auth = req.headers.authorization; if(!auth) return 401. Let's see if we can bypass it or we need a real token.
    },
    body: JSON.stringify({
      vendor: 'Test',
      service: 'Test',
      amount: 100
    })
  });
  console.log(res.status);
  console.log(await res.text());
})();
