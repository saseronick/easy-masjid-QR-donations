import { supabase } from '../lib/supabase';
import type { Organization } from '../lib/supabase';

export interface PaymentRequest {
  organizationId: string;
  amount: number;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  paymentMethod: 'jazzcash' | 'easypaisa';
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
}

export class PaymentService {
  private async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to fetch organization:', error);
      return null;
    }

    return data as Organization;
  }

  async createDonation(request: PaymentRequest): Promise<string | null> {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        organization_id: request.organizationId,
        amount: request.amount,
        donor_name: request.donorName,
        donor_phone: request.donorPhone,
        donor_email: request.donorEmail,
        payment_method: request.paymentMethod,
        status: 'pending',
        currency: 'PKR',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create donation:', error);
      return null;
    }

    return data.id;
  }

  async initiateJazzCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const organization = await this.getOrganization(request.organizationId);
      if (!organization || !organization.jazzcash_merchant_id) {
        return { success: false, error: 'JazzCash not configured for this organization' };
      }

      const donationId = await this.createDonation(request);
      if (!donationId) {
        return { success: false, error: 'Failed to create donation record' };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jazzcash-payment`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          donationId,
          organizationId: request.organizationId,
          amount: request.amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
        };
      } else {
        return { success: false, error: result.error || 'Payment initiation failed' };
      }
    } catch (error) {
      console.error('JazzCash payment error:', error);
      return { success: false, error: 'Payment service unavailable' };
    }
  }

  async initiateEasyPaisaPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const organization = await this.getOrganization(request.organizationId);
      if (!organization || !organization.easypaisa_store_id) {
        return { success: false, error: 'EasyPaisa not configured for this organization' };
      }

      const donationId = await this.createDonation(request);
      if (!donationId) {
        return { success: false, error: 'Failed to create donation record' };
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/easypaisa-payment`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          donationId,
          organizationId: request.organizationId,
          amount: request.amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          paymentUrl: result.paymentUrl,
          qrCode: result.qrCode,
        };
      } else {
        return { success: false, error: result.error || 'Payment initiation failed' };
      }
    } catch (error) {
      console.error('EasyPaisa payment error:', error);
      return { success: false, error: 'Payment service unavailable' };
    }
  }

  async checkPaymentStatus(donationId: string): Promise<{
    status: string;
    transactionId?: string;
  } | null> {
    const { data, error } = await supabase
      .from('donations')
      .select('status, transaction_id')
      .eq('id', donationId)
      .maybeSingle();

    if (error || !data) {
      console.error('Failed to check payment status:', error);
      return null;
    }

    return {
      status: data.status,
      transactionId: data.transaction_id,
    };
  }
}

export const paymentService = new PaymentService();
