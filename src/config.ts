export interface AppConfig {
  port: number;
  corsOrigins: string[];
  jwtSecret: string;
  jwtExpiresIn: number;
}

export function validateDatabaseUrl(value: string | undefined): void {
  if (!value) {
    throw new Error('DATABASE_URL is required');
  }
  try {
    const url = new URL(value);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }
}

export function parseJwtExpiresIn(value: string | undefined): number {
  const raw = value ?? '1d';
  const match = /^([1-9]\d*)([smhd]?)$/.exec(raw);
  if (!match) {
    throw new Error('JWT_EXPIRES_IN must be a positive number of seconds or use s, m, h, d');
  }
  const multipliers: Record<string, number> = { '': 1, s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = Number(match[1]) * multipliers[match[2]];
  if (!Number.isSafeInteger(seconds) || seconds > 31_536_000) {
    throw new Error('JWT_EXPIRES_IN must be at most 365 days');
  }
  return seconds;
}

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  if (!['development', 'test', 'production'].includes(env.NODE_ENV ?? 'development')) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const portValue = env.PORT ?? '3000';
  const port = Number(portValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535');
  }

  validateDatabaseUrl(env.DATABASE_URL);
  if (!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  const jwtExpiresIn = parseJwtExpiresIn(env.JWT_EXPIRES_IN);

  const corsOrigins = env.CORS_ORIGINS === undefined
    ? []
    : env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  if (corsOrigins.some((origin) => {
    try {
      const url = new URL(origin);
      return !['http:', 'https:'].includes(url.protocol) || url.origin !== origin;
    } catch {
      return true;
    }
  })) {
    throw new Error('CORS_ORIGINS must contain comma-separated HTTP(S) origins');
  }

  return { port, corsOrigins, jwtSecret: env.JWT_SECRET, jwtExpiresIn };
}
