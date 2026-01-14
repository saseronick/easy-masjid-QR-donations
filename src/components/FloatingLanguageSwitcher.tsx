import React, { useState, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../types';

interface FloatingLanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

const languages = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ur' as Language, name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'pa' as Language, name: 'Punjabi', nativeName: 'پنجابی', flag: '🇵🇰' }
];

export default function FloatingLanguageSwitcher({ currentLanguage, onLanguageChange }: FloatingLanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageSelect = (lang: Language) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <div className="absolute bottom-full mb-3 right-0 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden min-w-[200px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`w-full px-5 py-4 text-left hover:bg-green-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                currentLanguage === lang.code ? 'bg-green-100' : ''
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-gray-800">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-green-700 hover:bg-green-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300"
        aria-label="Change language"
        title="Change language"
      >
        <span className="text-xl">{currentLang.flag}</span>
      </button>
    </div>
  );
}
