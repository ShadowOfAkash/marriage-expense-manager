import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:5176/', { waitUntil: 'networkidle0' });
  
  console.log("Clicking Google login...");
  const buttons = await page.$$('button');
  if (buttons.length > 0) {
    await buttons[0].click();
    await page.waitForTimeout(2000);
    console.log("URL after login:", page.url());
  } else {
    console.log("No button found");
  }
  
  await browser.close();
})();
