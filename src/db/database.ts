import { PrismaClient } from '@prisma/client';
import { TransactionCallback } from '@/types';
import { logError, logInfo } from '../utils/logger';
import { DatabaseError } from '../utils/exceptions';

// Global PrismaClient instance
let prisma: PrismaClient;

// Initialize Prisma client
export const initializePrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Setup logging
    prisma.$on('query', (e) => {
      if (process.env.NODE_ENV === 'development') {
        logInfo('Database Query', {
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      }
    });

    prisma.$on('error', (e) => {
      logError('Database Error', e);
    });

    prisma.$on('info', (e) => {
      logInfo('Database Info', { message: e.message });
    });

    prisma.$on('warn', (e) => {
      logInfo('Database Warning', { message: e.message });
    });
  }

  return prisma;
};

// Get Prisma client instance
export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    return initializePrisma();
  }
  return prisma;
};

// Close database connection
export const closePrisma = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logInfo('Database connection closed');
  }
};

// Database transaction wrapper
export const withTransaction = async <T>(
  callback: TransactionCallback<T>
): Promise<T> => {
  const db = getPrisma();
  
  try {
    return await db.$transaction(callback);
  } catch (error) {
    logError('Transaction failed', error);
    throw new DatabaseError('Transaction failed');
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const db = getPrisma();
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logError('Database health check failed', error);
    return false;
  }
};

// Common database operations
export const dbOperations = {
  // Pagination helper
  paginate: async <T>(
    model: any,
    page: number = 1,
    limit: number = 20,
    where?: any,
    orderBy?: any,
    include?: any
  ) => {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      model.findMany({
        skip,
        take: limit,
        where,
        orderBy,
        include,
      }),
      model.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  },

  // Soft delete (if using soft delete pattern)
  softDelete: async (model: any, id: string) => {
    return await model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  // Batch operations
  batchCreate: async <T>(model: any, data: T[]) => {
    return await model.createMany({
      data,
      skipDuplicates: true,
    });
  },

  batchUpdate: async (model: any, updates: { where: any; data: any }[]) => {
    const db = getPrisma();
    return await db.$transaction(
      updates.map(({ where, data }) => model.update({ where, data }))
    );
  },

  // Search operations
  search: async (
    model: any,
    searchTerm: string,
    searchFields: string[],
    options?: {
      page?: number;
      limit?: number;
      where?: any;
      orderBy?: any;
      include?: any;
    }
  ) => {
    const { page = 1, limit = 20, where = {}, orderBy, include } = options || {};
    
    const searchConditions = searchFields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' as const },
    }));

    const searchWhere = {
      ...where,
      OR: searchConditions,
    };

    return await dbOperations.paginate(
      model,
      page,
      limit,
      searchWhere,
      orderBy,
      include
    );
  },
};

// Database seeding helpers
export const seedHelpers = {
  // Clear all data from tables (for development/testing)
  clearDatabase: async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear database in production');
    }

    const db = getPrisma();
    const tablenames = await db.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        await db.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      }
    }

    logInfo('Database cleared');
  },

  // Reset auto-increment sequences
  resetSequences: async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot reset sequences in production');
    }

    const db = getPrisma();
    const sequences = await db.$queryRaw<Array<{ sequence_name: string }>>`
      SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    `;

    for (const { sequence_name } of sequences) {
      await db.$executeRawUnsafe(`ALTER SEQUENCE "public"."${sequence_name}" RESTART WITH 1;`);
    }

    logInfo('Sequences reset');
  },
};

// Connection pool monitoring
export const getConnectionInfo = async () => {
  const db = getPrisma();
  try {
    const result = await db.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    `;
    return {
      activeConnections: result[0]?.count || 0,
    };
  } catch (error) {
    logError('Failed to get connection info', error);
    return { activeConnections: 0 };
  }
};

// Graceful shutdown handler
export const gracefulShutdown = async (signal: string) => {
  logInfo(`Received ${signal}, shutting down gracefully`);
  
  try {
    await closePrisma();
    logInfo('Database connections closed');
    process.exit(0);
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
};

// Setup shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); 