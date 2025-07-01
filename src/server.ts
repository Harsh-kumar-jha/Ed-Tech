import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config, corsConfig, rateLimitConfig, socketConfig } from './config';
import { 
  globalErrorHandler, 
  notFoundHandler, 
  handleUncaughtException, 
  handleUnhandledRejection 
} from './utils/exceptions';
import { accessLogger, logInfo, logError } from './utils/logger';
import { initializePrisma, checkDatabaseHealth } from './utils/database';
import { requestLogger } from './common';

// Import routes
import { 
  authRoutes, 
  ieltsRoutes, 
  profileRoutes, 
  leaderboardRoutes, 
  aiRoutes 
} from './services';

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

export class Server {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;

  constructor() {
    try {
      logInfo('Server initialization started', { component: 'Server' });
      this.app = express();
      
      logInfo('HTTP server created', { component: 'Server' });
      this.server = createServer(this.app);
      
      logInfo('Socket.IO initialized', { 
        component: 'Server',
        allowedOrigins: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      });
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()),
          credentials: true,
        },
      });
      
      logInfo('Starting server initialization methods', { component: 'Server' });
      this.initializeDatabase();
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeSocketIO();
      this.initializeErrorHandling();
      
      logInfo('Server constructor completed successfully', { component: 'Server' });
    } catch (error) {
      logError('Error in Server constructor', error);
      throw error;
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // Initialize Prisma
      initializePrisma();
      
      // Check database health
      const isHealthy = await checkDatabaseHealth();
      if (!isHealthy) {
        logError('Database health check failed');
        process.exit(1);
      }
      
      logInfo('Database initialized successfully');
    } catch (error) {
      logError('Database initialization failed', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors(corsConfig));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit(rateLimitConfig);
    this.app.use('/api/', limiter);

    // Custom request logging middleware
    this.app.use(requestLogger);

    // Morgan logging (in addition to custom logger)
    if (config.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            accessLogger.info(message.trim());
          }
        }
      }));
    }

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const dbHealth = await checkDatabaseHealth();
        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: dbHealth ? 'connected' : 'disconnected',
          environment: config.NODE_ENV,
          version: process.env.npm_package_version || '1.0.0',
        };

        res.status(dbHealth ? 200 : 503).json(health);
      } catch (error) {
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        });
      }
    });

    // API Info endpoint
    this.app.get(`/api/${config.API_VERSION}`, (req, res) => {
      res.json({
        name: 'IELTS EdTech Platform API',
        version: config.API_VERSION,
        environment: config.NODE_ENV,
        timestamp: new Date().toISOString(),
        endpoints: {
          auth: `/api/${config.API_VERSION}/auth`,
          tests: `/api/${config.API_VERSION}/tests`,
          profile: `/api/${config.API_VERSION}/profile`,
          leaderboard: `/api/${config.API_VERSION}/leaderboard`,
          ai: `/api/${config.API_VERSION}/ai`,
        },
      });
    });
  }

  private initializeRoutes(): void {
    try {
      logInfo('Routes initialization started', { component: 'Server' });
      
      // API Routes
      const apiRouter = express.Router();
      
      // Test endpoint
      apiRouter.get('/test', (req, res) => {
        logInfo('Test endpoint accessed', { component: 'Router', endpoint: '/test' });
        res.json({
          success: true,
          message: 'IELTS EdTech Platform API is running!',
          timestamp: new Date().toISOString(),
        });
      });

      logInfo('Mounting service routes', { component: 'Server' });
      
      logInfo('Auth routes mounted', { component: 'Router', route: '/auth' });
      apiRouter.use('/auth', authRoutes);
      
      logInfo('IELTS routes mounted', { component: 'Router', route: '/ielts' });
      apiRouter.use('/ielts', ieltsRoutes);
      
      logInfo('Profile routes mounted', { component: 'Router', route: '/profile' });
      apiRouter.use('/profile', profileRoutes);
      
      logInfo('Leaderboard routes mounted', { component: 'Router', route: '/leaderboard' });
      apiRouter.use('/leaderboard', leaderboardRoutes);
      
      logInfo('AI routes mounted', { component: 'Router', route: '/ai' });
      apiRouter.use('/ai', aiRoutes);
      
      // Mount API routes
      this.app.use(`/api/${config.API_VERSION}`, apiRouter);

      // Static files (if needed)
      this.app.use('/uploads', express.static('uploads'));
      
      logInfo('Routes initialized successfully', { 
        component: 'Server',
        apiVersion: config.API_VERSION
      });
    } catch (error) {
      logError('Error initializing routes', error);
      throw error;
    }
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logInfo('Socket connection established', { socketId: socket.id });

      // Handle socket events
      socket.on('join_room', (room: string) => {
        socket.join(room);
        logInfo('User joined room', { socketId: socket.id, room });
      });

      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        logInfo('User left room', { socketId: socket.id, room });
      });

      socket.on('disconnect', (reason) => {
        logInfo('Socket disconnected', { socketId: socket.id, reason });
      });

      socket.on('error', (error) => {
        logError('Socket error', error, { socketId: socket.id });
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(globalErrorHandler);
  }

  public start(): void {
    try {
      logInfo('Server startup initiated', { 
        component: 'Server',
        port: config.PORT,
        environment: config.NODE_ENV
      });
      const port = config.PORT;
      
      this.server.listen(port, () => {
        logInfo(`🚀 Server started successfully`, {
          port,
          environment: config.NODE_ENV,
          apiVersion: config.API_VERSION,
          processId: process.pid,
        });

        // Log available routes in development
        if (config.NODE_ENV === 'development') {
          logInfo('📋 Available endpoints:', {
            health: `http://localhost:${port}/health`,
            api: `http://localhost:${port}/api/${config.API_VERSION}`,
            test: `http://localhost:${port}/api/${config.API_VERSION}/test`,
          });
        }
      });

      // Graceful shutdown
      const gracefulShutdown = (signal: string) => {
        logInfo(`Received ${signal}, shutting down gracefully`);
        
        this.server.close(() => {
          logInfo('Server closed');
          process.exit(0);
        });

        // Force close after 10 seconds
        setTimeout(() => {
          logError('Could not close connections in time, forcefully shutting down');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      
    } catch (error) {
      logError('Error starting server', error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
} 