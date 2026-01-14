import { useState, useEffect } from 'react';
import { supabase, Organization, Donation, Expense } from '../lib/supabase';
import { Plus, Download, X, TrendingUp, TrendingDown, Wallet, Receipt, ArrowLeft } from 'lucide-react';
import { DashboardSkeleton } from './LoadingSkeleton';
import { offlineStorage } from '../services/offlineStorage';
import { syncQueue } from '../services/syncQueue';
import { DBDonation, DBExpense } from '../utils/db';

interface DashboardProps {
  organization: Organization;
  onBack: () => void;
}

export default function Dashboard({ organization, onBack }: DashboardProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'donations' | 'expenses'>('overview');

  const [donationForm, setDonationForm] = useState({
    amount: '',
    donor_name: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    purpose: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, [organization.id]);

  const loadData = async () => {
    try {
      const offlineDonations = await offlineStorage.getDonationsForOrganization(organization.id);
      const offlineExpenses = await offlineStorage.getExpensesForOrganization(organization.id);

      setDonations(offlineDonations as any);
      setExpenses(offlineExpenses as any);
      setLoading(false);

      if (navigator.onLine) {
        try {
          const [donationsRes, expensesRes] = await Promise.all([
            supabase
              .from('donations')
              .select('*')
              .eq('organization_id', organization.id)
              .order('date', { ascending: false }),
            supabase
              .from('expenses')
              .select('*')
              .eq('organization_id', organization.id)
              .order('date', { ascending: false }),
          ]);

          if (!donationsRes.error && !expensesRes.error) {
            setDonations(donationsRes.data || []);
            setExpenses(expensesRes.data || []);

            await offlineStorage.cacheSupabaseData(organization.id);
          }
        } catch (error) {
          console.log('Using offline data due to network error');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const donationData = {
        organization_id: organization.id,
        amount: parseFloat(donationForm.amount),
        donor_name: donationForm.donor_name || 'Anonymous',
        notes: donationForm.notes,
        date: donationForm.date,
        manual_entry: true,
        status: 'completed',
        currency: 'PKR',
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('donations').insert(donationData);
        if (error) throw error;
      } else {
        await offlineStorage.saveDonationOffline(donationData, organization.id);
        await syncQueue.updatePendingCount();
      }

      setShowDonationModal(false);
      setDonationForm({
        amount: '',
        donor_name: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Error adding donation:', error);
      alert('Error adding donation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const expenseData = {
        organization_id: organization.id,
        amount: parseFloat(expenseForm.amount),
        purpose: expenseForm.purpose,
        notes: expenseForm.notes,
        date: expenseForm.date,
        currency: 'PKR',
      };

      if (navigator.onLine) {
        const { error } = await supabase.from('expenses').insert(expenseData);
        if (error) throw error;
      } else {
        await offlineStorage.saveExpenseOffline(expenseData, organization.id);
        await syncQueue.updatePendingCount();
      }

      setShowExpenseModal(false);
      setExpenseForm({
        amount: '',
        purpose: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDonations = donations.reduce((sum, d) => sum + parseFloat(d.amount.toString()), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  const balance = totalDonations - totalExpenses;

  const exportReport = () => {
    const reportText = `
${organization.name} - Financial Report
Generated: ${new Date().toLocaleDateString()}

SUMMARY
Total Donations: Rs. ${totalDonations.toLocaleString()}
Total Expenses: Rs. ${totalExpenses.toLocaleString()}
Balance: Rs. ${balance.toLocaleString()}

DONATIONS
${donations.map(d => `${d.date} - Rs. ${parseFloat(d.amount.toString()).toLocaleString()} - ${d.donor_name || 'Anonymous'}${d.notes ? ` (${d.notes})` : ''}`).join('\n')}

EXPENSES
${expenses.map(e => `${e.date} - Rs. ${parseFloat(e.amount.toString()).toLocaleString()} - ${e.purpose}${e.notes ? ` (${e.notes})` : ''}`).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${organization.name}-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to Organizations"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const isFirstTime = donations.length === 0 && expenses.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back to Organizations"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-gray-600 mt-1">{organization.contact_phone}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 opacity-80" />
              <span className="text-emerald-50 text-sm font-medium">Total Donations</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">Rs. {totalDonations.toLocaleString()}</p>
            <p className="text-emerald-100 text-sm mt-2">{donations.length} entries</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 opacity-80" />
              <span className="text-rose-50 text-sm font-medium">Total Expenses</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">Rs. {totalExpenses.toLocaleString()}</p>
            <p className="text-rose-100 text-sm mt-2">{expenses.length} entries</p>
          </div>

          <div className={`bg-gradient-to-br rounded-xl shadow-lg p-6 text-white ${
            balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-amber-500 to-amber-600'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6 opacity-80" />
              <span className="opacity-90 text-sm font-medium">Current Balance</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold">Rs. {balance.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${balance >= 0 ? 'text-blue-100' : 'text-amber-100'}`}>
              {balance >= 0 ? 'Funds available' : 'Deficit'}
            </p>
          </div>
        </div>

        {isFirstTime && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 sm:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Welcome to Your Dashboard</h2>
            <p className="text-gray-700 mb-6">Get started by logging your first donation or expense.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md font-medium text-lg"
              >
                <Plus className="w-6 h-6" />
                Log First Donation
              </button>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md font-medium text-lg"
              >
                <Plus className="w-6 h-6" />
                Log First Expense
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-4 py-2.5 min-h-[48px] rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeView === 'overview'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('donations')}
                  className={`px-4 py-2.5 min-h-[48px] rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeView === 'donations'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Donations ({donations.length})
                </button>
                <button
                  onClick={() => setActiveView('expenses')}
                  className={`px-4 py-2.5 min-h-[48px] rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeView === 'expenses'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Expenses ({expenses.length})
                </button>
              </div>
              <button
                onClick={exportReport}
                className="flex items-center justify-center gap-2 px-4 py-2.5 min-h-[48px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeView === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowDonationModal(true)}
                    className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Log Donation
                  </button>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex items-center justify-center gap-3 px-6 py-4 min-h-[56px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Log Expense
                  </button>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {[...donations.slice(0, 3), ...expenses.slice(0, 3)]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 5)
                      .map((item) => {
                        const isDonation = 'donor_name' in item;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isDonation ? 'bg-emerald-100' : 'bg-rose-100'
                              }`}>
                                {isDonation ? (
                                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Receipt className="w-5 h-5 text-rose-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {isDonation ? (item as Donation).donor_name || 'Anonymous' : (item as Expense).purpose}
                                </p>
                                <p className="text-sm text-gray-600">{item.date}</p>
                              </div>
                            </div>
                            <p className={`text-lg font-bold ${isDonation ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {isDonation ? '+' : '-'}Rs. {parseFloat(item.amount.toString()).toLocaleString()}
                            </p>
                          </div>
                        );
                      })}
                    {donations.length === 0 && expenses.length === 0 && (
                      <p className="text-center text-gray-500 py-8">No activity yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'donations' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="flex items-center gap-2 px-6 py-3 min-h-[48px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Log Donation
                </button>

                <div className="space-y-3">
                  {donations.map((donation) => (
                    <div key={donation.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {donation.donor_name || 'Anonymous'}
                          </p>
                          {!donation.synced && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Saved Locally - Will Sync
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{donation.date}</p>
                        {donation.notes && (
                          <p className="text-sm text-gray-500 mt-1">{donation.notes}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-emerald-600">
                        Rs. {parseFloat(donation.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {donations.length === 0 && (
                    <p className="text-center text-gray-500 py-12">No donations logged yet</p>
                  )}
                </div>
              </div>
            )}

            {activeView === 'expenses' && (
              <div className="space-y-4">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-2 px-6 py-3 min-h-[48px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Log Expense
                </button>

                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{expense.purpose}</p>
                          {!expense.synced && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Saved Locally - Will Sync
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{expense.date}</p>
                        {expense.notes && (
                          <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-rose-600">
                        Rs. {parseFloat(expense.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-gray-500 py-12">No expenses logged yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDonationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Log Donation</h3>
              <button
                onClick={() => setShowDonationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddDonation} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donor Name
                  </label>
                  <input
                    type="text"
                    value={donationForm.donor_name}
                    onChange={(e) => setDonationForm({ ...donationForm, donor_name: e.target.value })}
                    placeholder="Anonymous"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={donationForm.date}
                    onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={donationForm.notes}
                    onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 min-h-[48px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Donation'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDonationModal(false)}
                  disabled={submitting}
                  className="px-6 py-3 min-h-[48px] bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Log Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseForm.purpose}
                    onChange={(e) => setExpenseForm({ ...expenseForm, purpose: e.target.value })}
                    placeholder="e.g., Electricity Bill"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 min-h-[48px] bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    'Add Expense'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  disabled={submitting}
                  className="px-6 py-3 min-h-[48px] bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
