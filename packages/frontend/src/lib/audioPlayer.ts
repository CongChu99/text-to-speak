/**
 * AudioPlayer manages a queue of audio clips and plays them sequentially.
 * Used to play translated TTS audio received from the backend.
 */

export class AudioPlayer {
  private queue: string[] = [];
  private isPlaying = false;
  private currentAudio: HTMLAudioElement | null = null;
  private onPlayStateChange: (playing: boolean) => void;

  constructor(onPlayStateChange?: (playing: boolean) => void) {
    this.onPlayStateChange = onPlayStateChange ?? (() => {});
  }

  /**
   * Enqueue a base64 MP3 audio clip for playback
   */
  enqueue(base64Mp3: string): void {
    this.queue.push(base64Mp3);
    if (!this.isPlaying) {
      void this.playNext();
    }
  }

  /**
   * Stop playback and clear the queue
   */
  stop(): void {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.onPlayStateChange(false);
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlayStateChange(false);
      return;
    }

    this.isPlaying = true;
    this.onPlayStateChange(true);
    const base64 = this.queue.shift()!;

    return new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        resolve();
        void this.playNext();
      };

      audio.onerror = () => {
        this.currentAudio = null;
        resolve();
        void this.playNext();
      };

      void audio.play().catch(() => {
        // Autoplay blocked or other error
        this.currentAudio = null;
        resolve();
        void this.playNext();
      });
    });
  }
}
