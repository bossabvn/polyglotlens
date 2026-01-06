import React from 'react';
import { SupportedLanguage } from '../types';
import { LANGUAGES } from '../constants';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  disabled
}) => {
  return (
    <div className="relative group w-full max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Globe className="h-4 w-4 text-gray-400" />
      </div>
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
        disabled={disabled}
        className="appearance-none w-full bg-surface border border-gray-600 text-white py-2 pl-10 pr-8 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm disabled:opacity-50 transition-all cursor-pointer hover:bg-gray-700"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            Translate to {lang}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
};