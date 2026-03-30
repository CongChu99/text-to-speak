import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAITranslationProvider } from '../providers/OpenAITranslationProvider'
import type { TranslationProvider } from '../providers/TranslationProvider'

// Mock openai module
vi.mock('openai', () => {
  const mockCreate = vi.fn()
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
    __mockCreate: mockCreate,
  }
})

async function getMockCreate() {
  const mod = await import('openai')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).__mockCreate as ReturnType<typeof vi.fn>
}

describe('OpenAITranslationProvider', () => {
  let provider: TranslationProvider
  let mockCreate: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockCreate = await getMockCreate()
    provider = new OpenAITranslationProvider('test-api-key')
  })

  it('translates text to target language', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Xin chào' } }],
    })

    const result = await provider.translate('Hello', 'en', 'vi')

    expect(result).toBe('Xin chào')
  })

  it('calls OpenAI with correct model and system prompt', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Bonjour' } }],
    })

    await provider.translate('Hello', 'en', 'fr')

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        max_tokens: 500,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('fr'),
          }),
          expect.objectContaining({
            role: 'user',
            content: 'Hello',
          }),
        ]),
      })
    )
  })

  it('returns only translated text without extra content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '  Hola  ' } }],
    })

    const result = await provider.translate('Hello', 'en', 'es')

    expect(result).toBe('Hola')
  })

  it('throws TranslationError when API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'))

    await expect(provider.translate('Hello', 'en', 'vi')).rejects.toThrow(
      'TranslationError'
    )
  })

  it('includes original text in TranslationError', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API error'))

    try {
      await provider.translate('Hello', 'en', 'vi')
    } catch (err) {
      expect((err as Error).message).toContain('Hello')
    }
  })

  it('throws TranslationError when response has no content', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    })

    await expect(provider.translate('Hello', 'en', 'vi')).rejects.toThrow(
      'TranslationError'
    )
  })
})
