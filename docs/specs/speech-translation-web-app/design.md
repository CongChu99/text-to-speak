# Design: Speech Translation Web App

## Context

People in cross-language encounters (travelers, hospitality workers, language learners) cannot hold fluid conversations today. Existing tools require app installs, account creation, or manual language selection. Google Interpreter Mode — the closest prior art — was discontinued in 2025. This app fills that gap: a zero-install, zero-auth web app where Person B sets one target language and both speakers can converse naturally in real time, each hearing the other in their own language.

## Architecture Overview

```
Browser (React SPA)
  │
  ├── MediaRecorder API → WebSocket → Backend (Node.js/Fastify)
  │                                        │
  │                                        ├── Deepgram Nova-3 (STT streaming)
  │                                        │     └── returns: { transcript, detectedLang, isFinal }
  │                                        │
  │                                        ├── OpenAI GPT-4o-mini (Translation)
  │                                        │     └── returns: translatedText
  │                                        │
  │                                        └── Google Cloud TTS (Synthesis)
  │                                              └── returns: audioBuffer (MP3/OGG)
  │
  └── WebSocket ← audioBuffer + transcript ← Backend
        │
        └── AudioContext.play() + transcript UI update
```

**Data flow per utterance (single-device two-way):**
1. User taps Speak → MediaRecorder starts → audio chunks stream over WebSocket
2. Backend pipes chunks to Deepgram streaming STT → partial transcripts returned to UI
3. On final transcript: backend calls OpenAI GPT-4o-mini with `{text, sourceLang, targetLang}`
4. Translated text sent to Google Cloud TTS → audio buffer streamed back to browser
5. Browser plays audio + renders final transcript entry in conversation log
6. User releases Speak → MediaRecorder stops → next speaker can begin

## Components

### Component 1: ConversationUI (Frontend)
- **Purpose**: Root UI component. Renders the target language selector, speak button, live transcript panel, and conversation history. Manages local UI state (speaking indicator, current utterance, scroll position).
- **Interface**: Reads session state from Zustand store; dispatches actions (startCapture, stopCapture, setTargetLanguage)
- **Dependencies**: AudioPlayer, TranscriptPanel, LanguageSelector, WebSocketClient

### Component 2: AudioCaptureService (Frontend)
- **Purpose**: Wraps MediaRecorder API. Starts/stops microphone capture. Splits audio into 150ms chunks and emits them to WebSocketClient. Handles browser permission lifecycle.
- **Interface**: `start(deviceId?) → void`, `stop() → void`, `onChunk(handler)`, `onError(handler)`
- **Dependencies**: Browser MediaRecorder API, WebSocketClient

### Component 3: WebSocketClient (Frontend)
- **Purpose**: Manages the WebSocket connection to the backend. Sends audio chunks upstream. Receives events downstream: `partial_transcript`, `final_transcript`, `translation`, `audio_ready`, `error`.
- **Interface**: `connect(url)`, `send(audioChunk)`, `on(event, handler)`, `disconnect()`
- **Dependencies**: Browser WebSocket API

### Component 4: AudioPlayer (Frontend)
- **Purpose**: Plays TTS audio buffers received from the backend. Manages AudioContext unlock on iOS (requires first user gesture). Queues audio if a previous clip is playing. Exposes replay capability for conversation history.
- **Interface**: `play(audioBuffer, utteranceId)`, `replay(utteranceId)`, `stop()`
- **Dependencies**: Browser AudioContext API, WebSocketClient

### Component 5: TranslationPipeline (Backend)
- **Purpose**: Core orchestrator. Receives audio chunks from WebSocket, streams to Deepgram, receives transcripts, calls OpenAI for translation, calls Google TTS for synthesis, sends results back to browser client.
- **Interface**: WebSocket message handler — input: `{ type: "audio_chunk", data: Buffer, sessionId }` → output: `{ type: "partial_transcript" | "final_transcript" | "translation" | "audio_ready", ... }`
- **Dependencies**: SttProvider, TranslationProvider, TtsProvider, SessionStore

### Component 6: SttProvider (Backend)
- **Purpose**: Abstraction over Deepgram Nova-3 streaming API. Opens a streaming connection per utterance. Emits partial and final transcripts with detected language. Closes on silence or stop signal.
- **Interface**: `stream(config: { targetSampleRate, languages? }) → EventEmitter<{ transcript, detectedLang, isFinal, confidence }>`
- **Dependencies**: Deepgram Node.js SDK
- **Alternative**: Azure Speech SDK (drop-in replacement via same interface)

### Component 7: TranslationProvider (Backend)
- **Purpose**: Abstraction over OpenAI GPT-4o-mini for translation. Sends a structured prompt requesting translation of `sourceText` from `sourceLang` to `targetLang`. Returns translated string only (no explanation).
- **Interface**: `translate(text: string, sourceLang: string, targetLang: string) → Promise<string>`
- **Dependencies**: OpenAI Node.js SDK (`openai` npm package)
- **Alternative**: Anthropic SDK with Claude Haiku 4.5 — identical interface, swap provider implementation only

