import { config } from './environment';

// Socket.IO configuration
export const socketConfig = {
  cors: {
    origin: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
}; 