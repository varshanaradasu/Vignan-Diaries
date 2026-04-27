const OpenAI = require('openai');

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error('GROQ_API_KEY missing');
    err.code = 'GROQ_KEY_MISSING';
    throw err;
  }

  return new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });
}

async function generateText(input) {
  const isObject = input && typeof input === 'object';
  const prompt = isObject ? String(input.prompt || '') : String(input || '');
  const system = isObject ? String(input.system || '') : '';

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama3-70b-8192',
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || '';
    return {
      text,
      used: !!text,
      reason: text ? 'ok:groq' : 'empty_response',
    };
  } catch (error) {
    const details = error?.message || error?.error?.message || 'groq_request_failed';
    return {
      text: '',
      used: false,
      reason: `groq_error:${details}`,
    };
  }
}

module.exports = { generateText };