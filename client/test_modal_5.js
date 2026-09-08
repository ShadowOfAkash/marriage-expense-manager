import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log("PAGE ERROR:", err));
  page.on('console', msg => console.log("PAGE LOG:", msg.text()));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }
  await browser.close();
})();
