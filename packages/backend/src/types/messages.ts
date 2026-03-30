// Incoming message types (browser → server)

export interface SetTargetLanguageMessage {
  type: 'set_target_language';
  language: string;
}

export interface AudioChunkMessage {
  type: 'audio_chunk';
  data: string; // base64-encoded audio
  speaker: 'A' | 'B';
}

export interface StopSpeakingMessage {
  type: 'stop_speaking';
}

export type IncomingMessage =
  | SetTargetLanguageMessage
  | AudioChunkMessage
  | StopSpeakingMessage;

// Outgoing message types (server → browser)

export interface PartialTranscriptMessage {
  type: 'partial_transcript';
  text: string;
}

export interface FinalTranscriptMessage {
  type: 'final_transcript';
  text: string;
  speaker: 'A' | 'B';
}

export interface TranslationMessage {
  type: 'translation';
  text: string;
  language: string;
}

export interface AudioReadyMessage {
  type: 'audio_ready';
  data: string; // base64-encoded audio
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type OutgoingMessage =
  | PartialTranscriptMessage
  | FinalTranscriptMessage
  | TranslationMessage
  | AudioReadyMessage
  | ErrorMessage;
