// File Upload Configuration
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_TYPES: {
    IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    AUDIO: ['mp3', 'wav', 'ogg', 'm4a'],
    VIDEO: ['mp4', 'webm', 'avi', 'mov'],
    DOCUMENTS: ['pdf', 'doc', 'docx', 'txt'],
  },
  UPLOAD_PATHS: {
    PROFILE: 'uploads/profiles',
    TESTS: 'uploads/tests',
    AUDIO: 'uploads/audio',
    DOCUMENTS: 'uploads/documents',
  },
} as const; 