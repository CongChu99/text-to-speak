import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// --- Mock @deepgram/sdk ---
// vi.mock is hoisted before variable declarations, so use vi.hoisted() to
// declare mock objects so they're available when the mock factory runs.
const { mockConnection, mockListen, mockDeepgramClient } = vi.hoisted(() => {
  const mockConnection = {
    on: vi.fn(),
    send: vi.fn(),
    finish: vi.fn(),
  };
  const mockListen = {
    live: vi.fn().mockReturnValue(mockConnection),
  };
  const mockDeepgramClient = {
    listen: mockListen,
  };
  return { mockConnection, mockListen, mockDeepgramClient };
});

vi.mock('@deepgram/sdk', () => ({
  createClient: vi.fn().mockReturnValue(mockDeepgramClient),
  LiveTranscriptionEvents: {
    Results: 'Results',
    Error: 'Error',
    Open: 'Open',
    Close: 'Close',
  },
}));

// Import after mocking
import { DeepgramSttProvider } from '../providers/DeepgramSttProvider';
import type { SttProvider } from '../providers/SttProvider';

describe('DeepgramSttProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListen.live.mockReturnValue(mockConnection);
    mockConnection.on.mockReset();
    mockConnection.send.mockReset();
    mockConnection.finish.mockReset();
  });

  it('implements SttProvider interface (has stream method)', () => {
    const provider: SttProvider = new DeepgramSttProvider('test-api-key');
    expect(typeof provider.stream).toBe('function');
  });

  it('stream() returns an object with sendAudio and stop methods', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});
    expect(typeof sttStream.sendAudio).toBe('function');
    expect(typeof sttStream.stop).toBe('function');
  });

  it('stream() returns an EventEmitter (has on, emit, off methods)', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});
    expect(typeof sttStream.on).toBe('function');
    expect(typeof sttStream.emit).toBe('function');
    expect(typeof sttStream.off).toBe('function');
  });

  it('stream() creates Deepgram connection with correct options', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    provider.stream({ sampleRate: 48000 });

    expect(mockListen.live).toHaveBeenCalledWith({
      model: 'nova-3',
      language: 'multi',
      interim_results: true,
      smart_format: true,
      encoding: 'linear16',
      sample_rate: 48000,
    });
  });

  it('stream() uses default sampleRate 16000 when not provided', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    provider.stream({});

    expect(mockListen.live).toHaveBeenCalledWith(
      expect.objectContaining({ sample_rate: 16000 })
    );
  });

  it('when Deepgram emits a Results event, SttStream emits transcript with correct shape', async () => {
    // Capture the handler registered for Results event
    let resultsHandler: ((data: unknown) => void) | undefined;
    mockConnection.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
      if (event === 'Results') {
        resultsHandler = handler;
      }
    });

    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});

    // Simulate Deepgram Results event
    const deepgramResultsPayload = {
      channel: {
        alternatives: [
          {
            transcript: 'Hello world',
            confidence: 0.99,
            languages: ['en'],
          },
        ],
      },
      is_final: true,
    };

    const transcriptPromise = new Promise<{
      text: string;
      detectedLang: string;
      isFinal: boolean;
      confidence: number;
    }>((resolve) => {
      sttStream.on('transcript', resolve);
    });

    expect(resultsHandler).toBeDefined();
    resultsHandler!(deepgramResultsPayload);

    const transcript = await transcriptPromise;
    expect(transcript.text).toBe('Hello world');
    expect(transcript.detectedLang).toBe('en');
    expect(transcript.isFinal).toBe(true);
    expect(transcript.confidence).toBe(0.99);
  });

  it('when Deepgram emits an Error event, SttStream emits error', async () => {
    let errorHandler: ((data: unknown) => void) | undefined;
    mockConnection.on.mockImplementation((event: string, handler: (data: unknown) => void) => {
      if (event === 'Error') {
        errorHandler = handler;
      }
    });

    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});

    const deepgramError = { message: 'Connection failed' };

    const errorPromise = new Promise<{ message: string }>((resolve) => {
      sttStream.on('error', resolve);
    });

    expect(errorHandler).toBeDefined();
    errorHandler!(deepgramError);

    const err = await errorPromise;
    expect(err.message).toBe('Connection failed');
  });

  it('stop() calls connection.finish()', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});

    sttStream.stop();

    expect(mockConnection.finish).toHaveBeenCalledOnce();
  });

  it('sendAudio() sends the buffer via the Deepgram connection', () => {
    const provider = new DeepgramSttProvider('test-api-key');
    const sttStream = provider.stream({});

    const audioChunk = Buffer.from([0x01, 0x02, 0x03]);
    sttStream.sendAudio(audioChunk);

    expect(mockConnection.send).toHaveBeenCalledWith(audioChunk);
  });
});
