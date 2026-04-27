const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

async function generateText(prompt) {
  const response = await client.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct",
    messages: [
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message.content;
}

module.exports = { generateText };
