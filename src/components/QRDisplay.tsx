import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Share2, Download, Copy, Smartphone } from 'lucide-react';
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
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [qrWithTextDataUrl, setQrWithTextDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileUA || (isTouchDevice && isSmallScreen));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate payment URL based on method
  const generatePaymentUrl = () => {
    const { method, identifier, name } = paymentInfo;
    const amount = paymentInfo.amount || '';
    
    switch (method) {
      case 'jazzcash':
        // JazzCash deep link for direct app opening
        const jazzAmount = amount ? `&amount=${encodeURIComponent(amount)}` : '';
        return `jazzcash://send?to=${encodeURIComponent(identifier)}&note=${encodeURIComponent(`Donation to ${name}`)}${jazzAmount}`;
      case 'easypaisa':
        // Easypaisa deep link for direct app opening
        const epAmount = amount ? `&amount=${encodeURIComponent(amount)}` : '';
        return `easypaisa://transfer?recipient=${encodeURIComponent(identifier)}&description=${encodeURIComponent(`Donation to ${name}`)}${epAmount}`;
      case 'sadapay':
        // SadaPay deep link for direct app opening
        const sadaAmount = amount ? `&amount=${encodeURIComponent(amount)}` : '';
        return `sadapay://pay?to=${encodeURIComponent(identifier)}&note=${encodeURIComponent(`Donation to ${name}`)}${sadaAmount}`;
      case 'raast':
        // RAAST deep link (works with multiple banking apps)
        const raastAmount = amount ? `&amount=${encodeURIComponent(amount)}` : '';
        return `raast://transfer?account=${encodeURIComponent(identifier)}&beneficiary=${encodeURIComponent(name)}${raastAmount}`;
      case 'bank':
        if (paymentInfo.bankDetails?.qrCodeUrl) {
          return paymentInfo.bankDetails.qrCodeUrl;
        } else {
          // Generate universal banking deep link
          const bankInfo = paymentInfo.bankDetails;
          const bankAmount = amount ? `&amount=${encodeURIComponent(amount)}` : '';
          const iban = bankInfo?.iban || '';
          const accountNumber = bankInfo?.accountNumber || '';
          
          // Use IBAN if available, otherwise account number
          const accountId = iban || accountNumber;
          
          return `bank://transfer?account=${encodeURIComponent(accountId)}&beneficiary=${encodeURIComponent(bankInfo?.accountTitle || name)}&bank=${encodeURIComponent(bankInfo?.bankName || '')}${bankAmount}`;
        }
      case 'custom':
        return identifier.startsWith('http') ? identifier : `https://${identifier}`;
      default:
        return identifier;
    }
  };

  // Generate QR code
  useEffect(() => {
    const generateQRs = async () => {
      try {
        const paymentUrl = generatePaymentUrl();
        
        // Generate basic QR code for display
        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(dataUrl);
        
        // Generate QR code with text for download
        await generateQRWithText(paymentUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRs();
  }, [paymentInfo]);

  // Generate QR code with text overlay for download
  const generateQRWithText = async (paymentUrl: string) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size (wider to accommodate text)
    canvas.width = 400;
    canvas.height = 500;
    
    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add title text
    const donateText = `${t('donateTo')} ${paymentInfo.name}`;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    
    // Word wrap for long organization names
    const maxWidth = 360;
    const words = donateText.split(' ');
    let line = '';
    let y = 50;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[n] + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, canvas.width / 2, y);
    
    // Add decorative line
    ctx.fillStyle = '#166534';
    ctx.fillRect(canvas.width / 2 - 40, y + 15, 80, 3);
    
    // Generate QR code and add to canvas
    try {
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, paymentUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Draw QR code on main canvas
      const qrX = (canvas.width - 280) / 2;
      const qrY = y + 40;
      ctx.drawImage(qrCanvas, qrX, qrY);
      
      // Add scan instruction
      ctx.fillStyle = '#000000';
      ctx.font = '16px Inter, Arial, sans-serif';
      ctx.fillText(t('scanToPay'), canvas.width / 2, qrY + 320);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png');
      setQrWithTextDataUrl(dataUrl);
      
    } catch (error) {
      console.error('Error generating QR with text:', error);
    }
  };
  // Handle native share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'qr-code.png', { type: 'image/png' });
        
        await navigator.share({
          title: `${t('paymentTo')} ${paymentInfo.name}`,
          text: t('scanToPay'),
          files: [file]
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to download
        downloadQR();
      }
    } else {
      // Fallback for browsers without native share
      downloadQR();
    }
  };

  // Copy payment link to clipboard
  const copyPaymentLink = async () => {
    try {
      const paymentUrl = generatePaymentUrl();
      await navigator.clipboard.writeText(paymentUrl);
      
      // Show temporary feedback
      const button = document.getElementById('copy-link-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Download QR code
  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `${paymentInfo.name}-qr-code.png`;
    link.href = qrWithTextDataUrl || qrDataUrl;
    link.click();
  };

  // Handle share button click
  const handleShareClick = () => {
    if (isMobile) {
      handleNativeShare();
    } else {
      setShowShareOptions(!showShareOptions);
    }
  };

  return (
    <div className={`max-w-md mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-green-800 hover:text-white hover:bg-green-800 focus:text-white focus:bg-green-800 focus:ring-4 focus:ring-green-300 mb-6 p-3 rounded-lg border-2 border-green-800 transition-colors font-medium"
        aria-label={t('newQR')}
      >
        <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} aria-hidden="true" />
        <span className="font-medium">{t('newQR')}</span>
      </button>

      {/* QR Code Display */}
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center" role="main" aria-labelledby="qr-heading">
        <div className="mb-6">
          <h2 id="qr-heading" className="text-2xl font-bold text-gray-800 mb-2">
            {t('scanToPay')}
          </h2>
          <div className="bg-green-100 border-2 border-green-600 rounded-lg p-4 mb-4">
            <p className="text-green-900 font-bold text-lg">
              {t('paymentTo')} <span className="font-bold">{paymentInfo.name}</span>
            </p>
            {paymentInfo.method === 'bank' && paymentInfo.bankDetails && (
              <div className="mt-3 text-sm text-green-800" role="group" aria-label="Bank Details">
                <p><strong>{t('accountTitle')}:</strong> {paymentInfo.bankDetails.accountTitle}</p>
                <p><strong>{t('accountNumber')}:</strong> {paymentInfo.bankDetails.accountNumber}</p>
                <p><strong>{t('bankName')}:</strong> {paymentInfo.bankDetails.bankName}</p>
                {paymentInfo.bankDetails.branchCode && (
                  <p><strong>{t('branchCode')}:</strong> {paymentInfo.bankDetails.branchCode}</p>
                )}
                {paymentInfo.bankDetails.iban && (
                  <p><strong>{t('iban')}:</strong> {paymentInfo.bankDetails.iban}</p>
                )}
              </div>
            )}
            {paymentInfo.amount && (
              <div className="mt-3 text-sm text-green-800">
                <p><strong>Suggested Amount:</strong> {paymentInfo.amount}</p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white p-6 rounded-xl border-4 border-green-200 mb-6 inline-block print-area" role="img" aria-labelledby="qr-description">
          {/* Donate Text for Printing */}
          <div className="mb-4 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {t('donateTo')} {paymentInfo.name}
            </h3>
            <div className="w-16 h-1 bg-green-600 mx-auto rounded-full"></div>
          </div>
          
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={`QR Code for payments to ${paymentInfo.name}`}
              className="w-64 h-64 mx-auto"
              role="img"
            />
          )}
          <p id="qr-description" className="sr-only">
            QR code containing payment information for {paymentInfo.name}. Scan with your mobile payment app to make a donation.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4 mb-6" role="note" aria-labelledby="instructions-heading">
          <h4 id="instructions-heading" className="sr-only">Usage Instructions</h4>
          <p className="text-blue-900 text-sm leading-relaxed font-medium">
            {t('deepLinkInstructions')}
          </p>
        </div>

        {/* Setup Instructions */}
        <div className={`bg-green-50 border-2 border-green-600 rounded-lg p-6 mb-6 ${isRTL ? 'text-right' : 'text-left'}`} role="region" aria-labelledby="setup-heading">
          <h3 className="text-green-900 font-bold text-lg mb-4">
            {t('setupTitle')}
          </h3>
          <ol className="space-y-4 text-green-800" role="list">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</span>
              <div>
                <h4 className="font-semibold mb-1">{t('testStep')}</h4>
                <p className="text-sm">{t('testStepDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</span>
              <div>
                <h4 className="font-semibold mb-1">{t('printStep')}</h4>
                <p className="text-sm">{t('printStepDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">3</span>
              <div>
                <h4 className="font-semibold mb-1">{t('protectStep')}</h4>
                <p className="text-sm">{t('protectStepDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">4</span>
              <div>
                <h4 className="font-semibold mb-1">{t('attachStep')}</h4>
                <p className="text-sm">{t('attachStepDesc')}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">5</span>
              <div>
                <h4 className="font-semibold mb-1">{t('announceStep')}</h4>
                <p className="text-sm">{t('announceStepDesc')}</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3" role="group" aria-label="QR Code Actions">
          {/* Primary Button - Download */}
          <button
            onClick={downloadQR}
            className="w-full bg-green-800 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-900 focus:bg-green-900 focus:ring-4 focus:ring-green-300 transition-colors shadow-lg flex items-center justify-center gap-2"
            aria-describedby="download-description"
          >
            <Download className="w-5 h-5" aria-hidden="true" />
            {t('downloadQR')}
          </button>
          <p id="download-description" className="sr-only">
            Download the QR code as an image file to your device
          </p>

          {/* Secondary Button - Share */}
          <button
            onClick={handleShareClick}
            className="w-full bg-yellow-700 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-yellow-800 focus:bg-yellow-800 focus:ring-4 focus:ring-yellow-300 transition-colors shadow-lg flex items-center justify-center gap-2"
            aria-describedby="share-description"
          >
            <Share2 className="w-5 h-5" aria-hidden="true" />
            {t('shareQR')}
          </button>
          <p id="share-description" className="sr-only">
            Share the QR code with others through various methods
          </p>

          {/* Progressive Disclosure Panel for Desktop */}
          {!isMobile && showShareOptions && (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 space-y-3" role="region" aria-labelledby="share-options-heading">
              <p id="share-options-heading" className="text-yellow-900 font-bold text-base mb-3">
                {t('chooseOption')}
              </p>
              
              <button
                id="copy-link-btn"
                onClick={copyPaymentLink}
                className="w-full bg-white border-2 border-yellow-600 text-yellow-900 py-3 px-4 rounded-lg font-semibold hover:bg-yellow-100 focus:bg-yellow-100 focus:ring-4 focus:ring-yellow-400 transition-colors flex items-center justify-center gap-2"
                aria-describedby="copy-link-description"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
                {t('copyLink')}
              </button>
              <p id="copy-link-description" className="sr-only">
                Copy the payment link to your clipboard
              </p>
              
              <button
                onClick={handleNativeShare}
                className="w-full bg-white border-2 border-yellow-600 text-yellow-900 py-3 px-4 rounded-lg font-semibold hover:bg-yellow-100 focus:bg-yellow-100 focus:ring-4 focus:ring-yellow-400 transition-colors flex items-center justify-center gap-2"
                aria-describedby="share-image-description"
              >
                <Smartphone className="w-4 h-4" aria-hidden="true" />
                {t('shareImage')}
              </button>
              <p id="share-image-description" className="sr-only">
                Share the QR code image through your device's sharing options
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for QR generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width="400" height="500" aria-hidden="true" />
    </div>
  );
}