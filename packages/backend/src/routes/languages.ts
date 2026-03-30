import type { FastifyInstance } from 'fastify';
import { LANGUAGES } from '../data/languages.js';

export async function languagesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/languages', async (_request, _reply) => {
    return LANGUAGES;
  });
}
