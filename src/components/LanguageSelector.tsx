import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'پنجابی', flag: '🇵🇰' }
];

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const t = (key: string) => translations[key]?.[currentLanguage] || translations[key]?.en || key;
  const isRTL = currentLanguage === 'ar' || currentLanguage === 'ur' || currentLanguage === 'ps' || currentLanguage === 'sd';

  const handleKeyDown = (e: React.KeyboardEvent, langCode: Language) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onLanguageChange(langCode);
    }

    const currentIndex = languages.findIndex(l => l.code === langCode);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % languages.length;
      const nextButton = document.querySelector(`[data-lang="${languages[nextIndex].code}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + languages.length) % languages.length;
      const prevButton = document.querySelector(`[data-lang="${languages[prevIndex].code}"]`) as HTMLButtonElement;
      prevButton?.focus();
    }
  };

  return (
    <div className="mb-6" role="radiogroup" aria-labelledby="language-selector-label">
      <h2 id="language-selector-label" className="text-base font-medium text-gray-700 mb-3 text-center">
        {t('chooseLanguage')} / {translations['chooseLanguage']['ur']}
      </h2>
      <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
        {languages.map((lang) => {
          const hasEnglishInLabel = /[A-Za-z]/.test(lang.nativeName);
          const isSelected = currentLanguage === lang.code;
          return (
            <button
              key={lang.code}
              data-lang={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              onKeyDown={(e) => handleKeyDown(e, lang.code)}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${lang.name} - ${lang.nativeName}`}
              tabIndex={isSelected ? 0 : -1}
              className={`min-h-[48px] px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center gap-1.5 ${
                isSelected
                  ? 'bg-green-700 text-white border-green-700 shadow-md'
                  : 'text-gray-800 bg-white border-gray-300 hover:border-green-600 hover:bg-green-50 active:bg-green-100'
              } ${hasEnglishInLabel && isRTL ? 'atkinson-font' : ''}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.nativeName}</span>
              <span className="sr-only">
                {isSelected ? ' (selected)' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}