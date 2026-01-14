import React, { useState } from 'react';
import { Smartphone, CheckCircle, XCircle } from 'lucide-react';
import { PaymentMethod, PaymentInfo, Language } from '../types';
import { translations } from '../data/translations';

interface PaymentFormProps {
  language: Language;
  onSubmit: (paymentInfo: PaymentInfo) => void;
}

const getPaymentMethods = (language: Language) => [
  { id: 'raast' as PaymentMethod, icon: Smartphone, key: 'raast' },
  { id: 'jazzcash' as PaymentMethod, icon: Smartphone, key: 'jazzcash' },
  { id: 'easypaisa' as PaymentMethod, icon: Smartphone, key: 'easypaisa' }
];

export default function PaymentForm({ language, onSubmit }: PaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>('raast');
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [identifierError, setIdentifierError] = useState('');
  const [nameError, setNameError] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';
  const paymentMethods = getPaymentMethods(language);

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) {
      return language === 'ur' ? 'فون نمبر درج کریں' : 'Phone number is required';
    }

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 0) {
      return language === 'ur'
        ? 'صرف نمبر استعمال کریں (0-9)'
        : 'Please enter numbers only (0-9)';
    }

    if (phone.trim().length !== cleaned.length && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return language === 'ur'
        ? 'غلط حروف - صرف نمبر استعمال کریں'
        : 'Invalid characters - use numbers only';
    }

    if (cleaned.length < 11) {
      return language === 'ur'
        ? `پاکستانی موبائل نمبر 11 ہندسے کا ہونا چاہیے (آپ نے ${cleaned.length} درج کیے)`
        : `Pakistani mobile numbers must be 11 digits (you entered ${cleaned.length})`;
    }

    if (cleaned.length > 15) {
      return language === 'ur'
        ? `زیادہ سے زیادہ 15 نمبر (آپ نے ${cleaned.length} درج کیے)`
        : `Maximum 15 digits allowed (you entered ${cleaned.length})`;
    }

    if (!cleaned.startsWith('0')) {
      return language === 'ur'
        ? 'پاکستانی نمبر 0 سے شروع ہونا چاہیے (مثال: 03001234567)'
        : 'Pakistani numbers must start with 0 (e.g., 03001234567)';
    }

    if (cleaned.length === 11 && !cleaned.startsWith('03')) {
      return language === 'ur'
        ? 'موبائل نمبر 03 سے شروع ہونا چاہیے (مثال: 03001234567)'
        : 'Mobile numbers must start with 03 (e.g., 03001234567)';
    }

    const validMobilePrefixes = ['0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309',
                                  '0310', '0311', '0312', '0313', '0314', '0315', '0316', '0317', '0318', '0320',
                                  '0321', '0322', '0323', '0324', '0325', '0330', '0331', '0332', '0333', '0334',
                                  '0335', '0336', '0337', '0340', '0341', '0342', '0343', '0344', '0345', '0346',
                                  '0347', '0348', '0349'];

    if (cleaned.length === 11) {
      const prefix = cleaned.substring(0, 4);
      if (!validMobilePrefixes.includes(prefix)) {
        return language === 'ur'
          ? `غلط موبائل کوڈ - برائے مہربانی درست پاکستانی نمبر استعمال کریں`
          : `Invalid mobile code - please use a valid Pakistani mobile number`;
      }
    }

    return '';
  };

  const validateName = (orgName: string): string => {
    if (!orgName.trim()) {
      return language === 'ur' ? 'نام درج کریں' : 'Organization name is required';
    }
    if (orgName.trim().length < 3) {
      return language === 'ur' ? 'نام بہت چھوٹا ہے' : 'Name is too short (minimum 3 characters)';
    }
    if (orgName.trim().length > 100) {
      return language === 'ur' ? 'نام بہت لمبا ہے' : 'Name is too long (maximum 100 characters)';
    }
    return '';
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (identifierTouched) {
      setIdentifierError(validatePhone(value));
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameTouched) {
      setNameError(validateName(value));
    }
  };

  const handleIdentifierBlur = () => {
    setIdentifierTouched(true);
    setIdentifierError(validatePhone(identifier));
  };

  const handleNameBlur = () => {
    setNameTouched(true);
    setNameError(validateName(name));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setIdentifierTouched(true);
    setNameTouched(true);

    const phoneError = validatePhone(identifier);
    const orgNameError = validateName(name);

    setIdentifierError(phoneError);
    setNameError(orgNameError);

    if (phoneError || orgNameError) {
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
          <label htmlFor="payment-identifier" className="block text-xl font-bold text-gray-900 mb-2">
            {t('step2Mobile')}
          </label>
          <p className="text-base text-gray-600 mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            {language === 'ur' ? 'مثال: 0300-1234567' : 'Example: 0300-1234567'}
          </p>
          <div className="relative">
            <input
              id="payment-identifier"
              type="tel"
              value={identifier}
              onChange={(e) => handleIdentifierChange(e.target.value)}
              onBlur={handleIdentifierBlur}
              required
              aria-required="true"
              aria-invalid={identifierError ? 'true' : 'false'}
              aria-describedby={identifierError ? 'identifier-error identifier-helper' : 'identifier-helper'}
              placeholder="03001234567"
              className={`w-full px-5 py-4 pr-14 text-xl border-3 rounded-xl focus:outline-none focus:ring-4 transition-colors ${
                identifierTouched && !identifierError && identifier
                  ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                  : identifierError
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-green-700 focus:ring-green-200'
              }`}
              dir="ltr"
            />
            {identifierTouched && identifier && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {identifierError ? (
                  <XCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
          {identifierError && (
            <div id="identifier-error" className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2" role="alert">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-red-700 text-base font-medium">{identifierError}</p>
            </div>
          )}
          {identifierTouched && !identifierError && identifier && (
            <div id="identifier-helper" className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-green-700 text-base font-medium">
                {language === 'ur' ? 'درست نمبر!' : 'Correct number!'}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <label htmlFor="organization-name" className="block text-xl font-bold text-gray-900 mb-3">
            {t('step3Masjid')}
          </label>
          <div className="relative">
            <input
              id="organization-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              required
              aria-required="true"
              aria-invalid={nameError ? 'true' : 'false'}
              aria-describedby={nameError ? 'name-error' : undefined}
              placeholder={t('masjidNamePlaceholder')}
              className={`w-full px-5 py-4 pr-14 text-xl border-3 rounded-xl focus:outline-none focus:ring-4 transition-colors ${
                nameTouched && !nameError && name
                  ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                  : nameError
                  ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                  : 'border-gray-300 focus:border-green-700 focus:ring-green-200'
              } ${isRTL ? 'text-right' : 'text-left'}`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            {nameTouched && name && (
              <div className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2`}>
                {nameError ? (
                  <XCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
                )}
              </div>
            )}
          </div>
          {nameError && (
            <div id="name-error" className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2" role="alert">
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-red-700 text-base font-medium">{nameError}</p>
            </div>
          )}
          {nameTouched && !nameError && name && (
            <div className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-green-700 text-base font-medium">
                {language === 'ur' ? 'درست نام!' : 'Correct name!'}
              </p>
            </div>
          )}
        </div>

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