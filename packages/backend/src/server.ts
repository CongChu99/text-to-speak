import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './routes/health.js';
import { languagesRoutes } from './routes/languages.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Register routes
  await app.register(healthRoutes);
  await app.register(languagesRoutes);

  return app;
}
