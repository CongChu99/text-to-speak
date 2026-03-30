import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { sessionStore, type Session } from '../store/SessionStore.js';
import type { IncomingMessage, OutgoingMessage } from '../types/messages.js';

function send(ws: WebSocket, msg: OutgoingMessage): void {
  ws.send(JSON.stringify(msg));
}

export async function sessionWsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws/session', { websocket: true }, (socket, _request) => {
    const sessionId = randomUUID();

    const session: Session = {
      sessionId,
      targetLanguage: null,
      lastSpeakerALang: null,
      lastSpeakerBLang: null,
      activeSpeaker: null,
      sttStream: null,
      createdAt: Date.now(),
    };

    sessionStore.set(sessionId, session);

    socket.on('message', (raw: Buffer | string) => {
      let msg: { type?: string } & Record<string, unknown>;

      try {
        msg = JSON.parse(raw.toString()) as typeof msg;
      } catch {
        send(socket, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      const currentSession = sessionStore.get(sessionId);
      if (!currentSession) {
        send(socket, { type: 'error', message: 'Session not found' });
        return;
      }

      switch (msg.type) {
        case 'set_target_language': {
          const typed = msg as unknown as IncomingMessage & { type: 'set_target_language' };
          currentSession.targetLanguage = typed.language ?? null;
          break;
        }

        case 'audio_chunk': {
          // Stub: just acknowledge receipt (no reply = ok, or we could send ack)
          // Per spec: "acknowledge or no error" — we do nothing (no error = pass)
          break;
        }

        case 'stop_speaking': {
          // Stub: finalize current STT stream (no-op for now)
          break;
        }

        default:
          send(socket, { type: 'error', message: `Unknown message type: ${String(msg.type)}` });
      }
    });

    socket.on('close', () => {
      sessionStore.delete(sessionId);
    });
  });
}
