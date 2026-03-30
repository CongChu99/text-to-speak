# Spec: Speech Translation Web App

## ADDED Requirements

---

### Requirement: Target Language Configuration
Person B selects their desired output language before or during a conversation. The app persists this choice for the session and allows changing it at any time without interrupting the conversation.

**Priority**: MUST

#### Scenario: Select target language before first utterance
- **GIVEN** a user has opened the app for the first time (no session in progress)
- **WHEN** the user opens the language selector and chooses "Vietnamese" from the dropdown
- **THEN** the app sets Vietnamese as the active target language, displays it prominently in the UI, and is ready to receive speech input

#### Scenario: Search for a language by name
- **GIVEN** the language selector is open
- **WHEN** the user types "Japa" in the search field
- **THEN** the dropdown filters to show "Japanese" (and any other matches) in real time

#### Scenario: Change target language mid-conversation
- **GIVEN** a conversation is in progress with target language set to Vietnamese
- **WHEN** the user opens the selector and switches to French
- **THEN** all subsequent utterances are translated and played in French; previous utterances in the conversation log remain in Vietnamese

#### Scenario: Target language persists within session
- **GIVEN** the user has selected Spanish as the target language
- **WHEN** the user navigates away and returns within the same browser session
- **THEN** Spanish remains the selected target language (stored in sessionStorage)

---

### Requirement: Real-Time Speech Capture
The app captures microphone audio from the browser in real time and streams it to the backend over WebSocket. The user does not need to press a button to start speaking — capture begins when the user taps/clicks the active microphone button.

**Priority**: MUST

#### Scenario: Microphone permission grant
- **GIVEN** a user opens the app on a supported browser for the first time
- **WHEN** the user taps the microphone button
- **THEN** the browser prompts for microphone permission; on grant, audio capture begins immediately and the UI shows a visual indicator (e.g., waveform or pulsing icon)

#### Scenario: Microphone permission denied
- **GIVEN** a user has denied microphone permission
- **WHEN** the user taps the microphone button
- **THEN** the app shows a clear error message explaining that microphone access is required, with troubleshooting instructions for the specific browser

#### Scenario: Audio streaming starts
- **GIVEN** microphone permission is granted and WebSocket is connected
- **WHEN** the user begins speaking
- **THEN** audio chunks (100–200ms) are streamed to the backend via WebSocket within 50ms of capture; a visual speaking indicator is shown

---

### Requirement: Automatic Source Language Detection
The app identifies the speaker's language automatically from the audio stream. The user (Person A) is never asked to select or confirm their source language.

**Priority**: MUST

#### Scenario: Language detected on first utterance
- **GIVEN** no prior speech has been captured in this turn
- **WHEN** the user speaks a complete phrase in any supported language
- **THEN** the STT provider returns the detected language code alongside the transcript; the app displays the detected language in the transcript UI (e.g., "Detected: English")

#### Scenario: Language detection for 20+ common languages
- **GIVEN** the user speaks in any of: English, Spanish, French, German, Japanese, Korean, Chinese (Mandarin), Vietnamese, Portuguese, Arabic, Hindi, Italian, Dutch, Russian, Thai, Indonesian, Turkish, Polish, Swedish, Danish
- **WHEN** a full utterance is processed
- **THEN** the correct source language is detected and the translation is produced in the configured target language

#### Scenario: Unsupported or ambiguous language
- **GIVEN** the user speaks in a language with low STT coverage
- **WHEN** the STT provider returns low confidence or no language detection
- **THEN** the app shows a warning ("Language not recognized — translation may be inaccurate") and attempts translation with the best-guess language rather than failing silently

---

### Requirement: AI Translation
The app translates the STT transcript into the target language using OpenAI GPT-4o-mini. Translation is triggered once the STT provider signals a final (non-partial) transcript for the utterance.

**Priority**: MUST

