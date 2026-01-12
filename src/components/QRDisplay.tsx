import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';

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
      const method = paymentInfo.method === 'jazzcash' ? 'JazzCash' : 'Easypaisa';
      ctx.fillText(`Opens ${method} app automatically`, canvas.width / 2, qrY + 660);


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
        className="min-h-[60px] px-6 py-4 rounded-xl text-lg font-bold border-3 border-gray-400 bg-white text-gray-800 hover:bg-gray-100 active:bg-gray-200 flex items-center gap-3 transition-all mb-6 shadow-sm"
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
            className="min-h-[65px] bg-white text-gray-800 py-4 px-5 rounded-xl text-lg font-bold border-3 border-gray-300 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-colors flex items-center justify-center gap-3"
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

      <canvas ref={canvasRef} style={{ display: 'none' }} width="800" height="1100" aria-hidden="true" />
    </div>
  );
}
