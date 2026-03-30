/**
 * Browser Speech Recognition wrapper using Web Speech API.
 * Works in Chrome, Edge, Safari. Free, no API keys needed.
 */

// Extend Window type for webkit prefix
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export interface SpeechRecognitionCallbacks {
  onPartial: (text: string) => void
  onFinal: (text: string, lang: string) => void
  onError: (error: string) => void
  onEnd: () => void
}

export class BrowserSpeechRecognition {
  private recognition: SpeechRecognition | null = null
  private callbacks: SpeechRecognitionCallbacks

  constructor(callbacks: SpeechRecognitionCallbacks) {
    this.callbacks = callbacks
  }

  static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  start(lang?: string): void {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      this.callbacks.onError('Speech recognition is not supported in this browser. Use Chrome or Edge.')
      return
    }

    this.recognition = new SR()
    this.recognition.continuous = true
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 1

    // If no specific language, let the browser auto-detect
    if (lang && lang !== 'auto') {
      this.recognition.lang = lang
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript

        if (result.isFinal) {
          // Detect language from result if available
          const detectedLang = this.recognition?.lang || 'auto'
          this.callbacks.onFinal(text, detectedLang)
        } else {
          this.callbacks.onPartial(text)
        }
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are not real errors
      if (event.error === 'no-speech' || event.error === 'aborted') return
      this.callbacks.onError(`Speech recognition error: ${event.error}`)
    }

    this.recognition.onend = () => {
      this.callbacks.onEnd()
    }

    try {
      this.recognition.start()
    } catch (err) {
      this.callbacks.onError(err instanceof Error ? err.message : 'Failed to start speech recognition')
    }
  }

  stop(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {
        // May already be stopped
      }
      this.recognition = null
    }
  }
}
