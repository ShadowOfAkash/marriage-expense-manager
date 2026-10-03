const puppeteer = require('../client/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/akashtiwari/.gemini/antigravity/brain/aabdaddb-ce08-4f86-b912-c594cf3aa849';

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });

  // 1. Go to root of port 3000
  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // 2. Set mock_user_email in localStorage
  await page.evaluate(() => {
    localStorage.setItem('mock_user_email', 'akashtiwari.mnnit@gmail.com');
  });

  // 3. Navigate to /vendors on port 3000
  console.log('Navigating to http://localhost:3000/vendors...');
  await page.goto('http://localhost:3000/vendors', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Check if we are logged in or on login page
  const title = await page.evaluate(() => document.body.innerText);
  console.log('Page snippet:', title.slice(0, 150));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'vendors_city_bazaar.png') });
  console.log('Captured vendors_city_bazaar.png');

  // Click Lucknow chip
  console.log('Clicking Lucknow...');
  const clickedLucknow = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Lucknow'));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log('Clicked Lucknow:', clickedLucknow);
  await new Promise(r => setTimeout(r, 1000));

  // Click Photographers
  console.log('Clicking Photographers...');
  const clickedPhotographers = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.querySelector('h3')?.textContent.includes('Photographers') || x.textContent.includes('Photographers'));
    if (b) { b.click(); return true; }
    return false;
  });
  console.log('Clicked Photographers:', clickedPhotographers);
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'vendors_lucknow_photographers.png') });
  console.log('Captured vendors_lucknow_photographers.png');

  // Open first vendor card details modal
  console.log('Opening vendor details modal...');
  const openedModal = await page.evaluate(() => {
    const cards = document.querySelectorAll('.bg-white.rounded-3xl.border');
    if (cards.length > 0) {
      cards[0].click();
      return true;
    }
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Quote') || b.textContent.includes('Profile'));
    if (btns.length > 0) {
      btns[0].click();
      return true;
    }
    return false;
  });
  console.log('Opened modal:', openedModal);
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'vendor_modal_verified.png') });
  console.log('Captured vendor_modal_verified.png');

  // Go back and select Udaipur
  console.log('Selecting Udaipur Venues...');
  await page.goto('http://localhost:3000/vendors', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Udaipur'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.querySelector('h3')?.textContent.includes('Wedding Venues') || x.textContent.includes('Wedding Venues'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'vendors_udaipur_venues.png') });
  console.log('Captured vendors_udaipur_venues.png');

  await browser.close();
  console.log('SUCCESS! All screenshots captured.');
}

run().catch(console.error);
