import { SupportedLanguage } from '../types';

const STORAGE_PREFIX = 'polyglot_offline_pack_';

export const isPackDownloaded = (lang: SupportedLanguage): boolean => {
  return localStorage.getItem(`${STORAGE_PREFIX}${lang}`) === 'true';
};

export const downloadPack = async (lang: SupportedLanguage): Promise<void> => {
  // Simulate network request and download time
  await new Promise(resolve => setTimeout(resolve, 1500));
  localStorage.setItem(`${STORAGE_PREFIX}${lang}`, 'true');
};

export const deletePack = (lang: SupportedLanguage): void => {
  localStorage.removeItem(`${STORAGE_PREFIX}${lang}`);
};

export const offlineScanAndTranslate = async (
  imageBase64: string,
  targetLanguage: SupportedLanguage
): Promise<{ originalText: string; translatedText: string; detectedLanguage?: string }> => {
  
  if (!isPackDownloaded(targetLanguage)) {
    throw new Error(`Offline pack for ${targetLanguage} is missing. Please download it in settings.`);
  }

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // NOTE: In a production environment, this would integrate with:
  // 1. Tesseract.js (WASM) for OCR
  // 2. A compact translation model (e.g. Transformers.js / ONNX)
  //
  // Due to browser constraints and the size of these libraries/models,
  // we are simulating the successful offline processing here.
  
  return {
    originalText: "[Offline Mode] Text extracted from image...",
    translatedText: `[Offline Translation to ${targetLanguage}]\n\nThis text is a placeholder demonstrating that the offline capability was triggered successfully. In a full build, this would use local ML models.`,
    detectedLanguage: "Detected (Local)"
  };
};