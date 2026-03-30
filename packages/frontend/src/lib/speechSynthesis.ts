/**
 * Browser Speech Synthesis wrapper using Web Speech API.
 * Works in all modern browsers. Free, no API keys needed.
 */

// Map short language codes to BCP-47 locales for better voice matching
const LANG_TO_BCP47: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-BR',
  it: 'it-IT',
  ru: 'ru-RU',
  ar: 'ar-SA',
  hi: 'hi-IN',
  th: 'th-TH',
  id: 'id-ID',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
  sv: 'sv-SE',
  uk: 'uk-UA',
}

/**
 * Speak text using browser's built-in speech synthesis.
 * Returns a promise that resolves when speaking is done.
 */
export function speakText(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = LANG_TO_BCP47[lang] || lang
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to find a voice matching the language
    const voices = window.speechSynthesis.getVoices()
    const targetLocale = LANG_TO_BCP47[lang] || lang
    const matchingVoice = voices.find((v) => v.lang.startsWith(targetLocale)) ||
      voices.find((v) => v.lang.startsWith(lang))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (event) => {
      if (event.error === 'canceled') {
        resolve() // Not a real error
      } else {
        reject(new Error(`Speech synthesis error: ${event.error}`))
      }
    }

    window.speechSynthesis.speak(utterance)
  })
}

/** Check if speech synthesis is available */
export function isSpeechSynthesisSupported(): boolean {
  return !!window.speechSynthesis
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  window.speechSynthesis?.cancel()
}
