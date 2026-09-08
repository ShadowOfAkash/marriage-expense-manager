import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'dashboard.png' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log("TEXT:", text.substring(0, 500));
  await browser.close();
})();
