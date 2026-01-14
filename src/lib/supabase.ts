import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Organization {
  id: string;
  name: string;
  name_urdu?: string;
  location?: string;
  contact_phone: string;
  contact_email?: string;
  jazzcash_merchant_id?: string;
  jazzcash_merchant_password?: string;
  easypaisa_store_id?: string;
  easypaisa_merchant_hash?: string;
  enabled_payment_methods: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  donor_name?: string;
  donor_phone?: string;
  donor_email?: string;
  payment_method?: 'jazzcash' | 'easypaisa' | 'raast' | 'manual';
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_response?: Record<string, unknown>;
  manual_entry?: boolean;
  notes?: string;
  date: string;
  created_at: string;
  completed_at?: string;
}

export interface Expense {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  purpose: string;
  notes?: string;
  date: string;
  created_at: string;
  updated_at: string;
}
