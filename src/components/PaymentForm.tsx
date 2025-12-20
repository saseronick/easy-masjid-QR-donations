import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2, Link, Banknote, Zap } from 'lucide-react';
import { PaymentMethod, PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';

interface PaymentFormProps {
  language: Language;
  onSubmit: (paymentInfo: PaymentInfo) => void;
}

const paymentMethods = [
  { id: 'jazzcash' as PaymentMethod, icon: Smartphone },
  { id: 'easypaisa' as PaymentMethod, icon: Smartphone },
  { id: 'sadapay' as PaymentMethod, icon: CreditCard },
  { id: 'raast' as PaymentMethod, icon: Zap },
  { id: 'bank' as PaymentMethod, icon: Banknote },
  { id: 'custom' as PaymentMethod, icon: Link }
];

export default function PaymentForm({ language, onSubmit }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountTitle: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    iban: '',
    qrCodeUrl: ''
  });
  const [error, setError] = useState('');

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  const getHelpText = () => {
    const helpTexts = {
      jazzcash: t('jazzcashHelp'),
      easypaisa: t('easypaisaHelp'),
      sadapay: t('sadapayHelp'),
      raast: t('raastHelp'),
      upi: t('upiHelp'),
      paypal: t('paypalHelp'),
      bank: t('bankHelp'),
      custom: t('customHelp')
    };
    return helpTexts[method];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(t('error'));
      return;
    }

    if (method === 'bank') {
      if (!bankDetails.accountTitle.trim() || !bankDetails.accountNumber.trim() || !bankDetails.bankName.trim()) {
        setError(t('error'));
        return;
      }
    } else if (!identifier.trim()) {
      setError(t('error'));
      return;
    }

    onSubmit({
      method,
      identifier: identifier.trim(),
      name: name.trim(),
      bankDetails: method === 'bank' ? bankDetails : undefined
    });
  };

  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    setIdentifier('');
    setBankDetails({
      accountTitle: '',
      accountNumber: '',
      bankName: '',
      branchCode: '',
      iban: '',
      qrCodeUrl: ''
    });
  };

  return (
    <div className={`max-w-md mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-lg font-semibold text-gray-800 mb-4">
            {t('paymentMethod')}
            </legend>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => handleMethodChange(pm.id)}
                  aria-pressed={method === pm.id}
                  aria-describedby={`${pm.id}-help`}
                  role="radio"
                  aria-checked={method === pm.id}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    method === pm.id
                      ? 'border-green-800 bg-green-800 text-white shadow-lg focus:ring-4 focus:ring-green-300'
                      : 'border-gray-400 bg-white text-gray-900 hover:border-green-600 hover:bg-green-50 focus:ring-4 focus:ring-green-300'
                  }`}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                  <span className="text-sm font-medium">{t(pm.id)}</span>
                  <span id={`${pm.id}-help`} className="sr-only">
                    {t(pm.id)} payment method
                  </span>
                </button>
              );
            })}
          </div>
          </fieldset>
        </div>

        {method === 'bank' ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3" id="bank-details-heading">
              {t('bankHelp')}
            </h3>
            
            <div role="group" aria-labelledby="bank-details-heading">
              <label htmlFor="account-title" className="block text-sm font-medium text-gray-700 mb-2">
                {t('accountTitle')} *
              </label>
              <input
                id="account-title"
                type="text"
                value={bankDetails.accountTitle}
                onChange={(e) => setBankDetails({...bankDetails, accountTitle: e.target.value})}
                required
                aria-required="true"
                aria-invalid={!bankDetails.accountTitle.trim() && error ? 'true' : 'false'}
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label htmlFor="account-number" className="block text-sm font-medium text-gray-700 mb-2">
                {t('accountNumber')} *
              </label>
              <input
                id="account-number"
                type="text"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                required
                aria-required="true"
                aria-invalid={!bankDetails.accountNumber.trim() && error ? 'true' : 'false'}
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label htmlFor="bank-name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('bankName')} *
              </label>
              <input
                id="bank-name"
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                required
                aria-required="true"
                aria-invalid={!bankDetails.bankName.trim() && error ? 'true' : 'false'}
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label htmlFor="branch-code" className="block text-sm font-medium text-gray-700 mb-2">
                {t('branchCode')}
              </label>
              <input
                id="branch-code"
                type="text"
                value={bankDetails.branchCode}
                onChange={(e) => setBankDetails({...bankDetails, branchCode: e.target.value})}
                aria-invalid="false"
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-2">
                {t('iban')}
              </label>
              <input
                id="iban"
                type="text"
                value={bankDetails.iban}
                onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})}
                aria-invalid="false"
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <label htmlFor="bank-qr-url" className="block text-sm font-medium text-gray-700 mb-2">
                {t('bankQrUrl')}
              </label>
              <input
                id="bank-qr-url"
                type="url"
                value={bankDetails.qrCodeUrl}
                onChange={(e) => setBankDetails({...bankDetails, qrCodeUrl: e.target.value})}
                aria-invalid="false"
                className={`w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:border-green-700 focus:outline-none transition-colors ${
                  isRTL ? 'text-right' : 'text-left'
                }`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="payment-identifier" className="block text-lg font-semibold text-gray-800 mb-3">
              {t('identifier')}
            </label>
            <p className="text-sm text-gray-700 mb-3" id="identifier-help">
              {getHelpText()}
            </p>
            <input
              id="payment-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-describedby="identifier-help"
              aria-invalid={!identifier.trim() && error ? 'true' : 'false'}
              required
              aria-required="true"
              className={`w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-700 focus:outline-none transition-colors ${
                isRTL ? 'text-right' : 'text-left'
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        )}

        <div>
          <label htmlFor="organization-name" className="block text-lg font-semibold text-gray-800 mb-3">
            {t('name')}
          </label>
          <p className="text-sm text-gray-700 mb-3" id="name-help">
            {t('nameHelp')}
          </p>
          <input
            id="organization-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby="name-help"
            aria-invalid={!name.trim() && error ? 'true' : 'false'}
            required
            aria-required="true"
            className={`w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-700 focus:outline-none transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        <div>
          <label htmlFor="suggested-amount" className="block text-lg font-semibold text-gray-800 mb-3">
            {t('suggestedAmount')}
          </label>
          <p className="text-sm text-gray-700 mb-3" id="amount-help">
            {t('amountHelp')}
          </p>
          <input
            id="suggested-amount"
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-describedby="amount-help"
            aria-invalid="false"
            className={`w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-green-700 focus:outline-none transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder={method === 'bank' ? '' : '100'}
          />
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-500 rounded-lg p-4" role="alert" aria-live="polite" aria-atomic="true">
            <p className="text-red-900 text-center font-medium">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-800 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-900 focus:bg-green-900 focus:ring-4 focus:ring-green-300 transition-colors shadow-lg"
          aria-describedby={error ? 'form-error' : undefined}
        >
          {t('generateQR')}
        </button>
      </form>
    </div>
  );
}