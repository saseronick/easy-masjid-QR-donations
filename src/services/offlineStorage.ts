import { db, DBDonation, DBExpense } from '../utils/db';
import { supabase, Donation, Expense } from '../lib/supabase';

export interface OfflineOperation {
  id?: number;
  type: 'donation' | 'expense';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineStorageService {
  async saveDonationOffline(donation: Partial<Donation>, organizationId: string): Promise<string> {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dbDonation: DBDonation = {
      id,
      organization_id: organizationId,
      amount: donation.amount || 0,
      donor_name: donation.donor_name,
      donor_phone: donation.donor_phone,
      donor_email: donation.donor_email,
      payment_method: donation.payment_method,
      status: donation.status || 'pending',
      currency: donation.currency || 'PKR',
      date: donation.date || new Date().toISOString().split('T')[0],
      notes: donation.notes,
      manual_entry: donation.manual_entry ?? true,
      synced: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.addDonation(dbDonation);
    return id;
  }

  async saveExpenseOffline(expense: Partial<Expense>, organizationId: string): Promise<string> {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dbExpense: DBExpense = {
      id,
      organization_id: organizationId,
      amount: expense.amount || 0,
      purpose: expense.purpose || '',
      notes: expense.notes,
      currency: expense.currency || 'PKR',
      date: expense.date || new Date().toISOString().split('T')[0],
      synced: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.addExpense(dbExpense);
    return id;
  }

  async getDonationsForOrganization(organizationId: string): Promise<DBDonation[]> {
    return db.getDonationsByOrganization(organizationId);
  }

  async getExpensesForOrganization(organizationId: string): Promise<DBExpense[]> {
    return db.getExpensesByOrganization(organizationId);
  }

  async syncDonationsToSupabase(): Promise<{ success: number; failed: number }> {
    const unsyncedDonations = await db.getUnsyncedDonations();
    let success = 0;
    let failed = 0;

    for (const donation of unsyncedDonations) {
      try {
        const { error } = await supabase.from('donations').insert({
          organization_id: donation.organization_id,
          amount: donation.amount,
          donor_name: donation.donor_name,
          donor_phone: donation.donor_phone,
          donor_email: donation.donor_email,
          payment_method: donation.payment_method,
          status: donation.status,
          currency: donation.currency,
          date: donation.date,
          notes: donation.notes,
          manual_entry: donation.manual_entry,
        });

        if (error) {
          console.error('Failed to sync donation:', error);
          failed++;
        } else {
          await db.markDonationAsSynced(donation.id);
          success++;
        }
      } catch (err) {
        console.error('Error syncing donation:', err);
        failed++;
      }
    }

    return { success, failed };
  }

  async syncExpensesToSupabase(): Promise<{ success: number; failed: number }> {
    const unsyncedExpenses = await db.getUnsyncedExpenses();
    let success = 0;
    let failed = 0;

    for (const expense of unsyncedExpenses) {
      try {
        const { error } = await supabase.from('expenses').insert({
          organization_id: expense.organization_id,
          amount: expense.amount,
          purpose: expense.purpose,
          notes: expense.notes,
          currency: expense.currency,
          date: expense.date,
        });

        if (error) {
          console.error('Failed to sync expense:', error);
          failed++;
        } else {
          await db.markExpenseAsSynced(expense.id);
          success++;
        }
      } catch (err) {
        console.error('Error syncing expense:', err);
        failed++;
      }
    }

    return { success, failed };
  }

  async syncAll(): Promise<{ donations: { success: number; failed: number }; expenses: { success: number; failed: number } }> {
    const donations = await this.syncDonationsToSupabase();
    const expenses = await this.syncExpensesToSupabase();
    return { donations, expenses };
  }

  async getUnsyncedCount(): Promise<number> {
    const [donations, expenses] = await Promise.all([
      db.getUnsyncedDonations(),
      db.getUnsyncedExpenses(),
    ]);
    return donations.length + expenses.length;
  }

  async cacheSupabaseData(organizationId: string): Promise<void> {
    try {
      const [donationsRes, expensesRes] = await Promise.all([
        supabase
          .from('donations')
          .select('*')
          .eq('organization_id', organizationId)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('organization_id', organizationId)
          .order('date', { ascending: false }),
      ]);

      if (donationsRes.data) {
        for (const donation of donationsRes.data) {
          const dbDonation: DBDonation = {
            ...donation,
            synced: true,
            created_at: donation.created_at || new Date().toISOString(),
            updated_at: donation.updated_at || new Date().toISOString(),
          };
          await db.addDonation(dbDonation);
        }
      }

      if (expensesRes.data) {
        for (const expense of expensesRes.data) {
          const dbExpense: DBExpense = {
            ...expense,
            synced: true,
            created_at: expense.created_at || new Date().toISOString(),
            updated_at: expense.updated_at || new Date().toISOString(),
          };
          await db.addExpense(dbExpense);
        }
      }
    } catch (error) {
      console.error('Failed to cache Supabase data:', error);
    }
  }
}

export const offlineStorage = new OfflineStorageService();
