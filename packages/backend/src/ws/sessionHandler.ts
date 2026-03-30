import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { randomUUID } from 'crypto';
import { sessionStore, type Session } from '../store/SessionStore.js';
import type { OutgoingMessage } from '../types/messages.js';
import { DeepgramSttProvider } from '../providers/DeepgramSttProvider.js';
import { OpenAITranslationProvider } from '../providers/OpenAITranslationProvider.js';
import { OllamaTranslationProvider } from '../providers/OllamaTranslationProvider.js';
import { GoogleTtsProvider } from '../providers/GoogleTtsProvider.js';
import type { SttProvider } from '../providers/SttProvider.js';
import type { TranslationProvider } from '../providers/TranslationProvider.js';
import type { TtsProvider } from '../providers/TtsProvider.js';

// Lazy-initialized providers (shared across sessions)
let sttProvider: SttProvider | null = null;
let translationProvider: TranslationProvider | null = null;
let ttsProvider: TtsProvider | null = null;

function getSttProvider(): SttProvider {
  if (!sttProvider) {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key || key === 'your_deepgram_api_key_here') {
      throw new Error('DEEPGRAM_API_KEY is not configured. Use free mode (browser STT) instead.');
    }
    sttProvider = new DeepgramSttProvider(key);
  }
  return sttProvider;
}

function getTranslationProvider(): TranslationProvider {
  if (!translationProvider) {
    const provider = process.env.TRANSLATION_PROVIDER || 'ollama';

    if (provider === 'openai') {
      const key = process.env.OPENAI_API_KEY;
      if (!key || key === 'your_openai_api_key_here') {
        throw new Error('OPENAI_API_KEY is not configured.');
      }
      translationProvider = new OpenAITranslationProvider(key);
    } else {
      // Default: Ollama (free, local)
      const url = process.env.OLLAMA_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'gemma3:4b';
      translationProvider = new OllamaTranslationProvider(url, model);
    }
  }
  return translationProvider;
}

function getTtsProvider(): TtsProvider | null {
  if (!ttsProvider) {
    const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!creds || creds === '/path/to/service-account.json') {
      return null; // TTS handled by browser
    }
    ttsProvider = new GoogleTtsProvider(creds);
  }
  return ttsProvider;
}

function send(ws: WebSocket, msg: OutgoingMessage): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
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
    app.log.info({ sessionId }, 'WebSocket session created');

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
          currentSession.targetLanguage = (msg.language as string) ?? null;
          app.log.info({ sessionId, targetLanguage: currentSession.targetLanguage }, 'Target language set');
          break;
        }

        // ── FREE MODE: Browser handles STT, server only translates ──
        case 'translate_text': {
          const text = msg.text as string;
          const targetLang = (msg.targetLang as string) || currentSession.targetLanguage;
          const utteranceId = (msg.utteranceId as string) || randomUUID();

          if (!text || !targetLang) {
            send(socket, { type: 'error', message: 'Missing text or target language' });
            break;
          }

          void translateText(socket, text, msg.sourceLang as string || 'auto', targetLang, utteranceId, app);
          break;
        }

        // ── API MODE: Server handles STT via Deepgram ──
        case 'audio_chunk': {
          const speaker = (msg.speaker as 'A' | 'B') ?? 'A';
          const audioData = msg.data as string;

          if (!audioData) {
            send(socket, { type: 'error', message: 'Missing audio data' });
            break;
          }

          try {
            if (!currentSession.sttStream) {
              const provider = getSttProvider();
              const stream = provider.stream({ sampleRate: 16000 });
              currentSession.sttStream = stream;
              currentSession.activeSpeaker = speaker;

              stream.on('transcript', (event: { text: string; detectedLang: string; isFinal: boolean; confidence: number }) => {
                if (!event.text || event.text.trim() === '') return;
                const utteranceId = randomUUID();

                if (!event.isFinal) {
                  send(socket, { type: 'partial_transcript', text: event.text, utteranceId });
                } else {
                  send(socket, { type: 'final_transcript', text: event.text, speaker, utteranceId });
                  const targetLang = currentSession.targetLanguage;
                  if (targetLang) {
                    void translateAndSpeak(socket, event.text, event.detectedLang, targetLang, utteranceId, app);
                  }
                }
              });

              stream.on('error', (event: { message: string }) => {
                app.log.error({ sessionId, error: event.message }, 'STT stream error');
                send(socket, { type: 'error', message: `Speech recognition error: ${event.message}` });
              });
            }

            const audioBuffer = Buffer.from(audioData, 'base64');
            currentSession.sttStream.sendAudio(audioBuffer);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Failed to process audio';
            app.log.error({ sessionId, error: errMsg }, 'Audio processing error');
            send(socket, { type: 'error', message: errMsg });
          }
          break;
        }

        case 'stop_speaking': {
          if (currentSession.sttStream) {
            currentSession.sttStream.stop();
            currentSession.sttStream = null;
            currentSession.activeSpeaker = null;
          }
          break;
        }

        default:
          send(socket, { type: 'error', message: `Unknown message type: ${String(msg.type)}` });
      }
    });

    socket.on('close', () => {
      const s = sessionStore.get(sessionId);
      if (s?.sttStream) {
        s.sttStream.stop();
      }
      sessionStore.delete(sessionId);
      app.log.info({ sessionId }, 'WebSocket session closed');
    });
  });
}

/**
 * Free mode: translate text only (browser handles STT + TTS)
 */
async function translateText(
  ws: WebSocket,
  text: string,
  sourceLang: string,
  targetLang: string,
  utteranceId: string,
  app: FastifyInstance,
): Promise<void> {
  try {
    const translator = getTranslationProvider();
    const translated = await translator.translate(text, sourceLang, targetLang);

    send(ws, {
      type: 'translation',
      text: translated,
      language: targetLang,
      utteranceId,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Translation failed';
    app.log.error({ utteranceId, error: errMsg }, 'Translation error');
    send(ws, { type: 'error', message: errMsg });
  }
}

/**
 * API mode: translate text → synthesize audio → send to client
 */
async function translateAndSpeak(
  ws: WebSocket,
  text: string,
  sourceLang: string,
  targetLang: string,
  utteranceId: string,
  app: FastifyInstance,
): Promise<void> {
  try {
    const translator = getTranslationProvider();
    const translated = await translator.translate(text, sourceLang, targetLang);

    send(ws, {
      type: 'translation',
      text: translated,
      language: targetLang,
      utteranceId,
    });

    // TTS (optional — only if Google credentials configured)
    const tts = getTtsProvider();
    if (tts) {
      try {
        const audioBuffer = await tts.synthesize(translated, targetLang);
        const audioBase64 = audioBuffer.toString('base64');
        send(ws, { type: 'audio_ready', data: audioBase64, utteranceId });
      } catch (ttsErr) {
        const errMsg = ttsErr instanceof Error ? ttsErr.message : 'TTS failed';
        app.log.error({ utteranceId, error: errMsg }, 'TTS error');
      }
    }
  } catch (transErr) {
    const errMsg = transErr instanceof Error ? transErr.message : 'Translation failed';
    app.log.error({ utteranceId, error: errMsg }, 'Translation error');
    send(ws, { type: 'error', message: errMsg });
  }
}
