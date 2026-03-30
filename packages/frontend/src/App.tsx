import { useEffect } from 'react'
import { useLanguageStore } from './store/languageStore'
import { useSessionStore } from './store/sessionStore'
import { LanguageSelector } from './components/LanguageSelector'
import { SpeakButton } from './components/SpeakButton'
import { TranscriptPanel } from './components/TranscriptPanel'

function App() {
  const { languages, fetchLanguages } = useLanguageStore()
  const { targetLanguage, utterances, isSpeaking, setTargetLanguage, setIsSpeaking } =
    useSessionStore()

  useEffect(() => {
    fetchLanguages()
  }, [fetchLanguages])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <h1 className="text-lg font-bold text-white">SpeakBridge</h1>
        <LanguageSelector
          languages={languages}
          value={targetLanguage}
          onChange={setTargetLanguage}
        />
      </header>

      {/* Transcript */}
      <TranscriptPanel utterances={utterances} />

      {/* Speak Button — thumb zone */}
      <div className="flex justify-center pb-10 pt-4 border-t border-slate-700">
        <SpeakButton
          isActive={isSpeaking}
          onPress={() => setIsSpeaking(true)}
          onRelease={() => setIsSpeaking(false)}
        />
      </div>
    </div>
  )
}

export default App
