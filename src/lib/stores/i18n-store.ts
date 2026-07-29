import { create } from 'zustand';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Language = 'en' | 'es';

const translations = { en, es };

interface I18nState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

export const useI18nStore = create<I18nState>()((set, get) => ({
  language: 'en',
  
  setLanguage: (language) => {
    set({ language });
    localStorage.setItem('language', language);
  },
  
  t: (key, replacements) => {
    const { language } = get();
    const keys = key.split('.');
    let translation = translations[language] as any;

    // Navigate through the translation object
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English if key not found
        translation = en as any;
        for (const enK of keys) {
          if (translation && typeof translation === 'object' && enK in translation) {
            translation = translation[enK];
          } else {
            return key; // Return the key if not found in English either
          }
        }
        break;
      }
    }

    // Handle string replacements if needed
    if (typeof translation === 'string' && replacements) {
      return Object.entries(replacements).reduce(
        (result, [k, value]) => result.replace(`{{${k}}}`, String(value)),
        translation
      );
    }

    return typeof translation === 'string' ? translation : key;
  },
}));