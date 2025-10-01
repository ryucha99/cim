// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () =>
  new PrismaClient({ log: ['warn', 'error'] });

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const prisma =
  globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
