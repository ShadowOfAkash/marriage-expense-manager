import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  
  // Click the Google login button
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 1000));
  await browser.close();
})();
