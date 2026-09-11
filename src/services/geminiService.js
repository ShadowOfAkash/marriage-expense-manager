const { GoogleGenerativeAI } = require('@google/generative-ai');

async function scanReceiptImage({ imageBase64, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  if (!imageBase64 || !mimeType) {
    throw new Error('Image data and mimeType are required.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const prompt = `You are a receipt data extractor. Extract the following from this receipt/bill image:
  1. amount (number, the total final amount paid)
  2. date (string, YYYY-MM-DD format, guess the year if missing based on recent times)
  3. description (string, short summary of the vendor/items, max 5 words)
  4. category (string, MUST be exactly one of these: Venue, Catering, Photography, Decoration, Clothing, Jewellery, Invitation Cards, Music / DJ, Mehendi, Makeup, Travel, Accommodation, Gifts, Miscellaneous. Guess the best fit.)

  Return ONLY a raw JSON object with these keys (amount, date, description, category). Do NOT wrap it in markdown code blocks like \`\`\`json. Return pure JSON only.`;

  const imageParts = [
    {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    }
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text().trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error('Failed to parse AI response: ' + text);
  }
}

module.exports = {
  scanReceiptImage
};
