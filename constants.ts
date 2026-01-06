import { SupportedLanguage } from './types';

export const LANGUAGES = Object.values(SupportedLanguage);

// Setting Vietnamese as default per user request
export const DEFAULT_LANGUAGE = SupportedLanguage.VIETNAMESE;

export const APP_NAME = "Polyglot Lens V1.0";

// Using a slightly high resolution ideal to allow for digital zoom if needed, 
// though we primarily rely on native track zoom.
export const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  // @ts-ignore - 'zoom' is a standard constraint but TS types might lag behind
  zoom: true,
};