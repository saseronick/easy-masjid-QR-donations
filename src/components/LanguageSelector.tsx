import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'پنجابی' }
];

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const t = (key: string) => translations[key]?.[currentLanguage] || translations[key]?.en || key;

  return (
    <div className="mb-10" role="group" aria-labelledby="language-selector-label">
      <h2 id="language-selector-label" className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {t('chooseLanguage')} / {translations['chooseLanguage']['ur']}
      </h2>
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            aria-pressed={currentLanguage === lang.code}
            aria-label={`Switch to ${lang.name}`}
            role="radio"
            aria-describedby={`${lang.code}-description`}
            className={`min-h-[70px] px-6 py-5 rounded-xl text-xl font-bold transition-all border-3 ${
              currentLanguage === lang.code
                ? 'bg-green-700 text-white border-green-700 shadow-lg'
                : 'text-gray-800 bg-white border-gray-400 hover:border-green-600 hover:bg-green-50 active:bg-green-100'
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