import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VoiceButtonProps {
  text: string;
  language: string;
}

export default function VoiceButton({ text, language }: VoiceButtonProps) {
  const [speaking, setSpeaking] = useState(false);

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
      className="min-h-[80px] w-full px-8 py-6 rounded-2xl text-2xl font-bold border-4 border-black bg-black text-white hover:bg-gray-800 active:bg-gray-900 flex items-center justify-center gap-4 transition-all"
      aria-label={speaking ? 'Stop speaking' : 'Read aloud'}
      type="button"
    >
      {speaking ? (
        <>
          <VolumeX className="w-10 h-10" aria-hidden="true" />
          <span>STOP</span>
        </>
      ) : (
        <>
          <Volume2 className="w-10 h-10" aria-hidden="true" />
          <span>LISTEN / سنیں</span>
        </>
      )}
    </button>
  );
}
