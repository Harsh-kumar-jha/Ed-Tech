import { Server } from './src/server';
import { logInfo, logError } from './src/utils/logger';

// Initialize and start server
async function bootstrap() {
  try {
    logInfo('🔥 Starting IELTS EdTech Platform...');
    
    const server = new Server();
    server.start();
    
  } catch (error) {
    logError('❌ Failed to start server', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
