import { ApiResponse, PaginationQuery } from '@/types';
import { DEFAULTS } from '@/constants';

// UUID generation
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Date utilities
export const dateHelpers = {
  // Format date to ISO string
  toISOString: (date: Date): string => {
    return date.toISOString();
  },

  // Get current timestamp
  now: (): Date => {
    return new Date();
  },

  // Add days to date
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  // Add hours to date
  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  // Check if date is in the past
  isPast: (date: Date): boolean => {
    return date < new Date();
  },

  // Check if date is in the future
  isFuture: (date: Date): boolean => {
    return date > new Date();
  },

  // Format date for display
  formatDate: (date: Date, locale: string = 'en-US'): string => {
    return date.toLocaleDateString(locale);
  },

  // Format datetime for display
  formatDateTime: (date: Date, locale: string = 'en-US'): string => {
    return date.toLocaleString(locale);
  },

  // Get start of day
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  // Get end of day
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },
};

// String utilities
export const stringHelpers = {
  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (str: string): string => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate random string
  randomString: (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate slug from string
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  // Truncate string
  truncate: (str: string, length: number = 100, suffix: string = '...'): string => {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },

  // Remove HTML tags
  stripHtml: (str: string): string => {
    return str.replace(/<[^>]*>/g, '');
  },

  // Extract initials from name
  getInitials: (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  },
};

// Number utilities
export const numberHelpers = {
  // Format number as currency
  formatCurrency: (amount: number, currency: string = 'USD', locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  },

  // Format number with commas
  formatNumber: (num: number, locale: string = 'en-US'): string => {
    return new Intl.NumberFormat(locale).format(num);
  },

  // Round to decimal places
  roundTo: (num: number, decimalPlaces: number = 2): number => {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(num * factor) / factor;
  },

  // Clamp number between min and max
  clamp: (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
  },

  // Generate random number between min and max
  random: (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Calculate percentage
  percentage: (value: number, total: number): number => {
    return total === 0 ? 0 : (value / total) * 100;
  },
};

// Array utilities
export const arrayHelpers = {
  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  // Get unique values from array
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },

  // Group array by key
  groupBy: <T>(array: T[], key: keyof T): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  // Remove duplicates based on key
  uniqueBy: <T>(array: T[], key: keyof T): T[] => {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  },
};

// Object utilities
export const objectHelpers = {
  // Deep clone object
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  },

  // Pick specific keys from object
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  // Omit specific keys from object
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj };
    keys.forEach(key => {
      delete result[key];
    });
    return result;
  },

  // Check if object is empty
  isEmpty: (obj: any): boolean => {
    return Object.keys(obj).length === 0;
  },

  // Flatten nested object
  flatten: (obj: any, prefix: string = ''): any => {
    const flattened: any = {};
    Object.keys(obj).forEach(key => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, objectHelpers.flatten(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    });
    return flattened;
  },
};

// API response helpers
export const responseHelpers = {
  // Success response
  success: <T>(data: T, message?: string): ApiResponse<T> => {
    return { success: true, data, message };
  },

  // Error response
  error: (message: string, error?: string): ApiResponse => {
    return { success: false, message, error };
  },

  // Paginated response
  paginated: <T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): ApiResponse<T[]> => {
    return {
      success: true,
      data,
      message,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

// Pagination helpers
export const paginationHelpers = {
  // Normalize pagination parameters
  normalizePagination: (query: PaginationQuery) => {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(
      Math.max(1, query.limit || DEFAULTS.PAGE_SIZE),
      DEFAULTS.MAX_PAGE_SIZE
    );
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      search: query.search?.trim() || undefined,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };
  },

  // Calculate pagination metadata
  calculateMeta: (page: number, limit: number, total: number) => {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  },
};

// File utilities
export const fileHelpers = {
  // Get file extension
  getExtension: (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  // Get file size in human readable format
  formatFileSize: (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Check if file type is allowed
  isAllowedFileType: (filename: string, allowedTypes: string[]): boolean => {
    const extension = fileHelpers.getExtension(filename);
    return allowedTypes.includes(extension);
  },

  // Generate unique filename
  generateUniqueFilename: (originalName: string): string => {
    const extension = fileHelpers.getExtension(originalName);
    const name = originalName.replace(`.${extension}`, '');
    const slug = stringHelpers.slugify(name);
    const timestamp = Date.now();
    const random = stringHelpers.randomString(6);
    return `${slug}-${timestamp}-${random}.${extension}`;
  },
};

// Time utilities
export const timeHelpers = {
  // Convert seconds to human readable format
  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  // Get time ago format
  timeAgo: (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
    return `${Math.floor(seconds / 31536000)}y ago`;
  },

  // Sleep function
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
}; 