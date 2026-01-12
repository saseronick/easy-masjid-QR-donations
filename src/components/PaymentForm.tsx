import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { PaymentMethod, PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';

interface PaymentFormProps {
  language: Language;
  onSubmit: (paymentInfo: PaymentInfo) => void;
}

const getPaymentMethods = (language: Language) => [
  { id: 'jazzcash' as PaymentMethod, icon: Smartphone, key: 'jazzcash' },
  { id: 'easypaisa' as PaymentMethod, icon: Smartphone, key: 'easypaisa' }
];

export default function PaymentForm({ language, onSubmit }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';
  const paymentMethods = getPaymentMethods(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !identifier.trim()) {
      setError(t('error'));
      return;
    }

    onSubmit({
      method,
      identifier: identifier.trim(),
      name: name.trim()
    });
  };

  return (
    <div className={`max-w-3xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-xl font-bold text-gray-900 mb-4">
              {t('step1Question')}
            </legend>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                const label = t(pm.key);
                const hasEnglishInLabel = /[A-Za-z]/.test(label);
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    aria-pressed={method === pm.id}
                    role="radio"
                    aria-checked={method === pm.id}
                    className={`min-h-[70px] p-5 rounded-xl border-3 transition-all flex items-center gap-4 ${isRTL ? 'text-right' : 'text-left'} ${
                      method === pm.id
                        ? 'border-green-700 bg-green-700 text-white shadow-lg'
                        : 'border-gray-300 bg-white text-gray-900 hover:border-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Icon className="w-10 h-10 flex-shrink-0" aria-hidden="true" />
                    <span className={`text-xl font-bold ${hasEnglishInLabel && isRTL ? 'atkinson-font' : ''}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <label htmlFor="payment-identifier" className="block text-xl font-bold text-gray-900 mb-3">
            {t('step2Mobile')}
          </label>
          <input
            id="payment-identifier"
            type="tel"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!identifier.trim() && error ? 'true' : 'false'}
            placeholder="03001234567"
            className="w-full px-5 py-4 text-xl border-3 border-gray-300 rounded-xl focus:outline-none focus:border-green-700 focus:ring-4 focus:ring-green-200 transition-colors"
            dir="ltr"
          />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <label htmlFor="organization-name" className="block text-xl font-bold text-gray-900 mb-3">
            {t('step3Masjid')}
          </label>
          <input
            id="organization-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!name.trim() && error ? 'true' : 'false'}
            placeholder={t('masjidNamePlaceholder')}
            className={`w-full px-5 py-4 text-xl border-3 border-gray-300 rounded-xl focus:outline-none focus:border-green-700 focus:ring-4 focus:ring-green-200 transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-3 border-red-600 rounded-xl p-6" role="alert" aria-live="polite" aria-atomic="true">
            <p className="text-red-900 text-xl font-bold text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[70px] bg-green-700 text-white py-5 px-6 rounded-xl text-xl font-bold hover:bg-green-800 focus:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors shadow-lg"
        >
          {t('createQRButton')}
        </button>
      </form>
    </div>
  );
}