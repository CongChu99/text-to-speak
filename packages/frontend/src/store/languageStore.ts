import { create } from 'zustand';

export interface Language {
  code: string;
  displayName: string;
  sttSupported: boolean;
  ttsSupported: boolean;
}

interface LanguageState {
  languages: Language[];
  isLoading: boolean;
  error: string | null;
  fetchLanguages: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  languages: [],
  isLoading: false,
  error: null,
  fetchLanguages: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/languages');
      if (!response.ok) {
        throw new Error(`Failed to fetch languages: ${response.statusText}`);
      }
      const languages: Language[] = await response.json();
      set({ languages, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      set({ error: message, isLoading: false });
    }
  },
}));
