import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import en from '../locales/en.json';
import he from '../locales/he.json';

export const LANGUAGE_STORAGE_KEY = '@easybill/app_language';

export type AppLanguage = 'en' | 'he';

export function getDeviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode;
  return code === 'he' ? 'he' : 'en';
}

function applyRtl(isRtl: boolean) {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    }
    return;
  }

  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);

  const wasRtl = I18nManager.isRTL;
  if (wasRtl === isRtl) {
    return;
  }

  I18nManager.forceRTL(isRtl);
}

export async function initI18n(): Promise<void> {
  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    /* ignore */
  }

  const lng: AppLanguage =
    stored === 'he' || stored === 'en' ? stored : getDeviceLanguage();

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        en: { translation: en },
        he: { translation: he },
      },
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
  } else {
    await i18n.changeLanguage(lng);
  }

  applyRtl(lng === 'he');
}

export async function setAppLanguage(lng: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
  applyRtl(lng === 'he');
}

export { i18n };
