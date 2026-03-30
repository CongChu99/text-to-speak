import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../server';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 status code', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
  });

  it('returns { status: "ok" }', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    const body = JSON.parse(response.body);
    expect(body).toEqual({ status: 'ok' });
  });
});
