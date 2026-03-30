import { useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { BrowserSpeechRecognition } from '../lib/speechRecognition'
import { speakText, stopSpeaking as stopBrowserSpeaking } from '../lib/speechSynthesis'
import { AudioPlayer } from '../lib/audioPlayer'

/**
 * Manages WebSocket connection + speech pipeline.
 *
 * FREE MODE (default):
 *   Browser SpeechRecognition → WebSocket (translate_text) → Ollama → Browser SpeechSynthesis
 *
 * API MODE (when Deepgram/Google keys are set):
 *   AudioRecorder → WebSocket (audio_chunk) → Deepgram STT → Ollama/OpenAI → Google TTS
 */
export function useSession() {
  const wsRef = useRef<WebSocket | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const playerRef = useRef<AudioPlayer | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const store = useSessionStore()
  const targetLanguageRef = useRef(store.targetLanguage)
  targetLanguageRef.current = store.targetLanguage

  const {
    setConnectionStatus,
    setPartialTranscript,
    addUtterance,
    updateUtteranceTranslation,
    setIsPlayingAudio,
    setError,
  } = store

  // Initialize audio player (for API mode TTS fallback)
  useEffect(() => {
    playerRef.current = new AudioPlayer((playing) => {
      setIsPlayingAudio(playing)
    })
    return () => {
      playerRef.current?.stop()
    }
  }, [setIsPlayingAudio])

  // ─── WebSocket Connection ───
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${location.host}/ws/session`)

    ws.onopen = () => {
      setConnectionStatus('connected')
      ws.send(JSON.stringify({
        type: 'set_target_language',
        language: targetLanguageRef.current,
      }))
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      wsRef.current = null
      reconnectTimerRef.current = setTimeout(() => connect(), 2000)
    }

    ws.onerror = () => {
      setConnectionStatus('error')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string
          text?: string
          speaker?: 'A' | 'B'
          language?: string
          data?: string
          message?: string
          utteranceId?: string
        }

        switch (msg.type) {
          case 'partial_transcript':
            if (msg.text) setPartialTranscript(msg.text)
            break

          case 'final_transcript':
            setPartialTranscript('')
            if (msg.text && msg.utteranceId) {
              addUtterance({
                id: msg.utteranceId,
                speaker: msg.speaker ?? 'A',
                sourceText: msg.text,
                translatedText: '…',
                sourceLang: 'auto',
                targetLang: targetLanguageRef.current,
              })
            }
            break

          case 'translation':
            if (msg.utteranceId && msg.text) {
              updateUtteranceTranslation(msg.utteranceId, msg.text)

              // In free mode: use browser TTS to speak the translation
              if (msg.language) {
                setIsPlayingAudio(true)
                speakText(msg.text, msg.language)
                  .catch(() => {/* ignore TTS errors */})
                  .finally(() => setIsPlayingAudio(false))
              }
            }
            break

          case 'audio_ready':
            // API mode: play server-rendered audio (overrides browser TTS)
            if (msg.data) {
              stopBrowserSpeaking() // Cancel browser TTS if running
              playerRef.current?.enqueue(msg.data)
            }
            break

          case 'error':
            setError(msg.message ?? 'Unknown error')
            setTimeout(() => setError(null), 5000)
            break
        }
      } catch {
        // Ignore malformed messages
      }
    }

    wsRef.current = ws
  }, [setConnectionStatus, setPartialTranscript, addUtterance, updateUtteranceTranslation, setIsPlayingAudio, setError])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  // ─── Target Language Sync ───
  const sendTargetLanguage = useCallback((lang: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'set_target_language',
        language: lang,
      }))
    }
  }, [])

  // ─── Start Speaking (Free Mode: Browser STT) ───
  const startSpeaking = useCallback(async () => {
    // Stop any ongoing TTS playback
    stopBrowserSpeaking()
    playerRef.current?.stop()

    const recognition = new BrowserSpeechRecognition({
      onPartial: (text) => {
        setPartialTranscript(text)
      },
      onFinal: (text, detectedLang) => {
        setPartialTranscript('')

        const utteranceId = crypto.randomUUID()
        // Add to conversation immediately
        addUtterance({
          id: utteranceId,
          speaker: 'A',
          sourceText: text,
          translatedText: '…',
          sourceLang: detectedLang,
          targetLang: targetLanguageRef.current,
        })

        // Send to backend for translation (Ollama)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'translate_text',
            text,
            sourceLang: detectedLang,
            targetLang: targetLanguageRef.current,
            utteranceId,
            speaker: 'A',
          }))
        }
      },
      onError: (error) => {
        setError(error)
        setTimeout(() => setError(null), 5000)
      },
      onEnd: () => {
        // Recognition ended naturally (e.g., silence timeout)
      },
    })

    recognition.start()
    recognitionRef.current = recognition
  }, [setPartialTranscript, addUtterance, setError])

  // ─── Stop Speaking ───
  const stopSpeaking = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setPartialTranscript('')

    // Also tell backend (for API mode cleanup)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop_speaking' }))
    }
  }, [setPartialTranscript])

  return { startSpeaking, stopSpeaking, sendTargetLanguage }
}
