const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel(system = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY missing');
    err.code = 'GEMINI_KEY_MISSING';
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest',
    ...(system ? { systemInstruction: system } : {}),
  });
}

async function generateText({ prompt = '', system = '' }) {
  const model = getModel(system);
  const result = await model.generateContent(String(prompt || ''));
  const text = result?.response?.text?.()?.trim() || '';
  return {
    text,
    used: !!text,
    reason: text ? 'ok:gemini' : 'empty_response',
  };
}

module.exports = { generateText };
