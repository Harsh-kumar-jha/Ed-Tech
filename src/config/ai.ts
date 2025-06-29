import { config } from './environment';

// AI configuration
export const aiConfig = {
  baseUrl: config.OLLAMA_BASE_URL,
  model: config.OLLAMA_MODEL,
  timeout: parseInt(process.env.AI_TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
}; 