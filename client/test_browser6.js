import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('response', response => {
    if (response.status() === 500) {
      console.log('500 ERROR:', response.url());
    }
  });
  
  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle0' });
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].click();
    await new Promise(r => setTimeout(r, 2000));
  }
  await browser.close();
})();
