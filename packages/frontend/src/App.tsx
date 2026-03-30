import { useEffect } from 'react'
import { useLanguageStore } from './store/languageStore'
import { useSessionStore } from './store/sessionStore'
import { useSession } from './hooks/useSession'
import { LanguageSelector } from './components/LanguageSelector'
import { SpeakButton } from './components/SpeakButton'
import { TranscriptPanel } from './components/TranscriptPanel'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ErrorToast } from './components/ErrorToast'

function App() {
  const { languages, fetchLanguages } = useLanguageStore()
  const {
    targetLanguage,
    utterances,
    isSpeaking,
    partialTranscript,
    connectionStatus,
    error,
    isPlayingAudio,
    setTargetLanguage,
    setIsSpeaking,
    clearError,
  } = useSessionStore()

  const { startSpeaking, stopSpeaking, sendTargetLanguage } = useSession()

  useEffect(() => {
    fetchLanguages()
  }, [fetchLanguages])

  const handleLanguageChange = (code: string) => {
    setTargetLanguage(code)
    sendTargetLanguage(code)
  }

  const handlePress = async () => {
    setIsSpeaking(true)
    await startSpeaking()
  }

  const handleRelease = () => {
    setIsSpeaking(false)
    stopSpeaking()
  }

  return (
    <div className="h-full flex flex-col bg-gradient-main">
      {/* Header */}
      <header className="glass flex items-center justify-between px-5 py-3 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 15a3 3 0 01-3-3V5a3 3 0 016 0v7a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">SpeakBridge</h1>
            <ConnectionStatus status={connectionStatus} />
          </div>
        </div>
        <LanguageSelector
          languages={languages}
          value={targetLanguage}
          onChange={handleLanguageChange}
        />
      </header>

      {/* Transcript */}
      <TranscriptPanel
        utterances={utterances}
        partialTranscript={partialTranscript}
        isSpeaking={isSpeaking}
      />

      {/* Controls */}
      <div className="glass flex flex-col items-center gap-3 pb-8 pt-5">
        {isPlayingAudio && (
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium animate-slide-up">
            <div className="dot-pulse flex gap-1">
              <span /><span /><span />
            </div>
            Playing translation…
          </div>
        )}
        <SpeakButton
          isActive={isSpeaking}
          isDisabled={connectionStatus !== 'connected'}
          onPress={handlePress}
          onRelease={handleRelease}
        />
        <p className="text-[11px] text-slate-500 font-medium">
          {connectionStatus !== 'connected'
            ? 'Connecting…'
            : isSpeaking
              ? 'Release to stop'
              : 'Hold to speak'}
        </p>
      </div>

      {/* Error Toast */}
      {error && <ErrorToast message={error} onDismiss={clearError} />}
    </div>
  )
}

export default App
