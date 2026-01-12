import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
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
  const [qrWithTextDataUrl, setQrWithTextDataUrl] = useState<string>('');
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
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);

        await generateQRWithText(paymentUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRs();
  }, [paymentInfo]);

  const generateQRWithText = async (paymentUrl: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 700;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const donateText = `${paymentInfo.name}`;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(donateText, canvas.width / 2, 60);

    ctx.fillStyle = '#000000';
    ctx.fillRect(canvas.width / 2 - 60, 80, 120, 4);

    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, paymentUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const qrX = (canvas.width - 400) / 2;
      const qrY = 120;
      ctx.drawImage(qrCanvas, qrX, qrY);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText('SCAN TO PAY', canvas.width / 2, qrY + 480);

      const dataUrl = canvas.toDataURL('image/png');
      setQrWithTextDataUrl(dataUrl);

    } catch (error) {
      console.error('Error generating QR with text:', error);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `${paymentInfo.name}-qr-code.png`;
    link.href = qrWithTextDataUrl || qrDataUrl;
    link.click();
  };

  const instruction = `Scan this code with your phone camera. It will open ${paymentInfo.method === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} app automatically. Then complete the payment.`;

  return (
    <div className={`max-w-3xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <button
        onClick={onBack}
        className="min-h-[80px] w-full mb-10 px-8 py-6 rounded-2xl text-2xl font-bold border-4 border-black bg-white text-black hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center gap-4 transition-all"
        aria-label="Go back"
      >
        <ArrowLeft className={`w-10 h-10 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span>BACK</span>
      </button>

      <VoiceButton
        text={instruction}
        language={language}
      />

      <div className="bg-white rounded-3xl border-8 border-black p-12 text-center mt-10" role="main">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-black mb-6 leading-tight">
            {paymentInfo.name}
          </h2>
          <p className="text-3xl font-bold text-black">
            SCAN TO PAY
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border-4 border-black mb-10 inline-block">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR Code for ${paymentInfo.name}`}
              className="w-full max-w-md mx-auto"
              role="img"
            />
          )}
        </div>

        <div className="bg-white border-4 border-black rounded-2xl p-8 mb-10">
          <p className="text-2xl text-black font-bold leading-relaxed">
            Point your camera at this code. Your payment app will open automatically.
          </p>
        </div>

        <button
          onClick={downloadQR}
          className="w-full min-h-[100px] bg-black text-white py-8 px-8 rounded-2xl text-3xl font-bold hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-gray-400 transition-colors shadow-xl flex items-center justify-center gap-6"
        >
          <Download className="w-12 h-12" aria-hidden="true" />
          DOWNLOAD QR CODE
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} width="600" height="700" aria-hidden="true" />
    </div>
  );
}
