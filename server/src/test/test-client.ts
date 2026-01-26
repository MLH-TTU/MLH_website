import { PrismaClient } from '../../node_modules/.prisma/test-client/index.js';

// Create a singleton test client
let testClient: PrismaClient | null = null;

export function getTestClient(): PrismaClient {
  if (!testClient) {
    testClient = new PrismaClient();
  }
  return testClient;
}

export async function cleanupTestClient(): Promise<void> {
  if (testClient) {
    await testClient.$disconnect();
    testClient = null;
  }
}