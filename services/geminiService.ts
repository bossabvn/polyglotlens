import { GoogleGenAI, Type } from "@google/genai";
import { SupportedLanguage } from '../types';

// Ensure API key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    originalText: {
      type: Type.STRING,
      description: "The text exactly as extracted from the image.",
    },
    translatedText: {
      type: Type.STRING,
      description: "The translated version of the extracted text.",
    },
    detectedLanguage: {
      type: Type.STRING,
      description: "The language detected from the original text.",
    },
  },
  required: ["originalText", "translatedText"],
};

export const scanAndTranslate = async (
  imageBase64: string,
  targetLanguage: SupportedLanguage
): Promise<{ originalText: string; translatedText: string; detectedLanguage?: string }> => {
  if (!apiKey) {
    throw new Error("API configuration error: Missing API Key.");
  }

  // Remove data URL prefix if present for clean base64
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const prompt = `
      Perform two tasks:
      1. Optical Character Recognition (OCR): Extract all readable text from this image. Preserve formatting where possible.
      2. Translation: Translate the extracted text into ${targetLanguage}.
      
      If no text is found, return empty strings.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        systemInstruction: "You are an expert translator and OCR engine. Your goal is to be accurate and helpful for users scanning signs, menus, and documents.",
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No response from AI.");
    }

    const result = JSON.parse(jsonText);
    
    return {
      originalText: result.originalText || "(No text detected)",
      translatedText: result.translatedText || "(No translation available)",
      detectedLanguage: result.detectedLanguage,
    };

  } catch (error) {
    console.error("Gemini Scan Error:", error);
    throw new Error("Failed to process image. Please try again.");
  }
};