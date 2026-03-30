import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../server';
import type { FastifyInstance } from 'fastify';

interface Language {
  code: string;
  displayName: string;
  sttSupported: boolean;
  ttsSupported: boolean;
}

describe('GET /api/languages', () => {
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
      url: '/api/languages',
    });
    expect(response.statusCode).toBe(200);
  });

  it('returns an array', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns at least 50 languages', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    expect(body.length).toBeGreaterThanOrEqual(50);
  });

  it('each language has required fields: code, displayName, sttSupported, ttsSupported', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    body.forEach((lang) => {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('displayName');
      expect(lang).toHaveProperty('sttSupported');
      expect(lang).toHaveProperty('ttsSupported');
    });
  });

  it('code field is a non-empty string', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    body.forEach((lang) => {
      expect(typeof lang.code).toBe('string');
      expect(lang.code.length).toBeGreaterThan(0);
    });
  });

  it('displayName field is a non-empty string', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    body.forEach((lang) => {
      expect(typeof lang.displayName).toBe('string');
      expect(lang.displayName.length).toBeGreaterThan(0);
    });
  });

  it('sttSupported field is a boolean', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    body.forEach((lang) => {
      expect(typeof lang.sttSupported).toBe('boolean');
    });
  });

  it('ttsSupported field is a boolean', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    body.forEach((lang) => {
      expect(typeof lang.ttsSupported).toBe('boolean');
    });
  });

  it('includes common languages like English and Vietnamese', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    const codes = body.map((lang) => lang.code);
    expect(codes).toContain('en');
    expect(codes).toContain('vi');
  });

  it('top 30 most common languages have sttSupported: true', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    const sttLanguages = body.filter((lang) => lang.sttSupported);
    expect(sttLanguages.length).toBeGreaterThanOrEqual(30);
  });

  it('top 40 most common languages have ttsSupported: true', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/languages',
    });
    const body: Language[] = JSON.parse(response.body);
    const ttsLanguages = body.filter((lang) => lang.ttsSupported);
    expect(ttsLanguages.length).toBeGreaterThanOrEqual(40);
  });
});
