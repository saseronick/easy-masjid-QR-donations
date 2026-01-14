import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';
import AccountPrompt from './AccountPrompt';
import { db, DBPaymentInfo } from '../utils/db';

interface QRDisplayProps {
  paymentInfo: PaymentInfo;
  language: Language;
  onBack: () => void;
  onSignUp?: () => void;
}

export default function QRDisplay({ paymentInfo, language, onBack, onSignUp }: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrPrintDataUrl, setQrPrintDataUrl] = useState<string>('');
  const [showShareTip, setShowShareTip] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const generatePaymentUrl = () => {
    const { method, identifier, name } = paymentInfo;

    if (method === 'raast') {
      return `tel:${identifier.replace(/\D/g, '')}`;
    } else if (method === 'jazzcash') {
      return `jazzcash://send?to=${encodeURIComponent(identifier)}&note=${encodeURIComponent(`Donation to ${name}`)}`;
    } else if (method === 'easypaisa') {
      return `easypaisa://transfer?recipient=${encodeURIComponent(identifier)}&description=${encodeURIComponent(`Donation to ${name}`)}`;
    }
    return identifier;
  };

  useEffect(() => {
    const generateQRs = async () => {
      try {
        setIsGenerating(true);
        setGenerationProgress(0);

        const paymentUrl = generatePaymentUrl();
        const cacheId = `${paymentInfo.method}-${paymentInfo.identifier.replace(/\D/g, '')}`;

        setGenerationProgress(20);

        const cachedQR = localStorage.getItem(`qr-${cacheId}`);
        if (cachedQR) {
          setQrDataUrl(cachedQR);
          setIsFromCache(true);
          setGenerationProgress(60);
          await generatePrintQR(paymentUrl, cacheId);
          setGenerationProgress(100);
          setIsGenerating(false);
          return;
        }
        setIsFromCache(false);

        setGenerationProgress(40);
        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          width: 350,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);

        setGenerationProgress(60);
        localStorage.setItem(`qr-${cacheId}`, dataUrl);

        const uniqueId = `${cacheId}-${Date.now()}`;
        const paymentData: DBPaymentInfo = {
          id: uniqueId,
          organizationName: paymentInfo.name,
          amount: 0,
          purpose: 'Donation',
          qrCodeData: dataUrl,
          paymentMethod: paymentInfo.method,
          raastId: paymentInfo.method === 'raast' ? paymentInfo.identifier : undefined,
          phoneNumber: paymentInfo.identifier,
          created_at: new Date().toISOString(),
        };

        setGenerationProgress(80);
        await db.addPaymentInfo(paymentData);

        await generatePrintQR(paymentUrl, cacheId);
        setGenerationProgress(100);
        setIsGenerating(false);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setIsGenerating(false);
      }
    };

    generateQRs();
  }, [paymentInfo]);

  const generatePrintQR = async (paymentUrl: string, cacheKey?: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 1100;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const titleText = paymentInfo.name;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px "Atkinson Hyperlegible", Arial, sans-serif';
    ctx.textAlign = 'center';

    const words = titleText.split(' ');
    let line = '';
    let y = 80;
    const maxWidth = 700;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 55;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);

    ctx.fillStyle = '#000000';
    ctx.fillRect(150, y + 20, 500, 3);

    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, paymentUrl, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const qrX = (canvas.width - 500) / 2;
      const qrY = y + 60;
      ctx.drawImage(qrCanvas, qrX, qrY);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px "Atkinson Hyperlegible", Arial, sans-serif';
      ctx.fillText('Scan with Camera', canvas.width / 2, qrY + 560);
      ctx.font = '28px "Noto Nastaliq Urdu", Arial, sans-serif';
      ctx.fillText('کیمرہ سے اسکین کریں', canvas.width / 2, qrY + 600);

      ctx.fillStyle = '#666666';
      ctx.font = '24px "Atkinson Hyperlegible", Arial, sans-serif';
      const methodName = paymentInfo.method === 'jazzcash' ? 'JazzCash' :
                        paymentInfo.method === 'easypaisa' ? 'Easypaisa' :
                        'RAAST / Any Payment App';
      ctx.fillText(`${paymentInfo.method === 'raast' ? 'Works with' : 'Opens'} ${methodName}`, canvas.width / 2, qrY + 660);


      const dataUrl = canvas.toDataURL('image/png');
      setQrPrintDataUrl(dataUrl);

      if (cacheKey) {
        localStorage.setItem(`${cacheKey}-print`, dataUrl);
      }

    } catch (error) {
      console.error('Error generating print QR:', error);
    }
  };

  const downloadForPrint = () => {
    const link = document.createElement('a');
    link.download = `${paymentInfo.name}-qr-code-print.png`;
    link.href = qrPrintDataUrl || qrDataUrl;
    link.click();
  };

  const shareDigital = async () => {
    if (navigator.share) {
      try {
        const response = await fetch(qrPrintDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${paymentInfo.name}-qr-code.png`, { type: 'image/png' });

        await navigator.share({
          title: `Donate to ${paymentInfo.name}`,
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setShowShareTip(true);
      }
    } else {
      setShowShareTip(true);
    }
  };

  if (isGenerating) {
    return (
      <div className={`max-w-4xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t('generatingQR') || (language === 'ur' ? 'QR کوڈ بنایا جا رہا ہے...' : 'Generating QR Code...')}
            </h3>
            <p className="text-xl text-gray-600 font-medium mb-6">
              {language === 'ur' ? 'برائے مہربانی انتظار کریں' : 'Please wait...'}
            </p>

            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden mb-3">
                <div
                  className="bg-green-700 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
              <p className="text-lg text-gray-700 font-bold">
                {generationProgress}% {language === 'ur' ? 'مکمل' : 'Complete'}
              </p>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-base text-blue-900">
                {language === 'ur'
                  ? 'آپ کا QR کوڈ تیار ہو رہا ہے۔ یہ صرف چند سیکنڈ میں مکمل ہو جائے گا۔'
                  : 'Your QR code is being prepared. This will only take a few seconds.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      {(!isOnline || isFromCache) && (
        <div className="mb-4 bg-amber-50 border-2 border-amber-400 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 text-lg mb-1">
              {!isOnline ? 'Offline Mode' : 'From Cache'}
            </h3>
            <p className="text-amber-800 text-sm">
              {!isOnline
                ? 'You are offline. This QR code was generated from cached data and works perfectly offline.'
                : 'This QR code was loaded from your device cache for instant display.'}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onBack}
        className="min-h-[70px] px-6 py-4 rounded-xl text-lg font-bold border-3 border-gray-400 bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200 flex items-center gap-3 transition-all mb-6 shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span>{t('makeAnotherQR')}</span>
      </button>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {paymentInfo.name}
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
          <button
            onClick={downloadForPrint}
            className="min-h-[70px] bg-green-700 text-white py-5 px-6 rounded-xl text-xl font-bold hover:bg-green-800 focus:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors shadow-lg flex items-center justify-center gap-4"
          >
            <Download className="w-8 h-8" aria-hidden="true" />
            {t('downloadToPrint')}
          </button>

          <button
            onClick={shareDigital}
            className="min-h-[70px] bg-white text-gray-800 py-4 px-5 rounded-xl text-lg font-bold border-3 border-gray-300 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-colors flex items-center justify-center gap-3"
          >
            <Share2 className="w-7 h-7" aria-hidden="true" />
            {t('shareDigitalCopy')}
          </button>
        </div>

        {showShareTip && (
          <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
            <p className="text-yellow-900 text-sm">
              {t('shareTip')}
            </p>
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 mb-6">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${paymentInfo.name}`}
              className="w-full max-w-sm mx-auto"
              role="img"
            />
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h4 className="text-lg font-bold text-blue-900 mb-3">
            {t('howItWorks')}
          </h4>
          <ol className="space-y-2 text-base text-blue-900">
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>{t('step1Print')}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>{t('step2Laminate')}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>{t('step3Attach')}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>{t('step4Scan')}</span>
            </li>
          </ol>
        </div>
      </div>

      {showAccountPrompt && onSignUp && (
        <div className="mt-6">
          <AccountPrompt
            language={language}
            onSignUp={onSignUp}
            onDismiss={() => setShowAccountPrompt(false)}
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} width="800" height="1100" aria-hidden="true" />
    </div>
  );
}
