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
      <VoiceButton
        text={instructions}
        language={language}
      />

      <form onSubmit={handleSubmit} className="space-y-10 mt-10" noValidate>
        <div>
          <fieldset className="border-0 p-0 m-0">
            <legend className="block text-3xl font-bold text-black mb-8">
              Step 1: Choose Payment App
            </legend>
            <div className="grid grid-cols-1 gap-6">
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
                    className={`min-h-[100px] p-8 rounded-2xl border-4 transition-all flex items-center gap-6 text-left ${
                      method === pm.id
                        ? 'border-black bg-black text-white shadow-xl'
                        : 'border-black bg-white text-black hover:bg-gray-100 active:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-16 h-16 flex-shrink-0" aria-hidden="true" />
                    <span className="text-3xl font-bold">{pm.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div>
          <label htmlFor="payment-identifier" className="block text-3xl font-bold text-black mb-8">
            Step 2: Phone Number
          </label>
          <p className="text-2xl text-black mb-6 leading-relaxed">
            {method === 'jazzcash' ? 'Your JazzCash number' : 'Your Easypaisa number'}
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
            className={`w-full px-8 py-6 text-3xl border-4 border-black rounded-2xl focus:outline-none focus:ring-8 focus:ring-gray-300 ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            dir="ltr"
          />
        </div>

        <div>
          <label htmlFor="organization-name" className="block text-3xl font-bold text-black mb-8">
            Step 3: Mosque Name
          </label>
          <p className="text-2xl text-black mb-6 leading-relaxed">
            What is your mosque or community called?
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
            className={`w-full px-8 py-6 text-3xl border-4 border-black rounded-2xl focus:outline-none focus:ring-8 focus:ring-gray-300 ${
              isRTL ? 'text-right' : 'text-left'
            }`}
            dir={isRTL ? 'rtl' : 'ltr'}
          />
        </div>

        {error && (
          <div className="bg-white border-4 border-black rounded-2xl p-8" role="alert" aria-live="polite" aria-atomic="true">
            <p className="text-black text-2xl font-bold text-center">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[100px] bg-black text-white py-8 px-8 rounded-2xl text-3xl font-bold hover:bg-gray-800 focus:bg-gray-800 focus:outline-none focus:ring-8 focus:ring-gray-400 transition-colors shadow-xl"
        >
          CREATE QR CODE
        </button>
      </form>
    </div>
  );
}