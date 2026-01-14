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
    <div className={`bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300 rounded-xl p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
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

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onSignUp}
              className="flex-1 min-w-[200px] min-h-[56px] bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-bold hover:bg-blue-800 transition-colors shadow-md"
            >
              {t('createAccountButton')}
            </button>
            <button
              onClick={onDismiss}
              className="min-h-[56px] px-6 py-3 bg-gray-200 text-gray-800 rounded-lg text-lg font-bold hover:bg-gray-300 transition-colors border-2 border-gray-400 flex items-center gap-2"
              aria-label="Skip account creation"
            >
              <X className="w-5 h-5" aria-hidden="true" />
              <span>No Thanks</span>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            {t('accountOptional')}
          </p>
        </div>
      </div>
    </div>
  );
}
