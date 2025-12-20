import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو' },
  { code: 'hi' as Language, name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar' as Language, name: 'Arabic', nativeName: 'العربية' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ps' as Language, name: 'Pashto', nativeName: 'پښتو' },
  { code: 'sd' as Language, name: 'Sindhi', nativeName: 'سنڌي' }
];

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" role="group" aria-labelledby="language-selector-label">
      <span id="language-selector-label" className="sr-only">Select Language</span>
      <Globe className="w-5 h-5 text-green-800" />
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            aria-pressed={currentLanguage === lang.code}
            aria-label={`Switch to ${lang.name}`}
            role="radio"
            aria-describedby={`${lang.code}-description`}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
              currentLanguage === lang.code
                ? 'bg-green-800 text-white shadow-lg border-2 border-green-900 focus:ring-4 focus:ring-green-300'
                : 'text-gray-900 bg-white hover:bg-green-100 border-2 border-transparent focus:ring-4 focus:ring-green-300'
            }`}
          >
            {lang.nativeName}
            <span id={`${lang.code}-description`} className="sr-only">
              {lang.name} language option
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}