import { BookOpen, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface AccountPromptProps {
  language: Language;
  onSignUp: () => void;
  onDismiss: () => void;
}

export default function AccountPrompt({ language, onSignUp, onDismiss }: AccountPromptProps) {
  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;
  const isRTL = language === 'ar' || language === 'ur' || language === 'ps' || language === 'sd';

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-6 relative ${isRTL ? 'rtl' : 'ltr'}`}>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-3 min-h-[48px] min-w-[48px] text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-4">
        <BookOpen className="w-12 h-12 text-blue-700 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('trackDonationsTitle')}
          </h3>
          <p className="text-gray-700 mb-4 leading-relaxed">
            {t('trackDonationsDesc')}
          </p>

          <ul className="space-y-2 mb-4 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>{t('trackDonationsBenefit1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>{t('trackDonationsBenefit2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>{t('trackDonationsBenefit3')}</span>
            </li>
          </ul>

          <button
            onClick={onSignUp}
            className="w-full min-h-[56px] bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-bold hover:bg-blue-800 transition-colors shadow-md"
          >
            {t('createAccountButton')}
          </button>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {t('accountOptional')}
          </p>
        </div>
      </div>
    </div>
  );
}
