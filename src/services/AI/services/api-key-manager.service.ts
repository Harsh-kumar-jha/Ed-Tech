import { logError, logInfo } from '../../../utils/logger';

interface APIKeyUsage {
  key: string;
  usageCount: number;
  lastUsed: Date;
  isExhausted: boolean;
}

export class APIKeyManagerService {
  private static instance: APIKeyManagerService;
  private currentKeyIndex: number = 0;
  private apiKeys: APIKeyUsage[] = [];
  private readonly MAX_DAILY_USAGE = 1000; // Adjust based on your Groq AI plan limits

  private constructor() {
    // Initialize with all available API keys
    const keys = [
      process.env.GROQ_API_KEY || '',
      process.env.GROQ_API_KEY_2 || '',
      process.env.GROQ_API_KEY_3 || '',
      process.env.GROQ_API_KEY_4 || '',
      process.env.GROQ_API_KEY_5 || '',
    ].filter(key => key !== '');

    this.apiKeys = keys.map(key => ({
      key,
      usageCount: 0,
      lastUsed: new Date(),
      isExhausted: false
    }));

    // Start daily reset job
    this.startDailyReset();
  }

  public static getInstance(): APIKeyManagerService {
    if (!APIKeyManagerService.instance) {
      APIKeyManagerService.instance = new APIKeyManagerService();
    }
    return APIKeyManagerService.instance;
  }

  public getCurrentKey(): string {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    
    if (!currentKey || currentKey.isExhausted) {
      this.rotateToNextKey();
      return this.getCurrentKey();
    }

    return currentKey.key;
  }

  public incrementUsage(): void {
    const currentKey = this.apiKeys[this.currentKeyIndex];
    if (!currentKey) return;

    currentKey.usageCount++;
    currentKey.lastUsed = new Date();

    if (currentKey.usageCount >= this.MAX_DAILY_USAGE) {
      currentKey.isExhausted = true;
      logInfo(`API key ${this.maskKey(currentKey.key)} exhausted, rotating to next key`);
      this.rotateToNextKey();
    }
  }

  public areAllKeysExhausted(): boolean {
    return this.apiKeys.every(key => key.isExhausted);
  }

  private rotateToNextKey(): void {
    const initialIndex = this.currentKeyIndex;
    let foundValidKey = false;

    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      if (!this.apiKeys[this.currentKeyIndex].isExhausted) {
        foundValidKey = true;
        break;
      }
    } while (this.currentKeyIndex !== initialIndex);

    if (!foundValidKey) {
      logError('All API keys are exhausted');
    }
  }

  private startDailyReset(): void {
    setInterval(() => {
      const now = new Date();
      this.apiKeys.forEach(key => {
        const lastUsedDate = new Date(key.lastUsed);
        if (now.getDate() !== lastUsedDate.getDate() || 
            now.getMonth() !== lastUsedDate.getMonth() || 
            now.getFullYear() !== lastUsedDate.getFullYear()) {
          key.usageCount = 0;
          key.isExhausted = false;
        }
      });
      logInfo('Daily API key usage reset completed');
    }, 60 * 60 * 1000); // Check every hour
  }

  private maskKey(key: string): string {
    if (key.length < 8) return '***';
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  }
} 