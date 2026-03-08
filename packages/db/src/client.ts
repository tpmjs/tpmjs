import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // During Next.js build, DATABASE_URL might not be set. This is expected.
  // Only warn during build, but throw at runtime when actually trying to connect.
  if (!process.env.DATABASE_URL) {
    const errorMsg =
      'DATABASE_URL is not defined in environment variables. Please configure your database connection.';

    // During build or test, allow creating a client without DATABASE_URL
    // (it will fail on first query, but won't crash module loading)
    if (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.VITEST ||
      process.env.NODE_ENV === 'test'
    ) {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }

    // At production runtime, throw immediately for clear error messages
    throw new Error(errorMsg);
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    // Enhance error message for PrismaClientInitializationError
    if (error instanceof Error) {
      throw new Error(`Failed to initialize PrismaClient: ${error.message}`);
    }
    throw error;
  }
}

// Use lazy initialization so the module can load even if DATABASE_URL is absent at cold start.
// This defers the error to the first actual database query, where route handlers can catch it
// gracefully instead of crashing the entire serverless function on module load.
let _prisma: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_prisma) {
    _prisma = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma;
    }
  }
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    return getClient()[prop as keyof PrismaClient];
  },
});
