import { EventEmitter } from 'events';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { SttProvider, SttStreamConfig, SttStream } from './SttProvider';

class DeepgramSttStream extends EventEmitter implements SttStream {
  private connection: ReturnType<ReturnType<typeof createClient>['listen']['live']>;

  constructor(connection: ReturnType<ReturnType<typeof createClient>['listen']['live']>) {
    super();
    this.connection = connection;

    this.connection.on(LiveTranscriptionEvents.Results, (data: unknown) => {
      const result = data as {
        channel: {
          alternatives: Array<{
            transcript: string;
            confidence: number;
            languages?: string[];
          }>;
        };
        is_final: boolean;
      };

      const alternative = result?.channel?.alternatives?.[0];
      if (!alternative) return;

      this.emit('transcript', {
        text: alternative.transcript,
        detectedLang: alternative.languages?.[0] ?? 'unknown',
        isFinal: result.is_final,
        confidence: alternative.confidence,
      });
    });

    this.connection.on(LiveTranscriptionEvents.Error, (err: unknown) => {
      const error = err as { message?: string };
      this.emit('error', { message: error?.message ?? 'Unknown error' });
    });
  }

  sendAudio(chunk: Buffer): void {
    this.connection.send(chunk);
  }

  stop(): void {
    this.connection.finish();
  }
}

export class DeepgramSttProvider implements SttProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  stream(config: SttStreamConfig): SttStream {
    const deepgram = createClient(this.apiKey);
    const connection = deepgram.listen.live({
      model: 'nova-3',
      language: 'multi',
      interim_results: true,
      smart_format: true,
      encoding: 'linear16',
      sample_rate: config.sampleRate ?? 16000,
    });

    return new DeepgramSttStream(connection);
  }
}
