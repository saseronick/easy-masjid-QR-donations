import React, { useState } from 'react';
import { Fuel as Mosque } from 'lucide-react';
import LanguageSelector from './components/LanguageSelector';
import PaymentForm from './components/PaymentForm';
import QRDisplay from './components/QRDisplay';
import { Language, PaymentInfo } from './types';
import { translations } from './data/translations';

function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  const handleGenerateQR = (info: PaymentInfo) => {
    setPaymentInfo(info);
  };

  const handleBack = () => {
    setPaymentInfo(null);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-green-100 ${isRTL ? 'rtl' : 'ltr'}`} lang={language}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8" role="banner">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-green-800 p-3 rounded-2xl">
              <Mosque className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-green-900" id="main-heading">
              {t('title')}
            </h1>
          </div>
          <div className={`text-gray-800 text-lg max-w-lg mx-auto px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="font-bold mb-2">
              {t('valueProposition')}
            </p>
            <p className="mb-2 text-base">
              {t('freeToolDescription')}
            </p>
            <p className="text-base">
              {t('completelyFreeService')}
            </p>
          </div>
        </header>

        {/* Language Selector */}
        <nav aria-label="Language Selection" role="navigation">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={setLanguage}
        />
        </nav>

        {/* Main Content */}
        <main className="max-w-lg mx-auto" role="main" aria-labelledby="main-heading">
          {!paymentInfo ? (
            <PaymentForm
              language={language}
              onSubmit={handleGenerateQR}
            />
          ) : (
            <QRDisplay
              paymentInfo={paymentInfo}
              language={language}
              onBack={handleBack}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-green-200" role="contentinfo">
          <p className="text-gray-700 text-sm">
            Made with ❤️ for our community
          </p>
        </footer>
      </div>

      {/* Decorative Islamic Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5" aria-hidden="true" role="presentation">
        {/* Islamic 8-pointed star (Khatam) - top left */}
        <div className="absolute top-10 left-10 w-32 h-32 transform rotate-12">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-2 border-green-800 transform rotate-45"></div>
            <div className="absolute inset-4 border-2 border-green-800 transform rotate-45"></div>
            <div className="absolute inset-0 border-2 border-green-800"></div>
            <div className="absolute inset-4 border-2 border-green-800"></div>
          </div>
        </div>
        
        {/* Geometric rosette pattern - top right */}
        <div className="absolute top-32 right-16 w-24 h-24 transform rotate-30">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-2 border-green-800 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-green-800 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-green-800 transform rotate-45"></div>
            <div className="absolute inset-0 border-2 border-green-800 transform rotate-90"></div>
          </div>
        </div>
        
        {/* Islamic geometric hexagon with internal pattern - bottom left */}
        <div className="absolute bottom-20 left-20 w-28 h-28 transform -rotate-15">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-2 border-green-800 transform rotate-30" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
            <div className="absolute inset-3 border-2 border-green-800 transform rotate-30" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
            <div className="absolute inset-0 border-2 border-green-800 transform rotate-60" style={{clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'}}></div>
          </div>
        </div>
        
        {/* Arabesque-inspired interlacing pattern - bottom right */}
        <div className="absolute bottom-32 right-12 w-20 h-20 transform rotate-45">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border-2 border-green-800 rounded-full"></div>
            <div className="absolute inset-1 border-2 border-green-800 transform rotate-45"></div>
            <div className="absolute inset-2 border-2 border-green-800 rounded-full"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-800 transform -translate-y-0.5"></div>
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-green-800 transform -translate-x-0.5"></div>
          </div>
        </div>
        
        {/* Additional subtle geometric elements */}
        <div className="absolute top-1/2 left-8 w-16 h-16 transform -translate-y-1/2 rotate-12">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border border-green-800 transform rotate-45"></div>
            <div className="absolute inset-2 border border-green-800 transform rotate-45"></div>
          </div>
        </div>
        
        <div className="absolute top-1/3 right-8 w-12 h-12 transform rotate-60">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 border border-green-800" style={{clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'}}></div>
            <div className="absolute inset-1 border border-green-800" style={{clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;