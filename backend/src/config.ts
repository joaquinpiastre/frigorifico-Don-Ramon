import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8080),
  gt06Port: Number(process.env.GT06_PORT ?? 5024),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
