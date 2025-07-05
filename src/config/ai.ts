import { config } from './environment';

export const openRouterConfig = {
  apiKey: config.OPENROUTER_API_KEY,
  baseUrl: config.OPENROUTER_API_BASE_URL,
  model: 'openrouter/cypher-alpha:free',
  headers: {
    'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://your-site.com', // Replace with your site URL
    'X-Title': 'IELTS Writing Evaluation', // Your app name
  },
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.0,
  },
}; 