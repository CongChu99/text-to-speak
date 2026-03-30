import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import type { TtsProvider } from './TtsProvider'
import { TtsError } from './TtsProvider'

// Neural2 voice map for top 20 languages
const NEURAL2_VOICES: Record<string, string> = {
  vi: 'vi-VN-Neural2-A',
  en: 'en-US-Neural2-F',
  ja: 'ja-JP-Neural2-B',
  ko: 'ko-KR-Neural2-A',
  zh: 'cmn-CN-Neural2-A',
  fr: 'fr-FR-Neural2-A',
  de: 'de-DE-Neural2-F',
  es: 'es-ES-Neural2-A',
  pt: 'pt-BR-Neural2-A',
  it: 'it-IT-Neural2-A',
  ru: 'ru-RU-Neural2-A',
  ar: 'ar-XA-Neural2-A',
  hi: 'hi-IN-Neural2-A',
  th: 'th-TH-Neural2-C',
  id: 'id-ID-Neural2-A',
  nl: 'nl-NL-Neural2-A',
  pl: 'pl-PL-Neural2-A',
  tr: 'tr-TR-Neural2-A',
  sv: 'sv-SE-Neural2-A',
  uk: 'uk-UA-Neural2-A',
}

// Language code to BCP-47 locale mapping
const LANG_TO_LOCALE: Record<string, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'cmn-CN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  pt: 'pt-BR',
  it: 'it-IT',
  ru: 'ru-RU',
  ar: 'ar-XA',
  hi: 'hi-IN',
  th: 'th-TH',
  id: 'id-ID',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
  sv: 'sv-SE',
  uk: 'uk-UA',
}

export class GoogleTtsProvider implements TtsProvider {
  private client: TextToSpeechClient

  constructor(credentialsJsonOrPath: string) {
    try {
      const credentials = JSON.parse(credentialsJsonOrPath)
      this.client = new TextToSpeechClient({ credentials })
    } catch {
      // treat as file path or rely on GOOGLE_APPLICATION_CREDENTIALS env var
      this.client = new TextToSpeechClient({ keyFilename: credentialsJsonOrPath })
    }
  }

  async synthesize(text: string, languageCode: string): Promise<Buffer> {
    const neuralVoice = NEURAL2_VOICES[languageCode]
    const locale = LANG_TO_LOCALE[languageCode] ?? languageCode

    const voice = neuralVoice
      ? { name: neuralVoice, languageCode: locale, ssmlGender: 'NEUTRAL' as const }
      : { languageCode, ssmlGender: 'NEUTRAL' as const }

    try {
      const [response] = await this.client.synthesizeSpeech({
        input: { text },
        voice,
        audioConfig: { audioEncoding: 'MP3' },
      })

      const audioContent = response.audioContent
      if (!audioContent) {
        throw new TtsError('Empty audio content from Google TTS')
      }

      return Buffer.isBuffer(audioContent)
        ? audioContent
        : Buffer.from(audioContent as Uint8Array)
    } catch (err) {
      if (err instanceof TtsError) throw err
      throw new TtsError(err instanceof Error ? err.message : 'Unknown error')
    }
  }
}
