import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR STR:', error.message);
    console.log('PAGE ERROR STACK:', error.stack);
  });

  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000/bookings');
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.includes('Marriage Expense Manager')) {
    console.log("PAGE LOADED. HTML starts with:", content.substring(0, 200));
  } else {
    console.log("PAGE BLANK. HTML:", content.substring(0, 500));
  }
  
  await browser.close();
})();
