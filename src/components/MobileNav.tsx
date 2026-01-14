import React, { useState, useEffect } from 'react';
import { Menu, X, UserCircle, History } from 'lucide-react';

interface MobileNavProps {
  onAccountClick: () => void;
  onHistoryClick: () => void;
}

export default function MobileNav({ onAccountClick, onHistoryClick }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAccountClick = () => {
    setIsOpen(false);
    onAccountClick();
  };

  const handleHistoryClick = () => {
    setIsOpen(false);
    onHistoryClick();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-green-900">QR Pay</h2>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 top-[57px]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-[57px] right-0 w-64 bg-white shadow-xl z-50 border-l border-gray-200 max-h-[calc(100vh-57px)] overflow-y-auto">
            <div className="p-2">
              <button
                onClick={handleAccountClick}
                className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] text-left text-base font-semibold text-gray-900 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                <UserCircle size={24} className="text-green-700" aria-hidden="true" />
                <span>My Account</span>
              </button>
              <button
                onClick={handleHistoryClick}
                className="w-full flex items-center gap-3 px-4 py-4 min-h-[56px] text-left text-base font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
              >
                <History size={24} className="text-gray-600" aria-hidden="true" />
                <span>View QR History</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
