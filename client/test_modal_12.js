import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('response', response => {
    if (response.status() === 404) {
      console.log("404:", response.url());
    }
  });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  await browser.close();
})();
