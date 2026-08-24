require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelsToTest = ['gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.5-pro', 'gemini-pro-vision'];
  
  for (const m of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hello");
      console.log(`Success with ${m}`);
      return;
    } catch (e) {
      console.log(`Error with ${m}:`, e.message.split('\n')[0]);
    }
  }
}

test();
