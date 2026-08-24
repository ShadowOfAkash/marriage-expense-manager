require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent("Say 'TESTING123'");
    console.log("Success with gemini-3.6-flash:", result.response.text());
  } catch (e) {
    console.log("Error with gemini-3.6-flash:", e.message);
  }
}

test();
