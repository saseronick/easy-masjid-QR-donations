import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { PaymentMethod, PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';
import VoiceButton from './VoiceButton';

interface PaymentFormProps {
  language: Language;
  onSubmit: (paymentInfo: PaymentInfo) => void;
}

const paymentMethods = [
  { id: 'jazzcash' as PaymentMethod, icon: Smartphone, label: 'JazzCash' },
  { id: 'easypaisa' as PaymentMethod, icon: Smartphone, label: 'Easypaisa' }
];

export default function PaymentForm({ language, onSubmit }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('jazzcash');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

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

  const instructions = method === 'jazzcash'
    ? 'Enter your JazzCash phone number (example: 03001234567)'
    : 'Enter your Easypaisa phone number (example: 03001234567)';

  return (
    <div className={`max-w-3xl mx-auto ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-lg">
        <p className="text-lg text-blue-900 font-medium leading-relaxed">
          Most donations come from cash. This QR code adds a digital option for people who prefer mobile payments.
        </p>
      </div>

      <VoiceButton
        text={instructions}
        language={language}
      />

      <form onSubmit={handleSubmit} className="space-y-8 mt-8" noValidate>
        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-2xl font-bold text-gray-900 mb-6">
              Step 1: Which app do people use to send you money?
            </legend>
            <div className="grid grid-cols-1 gap-4">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setMethod(pm.id)}
                    aria-pressed={method === pm.id}
                    role="radio"
                    aria-checked={method === pm.id}
                    className={`min-h-[80px] p-6 rounded-xl border-3 transition-all flex items-center gap-4 text-left ${
                      method === pm.id
                        ? 'border-green-700 bg-green-700 text-white shadow-lg'
                        : 'border-gray-300 bg-white text-gray-900 hover:border-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Icon className="w-12 h-12 flex-shrink-0" aria-hidden="true" />
                    <span className="text-2xl font-bold">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
          <label htmlFor="payment-identifier" className="block text-2xl font-bold text-gray-900 mb-4">
            Step 2: Your mobile number
          </label>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            {method === 'jazzcash' ? 'Your JazzCash number (usually your personal mobile)' : 'Your Easypaisa number (usually your personal mobile)'}
          </p>
          <input
            id="payment-identifier"
            type="tel"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!identifier.trim() && error ? 'true' : 'false'}
            placeholder="03001234567"
            className="w-full px-6 py-5 text-2xl border-3 border-gray-300 rounded-xl focus:outline-none focus:border-green-700 focus:ring-4 focus:ring-green-200 transition-colors"
            dir="ltr"
          />
        </div>

        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-200">
          <label htmlFor="organization-name" className="block text-2xl font-bold text-gray-900 mb-4">
            Step 3: Masjid name
          </label>
          <p className="text-lg text-gray-700 mb-4 leading-relaxed">
            This will appear on the QR code so people know where they're donating
          </p>
          <input
            id="organization-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-required="true"
            aria-invalid={!name.trim() && error ? 'true' : 'false'}
            placeholder="Masjid Al-Noor"
            className={`w-full px-6 py-5 text-2xl border-3 border-gray-300 rounded-xl focus:outline-none focus:border-green-700 focus:ring-4 focus:ring-green-200 transition-colors ${
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
          className="w-full min-h-[80px] bg-green-700 text-white py-6 px-8 rounded-xl text-2xl font-bold hover:bg-green-800 focus:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 transition-colors shadow-lg"
        >
          Create QR Code for Printing
        </button>
      </form>
    </div>
  );
}