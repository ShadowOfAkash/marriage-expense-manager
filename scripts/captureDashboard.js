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
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });

  // Set mock_user_email in localStorage
  await page.evaluate(() => {
    localStorage.setItem('mock_user_email', 'akashtiwari.mnnit@gmail.com');
  });

  // Navigate to dashboard
  console.log('Navigating to dashboard on port 3000...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_dashboard_view.png'), fullPage: false });
  console.log('Captured current_dashboard_view.png');

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_dashboard_full.png'), fullPage: true });
  console.log('Captured current_dashboard_full.png');

  // Let's also check /expenses
  await page.goto('http://localhost:3000/expenses', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_expenses_view.png') });
  console.log('Captured current_expenses_view.png');

  // Let's also check /savings
  await page.goto('http://localhost:3000/savings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_savings_view.png') });
  console.log('Captured current_savings_view.png');

  // Vendors
  await page.goto('http://localhost:3000/vendors', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_vendors_view.png') });
  console.log('Captured current_vendors_view.png');

  // Guests
  await page.goto('http://localhost:3000/guests', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_guests_view.png') });
  console.log('Captured current_guests_view.png');

  // Checklist / Roadmap
  await page.goto('http://localhost:3000/checklist', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_checklist_view.png') });
  console.log('Captured current_checklist_view.png');

  // Bookings / Contracts
  await page.goto('http://localhost:3000/bookings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_bookings_view.png') });
  console.log('Captured current_bookings_view.png');

  // Dashboard full view
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_dashboard_view.png'), fullPage: false });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'current_dashboard_full.png'), fullPage: true });
  console.log('Captured current_dashboard_view.png & full');

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