#### Scenario: Successful translation
- **GIVEN** the STT returns a final transcript "Hello, how much does this cost?" with detected language "en"
- **WHEN** the translation provider receives the text with target language "vi"
- **THEN** a Vietnamese translation ("Xin chào, cái này giá bao nhiêu?") is returned within 400ms and passed to TTS

#### Scenario: Translation for an idiomatic phrase
- **GIVEN** the speaker says an idiomatic expression (e.g., "break a leg")
- **WHEN** GPT-4o-mini translates to the target language
- **THEN** the translation conveys the correct meaning in context, not a literal word-for-word translation

#### Scenario: Translation API error
- **GIVEN** the OpenAI API is unavailable (timeout or 5xx)
- **WHEN** a translation request fails
- **THEN** the app shows the original transcript on screen with an error indicator ("Translation unavailable — original text shown"); audio playback is skipped for this utterance; the conversation can continue

---

### Requirement: TTS Playback of Translated Audio
The translated text is synthesized to speech and played back automatically in the browser. No user interaction is required to trigger playback.

**Priority**: MUST

#### Scenario: Automatic playback after translation
- **GIVEN** a translation is complete and the target language is Vietnamese
- **WHEN** the TTS provider returns an audio buffer for the Vietnamese translation
- **THEN** the audio plays automatically in the browser within 500ms of the translation completing; a visual indicator shows which utterance is playing

#### Scenario: Correct TTS language matches target
- **GIVEN** target language is set to Japanese
- **WHEN** TTS is synthesized for a translated utterance
- **THEN** the audio is spoken in Japanese with a natural Japanese voice (not approximated to Chinese or Korean)

#### Scenario: TTS playback on mobile browser
- **GIVEN** the user is on iOS Safari or Android Chrome
- **WHEN** TTS audio is ready to play
- **THEN** audio plays without requiring an additional user tap (using AudioContext unlock on first user gesture)

#### Scenario: TTS provider error
- **GIVEN** the TTS API returns an error for a specific utterance
- **WHEN** synthesis fails
- **THEN** the translated text is displayed on screen and a "Tap to hear" button appears; audio playback is not silently dropped

---

### Requirement: Live On-Screen Transcript
During a conversation, the app displays a real-time dual-language transcript — source text on one side, translated text on the other — updating as speech is recognized.

**Priority**: SHOULD

#### Scenario: Partial transcript shown while speaking
- **GIVEN** the user is mid-sentence and the STT returns partial results
- **WHEN** partial transcription data arrives from the backend
- **THEN** the source text field updates in real time showing the recognized words so far (marked as in-progress)

#### Scenario: Final transcript + translation displayed together
- **GIVEN** an utterance is complete
- **WHEN** both final transcript and translation are available
- **THEN** the transcript entry shows: speaker role (A/B), source text (finalized), translated text, and detected source language — all in a single conversation bubble

#### Scenario: Transcript scrolls to latest utterance
- **GIVEN** multiple utterances have been exchanged
- **WHEN** a new utterance is finalized
- **THEN** the transcript view auto-scrolls to the latest entry; older entries remain accessible by scrolling up

---

### Requirement: Two-Way Single-Device Conversation
Both Person A and Person B can speak using the same device in turn. The app handles turn-taking via an explicit tap-to-speak button; it does not use voice activity detection for automatic switching (to avoid crosstalk on a single microphone).

**Priority**: MUST

#### Scenario: Person A speaks, Person B receives translation
- **GIVEN** target language is set to Vietnamese by Person B
- **WHEN** Person A taps the "Speak" button and speaks in English
- **THEN** English is detected, translated to Vietnamese, and played back as audio; the transcript shows the exchange labeled as "Speaker A → B"

