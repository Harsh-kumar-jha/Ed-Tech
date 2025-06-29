// Socket.IO event definitions
export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  
  // Authentication events
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_SUCCESS: 'auth:success',
  AUTH_ERROR: 'auth:error',
  
  // Test events
  TEST_START: 'test:start',
  TEST_PAUSE: 'test:pause',
  TEST_RESUME: 'test:resume',
  TEST_SUBMIT: 'test:submit',
  TEST_COMPLETE: 'test:complete',
  TEST_TIME_WARNING: 'test:time_warning',
  TEST_TIME_UP: 'test:time_up',
  
  // Question events
  QUESTION_ANSWER: 'question:answer',
  QUESTION_FLAG: 'question:flag',
  QUESTION_UNFLAG: 'question:unflag',
  QUESTION_NAVIGATE: 'question:navigate',
  
  // Speaking test events
  SPEAKING_START_RECORDING: 'speaking:start_recording',
  SPEAKING_STOP_RECORDING: 'speaking:stop_recording',
  SPEAKING_UPLOAD_AUDIO: 'speaking:upload_audio',
  SPEAKING_AUDIO_UPLOADED: 'speaking:audio_uploaded',
  
  // Real-time updates
  LEADERBOARD_UPDATE: 'leaderboard:update',
  NOTIFICATION: 'notification',
  USER_STATUS_UPDATE: 'user:status_update',
  
  // Room events
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_MESSAGE: 'room:message',
  
  // Error events
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  PERMISSION_ERROR: 'permission_error',
} as const; 