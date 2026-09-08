import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => {
    return document.querySelector('h1')?.parentNode?.parentNode?.innerHTML;
  });
  console.log(html?.substring(0, 500));
  await browser.close();
})();
