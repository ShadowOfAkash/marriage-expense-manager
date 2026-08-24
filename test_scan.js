const fs = require('fs');

async function test() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'akashtiwari.mnnit@gmail.com', password: 'Akashcse@25274' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // Generate a fake base64 string ~2.5MB
  const largeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='.repeat(25000);

  console.log("Sending scan request with payload size:", largeBase64.length, "bytes");

  const scanRes = await fetch('http://localhost:3000/api/expenses/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ image: largeBase64, mimeType: 'image/png' })
  });

  const responseText = await scanRes.text();
  console.log("Status:", scanRes.status);
  console.log("Response:", responseText);
}

test();
