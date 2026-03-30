export interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>
}

export class TranslationError extends Error {
  constructor(message: string, public readonly originalText: string) {
    super(`TranslationError: ${message} (original: "${originalText}")`)
    this.name = 'TranslationError'
  }
}