#### Scenario: Person B responds
- **GIVEN** Person A's translation just played
- **WHEN** Person B taps the "Speak" button and speaks in Vietnamese
- **THEN** Vietnamese is detected, translated to English (Person A's last detected language), and played back; transcript shows "Speaker B → A"

#### Scenario: Conversation direction is automatic
- **GIVEN** Person A spoke English in the previous turn
- **WHEN** Person B taps Speak and speaks in Vietnamese
- **THEN** the app automatically translates B's speech to English — no manual "flip" or language swap button is required

#### Scenario: Simultaneous tap prevention
- **GIVEN** Person A is currently speaking (audio capture active)
- **WHEN** Person B taps the "Speak" button
- **THEN** Person B's tap is queued or rejected with a UI indicator ("Wait — other speaker is active")

---

### Requirement: Conversation History with Audio Replay
The app maintains a session-scoped log of all utterances. Each entry includes source text, translated text, speaker role, and the ability to replay the translated audio.

**Priority**: SHOULD

#### Scenario: History builds during conversation
- **GIVEN** three utterances have been exchanged
- **WHEN** the user scrolls up in the conversation view
- **THEN** all three utterances are visible with source text, translated text, detected language, and speaker label

#### Scenario: Replay translated audio
- **GIVEN** a past utterance is visible in the history
- **WHEN** the user taps the play icon on that utterance
- **THEN** the translated audio for that utterance plays again; any currently playing audio stops first

#### Scenario: History is session-only
- **GIVEN** the user closes the browser tab
- **WHEN** the user reopens the app URL
- **THEN** no previous conversation history is shown — the session is fresh (no server-side persistence)

---

### Requirement: Mobile-Responsive Design
The app must be fully usable on mobile browsers (iOS Safari, Android Chrome) without any functionality degradation. The two-way conversation UI must be operable with one hand on a phone screen.

**Priority**: MUST

#### Scenario: Tap-to-speak is accessible on mobile
- **GIVEN** the app is open on an iPhone or Android phone in portrait mode
- **WHEN** the user looks at the screen
- **THEN** the "Speak" button is prominently displayed in the lower portion of the screen, reachable with a thumb; the target language selector is accessible without scrolling

#### Scenario: Audio plays on locked iOS Safari
- **GIVEN** the user is on iOS Safari where AudioContext requires a user gesture
- **WHEN** the user has already tapped the Speak button (satisfying the gesture requirement)
- **THEN** subsequent TTS audio playback fires automatically without prompting the user to tap again

---

### Requirement: Zero-Friction First Session
A first-time user must be able to receive their first translated audio within 30 seconds of opening the app URL, with no account creation, no app installation, and no mandatory tutorial.

**Priority**: MUST

#### Scenario: Cold start to first translation
- **GIVEN** a user opens the app URL for the first time on a mobile browser
- **WHEN** they select a target language and tap Speak for the first time
- **THEN** they receive a translated audio response within 30 seconds of page load (excluding network time for first microphone permission prompt)

#### Scenario: No signup gate
- **GIVEN** a user opens the app
- **WHEN** they attempt to use any core feature (language select, speak, hear translation)
- **THEN** they are never redirected to a login or registration screen

---

### Requirement: Audio Privacy — No Server-Side Persistence
Raw audio captured from the microphone is processed in memory and never written to disk or stored in any database on the server. Translated audio (TTS output) is streamed to the client and not retained.

**Priority**: MUST

#### Scenario: Audio not logged server-side
- **GIVEN** a user completes a conversation with 10 utterances
- **WHEN** a developer inspects server logs and storage
- **THEN** no audio files, audio URLs, or raw audio bytes are present in any server log, database, or object storage bucket

#### Scenario: WebSocket connection drop clears state
- **GIVEN** a user disconnects mid-conversation (closes tab, loses connection)
- **WHEN** the WebSocket connection closes
- **THEN** all in-memory session state including any buffered audio is garbage collected; no data is written to disk on disconnect

---

## MODIFIED Requirements

None — greenfield product.

## REMOVED Requirements

None — greenfield product.
