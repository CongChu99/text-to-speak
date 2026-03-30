/**
 * AudioRecorder captures microphone audio and emits PCM16 chunks at 16kHz
 * suitable for streaming to Deepgram's speech-to-text API.
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onChunk: (pcm16Base64: string) => void;
  private _isRecording = false;

  constructor(onChunk: (pcm16Base64: string) => void) {
    this.onChunk = onChunk;
  }

  get isRecording(): boolean {
    return this._isRecording;
  }

  async start(): Promise<void> {
    if (this._isRecording) return;

    // Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // ScriptProcessorNode for audio processing (4096 samples per frame)
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    const inputSampleRate = this.audioContext.sampleRate;
    const outputSampleRate = 16000;

    this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
      if (!this._isRecording) return;

      const inputData = event.inputBuffer.getChannelData(0);

      // Downsample from browser sample rate (usually 44100 or 48000) to 16000
      const ratio = inputSampleRate / outputSampleRate;
      const outputLength = Math.floor(inputData.length / ratio);
      const outputData = new Int16Array(outputLength);

      for (let i = 0; i < outputLength; i++) {
        const srcIndex = Math.floor(i * ratio);
        // Clamp and convert float32 [-1, 1] → int16 [-32768, 32767]
        const sample = Math.max(-1, Math.min(1, inputData[srcIndex]));
        outputData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }

      // Base64 encode the PCM16 buffer
      const base64 = arrayBufferToBase64(outputData.buffer);
      this.onChunk(base64);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this._isRecording = true;
  }

  stop(): void {
    this._isRecording = false;

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }
}