### Component 8: TtsProvider (Backend)
- **Purpose**: Abstraction over Google Cloud TTS Neural2 voices. Accepts translated text + language code. Returns MP3 audio buffer.
- **Interface**: `synthesize(text: string, languageCode: string) → Promise<Buffer>`
- **Dependencies**: @google-cloud/text-to-speech npm package
- **Alternative**: Azure TTS (same interface)

### Component 9: SessionStore (Backend)
- **Purpose**: In-memory, per-WebSocket-connection state. Holds: targetLanguage, lastDetectedSpeakerLang, current STT stream reference, utterance sequence number. Cleared on WebSocket disconnect.
- **Interface**: `get(sessionId)`, `set(sessionId, state)`, `delete(sessionId)`
- **Dependencies**: Node.js Map (no external store for MVP)

## Data Model

### Session (in-memory, backend)
```typescript
interface Session {
  sessionId: string;           // UUID, generated on WebSocket connect
  targetLanguage: string;      // ISO 639-1 (e.g., "vi", "ja")
  lastSpeakerALang: string | null;  // detected lang of Person A's last utterance
  lastSpeakerBLang: string | null;  // detected lang of Person B's last utterance
  activeSpeaker: "A" | "B" | null;
  sttStream: EventEmitter | null;   // active Deepgram stream reference
  createdAt: number;           // Date.now()
}
```

### Utterance (in-memory, frontend session only)
```typescript
interface Utterance {
  utteranceId: string;         // UUID
  speakerRole: "A" | "B";
  detectedSourceLang: string;  // ISO 639-1
  sourceTranscript: string;
  translatedText: string;
  audioBuffer: ArrayBuffer | null;  // cached for replay; null if TTS failed
  latencyMs: number;           // time from speech start to audio play
  timestamp: number;           // Date.now()
  status: "partial" | "translating" | "ready" | "error";
}
```

### LanguageOption (frontend static config)
```typescript
interface LanguageOption {
  code: string;       // ISO 639-1 (e.g., "vi")
  displayName: string; // localized (e.g., "Vietnamese")
  sttSupported: boolean;
  ttsSupported: boolean;
}
```

**Business rules enforced by data model:**
- `Session.targetLanguage` is always set by Person B; never auto-assigned
- `Utterance.audioBuffer` is never sent to or stored on the server
- Session is deleted from SessionStore on WebSocket close event (enforces audio privacy rule)

## API Design

### WebSocket: `/ws/session`

**Client → Server messages:**

```json
{ "type": "set_target_language", "language": "vi" }
{ "type": "audio_chunk", "data": "<base64 PCM>", "speaker": "A" }
{ "type": "stop_speaking" }
```

**Server → Client messages:**

```json
{ "type": "partial_transcript", "text": "Hello how", "lang": "en" }
{ "type": "final_transcript", "text": "Hello, how much does this cost?", "lang": "en", "utteranceId": "uuid" }
{ "type": "translation", "utteranceId": "uuid", "translatedText": "Xin chào, cái này giá bao nhiêu?" }
{ "type": "audio_ready", "utteranceId": "uuid", "audioData": "<base64 MP3>" }
{ "type": "error", "code": "STT_FAILED | TRANSLATION_FAILED | TTS_FAILED", "utteranceId": "uuid", "message": "..." }
```

### HTTP: `GET /health`
Returns `{ status: "ok", version: "1.0.0" }` — used by Railway health checks.

### HTTP: `GET /api/languages`
Returns the list of supported language options:
```json
{ "languages": [{ "code": "vi", "displayName": "Vietnamese", "sttSupported": true, "ttsSupported": true }, ...] }
```

## Error Handling

| Error | Source | Client Behavior | Server Behavior |
|-------|--------|----------------|----------------|
| Microphone permission denied | Browser | Show error UI with browser-specific instructions; disable Speak button | N/A |
| WebSocket connection failed | Network | Show "Connection failed — retrying..." with exponential backoff (max 3 retries) | N/A |
| STT_FAILED | Deepgram timeout/error | Show "Could not recognize speech — try again" on current utterance | Log error, close STT stream, send error event |
| TRANSLATION_FAILED | OpenAI error | Show source transcript with "Translation unavailable" indicator; skip TTS | Log error with utteranceId; send error event |
| TTS_FAILED | Google TTS error | Show translated text with "Tap to hear" manual replay button | Log error; send error event with translatedText |
| Language not detected | Deepgram low confidence | Show "Language not recognized" warning; attempt translation with best-guess | Pass through with confidence flag |
| iOS AudioContext blocked | iOS Safari autoplay policy | AudioContext unlocked on first Speak button tap; subsequent audio plays automatically | N/A |

