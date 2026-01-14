import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { db, DBPaymentInfo } from '../utils/db';
import { Language } from '../types';
import { translations } from '../data/translations';

interface QRHistoryProps {
  language: Language;
  onClose: () => void;
}

export default function QRHistory({ language, onClose }: QRHistoryProps) {
  const [qrCodes, setQrCodes] = useState<DBPaymentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const t = (key: string) => translations[key]?.[language] || translations[key]?.en || key;

  useEffect(() => {
    loadQRHistory();
  }, []);

  const loadQRHistory = async () => {
    try {
      const history = await db.getAllPaymentInfo();
      setQrCodes(history);
    } catch (error) {
      console.error('Failed to load QR history:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (qrCode: DBPaymentInfo) => {
    const link = document.createElement('a');
    link.download = `${qrCode.organizationName}-QR-${new Date(qrCode.created_at).toLocaleDateString()}.png`;
    link.href = qrCode.qrCodeData;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Previously Generated QR Codes</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No QR codes generated yet</p>
              <p className="text-gray-400 mt-2">Generate your first QR code to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    <img
                      src={qr.qrCodeData}
                      alt={`QR Code for ${qr.organizationName}`}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 truncate" title={qr.organizationName}>
                      {qr.organizationName}
                    </h3>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-medium text-gray-900 capitalize">{qr.paymentMethod}</span>
                    </div>

                    {qr.phoneNumber && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium text-gray-900">{qr.phoneNumber}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Generated:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(qr.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadQR(qr)}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download QR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-600 text-center">
            All QR codes are stored locally on your device and available offline
          </p>
        </div>
      </div>
    </div>
  );
}
