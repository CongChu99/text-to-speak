import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// We'll import the function after it's implemented
// For now, this import will fail (RED state)
import { setupGoogleCredentials } from '../config/googleCredentials.js';

describe('setupGoogleCredentials', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('does nothing when neither env var is set', () => {
    expect(() => setupGoogleCredentials()).not.toThrow();
    expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBeUndefined();
  });

  it('does nothing when GOOGLE_APPLICATION_CREDENTIALS is already set as a file path', () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/some/path/credentials.json';
    setupGoogleCredentials();
    expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBe('/some/path/credentials.json');
  });

  it('decodes base64 JSON from GOOGLE_APPLICATION_CREDENTIALS_JSON and writes to temp file', () => {
    const fakeCredentials = { type: 'service_account', project_id: 'test-project' };
    const base64Encoded = Buffer.from(JSON.stringify(fakeCredentials)).toString('base64');
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = base64Encoded;

    setupGoogleCredentials();

    expect(process.env.GOOGLE_APPLICATION_CREDENTIALS).toBeDefined();
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
    expect(fs.existsSync(credPath)).toBe(true);

    const written = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
    expect(written).toEqual(fakeCredentials);

    // Cleanup
    fs.unlinkSync(credPath);
  });

  it('throws if GOOGLE_APPLICATION_CREDENTIALS_JSON is invalid base64 JSON', () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = 'not-valid-base64!!!';
    expect(() => setupGoogleCredentials()).toThrow();
  });
});
