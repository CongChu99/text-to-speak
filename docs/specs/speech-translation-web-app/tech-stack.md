# Tech Stack: Speech Translation Web App

## Frontend

- **Framework**: React 18 + Vite — SPA architecture; Vite for fast dev builds and HMR. Next.js is overkill for a single-page tool with no SSR requirements.
- **Styling**: Tailwind CSS — mobile-first utility classes, rapid UI iteration
- **State Management**: Zustand — lightweight global state for session/language config; no Redux complexity needed for MVP
- **Audio**: MediaRecorder API (browser-native) — captures microphone input as WebM/Opus or PCM chunks for streaming

## Backend

- **Runtime**: Node.js 20 LTS
- **Framework**: Fastify — lower overhead than Express, native WebSocket support via `@fastify/websocket`
- **WebSocket**: `ws` library via Fastify plugin — handles bidirectional audio streaming between browser and backend
- **Database**: None — MVP is fully stateless. No auth, no persistent data. Session state held in memory per WebSocket connection.
- **Cache**: None for MVP — TTS audio is ephemeral, not cached

## AI / External APIs

- **STT (Speech-to-Text)**: Deepgram Nova-3 Streaming
  - Auto language detection (45+ languages), ~150–300ms P50 latency
  - Cost: $0.0043/min streaming
  - Lock-in risk: Medium — abstract behind `SttProvider` interface; Azure Speech is a drop-in alternative
  - Alternative: Azure Speech Service ($1/hr streaming speech translation — bundles STT + translation in one call)

- **Translation**: OpenAI GPT-4o-mini
  - Prompt-based translation; handles 100+ languages, idiomatic nuance, and low-resource pairs better than rule-based APIs
  - Cost: ~$0.15/1M input tokens + $0.60/1M output tokens — significantly cheaper than GPT-4o for translation tasks
  - Latency: ~200–400ms per translation call
  - Lock-in risk: Medium — abstract behind `TranslationProvider` interface; Anthropic Claude Haiku 4.5 is a direct alternative with minimal code change
  - Alternative: Anthropic Claude Haiku 4.5 (claude-haiku-4-5-20251001) — comparable cost and quality

- **TTS (Text-to-Speech)**: Google Cloud TTS (Neural2 voices)
  - High-quality neural voices for 50+ languages, natural prosody
  - Cost: $16/1M characters (Neural2)
  - Lock-in risk: Medium — abstract behind `TtsProvider` interface; Azure TTS or ElevenLabs are alternatives
  - Alternative: Azure TTS (comparable quality, $16/1M chars Neural)

## Infrastructure

- **Hosting**: Railway (initial MVP) — supports WebSocket, Node.js, auto-deploy from GitHub, generous free tier
  - Alternative: Render.com (same profile)
  - Upgrade path: AWS ECS or Fly.io when traffic justifies
- **Container**: Docker (Dockerfile in repo) — ensures environment parity dev/prod
- **IaC**: None for MVP — Railway handles provisioning; add Terraform at v1.1 if moving to AWS

## CI/CD

- **Pipeline**: GitHub Actions
  - On push to `main`: lint → test → build → deploy to Railway
  - On PR: lint + test only

## Monitoring & Logging

- **Error tracking**: Sentry (free tier) — frontend + backend error capture
- **Logging**: Logtail / Better Stack (free tier) — structured JSON logs from backend; include latency_ms per utterance for pipeline monitoring
- **Alerting**: Railway built-in metrics for MVP; add PagerDuty/Uptime Robot at v1.1

## Deployment Strategy

- **Strategy**: Rolling deploy (Railway default) — acceptable for stateless MVP; WebSocket connections drop on deploy (brief, acceptable)
- **Environments**: `main` → production (single environment for MVP)
- **Secrets management**: Railway environment variables for API keys (Deepgram, OpenAI, Google Cloud TTS)

## Provider Abstraction (Design Constraint)

All three AI providers (STT, Translation, TTS) MUST be accessed through provider interfaces, not called directly. This enables:
1. Swapping OpenAI → Claude or Google STT → Azure without frontend changes
2. A/B testing providers on latency/quality
3. Cost failover if a provider has an outage

```
SttProvider interface: { streamTranscribe(audioChunk, config) → { transcript, detectedLanguage, isFinal } }
TranslationProvider interface: { translate(text, sourceLang, targetLang) → string }
TtsProvider interface: { synthesize(text, language) → AudioBuffer }
```
