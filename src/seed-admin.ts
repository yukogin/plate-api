import 'dotenv/config';
import { Prisma } from '@prisma/client';
import { hash, truncates } from 'bcryptjs';
import { isEmail } from 'class-validator';
import { validateDatabaseUrl } from './config';
import { normalizeEmail } from './auth/normalize-email';
import { UsersRepository } from './auth/users.repository';
import { PrismaService } from './prisma/prisma.service';

class SeedConfigurationError extends Error {}

function readSeedConfig(): { email: string; password: string } {
  try {
    validateDatabaseUrl(process.env.DATABASE_URL);
  } catch (error) {
    throw new SeedConfigurationError((error as Error).message);
  }

  const email = normalizeEmail(process.env.ADMIN_EMAIL ?? '');
  if (!isEmail(email) || email.length > 254) {
    throw new SeedConfigurationError('ADMIN_EMAIL must be a valid email address');
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 12 || truncates(password)) {
    throw new SeedConfigurationError('ADMIN_PASSWORD must contain at least 12 characters and at most 72 UTF-8 bytes');
  }
  return { email, password };
}

async function seedAdmin(): Promise<void> {
  const { email, password } = readSeedConfig();
  const prisma = new PrismaService();
  const users = new UsersRepository(prisma);
  try {
    if (await users.findByEmail(email)) {
      console.log('Administrator account already exists; no changes made.');
      return;
    }
    const passwordHash = await hash(password, 12);
    try {
      await users.createAdmin(email, passwordHash);
      console.log('Administrator account created.');
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        console.log('Administrator account already exists; no changes made.');
        return;
      }
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch((error: unknown) => {
  if (error instanceof SeedConfigurationError) {
    console.error(`Admin seed configuration error: ${error.message}`);
  } else {
    console.error('Admin seed failed. Check database availability and configuration.');
  }
  process.exitCode = 1;
});
