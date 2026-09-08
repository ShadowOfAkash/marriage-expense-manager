import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log("PAGE ERROR:", err));
  page.on('console', msg => console.log("PAGE LOG:", msg.text()));
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await browser.close();
})();
