import { create } from 'zustand'

export interface Utterance {
  id: string
  speaker: 'A' | 'B'
  sourceText: string
  translatedText: string
  sourceLang: string
  targetLang: string
}

interface SessionState {
  targetLanguage: string
  utterances: Utterance[]
  isSpeaking: boolean
  activeSpeaker: 'A' | 'B' | null
  setTargetLanguage: (lang: string) => void
  addUtterance: (utterance: Utterance) => void
  setIsSpeaking: (speaking: boolean) => void
  setActiveSpeaker: (speaker: 'A' | 'B' | null) => void
  clearUtterances: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  targetLanguage: sessionStorage.getItem('targetLanguage') ?? 'vi',
  utterances: [],
  isSpeaking: false,
  activeSpeaker: null,
  setTargetLanguage: (lang) => {
    sessionStorage.setItem('targetLanguage', lang)
    set({ targetLanguage: lang })
  },
  addUtterance: (utterance) =>
    set((state) => ({ utterances: [...state.utterances, utterance] })),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setActiveSpeaker: (activeSpeaker) => set({ activeSpeaker }),
  clearUtterances: () => set({ utterances: [] }),
}))
