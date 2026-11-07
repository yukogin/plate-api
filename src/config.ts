export interface AppConfig {
  port: number;
  corsOrigins: string[];
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

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  try {
    const url = new URL(env.DATABASE_URL);
    if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
      throw new Error();
    }
  } catch {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }

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

  return { port, corsOrigins };
}
