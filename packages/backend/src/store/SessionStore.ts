export interface Session {
  sessionId: string;
  targetLanguage: string | null;
  lastSpeakerALang: string | null;
  lastSpeakerBLang: string | null;
  activeSpeaker: 'A' | 'B' | null;
  sttStream: null; // will be filled in task 3
  createdAt: number;
}

// Singleton in-memory store: sessionId → Session
export const sessionStore = new Map<string, Session>();
