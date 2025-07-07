import { config } from './environment';

export const groqConfig = {
  apiKey: config.GROQ_API_KEY,
  baseUrl: config.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1',
  model: 'mixtral-8x7b-32768',  // Groq's most capable model
  headers: {
    'Authorization': `Bearer ${config.GROQ_API_KEY}`,
    'Content-Type': 'application/json',
  },
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  },
}; 