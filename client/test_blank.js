import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await browser.close();
})();
