import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { translations } from '../data/translations';

interface VoiceButtonProps {
  text: string;
  language: string;
}

export default function VoiceButton({ text, language }: VoiceButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const langMap: Record<string, string> = {
        'en': 'en-US',
        'ur': 'ur-PK',
        'hi': 'hi-IN',
        'ar': 'ar-SA',
        'pa': 'pa-IN',
        'ps': 'ps-AF',
        'sd': 'sd-PK'
      };

      utterance.lang = langMap[language] || 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  if (!('speechSynthesis' in window)) {
    return null;
  }

  return (
    <button
      onClick={speaking ? stop : speak}
      className="min-h-[70px] w-full px-6 py-5 rounded-xl text-xl font-bold border-3 border-blue-600 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 flex items-center justify-center gap-3 transition-all shadow-md"
      aria-label={speaking ? 'Stop speaking' : 'Read aloud'}
      type="button"
    >
      {speaking ? (
        <>
          <VolumeX className="w-8 h-8" aria-hidden="true" />
          <span>{t('stopButton')}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-8 h-8" aria-hidden="true" />
          <span>{t('listenButton')}</span>
        </>
      )}
    </button>
  );
}
