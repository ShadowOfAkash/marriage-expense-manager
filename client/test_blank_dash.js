import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  // Let's go to localhost:3000
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Type in the email and password and click login
  // User's email is akashtiwari.mnnit@gmail.com
  // But we don't have the password!
  // Wait, I can inject a script to manually set the AuthContext state? No.
  
  await browser.close();
})();
