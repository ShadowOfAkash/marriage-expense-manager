import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR STR:', error.message);
  });
  page.on('console', msg => {
    if(msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  // Since we don't have a real Firebase login token, the App.jsx will just redirect to <Login /> if not authenticated.
  // Wait, if there's a React render error in the component tree, it would happen regardless of auth IF the error is in App.jsx Route definitions!
  // BUT if the error is inside `Bookings.jsx` rendering logic, it only happens AFTER login.
  // Can we bypass login?
  // Let's patch AuthContext temporarily just to see if the page renders!
  
  await browser.close();
})();
