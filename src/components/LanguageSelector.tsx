import React from 'react';
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
    <div className="mb-8" role="group" aria-labelledby="language-selector-label">
      <h2 id="language-selector-label" className="text-3xl font-bold text-black mb-6 text-center">
        Language / زبان
      </h2>
      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            aria-pressed={currentLanguage === lang.code}
            aria-label={`Switch to ${lang.name}`}
            role="radio"
            aria-describedby={`${lang.code}-description`}
            className={`min-h-[80px] px-8 py-6 rounded-2xl text-2xl font-bold transition-all border-4 ${
              currentLanguage === lang.code
                ? 'bg-black text-white border-black shadow-xl'
                : 'text-black bg-white border-black hover:bg-gray-100 active:bg-gray-200'
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