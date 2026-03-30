# Proposal: Speech Translation Web App

## Why

No B2C web tool today offers zero-install + automatic source language detection + two-way voice conversation in a single product. Google Interpreter Mode (the closest prior art) was discontinued in 2025, leaving a clear market vacuum. Google Translate's Gemini-powered live speech feature is still in limited beta (US/Mexico/India only, early 2026), leaving a 12–18 month window to establish a differentiated position. The primary target user — an international traveler communicating with a local — needs a solution that opens instantly in any mobile browser, requires no account, and works without app installation.

The technical path is validated: cloud STT (Deepgram Nova-3) + translation API + cloud TTS over WebSocket can deliver sub-1s end-to-end latency. The market gap is real and the build cost is proportionate to an MVP.

## What Changes

This is a new greenfield web application. No existing system is being modified.

New capabilities enable a real-time speech-to-speech translation loop:
- Person B (listener) opens the URL and selects their target language — the only setup step required
- Person A speaks in any language; the app auto-detects, translates, and plays audio for Person B
- Person B speaks a reply; the process reverses automatically
- A live transcript with audio replay is shown on-screen throughout

## Capabilities

### New Capabilities

- `speech-capture`: Real-time microphone capture in browser via MediaRecorder API, streamed over WebSocket to backend
- `auto-language-detect`: Automatic source language identification via cloud STT (Deepgram Nova-3 or Azure Speech); no manual source language selection required
- `ai-translation`: Cloud translation of STT transcript to user-configured target language (Google Cloud Translation or DeepL API)
- `tts-playback`: Cloud TTS synthesis of translated text played back as audio in the browser (Google Cloud TTS or Azure TTS)
- `target-language-selector`: Searchable dropdown of 50+ supported languages; persisted in session storage; switchable mid-conversation without reload
- `live-transcript`: Real-time display of source transcript and translated text side by side during conversation
- `two-way-conversation`: Both speakers use the same device; app detects speaker turn-taking via silence detection; each utterance is independently translated to the other speaker's language
- `conversation-history`: Session-scoped log of all utterances (source text, translated text, speaker role); audio replay of any translated segment

### Modified Capabilities

None — greenfield product.

## Scope

### In Scope

- Browser microphone capture (MediaRecorder + WebSocket streaming)
- Cloud STT with streaming and automatic language detection
- Cloud translation API (50+ language pairs)
- Cloud TTS playback of translated audio
- Target language selector (searchable, 50+ languages)
- Live on-screen transcript (source + translated text)
- Two-way single-device conversation with turn detection
- Conversation history with audio replay for current session
- Mobile-responsive design (iOS Safari, Android Chrome, desktop Chrome/Edge)

### Out of Scope (Non-Goals)

- User authentication or accounts of any kind
- Shareable session links or multi-device sessions (deferred to v1.1)
- Paid tiers, rate limiting, or monetization infrastructure (deferred to v1.1)
- Offline mode or PWA (deferred to v2)
- Persistent conversation history across sessions (requires auth — deferred)
- Professional interpreter disclaimer UI (Phase 2)
- Dialect-level TTS selection (post-MVP)

## Success Criteria

- A new user can complete their first translation within **< 30 seconds** of opening the URL (zero setup, no account, no install)
- End-to-end latency (speech start → translated audio plays): **P50 < 1.5s, P95 < 3s** under normal network conditions
- App functions correctly on Chrome, Edge, Safari iOS/desktop — covering **≥ 95% of browser market share**
- Automatic source language detection is correct for **≥ 20 most common language pairs** (covering >80% of real-world use cases)
- Target language selector covers **≥ 50 languages** at launch
- Audio is never persisted server-side — verified via architecture review and privacy audit

## Impact

**Competitive positioning**: Direct replacement for discontinued Google Interpreter Mode; competes with Google Translate (web), SayHi, and Papago for B2C travelers. Differentiates via zero-install web access, auto source detection, and privacy-first ephemeral audio.

**External dependencies introduced**:
- Cloud STT provider: Deepgram Nova-3 or Azure Speech (streaming, language detection)
- Translation API: Google Cloud Translation v3 or DeepL API
- Cloud TTS: Google Cloud TTS or Azure TTS
- WebSocket server infrastructure (Node.js or Python backend)

**Browser APIs required**: MediaRecorder API (>95% support on target browsers), WebSocket API (universal support)
