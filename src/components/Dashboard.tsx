import { useState, useEffect } from 'react';
import { supabase, Organization, Donation, Expense } from '../lib/supabase';
import { Plus, Download, Receipt, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface DashboardProps {
  organization: Organization;
  onBack: () => void;
}

export default function Dashboard({ organization, onBack }: DashboardProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'donations' | 'expenses'>('donations');

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

      if (donationsRes.error) throw donationsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setDonations(donationsRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('donations').insert({
        organization_id: organization.id,
        amount: parseFloat(donationForm.amount),
        donor_name: donationForm.donor_name || 'Anonymous',
        notes: donationForm.notes,
        date: donationForm.date,
        manual_entry: true,
        status: 'completed',
        currency: 'PKR',
      });

      if (error) throw error;

      setShowDonationForm(false);
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
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('expenses').insert({
        organization_id: organization.id,
        amount: parseFloat(expenseForm.amount),
        purpose: expenseForm.purpose,
        notes: expenseForm.notes,
        date: expenseForm.date,
        currency: 'PKR',
      });

      if (error) throw error;

      setShowExpenseForm(false);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Organizations
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-gray-600">{organization.contact_phone}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">Total Donations</span>
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">Rs. {totalDonations.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-100">Total Expenses</span>
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">Rs. {totalExpenses.toLocaleString()}</p>
          </div>

          <div className={`bg-gradient-to-br rounded-lg shadow-lg p-6 text-white ${
            balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-orange-500 to-orange-600'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="opacity-90">Balance</span>
              <Wallet className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold">Rs. {balance.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('donations')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'donations'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Donations ({donations.length})
              </button>
              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'expenses'
                    ? 'bg-red-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Expenses ({expenses.length})
              </button>
            </div>
            <button
              onClick={exportReport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export Report
            </button>
          </div>

          {activeTab === 'donations' && (
            <div>
              {!showDonationForm && (
                <button
                  onClick={() => setShowDonationForm(true)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Log Donation
                </button>
              )}

              {showDonationForm && (
                <form onSubmit={handleAddDonation} className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-lg mb-4">Log New Donation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Donor Name (optional)
                      </label>
                      <input
                        type="text"
                        value={donationForm.donor_name}
                        onChange={(e) => setDonationForm({ ...donationForm, donor_name: e.target.value })}
                        placeholder="Anonymous"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={donationForm.date}
                        onChange={(e) => setDonationForm({ ...donationForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={donationForm.notes}
                        onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800"
                    >
                      Add Donation
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDonationForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {donations.map((donation) => (
                  <div key={donation.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.donor_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-600">{donation.date}</p>
                      {donation.notes && (
                        <p className="text-sm text-gray-500 mt-1">{donation.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-700">
                        Rs. {parseFloat(donation.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {donations.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No donations logged yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              {!showExpenseForm && (
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="mb-4 flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Log Expense
                </button>
              )}

              {showExpenseForm && (
                <form onSubmit={handleAddExpense} className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-lg mb-4">Log New Expense</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (PKR) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose *
                      </label>
                      <input
                        type="text"
                        required
                        value={expenseForm.purpose}
                        onChange={(e) => setExpenseForm({ ...expenseForm, purpose: e.target.value })}
                        placeholder="e.g., Electricity Bill"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
                    >
                      Add Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExpenseForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{expense.purpose}</p>
                      <p className="text-sm text-gray-600">{expense.date}</p>
                      {expense.notes && (
                        <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-700">
                        Rs. {parseFloat(expense.amount.toString()).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No expenses logged yet</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
