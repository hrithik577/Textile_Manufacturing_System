import React, { useState } from 'react';
import { CustomerAppProvider, useCustomerApp } from './context/CustomerAppContext';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { HomeTab } from './components/HomeTab';
import { CategoriesTab } from './components/CategoriesTab';
import { CustomStudioTab } from './components/CustomStudioTab';
import { OrdersTab } from './components/OrdersTab';
import { CartTab } from './components/CartTab';
import { ProductDetailModal } from './components/ProductDetailModal';

const CustomerAppContent: React.FC = () => {
  const { activeTab } = useCustomerApp();
  const [showApkGuide, setShowApkGuide] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex justify-center selection:bg-teal-500 selection:text-white">
      {/* Mobile container - Responsive Flipkart style app wrapper with maximum mobile width */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col relative shadow-2xl overflow-x-hidden border-x border-slate-200">
        
        {/* Top Header */}
        <MobileHeader />

        {/* APK Android Quick Bar */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 px-3.5 py-2 text-white flex items-center justify-between text-xs border-b border-teal-800/40">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">🤖</span>
            <span className="font-semibold text-[11px] text-teal-100">Android APK & Capacitor Mobile App</span>
          </div>
          <button
            onClick={() => setShowApkGuide(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-md transition-all active:scale-95 shadow-sm"
          >
            APK Info
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'custom-studio' && <CustomStudioTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'cart' && <CartTab />}
        </main>

        {/* Global Product Detail Modal */}
        <ProductDetailModal />

        {/* Fixed Bottom Navigation */}
        <BottomNav />

        {/* APK Build Instructions & Download Modal */}
        {showApkGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-gradient-to-r from-teal-700 to-emerald-700 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📱</span>
                  <div>
                    <h3 className="font-black text-base">Android APK & Mobile Package</h3>
                    <p className="text-[11px] text-teal-100">Capacitor Android Native Package</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApkGuide(false)}
                  className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3.5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
                <div className="bg-teal-50 border border-teal-200 p-3 rounded-xl">
                  <div className="font-bold text-teal-900 text-sm mb-1">📦 Package Specifications</div>
                  <div className="space-y-1 text-[11px] text-teal-800">
                    <div>• <b>Application ID:</b> <code>com.everest.fabricbazaar</code></div>
                    <div>• <b>App Name:</b> Everest Fabric Bazaar</div>
                    <div>• <b>Framework:</b> React 19 + Capacitor Android Engine</div>
                    <div>• <b>Target:</b> Android 14 / API 34+ (PWA & APK ready)</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-slate-900 mb-1.5">How to build .APK on your machine:</div>
                  <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 text-[11px]">
                    <li>
                      Run web asset build:
                      <pre className="bg-slate-900 text-emerald-400 p-1.5 rounded-md font-mono text-[10px] mt-0.5">cd customer-app ; npm run build</pre>
                    </li>
                    <li>
                      Sync with Android Studio project:
                      <pre className="bg-slate-900 text-emerald-400 p-1.5 rounded-md font-mono text-[10px] mt-0.5">npx cap sync android</pre>
                    </li>
                    <li>
                      Generate Debug / Release APK:
                      <pre className="bg-slate-900 text-emerald-400 p-1.5 rounded-md font-mono text-[10px] mt-0.5">npx cap open android</pre>
                      <span className="text-[10px] text-slate-500">In Android Studio, click <i>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</i>.</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">🌐 Instant PWA / Mobile Browser:</div>
                  <p className="text-[11px] text-slate-600">
                    This application is fully responsive with PWA manifest and mobile touch gestures configured. Open on any mobile device or browser to add directly to Home Screen as a native app.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t flex justify-end">
                <button
                  onClick={() => setShowApkGuide(false)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default function App() {
  return (
    <CustomerAppProvider>
      <CustomerAppContent />
    </CustomerAppProvider>
  );
}
