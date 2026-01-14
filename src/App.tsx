import React, { useState, useEffect } from 'react';
import { UserCircle, History } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import LanguageSelector from './components/LanguageSelector';
import FloatingLanguageSwitcher from './components/FloatingLanguageSwitcher';
import PaymentForm from './components/PaymentForm';
import QRDisplay from './components/QRDisplay';
import Login from './components/Login';
import NewAdminPanel from './components/NewAdminPanel';
import NetworkStatus from './components/NetworkStatus';
import SyncStatus from './components/SyncStatus';
import QRHistory from './components/QRHistory';
import { Language, PaymentInfo } from './types';
import { translations } from './data/translations';
import { syncQueue } from './services/syncQueue';

function App() {
  const { user, loading } = useAuth();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferredLanguage');
    if (saved) return saved as Language;

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ur')) return 'ur';
    if (browserLang.startsWith('pa')) return 'pa';
    if (browserLang.startsWith('hi')) return 'hi';
    if (browserLang.startsWith('ar')) return 'ar';
    if (browserLang.startsWith('ps')) return 'ps';
    if (browserLang.startsWith('sd')) return 'sd';

    return 'en';
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
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

  if (showQRHistory) {
    return <QRHistory language={language} onClose={() => setShowQRHistory(false)} />;
  }

  if (showAdmin) {
    if (!user) {
      return <Login onCancel={() => setShowAdmin(false)} />;
    }
    return <NewAdminPanel />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRTL ? 'rtl' : 'ltr'}`} lang={language}>
      <NetworkStatus />
      <SyncStatus />
      <FloatingLanguageSwitcher
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
      />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Language Selector - First on page */}
        <nav aria-label="Language Selection" role="navigation" className="mb-6">
          <LanguageSelector
            currentLanguage={language}
            onLanguageChange={handleLanguageChange}
          />
        </nav>

        {/* Header with Account Access */}
        <header className="mb-8" role="banner">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1"></div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQRHistory(true)}
                className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-green-900 py-2 px-4 min-h-[48px] min-w-[48px] rounded-lg border-2 border-gray-300 hover:border-green-700 bg-white hover:bg-green-50 transition-all font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label="View QR History"
              >
                <History size={20} aria-hidden="true" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={() => setShowAdmin(true)}
                className="inline-flex items-center gap-2 text-sm bg-green-700 hover:bg-green-800 text-white py-2 px-5 min-h-[48px] rounded-lg border-2 border-green-700 hover:border-green-800 transition-all font-semibold shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-300"
                aria-label="My Account"
              >
                <UserCircle size={20} aria-hidden="true" />
                <span>My Account</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-green-900 mb-3 leading-tight" id="main-heading">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-6">
              {t('valueProposition')}
            </p>
          </div>
        </header>

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