import React, { useState } from 'react';
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
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} lang={language}>
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-10" role="banner">
          <h1 className="text-4xl font-bold text-green-900 mb-4 leading-tight" id="main-heading">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            {t('valueProposition')}
          </p>
        </header>

        {/* Language Selector */}
        <nav aria-label="Language Selection" role="navigation" className="mb-10">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        </nav>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto" role="main" aria-labelledby="main-heading">
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
      </div>
    </div>
  );
}

export default App;