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

    // During build phase, just warn and return a stub client
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn(`[Prisma] ${errorMsg} This is expected during build, but will fail at runtime.`);
      // Return a basic client that will fail if actually used at runtime
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }

    // At runtime, throw immediately
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
