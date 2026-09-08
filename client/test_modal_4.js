import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }
  
  await page.screenshot({ path: 'dashboard.png' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log("TEXT:", text.substring(0, 500));
  await browser.close();
})();
