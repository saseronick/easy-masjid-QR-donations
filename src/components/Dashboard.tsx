import { useState, useEffect } from 'react';
import { supabase, Organization, Donation, Expense } from '../lib/supabase';
import { Plus, Download, X, TrendingUp, TrendingDown, Wallet, Receipt, ArrowLeft, DollarSign, ShoppingCart, CheckCircle, AlertTriangle, AlertCircle, XCircle, Building2 } from 'lucide-react';
import { DashboardSkeleton } from './LoadingSkeleton';
import { offlineStorage } from '../services/offlineStorage';
import { syncQueue } from '../services/syncQueue';
import { DBDonation, DBExpense } from '../utils/db';
import { formatCurrency } from '../utils/formatters';

interface DashboardProps {
  organization: Organization;
  onBack: () => void;
  onBackToMosques?: () => void;
}

export default function Dashboard({ organization, onBack, onBackToMosques }: DashboardProps) {
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

  const [donationAmountError, setDonationAmountError] = useState('');
  const [expenseAmountError, setExpenseAmountError] = useState('');
  const [expensePurposeError, setExpensePurposeError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successType, setSuccessType] = useState<'donation' | 'expense'>('donation');
  const [successAmount, setSuccessAmount] = useState('');

  const validateAmount = (amount: string): string => {
    if (!amount.trim()) {
      return 'Amount is required';
    }
    const num = parseFloat(amount);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }
    if (num <= 0) {
      return 'Amount must be greater than 0';
    }
    if (num > 1000000000) {
      return 'Amount is too large';
    }
    return '';
  };

  const validatePurpose = (purpose: string): string => {
    if (!purpose.trim()) {
      return 'Purpose is required';
    }
    if (purpose.trim().length < 3) {
      return 'Purpose is too short (minimum 3 characters)';
    }
    return '';
  };

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

    const amountError = validateAmount(donationForm.amount);
    setDonationAmountError(amountError);

    if (amountError) {
      return;
    }

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
      setSuccessType('donation');
      setSuccessAmount(donationForm.amount);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

      setDonationForm({
        amount: '',
        donor_name: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setDonationAmountError('');
      loadData();
    } catch (error) {
      console.error('Error adding donation:', error);
      alert('Could not save donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountError = validateAmount(expenseForm.amount);
    const purposeError = validatePurpose(expenseForm.purpose);
    setExpenseAmountError(amountError);
    setExpensePurposeError(purposeError);

    if (amountError || purposeError) {
      return;
    }

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
      setSuccessType('expense');
      setSuccessAmount(expenseForm.amount);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

      setExpenseForm({
        amount: '',
        purpose: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setExpenseAmountError('');
      setExpensePurposeError('');
      loadData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Could not save expense. Please try again.');
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
Total Donations: ${formatCurrency(totalDonations)}
Total Expenses: ${formatCurrency(totalExpenses)}
Balance: ${formatCurrency(balance)}

DONATIONS
${donations.map(d => `${d.date} - ${formatCurrency(d.amount)} - ${d.donor_name || 'Anonymous'}${d.notes ? ` (${d.notes})` : ''}`).join('\n')}

EXPENSES
${expenses.map(e => `${e.date} - ${formatCurrency(e.amount)} - ${e.purpose}${e.notes ? ` (${e.notes})` : ''}`).join('\n')}
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Back to Donation Page"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Donation Page</span>
              </button>
              {onBackToMosques && (
                <button
                  onClick={onBackToMosques}
                  className="flex items-center gap-2 text-green-700 hover:text-green-900 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-green-50 transition-colors border-2 border-green-700"
                  aria-label="Back to Mosque Management"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Mosque Management</span>
                </button>
              )}
            </div>
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
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to Donation Page"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Donation Page</span>
            </button>
            {onBackToMosques && (
              <button
                onClick={onBackToMosques}
                className="flex items-center gap-2 text-green-700 hover:text-green-900 py-2 px-3 min-h-[48px] min-w-[48px] rounded-lg hover:bg-green-50 transition-colors border-2 border-green-700"
                aria-label="Back to Mosque Management"
              >
                <Building2 className="w-5 h-5" />
                <span>Mosque Management</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-gray-600 mt-1">{organization.contact_phone}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Money Received</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{formatCurrency(totalDonations)}</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-semibold">Good</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">{donations.length} donations</p>
          </div>

          <div className="bg-rose-50 border-2 border-rose-200 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Money Spent</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{formatCurrency(totalExpenses)}</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-semibold">Tracked</p>
            </div>
            <p className="text-sm text-gray-600 mt-1">{expenses.length} expenses</p>
          </div>

          <div className={`rounded-xl shadow-md p-6 border-2 ${
            balance > totalDonations * 0.3
              ? 'bg-green-50 border-green-200'
              : balance > 0
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                balance > totalDonations * 0.3
                  ? 'bg-green-500'
                  : balance > 0
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}>
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Money Left</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-2">{formatCurrency(balance)}</p>
            <div className="flex items-center gap-2">
              {balance > totalDonations * 0.3 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-700 font-semibold">Good</p>
                </>
              ) : balance > 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-yellow-700 font-semibold">Needs Review</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-semibold">Low Balance</p>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">(Received - Spent)</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Money Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Money Received</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(totalDonations)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: '100%' }}
                >
                  <span className="text-xs font-semibold text-white">100%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Money Spent</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="bg-rose-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: totalDonations > 0 ? `${Math.min((totalExpenses / totalDonations) * 100, 100)}%` : '0%' }}
                >
                  {totalExpenses > 0 && (
                    <span className="text-xs font-semibold text-white">
                      {totalDonations > 0 ? Math.round((totalExpenses / totalDonations) * 100) : 0}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-center text-lg">
                {totalDonations > 0 ? (
                  <>
                    <span className="font-semibold text-gray-900">
                      You have used {Math.round((totalExpenses / totalDonations) * 100)}% of donations
                    </span>
                    {totalExpenses > totalDonations && (
                      <span className="block text-sm text-red-600 mt-1">
                        Spending is {Math.round(((totalExpenses - totalDonations) / totalDonations) * 100)}% over donations
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-600">No donations received yet</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {showSuccessMessage && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 mb-6 sm:mb-8 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {successType === 'donation' ? 'Donation Saved Successfully!' : 'Expense Saved Successfully!'}
                </h3>
                <p className="text-gray-700 mb-3">
                  {successType === 'donation'
                    ? `You recorded a donation of ${formatCurrency(successAmount)}`
                    : `You recorded an expense of ${formatCurrency(successAmount)}`}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSuccessMessage(false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  className={`px-6 py-4 min-h-[56px] rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeView === 'overview'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('donations')}
                  className={`px-6 py-4 min-h-[56px] rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeView === 'donations'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Donations ({donations.length})
                </button>
                <button
                  onClick={() => setActiveView('expenses')}
                  className={`px-6 py-4 min-h-[56px] rounded-lg font-medium transition-colors whitespace-nowrap ${
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
                              {isDonation ? '+' : '-'}{formatCurrency(item.amount)}
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
                        {formatCurrency(donation.amount)}
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
                        {formatCurrency(expense.amount)}
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
                className="p-3 min-h-[48px] min-w-[48px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
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
                  <p className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    Example: 1000 or 500.50
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={donationForm.amount}
                      onChange={(e) => {
                        setDonationForm({ ...donationForm, amount: e.target.value });
                        setDonationAmountError(validateAmount(e.target.value));
                      }}
                      className={`w-full px-4 py-3 pr-12 min-h-[48px] border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                        donationForm.amount && !donationAmountError
                          ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                          : donationAmountError
                          ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
                      }`}
                      placeholder="0.00"
                    />
                    {donationForm.amount && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {donationAmountError ? (
                          <XCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {donationAmountError && (
                    <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-2 flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm font-medium">{donationAmountError}</p>
                    </div>
                  )}
                  {donationForm.amount && !donationAmountError && (
                    <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg p-2 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 text-sm font-medium">Amount is valid!</p>
                    </div>
                  )}
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
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: YYYY-MM-DD (e.g., 2026-01-14)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={donationForm.notes}
                    onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold">Saving... Please wait</span>
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
                className="p-3 min-h-[48px] min-w-[48px] hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
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
                  <p className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    Example: 1000 or 500.50
                  </p>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, amount: e.target.value });
                        setExpenseAmountError(validateAmount(e.target.value));
                      }}
                      className={`w-full px-4 py-3 pr-12 min-h-[48px] border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                        expenseForm.amount && !expenseAmountError
                          ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                          : expenseAmountError
                          ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                          : 'border-gray-300 focus:border-rose-500 focus:ring-rose-200'
                      }`}
                      placeholder="0.00"
                    />
                    {expenseForm.amount && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {expenseAmountError ? (
                          <XCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {expenseAmountError && (
                    <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-2 flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm font-medium">{expenseAmountError}</p>
                    </div>
                  )}
                  {expenseForm.amount && !expenseAmountError && (
                    <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg p-2 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 text-sm font-medium">Amount is valid!</p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose *
                  </label>
                  <p className="text-sm text-gray-600 mb-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                    Example: Electricity Bill, Food, Repairs
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={expenseForm.purpose}
                      onChange={(e) => {
                        setExpenseForm({ ...expenseForm, purpose: e.target.value });
                        setExpensePurposeError(validatePurpose(e.target.value));
                      }}
                      placeholder="e.g., Electricity Bill"
                      className={`w-full px-4 py-3 pr-12 min-h-[48px] border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                        expenseForm.purpose && !expensePurposeError
                          ? 'border-green-500 focus:border-green-600 focus:ring-green-200'
                          : expensePurposeError
                          ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                          : 'border-gray-300 focus:border-rose-500 focus:ring-rose-200'
                      }`}
                    />
                    {expenseForm.purpose && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {expensePurposeError ? (
                          <XCircle className="w-6 h-6 text-red-500" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {expensePurposeError && (
                    <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-lg p-2 flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-red-700 text-sm font-medium">{expensePurposeError}</p>
                    </div>
                  )}
                  {expenseForm.purpose && !expensePurposeError && (
                    <div className="mt-2 bg-green-50 border-2 border-green-300 rounded-lg p-2 flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-green-700 text-sm font-medium">Purpose is valid!</p>
                    </div>
                  )}
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
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Format: YYYY-MM-DD (e.g., 2026-01-14)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={expenseForm.notes}
                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
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
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold">Saving... Please wait</span>
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
