import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import sw from './sw.json';

export function initI18n({ lng = 'sw' } = {}) {
  if (i18n.isInitialized) return i18n;

  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      sw: { translation: sw }
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

  return i18n;
}

export default i18n;

