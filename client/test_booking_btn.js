import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR STR:', error.message);
  });
  page.on('console', msg => console.log('LOG:', msg.text()));

  // Setup fake local storage auth
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('auth_token', 'fake-token');
    localStorage.setItem('user', JSON.stringify({uid: 'test'}));
  });

  await page.goto('http://localhost:3000/bookings');
  await new Promise(r => setTimeout(r, 1500));
  
  // Click 'Create Booking' button
  const createBtns = await page.$$('button');
  for (let b of createBtns) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Create Booking')) {
      console.log("Clicking Create Booking button...");
      await b.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 1000));

  // Try to type in vendor and service
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].type('Test Vendor');
    await inputs[1].type('Test Service');
  } else {
    console.log("Could not find inputs.");
  }

  // Click Save Booking button
  const saveBtns = await page.$$('button');
  for (let b of saveBtns) {
    const text = await page.evaluate(el => el.innerText, b);
    if (text.includes('Save Booking')) {
      console.log("Clicking Save Booking button...");
      await b.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
