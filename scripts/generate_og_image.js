const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../client/node_modules/puppeteer'));

async function generateOgImage() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 1200px;
            height: 630px;
            background: #141414;
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 80px;
            position: relative;
            overflow: hidden;
          }
          .glow {
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(200, 109, 81, 0.15) 0%, rgba(20, 20, 20, 0) 70%);
            top: -100px;
            right: -100px;
            pointer-events: none;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .brand {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: -0.04em;
            color: #ffffff;
          }
          .badge {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 10px 22px;
            border-radius: 9999px;
            font-size: 15px;
            font-weight: 600;
            color: #d4d4d4;
          }
          .content {
            margin-top: 40px;
          }
          .headline {
            font-size: 64px;
            font-weight: 700;
            line-height: 1.12;
            letter-spacing: -0.03em;
            color: #ffffff;
          }
          .subheadline {
            color: #a3a3a3;
            font-weight: 400;
          }
          .description {
            margin-top: 24px;
            font-size: 24px;
            color: #a3a3a3;
            max-width: 860px;
            line-height: 1.45;
          }
          .footer {
            display: flex;
            align-items: center;
            gap: 36px;
            padding-top: 32px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }
          .feature {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
            font-weight: 500;
            color: #e5e5e5;
          }
          .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
          }
        </style>
      </head>
      <body>
        <div class="glow"></div>
        <div class="header">
          <div class="brand">hitchd</div>
          <div class="badge">Shaadi Manager • Wedding Suite</div>
        </div>
        <div class="content">
          <h1 class="headline">
            Wedding Planning,<br>
            <span class="subheadline">made beautifully simple.</span>
          </h1>
          <p class="description">
            Comprehensive expense tracking, guest RSVP management, vendor agreements, and ceremony milestones.
          </p>
        </div>
        <div class="footer">
          <div class="feature"><span class="dot"></span> Real-time Budget & Kharcha</div>
          <div class="feature"><span class="dot"></span> Guest RSVPs & Invitations</div>
          <div class="feature"><span class="dot"></span> Vendor Contracts & Advances</div>
          <div class="feature"><span class="dot"></span> Telegram Bot & Sync</div>
        </div>
      </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const outputPath = path.resolve(__dirname, 'client/public/og-image.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  console.log('✅ Generated OG image at:', outputPath);
  await browser.close();
}

generateOgImage().catch(console.error);
