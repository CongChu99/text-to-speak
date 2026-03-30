import OpenAI from 'openai'
import type { TranslationProvider } from './TranslationProvider'
import { TranslationError } from './TranslationProvider'

export class OpenAITranslationProvider implements TranslationProvider {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async translate(text: string, _sourceLang: string, targetLang: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLang}. Return ONLY the translated text, no explanations, no quotes.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('Empty response from OpenAI')
      }

      return content.trim()
    } catch (err) {
      if (err instanceof TranslationError) throw err
      throw new TranslationError(
        err instanceof Error ? err.message : 'Unknown error',
        text
      )
    }
  }
}