## Goals / Non-Goals

**Goals:**
- Sub-1.5s end-to-end latency at P50 under normal network conditions
- Zero-friction first use: no account, no install, under 30s to first translation
- Cross-browser support: Chrome, Edge, Safari iOS/desktop
- Audio never persisted server-side
- Both speakers' languages handled automatically with no manual toggling

**Non-Goals:**
- User authentication or persistent data storage
- Multi-device sessions or shareable links (v1.1)
- Offline functionality (v2)
- Paid tier infrastructure (v1.1)
- Support for SeamlessM4T or self-hosted models (v2 cost reduction)

## Decisions

### Decision 1: Cloud STT over Web Speech API
**Chosen**: Deepgram Nova-3 via WebSocket streaming
**Rejected**: Web Speech API (browser-native)
**Rationale**: Web Speech API has ~50% browser support (no Firefox, partial iOS Safari) and critically does not support automatic language detection — which is the app's primary differentiator. Cloud STT adds infrastructure cost but is the only path to cross-browser + auto-detect simultaneously.

### Decision 2: OpenAI GPT-4o-mini for Translation
**Chosen**: OpenAI GPT-4o-mini (prompt-based)
**Rejected**: Google Cloud Translation v3 (rule-based API)
**Rationale**: User requirement. GPT-4o-mini handles idiomatic expressions, cultural nuance, and low-resource language pairs better than rule-based translation APIs. Cost is comparable (~$0.15/1M input tokens). Claude Haiku 4.5 is a documented alternative requiring only a provider swap.

### Decision 3: Tap-to-Speak over Voice Activity Detection (VAD)
**Chosen**: Explicit tap-to-speak button for turn switching
**Rejected**: Automatic VAD-based turn detection
**Rationale**: On a single shared device, a microphone picks up both speakers. VAD cannot reliably distinguish who is the "active" speaker when both are in proximity. Tap-to-speak eliminates crosstalk ambiguity at the cost of one extra interaction step — acceptable for the traveler use case.

### Decision 4: Fully Stateless MVP (No Database)
**Chosen**: In-memory session state, no database
**Rejected**: PostgreSQL or Redis for session persistence
**Rationale**: MVP has no auth and no cross-session features. A database adds deployment complexity with zero MVP benefit. Session state needed only for the duration of a WebSocket connection lifetime.

### Decision 5: Single Environment for MVP
**Chosen**: One production environment (Railway, main branch)
**Rejected**: Staging + production separation
**Rationale**: Pre-revenue MVP with one developer. The operational overhead of maintaining two environments is not justified until there are real users to protect.

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Google Translate achieves GA web speech in 2026 | High | High | Compete on UX simplicity, zero-account, and privacy; pivot to hospitality B2B niche if consumer market collapses |
| End-to-end latency exceeds 2s at P95 (noisy mic, slow network) | Medium | High | Deepgram Nova-3 streaming (~150-300ms STT); co-locate backend with CDN edge; display latency indicator; show partial transcripts to mask wait time |
| Safari iOS AudioContext autoplay restriction | Medium | Medium | Unlock AudioContext on first Speak button tap (first user gesture); test early on real iOS devices |
| Safari iOS MediaRecorder audio format incompatibility | Medium | Medium | Use PCM/16kHz or WebM/Opus; test with actual Safari on iOS 16+ before launch |
| OpenAI API outage breaks all translation | Low | High | Abstract TranslationProvider; fall back to Claude Haiku 4.5 if OpenAI is down; show source transcript as graceful degradation |
| STT cost overrun (Deepgram $0.0043/min × heavy sessions) | Medium | Medium | No rate limiting in MVP; monitor cost daily via Deepgram dashboard; add rate limiting in v1.1 if needed |
| AI translation failure for low-resource language pairs | Medium | Medium | Prioritize 20 high-traffic language pairs; show confidence warning for edge cases |
| User misuse in high-stakes settings (medical/legal) | Low | High | Add subtle disclaimer in UI ("AI translation — not suitable for medical/legal use"); defer formal disclaimer page to v1.1 |

## Testing Strategy

| Test Type | Coverage | Tools |
|-----------|----------|-------|
| Unit | TranslationProvider, TtsProvider, SttProvider interfaces; SessionStore | Vitest (backend), Vitest (frontend) |
| Integration | WebSocket message protocol (mock Deepgram/OpenAI/Google responses); full pipeline with real providers in dev | Supertest + ws client |
| Browser manual | iOS Safari AudioContext unlock, MediaRecorder format, mobile layout | Real devices (iPhone + Android) |
| Latency benchmark | End-to-end time from audio chunk send to audio play; target P50 < 1.5s | Custom timing in AudioPlayer; log latencyMs per utterance |
| Error scenarios | STT failure, translation failure, TTS failure, WebSocket disconnect | Unit mocks for each provider error case |
