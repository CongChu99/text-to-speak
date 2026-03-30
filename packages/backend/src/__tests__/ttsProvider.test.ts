import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoogleTtsProvider } from '../providers/GoogleTtsProvider'
import type { TtsProvider } from '../providers/TtsProvider'

vi.mock('@google-cloud/text-to-speech', () => {
  const mockSynthesize = vi.fn()
  const MockClient = vi.fn().mockImplementation(() => ({
    synthesizeSpeech: mockSynthesize,
  }))
  return {
    TextToSpeechClient: MockClient,
    __mockSynthesize: mockSynthesize,
  }
})

async function getMockSynthesize() {
  const mod = await import('@google-cloud/text-to-speech')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).__mockSynthesize as ReturnType<typeof vi.fn>
}

describe('GoogleTtsProvider', () => {
  let provider: TtsProvider
  let mockSynthesize: ReturnType<typeof vi.fn>
  const fakeAudioBuffer = Buffer.from('fake-mp3-data')

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSynthesize = await getMockSynthesize()
    provider = new GoogleTtsProvider('fake-credentials-json')
  })

  it('synthesizes text to MP3 buffer', async () => {
    mockSynthesize.mockResolvedValueOnce([
      { audioContent: fakeAudioBuffer },
    ])

    const result = await provider.synthesize('Xin chào', 'vi')

    expect(Buffer.isBuffer(result)).toBe(true)
    expect(result).toEqual(fakeAudioBuffer)
  })

  it('requests MP3 audio encoding', async () => {
    mockSynthesize.mockResolvedValueOnce([{ audioContent: fakeAudioBuffer }])

    await provider.synthesize('Hello', 'en')

    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.objectContaining({
        audioConfig: expect.objectContaining({ audioEncoding: 'MP3' }),
      })
    )
  })

  it('uses Neural2 voice for Vietnamese', async () => {
    mockSynthesize.mockResolvedValueOnce([{ audioContent: fakeAudioBuffer }])

    await provider.synthesize('Xin chào', 'vi')

    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: expect.objectContaining({ name: 'vi-VN-Neural2-A' }),
      })
    )
  })

  it('uses Neural2 voice for Japanese', async () => {
    mockSynthesize.mockResolvedValueOnce([{ audioContent: fakeAudioBuffer }])

    await provider.synthesize('こんにちは', 'ja')

    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: expect.objectContaining({ name: 'ja-JP-Neural2-B' }),
      })
    )
  })

  it('falls back to standard voice for unknown language', async () => {
    mockSynthesize.mockResolvedValueOnce([{ audioContent: fakeAudioBuffer }])

    await provider.synthesize('Hello', 'xx')

    expect(mockSynthesize).toHaveBeenCalledWith(
      expect.objectContaining({
        voice: expect.objectContaining({
          languageCode: 'xx',
          ssmlGender: 'NEUTRAL',
        }),
      })
    )
  })

  it('throws TtsError when synthesis fails', async () => {
    mockSynthesize.mockRejectedValueOnce(new Error('API error'))

    await expect(provider.synthesize('Hello', 'en')).rejects.toThrow('TtsError')
  })

  it('throws TtsError when audioContent is missing', async () => {
    mockSynthesize.mockResolvedValueOnce([{ audioContent: null }])

    await expect(provider.synthesize('Hello', 'en')).rejects.toThrow('TtsError')
  })
})
