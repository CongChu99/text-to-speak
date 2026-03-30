export interface TtsProvider {
  synthesize(text: string, languageCode: string): Promise<Buffer>
}

export class TtsError extends Error {
  constructor(message: string) {
    super(`TtsError: ${message}`)
    this.name = 'TtsError'
  }
}
