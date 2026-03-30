import { describe, it, expect, beforeEach } from 'vitest'
import { useSessionStore } from '../store/sessionStore'

describe('sessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({
      targetLanguage: 'vi',
      utterances: [],
      isSpeaking: false,
      activeSpeaker: null,
    })
  })

  it('has correct initial state', () => {
    const state = useSessionStore.getState()
    expect(state.utterances).toEqual([])
    expect(state.isSpeaking).toBe(false)
    expect(state.activeSpeaker).toBeNull()
  })

  it('setTargetLanguage updates target language', () => {
    useSessionStore.getState().setTargetLanguage('ja')
    expect(useSessionStore.getState().targetLanguage).toBe('ja')
  })

  it('addUtterance appends to utterances', () => {
    useSessionStore.getState().addUtterance({
      id: '1',
      speaker: 'A',
      sourceText: 'Hello',
      translatedText: 'Xin chào',
      sourceLang: 'en',
      targetLang: 'vi',
    })
    expect(useSessionStore.getState().utterances).toHaveLength(1)
    expect(useSessionStore.getState().utterances[0].sourceText).toBe('Hello')
  })

  it('setIsSpeaking toggles speaking state', () => {
    useSessionStore.getState().setIsSpeaking(true)
    expect(useSessionStore.getState().isSpeaking).toBe(true)
    useSessionStore.getState().setIsSpeaking(false)
    expect(useSessionStore.getState().isSpeaking).toBe(false)
  })

  it('setActiveSpeaker sets active speaker', () => {
    useSessionStore.getState().setActiveSpeaker('A')
    expect(useSessionStore.getState().activeSpeaker).toBe('A')
  })

  it('clearUtterances empties the utterances list', () => {
    useSessionStore.getState().addUtterance({
      id: '1',
      speaker: 'A',
      sourceText: 'Hello',
      translatedText: 'Xin chào',
      sourceLang: 'en',
      targetLang: 'vi',
    })
    useSessionStore.getState().clearUtterances()
    expect(useSessionStore.getState().utterances).toHaveLength(0)
  })
})
