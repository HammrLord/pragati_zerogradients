'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type SiteLanguage = 'en' | 'hi' | 'mr';
const STORAGE_KEY = 'pragati.site.language';
const listeners = new Set<() => void>();

function valid(value: string | null): SiteLanguage {
  return value === 'hi' || value === 'mr' ? value : 'en';
}

function getSnapshot(): SiteLanguage {
  if (typeof window === 'undefined') return 'en';
  try { return valid(window.localStorage.getItem(STORAGE_KEY)); }
  catch { return 'en'; }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setSiteLanguage(language: SiteLanguage) {
  try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* private mode */ }
  document.documentElement.lang = language;
  listeners.forEach(listener => listener());
}

export function useSiteLanguage(): SiteLanguage {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'en');
}

export function localize(language: SiteLanguage, en: string, hi: string, mr: string) {
  return language === 'hi' ? hi : language === 'mr' ? mr : en;
}

export function SiteLanguageDocument() {
  const language = useSiteLanguage();
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return null;
}
