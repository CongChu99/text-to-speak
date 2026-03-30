import { EventEmitter } from 'events';

export interface SttStreamConfig {
  sampleRate?: number;
}

export interface TranscriptEvent {
  text: string;
  detectedLang: string;
  isFinal: boolean;
  confidence: number;
}

export interface ErrorEvent {
  message: string;
}

export interface SttStream extends EventEmitter {
  sendAudio(chunk: Buffer): void;
  stop(): void;
}

export interface SttProvider {
  stream(config: SttStreamConfig): SttStream;
}
