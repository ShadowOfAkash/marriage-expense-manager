import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
  const html = await page.evaluate(() => document.body.innerHTML);
  if (html.includes('Add New Expense')) {
    console.log("Add Expense Modal is visible!");
  } else {
    console.log("Add Expense Modal is NOT visible.");
  }
  await browser.close();
})();
