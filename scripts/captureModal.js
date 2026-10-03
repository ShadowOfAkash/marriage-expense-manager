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

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('mock_user_email', 'akashtiwari.mnnit@gmail.com');
  });

  await page.goto('http://localhost:3000/vendors', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Click Lucknow
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.textContent.includes('Lucknow'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Photographers
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(x => x.querySelector('h3')?.textContent.includes('Photographers') || x.textContent.includes('Photographers'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Click on the vendor title or photo
  const clicked = await page.evaluate(() => {
    const title = Array.from(document.querySelectorAll('h3')).find(h => h.textContent.includes('Dheeraj Photo Point') || h.textContent.includes('Dakshah'));
    if (title) {
      title.click();
      return true;
    }
    return false;
  });
  console.log('Clicked vendor card:', clicked);
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'vendor_modal_verified.png') });
  console.log('✅ Captured vendor_modal_verified.png');

  await browser.close();
}

run().catch(console.error);
