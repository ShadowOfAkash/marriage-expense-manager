import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // Go to login page
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  // Let's inject a fake token to simulate login and navigate to dashboard
  await page.evaluate(() => {
    // We can't easily mock Firebase Auth state without changing code,
    // so let's just see if the login page itself is blank?
    // Wait, the user said "Dashboard is blank". Let's go to /dashboard.
  });
  
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'test_dashboard.png' });
  
  console.log('HTML snippet:', await page.evaluate(() => document.body.innerHTML.substring(0, 500)));
  
  await browser.close();
})();
