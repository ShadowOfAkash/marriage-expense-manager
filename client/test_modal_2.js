import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 500));
  await browser.close();
})();
