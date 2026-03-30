export interface Language {
  code: string;
  displayName: string;
  sttSupported: boolean;
  ttsSupported: boolean;
}

// Top 30 most common languages (sttSupported: true)
// Top 40 most common languages (ttsSupported: true)
// All 50+ languages listed
export const LANGUAGES: Language[] = [
  // Top 30 - sttSupported: true, ttsSupported: true (first 40 also have tts)
  { code: 'en', displayName: 'English', sttSupported: true, ttsSupported: true },
  { code: 'zh', displayName: 'Chinese', sttSupported: true, ttsSupported: true },
  { code: 'es', displayName: 'Spanish', sttSupported: true, ttsSupported: true },
  { code: 'hi', displayName: 'Hindi', sttSupported: true, ttsSupported: true },
  { code: 'ar', displayName: 'Arabic', sttSupported: true, ttsSupported: true },
  { code: 'fr', displayName: 'French', sttSupported: true, ttsSupported: true },
  { code: 'de', displayName: 'German', sttSupported: true, ttsSupported: true },
  { code: 'pt', displayName: 'Portuguese', sttSupported: true, ttsSupported: true },
  { code: 'ru', displayName: 'Russian', sttSupported: true, ttsSupported: true },
  { code: 'ja', displayName: 'Japanese', sttSupported: true, ttsSupported: true },
  { code: 'ko', displayName: 'Korean', sttSupported: true, ttsSupported: true },
  { code: 'it', displayName: 'Italian', sttSupported: true, ttsSupported: true },
  { code: 'vi', displayName: 'Vietnamese', sttSupported: true, ttsSupported: true },
  { code: 'tr', displayName: 'Turkish', sttSupported: true, ttsSupported: true },
  { code: 'pl', displayName: 'Polish', sttSupported: true, ttsSupported: true },
  { code: 'nl', displayName: 'Dutch', sttSupported: true, ttsSupported: true },
  { code: 'th', displayName: 'Thai', sttSupported: true, ttsSupported: true },
  { code: 'id', displayName: 'Indonesian', sttSupported: true, ttsSupported: true },
  { code: 'ms', displayName: 'Malay', sttSupported: true, ttsSupported: true },
  { code: 'sv', displayName: 'Swedish', sttSupported: true, ttsSupported: true },
  { code: 'da', displayName: 'Danish', sttSupported: true, ttsSupported: true },
  { code: 'fi', displayName: 'Finnish', sttSupported: true, ttsSupported: true },
  { code: 'no', displayName: 'Norwegian', sttSupported: true, ttsSupported: true },
  { code: 'uk', displayName: 'Ukrainian', sttSupported: true, ttsSupported: true },
  { code: 'el', displayName: 'Greek', sttSupported: true, ttsSupported: true },
  { code: 'cs', displayName: 'Czech', sttSupported: true, ttsSupported: true },
  { code: 'ro', displayName: 'Romanian', sttSupported: true, ttsSupported: true },
  { code: 'hu', displayName: 'Hungarian', sttSupported: true, ttsSupported: true },
  { code: 'he', displayName: 'Hebrew', sttSupported: true, ttsSupported: true },
  { code: 'bn', displayName: 'Bengali', sttSupported: true, ttsSupported: true },

  // Languages 31-40 - sttSupported: false, ttsSupported: true
  { code: 'ta', displayName: 'Tamil', sttSupported: false, ttsSupported: true },
  { code: 'te', displayName: 'Telugu', sttSupported: false, ttsSupported: true },
  { code: 'ml', displayName: 'Malayalam', sttSupported: false, ttsSupported: true },
  { code: 'fil', displayName: 'Filipino', sttSupported: false, ttsSupported: true },
  { code: 'sk', displayName: 'Slovak', sttSupported: false, ttsSupported: true },
  { code: 'bg', displayName: 'Bulgarian', sttSupported: false, ttsSupported: true },
  { code: 'hr', displayName: 'Croatian', sttSupported: false, ttsSupported: true },
  { code: 'ur', displayName: 'Urdu', sttSupported: false, ttsSupported: true },
  { code: 'fa', displayName: 'Persian', sttSupported: false, ttsSupported: true },
  { code: 'sw', displayName: 'Swahili', sttSupported: false, ttsSupported: true },

  // Languages 41-50 - sttSupported: false, ttsSupported: false
  { code: 'am', displayName: 'Amharic', sttSupported: false, ttsSupported: false },
  { code: 'az', displayName: 'Azerbaijani', sttSupported: false, ttsSupported: false },
  { code: 'ka', displayName: 'Georgian', sttSupported: false, ttsSupported: false },
  { code: 'kk', displayName: 'Kazakh', sttSupported: false, ttsSupported: false },
  { code: 'lt', displayName: 'Lithuanian', sttSupported: false, ttsSupported: false },
  { code: 'lv', displayName: 'Latvian', sttSupported: false, ttsSupported: false },
  { code: 'et', displayName: 'Estonian', sttSupported: false, ttsSupported: false },
  { code: 'sl', displayName: 'Slovenian', sttSupported: false, ttsSupported: false },
  { code: 'sr', displayName: 'Serbian', sttSupported: false, ttsSupported: false },
  { code: 'mk', displayName: 'Macedonian', sttSupported: false, ttsSupported: false },
];
