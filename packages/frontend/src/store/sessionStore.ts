import { create } from 'zustand'

export interface Utterance {
  id: string
  speaker: 'A' | 'B'
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface SessionState {
  // Connection
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // Language
  targetLanguage: string
  setTargetLanguage: (lang: string) => void

  // Conversation
  utterances: Utterance[]
  addUtterance: (utterance: Utterance) => void
  updateUtteranceTranslation: (utteranceId: string, translatedText: string) => void
  clearUtterances: () => void

  // Speaking state
  isSpeaking: boolean
  setIsSpeaking: (speaking: boolean) => void
  activeSpeaker: 'A' | 'B' | null
  setActiveSpeaker: (speaker: 'A' | 'B' | null) => void

  // Partial transcript (real-time)
  partialTranscript: string
  setPartialTranscript: (text: string) => void

  // Audio playback
  isPlayingAudio: boolean
  setIsPlayingAudio: (playing: boolean) => void

  // Errors
  error: string | null
  setError: (error: string | null) => void
  clearError: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  // Connection
  connectionStatus: 'connecting',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Language
  targetLanguage: sessionStorage.getItem('targetLanguage') ?? 'vi',
  setTargetLanguage: (lang) => {
    sessionStorage.setItem('targetLanguage', lang)
    set({ targetLanguage: lang })
  },

  // Conversation
  utterances: [],
  addUtterance: (utterance) =>
    set((state) => ({ utterances: [...state.utterances, utterance] })),
  updateUtteranceTranslation: (utteranceId, translatedText) =>
    set((state) => ({
      utterances: state.utterances.map((u) =>
        u.id === utteranceId ? { ...u, translatedText } : u
      ),
    })),
  clearUtterances: () => set({ utterances: [] }),

  // Speaking
  isSpeaking: false,
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  activeSpeaker: null,
  setActiveSpeaker: (activeSpeaker) => set({ activeSpeaker }),

  // Partial transcript
  partialTranscript: '',
  setPartialTranscript: (partialTranscript) => set({ partialTranscript }),

  // Audio playback
  isPlayingAudio: false,
  setIsPlayingAudio: (isPlayingAudio) => set({ isPlayingAudio }),

  // Errors
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}))
