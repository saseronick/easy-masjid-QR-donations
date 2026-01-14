import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

export function AccessibilityReport() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-8">
        <div className="no-print mb-8">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Download as PDF (Print)
          </button>
        </div>

        <div className="print-content">
          <header className="mb-12 border-b-2 border-gray-200 pb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Accessibility Audit Report
            </h1>
            <p className="text-xl text-gray-600">
              Pakistan Donation Platform - Raast P2P Integration
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Audit Date: January 14, 2026
            </p>
          </header>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">6</div>
                  <div className="text-sm text-gray-600">Critical Issues</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">4</div>
                  <div className="text-sm text-gray-600">High Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-gray-600">Medium Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">2</div>
                  <div className="text-sm text-gray-600">Low Priority</div>
                </div>
              </div>
              <p className="text-gray-700">
                This audit evaluates the donation platform against WCAG 2.1 Level AA standards and mobile
                accessibility best practices for the Pakistani market. The platform shows strong foundational
                elements but requires critical improvements in offline support, touch targets, and form validation.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <XCircle className="text-red-600 mr-2" />
              Critical Issues
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C1. No Offline Support (CRITICAL)
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Users in areas with poor connectivity cannot access the platform at all.
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> Mobile accessibility best practices for emerging markets
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Implement Progressive Web App with service worker for offline access
                </p>
              </div>

              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C2. Touch Targets Too Small
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Difficult to tap buttons accurately on mobile devices
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> WCAG 2.1 Success Criterion 2.5.5 (Level AAA, recommended for mobile)
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Increase all interactive elements to minimum 44x44px
                </p>
              </div>

              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C3. Dashboard Information Overload
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Overwhelming for first-time users, difficult to understand key actions
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> WCAG 2.1 SC 3.2.4 (Consistent Identification)
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Simplify interface with clear visual hierarchy and progressive disclosure
                </p>
              </div>

              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C4. No Form Validation Feedback
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Users submit invalid data and receive generic errors
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> WCAG 2.1 SC 3.3.1, 3.3.3 (Error Identification & Suggestions)
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Add inline validation with clear error messages
                </p>
              </div>

              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C5. Language Selector Not Keyboard Accessible
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Keyboard users cannot change language
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> WCAG 2.1 SC 2.1.1 (Keyboard Accessible)
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Add keyboard navigation and proper ARIA attributes
                </p>
              </div>

              <div className="border-l-4 border-red-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  C6. No Loading States
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Impact:</strong> Users uncertain if actions are processing
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Standard:</strong> WCAG 2.1 SC 2.2.1 (Timing Adjustable) & 4.1.3 (Status Messages)
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Add loading indicators with ARIA live regions
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="text-yellow-600 mr-2" />
              High Priority Issues
            </h2>

            <div className="space-y-6">
              <div className="border-l-4 border-yellow-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  H1. QR Code Not Accessible to Screen Readers
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Provide text alternative with payment details
                </p>
              </div>

              <div className="border-l-4 border-yellow-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  H2. Missing Focus Indicators
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Add visible focus styles (2px outline, high contrast)
                </p>
              </div>

              <div className="border-l-4 border-yellow-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  H3. Payment Method Selection Not Announced
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Add ARIA live region for status announcements
                </p>
              </div>

              <div className="border-l-4 border-yellow-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  H4. Error Messages Lack Specificity
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Solution:</strong> Provide actionable error messages in both languages
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Info className="text-blue-600 mr-2" />
              Medium & Low Priority Issues
            </h2>

            <div className="space-y-4">
              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  M1. Color Contrast on Emerald Buttons
                </h3>
                <p className="text-gray-700">Current: 4.3:1 | Required: 4.5:1 | Solution: Use emerald-700</p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  M2. Admin Panel Lacks Keyboard Shortcuts
                </h3>
                <p className="text-gray-700">Solution: Add keyboard navigation for power users</p>
              </div>

              <div className="border-l-4 border-blue-600 pl-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  M3. No Skip Navigation Link
                </h3>
                <p className="text-gray-700">Solution: Add skip to main content link</p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle2 className="text-emerald-600 mr-2" />
              Strengths
            </h2>

            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Clean, simple UI with good visual hierarchy</li>
              <li>Bilingual support (English/Urdu) built-in</li>
              <li>Semantic HTML structure</li>
              <li>Responsive design for mobile devices</li>
              <li>Context-based authentication flow</li>
              <li>Clear organization names and purposes</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Implementation Roadmap</h2>

            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <h3 className="font-semibold text-emerald-900 mb-2">Phase 1: Quick Wins (1-2 days)</h3>
                <ul className="list-disc list-inside text-emerald-800 space-y-1">
                  <li>C2: Touch target sizes</li>
                  <li>C5: Language selector accessibility</li>
                  <li>H2: Focus indicators</li>
                  <li>M1: Color contrast</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Phase 2: User Experience (2-3 days)</h3>
                <ul className="list-disc list-inside text-blue-800 space-y-1">
                  <li>C3: Dashboard simplification</li>
                  <li>C4: Form validation</li>
                  <li>C6: Loading states</li>
                  <li>H1: QR code accessibility</li>
                  <li>H3: Payment selection announcements</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">Phase 3: Critical Infrastructure (3-4 days)</h3>
                <ul className="list-disc list-inside text-purple-800 space-y-1">
                  <li>C1: Offline support with service worker</li>
                  <li>Data caching strategy</li>
                  <li>Background sync for donations</li>
                </ul>
              </div>
            </div>
          </section>

          <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-sm text-gray-600">
            <p>
              This audit follows WCAG 2.1 Level AA guidelines and mobile accessibility best practices.
              Priority classifications are based on user impact, especially for users in low-connectivity
              areas with varying levels of technical literacy.
            </p>
          </footer>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-content {
            font-size: 11pt;
          }

          h1 {
            font-size: 24pt;
          }

          h2 {
            font-size: 18pt;
            page-break-after: avoid;
          }

          h3 {
            font-size: 14pt;
            page-break-after: avoid;
          }

          section {
            page-break-inside: avoid;
          }

          @page {
            margin: 1in;
          }
        }
      `}</style>
    </div>
  );
}
