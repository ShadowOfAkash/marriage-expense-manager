import puppeteer from 'puppeteer';
import fs from 'fs';

const db = JSON.parse(fs.readFileSync('../marriage_data.json', 'utf8'));

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => {
    console.log('PAGE ERROR STR:', err.toString());
    console.log('PAGE ERROR STACK:', err.stack || err.message);
  });
  
  await page.setRequestInterception(true);
  
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/summary')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({ budget: 600000, totalExpenses: 813417, totalSavings: 600456, amountStillRequired: 0, availableBalance: -212961, savingsProgress: 100, expenseProgress: 100 }) });
    } else if (url.includes('/api/expenses/categories')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify([{category: "Catering", total: 1000}]) });
    } else if (url.includes('/api/expenses')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(db.expenses) });
    } else if (url.includes('/api/savings')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(db.savings) });
    } else if (url.includes('/api/telegram/status')) {
      req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify({isLinked: false, activeCode: null}) });
    } else {
      req.continue();
    }
  });
  
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'test_dash_real.png' });
  
  // Also check if there's any text on the page
  const html = await page.content();
  if (!html.includes('Goal Meter') && !html.includes('Recent Expenses')) {
    console.log("DASHBOARD BLANK, HTML:", html.substring(0, 500));
  } else {
    console.log("DASHBOARD RENDERED FINE.");
  }
  
  await browser.close();
})();
