import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Organization } from '../lib/supabase';
import { LogOut, Plus, Eye } from 'lucide-react';
import Dashboard from './Dashboard';

export default function NewAdminPanel() {
  const { user, signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    raast_phone_number: '',
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);

      if (data && data.length === 1) {
        setSelectedOrg(data[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const orgData = {
        name: formData.name,
        contact_phone: formData.contact_phone,
        raast_phone_number: formData.raast_phone_number,
        user_id: user?.id,
      };

      const { error } = await supabase.from('organizations').insert(orgData);

      if (error) throw error;

      setShowForm(false);
      setFormData({
        name: '',
        contact_phone: '',
        raast_phone_number: '',
      });
      loadOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Error saving organization. Please check your inputs.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (selectedOrg) {
    return <Dashboard organization={selectedOrg} onBack={() => setSelectedOrg(null)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mosque Management</h1>
            <p className="text-gray-600 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-3 min-h-[50px] bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 px-6 py-3 min-h-[50px] bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Mosque
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">New Mosque</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mosque Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Masjid Al-Noor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="03001234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RAAST Phone Number (for QR code)
                </label>
                <input
                  type="tel"
                  value={formData.raast_phone_number}
                  onChange={(e) => setFormData({ ...formData, raast_phone_number: e.target.value })}
                  className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="03001234567"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phone number for receiving RAAST donations
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 min-h-[50px] bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
                >
                  Create Mosque
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      name: '',
                      contact_phone: '',
                      raast_phone_number: '',
                    });
                  }}
                  className="px-6 py-3 min-h-[50px] bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {organizations.map((org) => (
            <div key={org.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{org.name}</h3>
                  <p className="text-gray-600 mt-1">{org.contact_phone}</p>
                  {org.raast_phone_number && (
                    <p className="text-sm text-gray-500 mt-1">
                      RAAST: {org.raast_phone_number}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedOrg(org)}
                  className="flex items-center gap-2 px-4 py-3 min-h-[50px] bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Dashboard
                </button>
              </div>
            </div>
          ))}
        </div>

        {organizations.length === 0 && !showForm && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No mosques registered yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 min-h-[50px] bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Mosque
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
