import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR STR:', error.message);
    console.log('PAGE ERROR STACK:', error.stack);
  });

  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000/expenses');
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  if (content.includes('Marriage Expense Manager')) {
    console.log("LOGIN PAGE LOADED (Normal if no auth)");
  } else {
    console.log("PAGE CONTENT SUMMARY:", content.substring(0, 500));
  }
  
  await browser.close();
})();
