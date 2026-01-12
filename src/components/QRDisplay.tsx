import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';
import VoiceButton from './VoiceButton';

interface QRDisplayProps {
  paymentInfo: PaymentInfo;
  language: Language;
  onBack: () => void;
}

export default function QRDisplay({ paymentInfo, language, onBack }: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrPrintDataUrl, setQrPrintDataUrl] = useState<string>('');
  const [showShareTip, setShowShareTip] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  const generatePaymentUrl = () => {
    const { method, identifier, name } = paymentInfo;

    if (method === 'jazzcash') {
      return `jazzcash://send?to=${encodeURIComponent(identifier)}&note=${encodeURIComponent(`Donation to ${name}`)}`;
    } else if (method === 'easypaisa') {
      return `easypaisa://transfer?recipient=${encodeURIComponent(identifier)}&description=${encodeURIComponent(`Donation to ${name}`)}`;
    }
    return identifier;
  };

  useEffect(() => {
    const generateQRs = async () => {
      try {
        const paymentUrl = generatePaymentUrl();

        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          width: 350,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);

        await generatePrintQR(paymentUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRs();
  }, [paymentInfo]);

  const generatePrintQR = async (paymentUrl: string) => {
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
    ctx.font = 'bold 48px Arial, sans-serif';
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
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillText('Scan with Camera', canvas.width / 2, qrY + 560);
      ctx.font = '28px Arial, sans-serif';
      ctx.fillText('کیمرہ سے اسکین کریں', canvas.width / 2, qrY + 600);

      ctx.fillStyle = '#666666';
      ctx.font = '24px Arial, sans-serif';
      const method = paymentInfo.method === 'jazzcash' ? 'JazzCash' : 'Easypaisa';
      ctx.fillText(`Opens ${method} app automatically`, canvas.width / 2, qrY + 660);

      ctx.strokeStyle = '#CCCCCC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, qrY + 700);
      ctx.lineTo(700, qrY + 700);
      ctx.stroke();

      ctx.fillStyle = '#666666';
      ctx.font = 'bold 22px Arial, sans-serif';
      ctx.fillText('Cash donations also welcome', canvas.width / 2, qrY + 750);
      ctx.font = '22px Arial, sans-serif';
      ctx.fillText('نقد عطیات بھی قبول ہیں', canvas.width / 2, qrY + 785);

      const dataUrl = canvas.toDataURL('image/png');
      setQrPrintDataUrl(dataUrl);

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

  return (
    <div className={`max-w-4xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <button
        onClick={onBack}
        className="min-h-[60px] px-6 py-4 rounded-xl text-lg font-bold border-3 border-gray-400 bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200 flex items-center gap-3 transition-all mb-8 shadow-sm"
        aria-label="Go back"
      >
        <ArrowLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span>{t('makeAnotherQR')}</span>
      </button>

      <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8 rounded-lg">
        <h2 className="text-2xl font-bold text-green-900 mb-3">
          {t('qrReady')}
        </h2>
        <p className="text-lg text-green-800 leading-relaxed">
          {t('qrReadyInstructions')}
        </p>
      </div>

      <VoiceButton
        text={t('voiceInstructionsQR')}
        language={language}
      />

      <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-200 mt-8">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
            {paymentInfo.name}
          </h3>
          <p className="text-xl text-gray-700">
            {t('digitalDonationQR')}
          </p>
        </div>

        <div className="bg-gray-50 p-8 rounded-xl border-2 border-gray-200 mb-8">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${paymentInfo.name}`}
              className="w-full max-w-sm mx-auto"
              role="img"
            />
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h4 className="text-xl font-bold text-blue-900 mb-3">
            {t('howItWorks')}
          </h4>
          <ol className="space-y-3 text-lg text-blue-900">
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">1.</span>
              <span>{t('step1Print')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">2.</span>
              <span>{t('step2Laminate')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">3.</span>
              <span>{t('step3Attach')}</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold flex-shrink-0">4.</span>
              <span>{t('step4Scan')}</span>
            </li>
          </ol>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={downloadForPrint}
            className="min-h-[80px] bg-green-700 text-white py-6 px-8 rounded-xl text-2xl font-bold hover:bg-green-800 focus:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors shadow-lg flex items-center justify-center gap-4"
          >
            <Download className="w-10 h-10" aria-hidden="true" />
            {t('downloadToPrint')}
          </button>

          <button
            onClick={shareDigital}
            className="min-h-[70px] bg-white text-gray-800 py-5 px-6 rounded-xl text-xl font-bold border-3 border-gray-300 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-colors flex items-center justify-center gap-3"
          >
            <Share2 className="w-8 h-8" aria-hidden="true" />
            {t('shareDigitalCopy')}
          </button>
        </div>

        {showShareTip && (
          <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-5">
            <p className="text-yellow-900 text-base">
              {t('shareTip')}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-100 border border-gray-300 rounded-xl p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-3">
          {t('importantReminders')}
        </h4>
        <ul className="space-y-2 text-gray-700">
          <li className="flex gap-2">
            <span>•</span>
            <span>{t('reminder1')}</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>{t('reminder2')}</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>{t('reminder3')}</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>{t('reminder4')}</span>
          </li>
        </ul>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} width="800" height="1100" aria-hidden="true" />
    </div>
  );
}
