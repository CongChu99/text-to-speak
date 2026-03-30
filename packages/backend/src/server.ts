import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { healthRoutes } from './routes/health.js';
import { languagesRoutes } from './routes/languages.js';
import { sessionWsRoutes } from './ws/sessionHandler.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Register WebSocket plugin before WebSocket routes
  await app.register(fastifyWebsocket);

  // Register routes
  await app.register(healthRoutes);
  await app.register(languagesRoutes);
  await app.register(sessionWsRoutes);

  return app;
}
