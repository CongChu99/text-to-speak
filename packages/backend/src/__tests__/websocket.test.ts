import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../server';
import type { FastifyInstance } from 'fastify';
import { sessionStore } from '../store/SessionStore';

describe('WebSocket /ws/session', () => {
  let app: FastifyInstance;
  let address: string;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    await app.listen({ port: 0, host: '127.0.0.1' });
    const addr = app.server.address();
    if (!addr || typeof addr === 'string') throw new Error('No address');
    address = `ws://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    sessionStore.clear();
  });

  function openWs(url: string): Promise<import('ws').WebSocket> {
    return new Promise((resolve, reject) => {
      // Use the ws module bundled with @fastify/websocket
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WS = require('ws');
      const ws: import('ws').WebSocket = new WS(url);
      ws.on('open', () => resolve(ws));
      ws.on('error', reject);
    });
  }

  function waitForMessage(ws: import('ws').WebSocket): Promise<unknown> {
    return new Promise((resolve, reject) => {
      ws.once('message', (data) => {
        try {
          resolve(JSON.parse(data.toString()));
        } catch {
          resolve(data.toString());
        }
      });
      ws.once('error', reject);
    });
  }

  function closeWs(ws: import('ws').WebSocket): Promise<void> {
    return new Promise((resolve) => {
      ws.once('close', () => resolve());
      ws.close();
    });
  }

  it('connects successfully to /ws/session', async () => {
    const ws = await openWs(`${address}/ws/session`);
    expect(ws.readyState).toBe(1); // OPEN
    await closeWs(ws);
  });

  it('creates a session in SessionStore on connect', async () => {
    const ws = await openWs(`${address}/ws/session`);

    // Give server a moment to process
    await new Promise((r) => setTimeout(r, 50));

    expect(sessionStore.size).toBe(1);
    await closeWs(ws);
  });

  it('updates session.targetLanguage on set_target_language message', async () => {
    const ws = await openWs(`${address}/ws/session`);
    await new Promise((r) => setTimeout(r, 50));

    ws.send(JSON.stringify({ type: 'set_target_language', language: 'vi' }));
    await new Promise((r) => setTimeout(r, 50));

    const sessions = Array.from(sessionStore.values());
    expect(sessions.length).toBe(1);
    expect(sessions[0].targetLanguage).toBe('vi');

    await closeWs(ws);
  });

  it('removes session from SessionStore on WebSocket close', async () => {
    const ws = await openWs(`${address}/ws/session`);
    await new Promise((r) => setTimeout(r, 50));

    expect(sessionStore.size).toBe(1);

    await closeWs(ws);
    await new Promise((r) => setTimeout(r, 50));

    expect(sessionStore.size).toBe(0);
  });

  it('sends acknowledgment or no error for audio_chunk message', async () => {
    const ws = await openWs(`${address}/ws/session`);
    await new Promise((r) => setTimeout(r, 50));

    // Send audio_chunk and verify no error type comes back
    // (we set up a listener first)
    let receivedError = false;
    const msgPromise = new Promise<unknown>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 200);
      ws.once('message', (data) => {
        clearTimeout(timeout);
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'error') receivedError = true;
          resolve(msg);
        } catch {
          resolve(null);
        }
      });
    });

    ws.send(JSON.stringify({ type: 'audio_chunk', data: 'base64data', speaker: 'A' }));
    await msgPromise;

    expect(receivedError).toBe(false);

    await closeWs(ws);
  });

  it('sends error message for unknown message types', async () => {
    const ws = await openWs(`${address}/ws/session`);
    await new Promise((r) => setTimeout(r, 50));

    const msgPromise = waitForMessage(ws);
    ws.send(JSON.stringify({ type: 'unknown_type' }));
    const msg = await msgPromise as { type: string };

    expect(msg.type).toBe('error');

    await closeWs(ws);
  });
});
