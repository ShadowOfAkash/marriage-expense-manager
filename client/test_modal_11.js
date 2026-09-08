import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log("ERROR:", msg.text());
  });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await browser.close();
})();
