import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Organization } from '../lib/supabase';
import { LogOut, Plus, Edit2, Eye, EyeOff } from 'lucide-react';

export default function AdminPanel() {
  const { user, signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showSecrets, setShowSecrets] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_urdu: '',
    location: '',
    contact_phone: '',
    contact_email: '',
    jazzcash_merchant_id: '',
    jazzcash_merchant_password: '',
    easypaisa_store_id: '',
    easypaisa_merchant_hash: '',
    enabled_payment_methods: ['jazzcash', 'easypaisa'],
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
        ...formData,
        enabled_payment_methods: formData.enabled_payment_methods,
        user_id: user?.id,
      };

      if (editingOrg) {
        const { error } = await supabase
          .from('organizations')
          .update(orgData)
          .eq('id', editingOrg.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert(orgData);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingOrg(null);
      resetForm();
      loadOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('Error saving organization. Please check your inputs.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_urdu: '',
      location: '',
      contact_phone: '',
      contact_email: '',
      jazzcash_merchant_id: '',
      jazzcash_merchant_password: '',
      easypaisa_store_id: '',
      easypaisa_merchant_hash: '',
      enabled_payment_methods: ['jazzcash', 'easypaisa'],
    });
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.name,
      name_urdu: org.name_urdu || '',
      location: org.location || '',
      contact_phone: org.contact_phone,
      contact_email: org.contact_email || '',
      jazzcash_merchant_id: org.jazzcash_merchant_id || '',
      jazzcash_merchant_password: org.jazzcash_merchant_password || '',
      easypaisa_store_id: org.easypaisa_store_id || '',
      easypaisa_merchant_hash: org.easypaisa_merchant_hash || '',
      enabled_payment_methods: org.enabled_payment_methods || ['jazzcash', 'easypaisa'],
    });
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-1">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Organization
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingOrg ? 'Edit Organization' : 'New Organization'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name (Urdu)
                  </label>
                  <input
                    type="text"
                    value={formData.name_urdu}
                    onChange={(e) => setFormData({ ...formData, name_urdu: e.target.value })}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location/Address
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Payment Gateway Credentials</h3>
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showSecrets ? 'Hide' : 'Show'} Secrets
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      JazzCash Merchant ID
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.jazzcash_merchant_id}
                      onChange={(e) => setFormData({ ...formData, jazzcash_merchant_id: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      JazzCash Password
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.jazzcash_merchant_password}
                      onChange={(e) => setFormData({ ...formData, jazzcash_merchant_password: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EasyPaisa Store ID
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.easypaisa_store_id}
                      onChange={(e) => setFormData({ ...formData, easypaisa_store_id: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      EasyPaisa Merchant Hash
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={formData.easypaisa_merchant_hash}
                      onChange={(e) => setFormData({ ...formData, easypaisa_merchant_hash: e.target.value })}
                      className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
                >
                  {editingOrg ? 'Update' : 'Create'} Organization
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOrg(null);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
                  {org.name_urdu && (
                    <p className="text-lg text-gray-700 mt-1">{org.name_urdu}</p>
                  )}
                  <p className="text-gray-600 mt-2">{org.location}</p>
                  <p className="text-gray-600">{org.contact_phone}</p>
                  {org.contact_email && (
                    <p className="text-gray-600">{org.contact_email}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {org.jazzcash_merchant_id && (
                      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                        JazzCash
                      </span>
                    )}
                    {org.easypaisa_store_id && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                        EasyPaisa
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(org)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {organizations.length === 0 && !showForm && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No organizations yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Your First Organization
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
