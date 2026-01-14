import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import LanguageSelector from './components/LanguageSelector';
import PaymentForm from './components/PaymentForm';
import QRDisplay from './components/QRDisplay';
import Login from './components/Login';
import NewAdminPanel from './components/NewAdminPanel';
import NetworkStatus from './components/NetworkStatus';
import SyncStatus from './components/SyncStatus';
import QRHistory from './components/QRHistory';
import { AccessibilityReport } from './components/AccessibilityReport';
import { Language, PaymentInfo } from './types';
import { translations } from './data/translations';
import { syncQueue } from './services/syncQueue';

function App() {
  const { user, loading } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferredLanguage');
    return (saved as Language) || 'en';
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showQRHistory, setShowQRHistory] = useState(false);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  const handleGenerateQR = (info: PaymentInfo) => {
    setPaymentInfo(info);
  };

  const handleBack = () => {
    setPaymentInfo(null);
  };

  const handleSignUp = () => {
    setShowSignUp(true);
    setShowAdmin(true);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('preferredLanguage', lang);
  };

  useEffect(() => {
    syncQueue.startAutoSync(5);

    return () => {
      syncQueue.stopAutoSync();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showReport) {
    return <AccessibilityReport />;
  }

  if (showQRHistory) {
    return <QRHistory language={language} onClose={() => setShowQRHistory(false)} />;
  }

  if (showAdmin) {
    if (!user) {
      return <Login />;
    }
    return <NewAdminPanel />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} lang={language}>
      <NetworkStatus />
      <SyncStatus />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Admin Link */}
        <div className="flex justify-end gap-4 mb-4 flex-wrap">
          <button
            onClick={() => setShowQRHistory(true)}
            className="text-sm text-gray-600 hover:text-gray-900 py-3 px-4 min-h-[48px] rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            View QR History
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="text-sm text-gray-600 hover:text-gray-900 py-3 px-4 min-h-[48px] rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Accessibility Report
          </button>
          <button
            onClick={() => setShowAdmin(true)}
            className="text-sm text-gray-600 hover:text-gray-900 py-3 px-4 min-h-[48px] rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Admin Panel
          </button>
        </div>

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
            onLanguageChange={handleLanguageChange}
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
              onSignUp={handleSignUp}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600" role="contentinfo">
          <p className="text-lg font-medium">
            {t('completelyFreeService')}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;