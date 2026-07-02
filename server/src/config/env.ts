import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
