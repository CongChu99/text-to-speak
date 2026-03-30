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

/** Free mode: browser handles STT, sends text for translation only */
export interface TranslateTextMessage {
  type: 'translate_text';
  text: string;
  sourceLang: string;
  targetLang: string;
  utteranceId: string;
  speaker: 'A' | 'B';
}

export type IncomingMessage =
  | SetTargetLanguageMessage
  | AudioChunkMessage
  | StopSpeakingMessage
  | TranslateTextMessage;

// Outgoing message types (server → browser)

export interface PartialTranscriptMessage {
  type: 'partial_transcript';
  text: string;
  utteranceId: string;
}

export interface FinalTranscriptMessage {
  type: 'final_transcript';
  text: string;
  speaker: 'A' | 'B';
  utteranceId: string;
}

export interface TranslationMessage {
  type: 'translation';
  text: string;
  language: string;
  utteranceId: string;
}

export interface AudioReadyMessage {
  type: 'audio_ready';
  data: string; // base64-encoded audio
  utteranceId: string;
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
