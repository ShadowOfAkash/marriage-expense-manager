const fs = require('fs');

// Patch AuthContext to bypass login for testing
let authCode = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');
const originalAuthCode = authCode;

authCode = authCode.replace(/const value = \{/, `
  const value = {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
`);

fs.writeFileSync('src/contexts/AuthContext.jsx', authCode);

// We need to build it again... actually we can just run vite dev server for testing?
// No, vite dev server fails in this environment. Let's just build it quickly.
const { execSync } = require('child_process');
console.log("Building...");
execSync('npm run build', { stdio: 'inherit' });

console.log("Testing with Puppeteer...");
(async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => console.log('PAGE ERROR STR:', error.message));
  
  await page.goto('http://localhost:3000/bookings');
  await new Promise(r => setTimeout(r, 1000));
  console.log("Bookings HTML:", (await page.content()).substring(0, 300));

  await page.goto('http://localhost:3000/expenses');
  await new Promise(r => setTimeout(r, 1000));
  console.log("Expenses HTML:", (await page.content()).substring(0, 300));

  await browser.close();

  // Restore AuthContext
  fs.writeFileSync('src/contexts/AuthContext.jsx', originalAuthCode);
  execSync('npm run build', { stdio: 'inherit' });
  console.log("Restored AuthContext");
})();
