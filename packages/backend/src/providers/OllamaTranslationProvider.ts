import type { TranslationProvider } from './TranslationProvider'
import { TranslationError } from './TranslationProvider'

interface OllamaChatResponse {
  message?: { content?: string }
  error?: string
}

export class OllamaTranslationProvider implements TranslationProvider {
  private baseUrl: string
  private model: string

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || 'http://localhost:11434'
    this.model = model || 'gemma3:4b'
  }

  async translate(text: string, _sourceLang: string, targetLang: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the following text to ${targetLang}. Return ONLY the translated text, no explanations, no quotes, no extra text.`,
            },
            {
              role: 'user',
              content: text,
            },
          ],
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 500,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new TranslationError(`Ollama API error (${response.status}): ${errorText}`, text)
      }

      const data = (await response.json()) as OllamaChatResponse

      if (data.error) {
        throw new TranslationError(`Ollama error: ${data.error}`, text)
      }

      const content = data.message?.content
      if (!content) {
        throw new TranslationError('Empty response from Ollama', text)
      }

      return content.trim()
    } catch (err) {
      if (err instanceof TranslationError) throw err
      throw new TranslationError(
        err instanceof Error ? err.message : 'Ollama connection failed. Is Ollama running?',
        text
      )
    }
  }

  /** Check if Ollama is reachable */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) })
      return response.ok
    } catch {
      return false
    }
  }
}
