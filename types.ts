export enum SupportedLanguage {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  CHINESE = 'Chinese (Simplified)',
  JAPANESE = 'Japanese',
  KOREAN = 'Korean',
  RUSSIAN = 'Russian',
  PORTUGUESE = 'Portuguese',
  HINDI = 'Hindi',
  ARABIC = 'Arabic',
  VIETNAMESE = 'Vietnamese'
}

export interface ScanResult {
  id: string;
  timestamp: number;
  imageUrl: string;
  originalText: string;
  translatedText: string;
  targetLanguage: SupportedLanguage;
  detectedLanguage?: string;
  status: 'scanning' | 'complete' | 'error';
  errorMessage?: string;
  mode: 'online' | 'offline';
}

export interface CameraCapabilities {
  zoom: {
    min: number;
    max: number;
    step: number;
    supported: boolean;
  };
  torch: boolean;
}