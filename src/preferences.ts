import { storageKey } from './storage';

export type Language = 'en' | 'de' | 'fr' | 'es' | 'it';

export interface Preferences {
  version: 1;
  language: Language;
  sounds: boolean;
  confirmDelete: boolean;
}

export const defaultPreferences: Preferences = {
  version: 1,
  language: 'en',
  sounds: false,
  confirmDelete: true,
};

export function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'de' || value === 'fr' || value === 'es' || value === 'it';
}

export function loadPreferences(storage: Pick<Storage, 'getItem'>): Preferences {
  const text = storage.getItem(`${storageKey}.preferences`);
  if (text === null) return { ...defaultPreferences };
  const value: unknown = JSON.parse(text);
  if (
    typeof value !== 'object' ||
    value === null ||
    !('version' in value) ||
    value.version !== 1 ||
    !('language' in value) ||
    !isLanguage(value.language) ||
    !('sounds' in value) ||
    typeof value.sounds !== 'boolean' ||
    !('confirmDelete' in value) ||
    typeof value.confirmDelete !== 'boolean'
  )
    throw new Error('Invalid saved preferences. Change a setting to save valid preferences.');
  return {
    version: 1,
    language: value.language,
    sounds: value.sounds,
    confirmDelete: value.confirmDelete,
  };
}

export function savePreferences(storage: Pick<Storage, 'setItem'>, preferences: Preferences): void {
  storage.setItem(`${storageKey}.preferences`, JSON.stringify(preferences));
}
