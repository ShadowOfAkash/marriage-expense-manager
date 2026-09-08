import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => {
    // get the modal container
    const m = document.querySelector('.modal');
    return m ? m.outerHTML.substring(0, 500) : "No .modal found";
  });
  console.log(html);
  await browser.close();
})();
