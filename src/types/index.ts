export type Language = 'en' | 'ur' | 'hi' | 'ar' | 'pa' | 'ps' | 'sd';

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'sadapay' | 'raast' | 'bank' | 'custom';

export interface PaymentInfo {
  method: PaymentMethod;
  identifier: string;
  name: string;
  amount?: string;
  bankDetails?: {
    accountTitle: string;
    accountNumber: string;
    bankName: string;
    branchCode?: string;
    iban?: string;
    qrCodeUrl?: string;
  };
}

export interface Translations {
  [key: string]: {
    en: string;
    ur: string;
    hi: string;
    ar: string;
  };
}