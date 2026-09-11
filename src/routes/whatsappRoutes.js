const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { UPLOADS_DIR } = require('../config/env');
const { isLibSQL, dbRun, readJSON, writeJSON } = require('../db');

router.post('/webhook', async (req, res) => {
  const { MediaUrl0, MediaContentType0 } = req.body || {};
  
  if (!MediaUrl0) {
    return res.send('<Response><Message>Please send a photo of a receipt/bill.</Message></Response>');
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.send('<Response><Message>API Key missing on server.</Message></Response>');

    // 1. Fetch image from Twilio
    const imgRes = await fetch(MediaUrl0);
    const arrayBuffer = await imgRes.arrayBuffer();
    const imgBuffer = Buffer.from(arrayBuffer);
    const base64Image = imgBuffer.toString('base64');
    const filename = `tg_${Date.now()}.jpg`;
    
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), imgBuffer);
    const receipt_url = `/uploads/${filename}`;
    const mimeType = MediaContentType0 || 'image/jpeg';

    // 2. Process with Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const prompt = `You are a receipt data extractor. Extract the following from this receipt/bill image:
    1. amount (number, the total final amount paid)
    2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
    3. description (string, short summary of the vendor/items, max 5 words)
    4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

    Return ONLY a raw JSON object with these keys (amount, date, description, category).`;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: mimeType } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim().replace(/^\s*```json/i, '').replace(/^\s*```/i, '').replace(/```\s*$/i, '').trim();
    
    let aiData = JSON.parse(text);

    // 3. Save to database as DRAFT
    const finalAmount = Number(aiData.amount) || 0;
    const finalDate = aiData.date || new Date().toISOString().split('T')[0];
    const finalCat = aiData.category || 'Miscellaneous';
    const finalDesc = aiData.description || 'WhatsApp Upload';
    
    if (isLibSQL()) {
      await dbRun(
        'INSERT INTO payments (category, description, amount, date, status, receipt_url) VALUES (?, ?, ?, ?, ?, ?)',
        [finalCat, finalDesc, finalAmount, finalDate, 'draft', receipt_url]
      );
    } else {
      const d = readJSON();
      const newPay = { id: d._nextPaymentId++, category: finalCat, description: finalDesc, amount: finalAmount, date: finalDate, status: 'draft', receipt_url, created_at: new Date().toISOString() };
      d.payments.push(newPay);
      writeJSON(d);
    }

    res.send(`<Response><Message>✅ Receipt scanned successfully! 
Total: ₹${finalAmount}
Category: ${finalCat}

Saved to your portal as a DRAFT. Please review and approve it on the dashboard.</Message></Response>`);
  } catch (e) {
    console.error('WhatsApp Webhook error:', e);
    res.send(`<Response><Message>❌ Error processing receipt: ${e.message}</Message></Response>`);
  }
});

module.exports = router;
