import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Organization } from '../lib/supabase';
import { LogOut, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import Dashboard from './Dashboard';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

export default function NewAdminPanel() {
  const { user, signOut } = useAuth();
  const { toasts, showToast, hideToast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    raast_phone_number: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    contact_phone: false,
    raast_phone_number: false,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const validateName = (name: string): string => {
    if (!name.trim()) return 'Mosque name is required';
    if (name.trim().length < 3) return 'Mosque name must be at least 3 characters';
    return '';
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 11) return 'Phone number must be at least 11 digits';
    if (cleaned.length > 11) return 'Phone number must be 11 digits';
    if (!cleaned.startsWith('03')) return 'Phone number must start with 03';
    return '';
  };

  const validateRaastPhone = (phone: string): string => {
    if (!phone.trim()) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 11) return 'Phone number must be at least 11 digits';
    if (cleaned.length > 11) return 'Phone number must be 11 digits';
    if (!cleaned.startsWith('03')) return 'Phone number must start with 03';
    return '';
  };

  const nameError = touched.name ? validateName(formData.name) : '';
  const contactPhoneError = touched.contact_phone ? validatePhone(formData.contact_phone) : '';
  const raastPhoneError = touched.raast_phone_number ? validateRaastPhone(formData.raast_phone_number) : '';

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

    setTouched({
      name: true,
      contact_phone: true,
      raast_phone_number: true,
    });

    const nameValidation = validateName(formData.name);
    const contactPhoneValidation = validatePhone(formData.contact_phone);
    const raastPhoneValidation = validateRaastPhone(formData.raast_phone_number);

    if (nameValidation || contactPhoneValidation || raastPhoneValidation) {
      showToast('Please fix the errors before submitting', 'error');
      return;
    }

    try {
      const orgData = {
        name: formData.name,
        contact_phone: formData.contact_phone,
        raast_phone_number: formData.raast_phone_number || null,
        user_id: user?.id,
      };

      const { error } = await supabase.from('organizations').insert(orgData);

      if (error) throw error;

      showToast('Mosque created successfully!', 'success');
      setShowForm(false);
      setFormData({
        name: '',
        contact_phone: '',
        raast_phone_number: '',
      });
      setTouched({
        name: false,
        contact_phone: false,
        raast_phone_number: false,
      });
      loadOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      showToast('Error saving organization. Please try again.', 'error');
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
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}
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
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">New Mosque</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mosque Name */}
              <div>
                <label htmlFor="mosque-name" className="block text-xl font-bold text-gray-900 mb-3">
                  Mosque Name *
                </label>
                <input
                  id="mosque-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full px-5 py-4 min-h-[56px] text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                    nameError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : touched.name && formData.name
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                  }`}
                  placeholder="Masjid Al-Noor"
                  aria-describedby={nameError ? 'name-error' : touched.name && formData.name ? 'name-success' : undefined}
                  aria-invalid={!!nameError}
                />
                {nameError && (
                  <div id="name-error" className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2" role="alert">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 text-base font-medium">{nameError}</p>
                  </div>
                )}
                {touched.name && !nameError && formData.name && (
                  <div id="name-success" className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-green-700 text-base font-medium">Looks good!</p>
                  </div>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label htmlFor="contact-phone" className="block text-xl font-bold text-gray-900 mb-3">
                  Contact Phone *
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  onBlur={() => setTouched({ ...touched, contact_phone: true })}
                  className={`w-full px-5 py-4 min-h-[56px] text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                    contactPhoneError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : touched.contact_phone && formData.contact_phone
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                  }`}
                  placeholder="03001234567"
                  aria-describedby={contactPhoneError ? 'contact-error' : touched.contact_phone && formData.contact_phone ? 'contact-success' : 'contact-help'}
                  aria-invalid={!!contactPhoneError}
                />
                <p id="contact-help" className="text-sm text-gray-600 mt-2">
                  Your main contact number for mosque administration
                </p>
                {contactPhoneError && (
                  <div id="contact-error" className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2" role="alert">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 text-base font-medium">{contactPhoneError}</p>
                  </div>
                )}
                {touched.contact_phone && !contactPhoneError && formData.contact_phone && (
                  <div id="contact-success" className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-green-700 text-base font-medium">Looks good!</p>
                  </div>
                )}
              </div>

              {/* RAAST Phone Number */}
              <div>
                <label htmlFor="raast-phone" className="block text-xl font-bold text-gray-900 mb-3">
                  RAAST Phone Number (Optional)
                </label>
                <input
                  id="raast-phone"
                  type="tel"
                  value={formData.raast_phone_number}
                  onChange={(e) => setFormData({ ...formData, raast_phone_number: e.target.value })}
                  onBlur={() => setTouched({ ...touched, raast_phone_number: true })}
                  className={`w-full px-5 py-4 min-h-[56px] text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                    raastPhoneError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50'
                      : touched.raast_phone_number && formData.raast_phone_number
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-200 bg-green-50'
                      : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                  }`}
                  placeholder="03001234567"
                  aria-describedby={raastPhoneError ? 'raast-error' : touched.raast_phone_number && formData.raast_phone_number ? 'raast-success' : 'raast-help'}
                  aria-invalid={!!raastPhoneError}
                />
                <p id="raast-help" className="text-sm text-gray-600 mt-2">
                  Phone number for receiving RAAST donations via QR code
                </p>
                {raastPhoneError && (
                  <div id="raast-error" className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-start gap-2" role="alert">
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-red-700 text-base font-medium">{raastPhoneError}</p>
                  </div>
                )}
                {touched.raast_phone_number && !raastPhoneError && formData.raast_phone_number && (
                  <div id="raast-success" className="mt-3 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-green-700 text-base font-medium">Looks good!</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-8 py-4 min-h-[56px] bg-green-700 text-white rounded-xl text-lg hover:bg-green-800 transition-colors font-bold shadow-md"
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
                    setTouched({
                      name: false,
                      contact_phone: false,
                      raast_phone_number: false,
                    });
                  }}
                  className="px-8 py-4 min-h-[56px] bg-gray-200 text-gray-800 rounded-xl text-lg hover:bg-gray-300 transition-colors font-bold"
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
