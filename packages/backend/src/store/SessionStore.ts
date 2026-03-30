import type { SttStream } from '../providers/SttProvider.js';

export interface Session {
  sessionId: string;
  targetLanguage: string | null;
  lastSpeakerALang: string | null;
  lastSpeakerBLang: string | null;
  activeSpeaker: 'A' | 'B' | null;
  sttStream: SttStream | null;
  createdAt: number;
}

// Singleton in-memory store: sessionId → Session
export const sessionStore = new Map<string, Session>();
