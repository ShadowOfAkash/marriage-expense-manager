import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => {
    return document.body.innerHTML;
  });
  const idx = html.indexOf('Set Total Budget Goal');
  console.log(html.substring(Math.max(0, idx - 200), idx + 200));
  await browser.close();
})();
