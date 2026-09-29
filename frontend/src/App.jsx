import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useWallet, WalletProvider } from './context/WalletContext';
import { Toaster } from 'react-hot-toast';
import { Menu, X, Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy loading pages to keep this file clean
import Landing from './pages/Landing';
import Search712 from './pages/Search712';
import ExtractView from './pages/ExtractView';
import CitizenDashboard from './pages/CitizenDashboard';
import TalathiDashboard from './pages/TalathiDashboard';
import SubRegistrarDashboard from './pages/SubRegistrarDashboard';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role, account, isConnecting } = useWallet();
  if (isConnecting) return <div className="flex h-screen items-center justify-center text-xl text-earth-600 dark:text-earth-400 animate-pulse">Loading Web3 State...</div>;
  if (!account) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-4">
        <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-3xl border border-red-100 dark:border-red-900/50 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">Unauthorized Access</h1>
          <p className="text-red-500 dark:text-red-300">Your role ({role}) does not have permission to view this dashboard.</p>
        </div>
      </div>
    );
  }
  return children;
};

const Navigation = () => {
  const { account, role, connect, disconnect, isConnecting, txPending } = useWallet();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'mr' : i18n.language === 'mr' ? 'gu' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <nav className="sticky top-0 z-50 bg-earth-50/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-earth-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 transition-colors print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-earth-600 to-earth-400 tracking-tight">
              {t('app_name')}
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-earth-200 dark:hover:bg-gray-800 transition-colors" title="Toggle Language">
              <Globe size={20} className="text-earth-700 dark:text-earth-300" />
              <span className="ml-1 text-xs uppercase font-bold">{i18n.language}</span>
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-earth-200 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-earth-700" />}
            </button>

            <Link to="/search" className="font-semibold hover:text-earth-600 dark:hover:text-earth-400 transition-colors">{t('search_712')}</Link>
            
            {txPending && (
              <span className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-semibold px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <span className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4"></span>
                Tx Pending
              </span>
            )}
            
            {account ? (
              <div className="flex items-center gap-3 bg-earth-100 dark:bg-gray-800 p-1.5 rounded-full shadow-inner border border-earth-200 dark:border-gray-700">
                <Link to="/" className="px-4 py-1.5 bg-white dark:bg-gray-700 rounded-full text-sm font-bold text-earth-700 dark:text-earth-300 shadow-sm">
                  {role}
                </Link>
                <span className="text-sm font-mono font-medium px-2 hidden lg:block">
                  {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </span>
                <button onClick={disconnect} className="px-4 py-1.5 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 font-bold rounded-full transition-colors">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={connect} disabled={isConnecting} className="px-6 py-2.5 bg-earth-600 hover:bg-earth-700 disabled:opacity-50 text-white font-bold rounded-full transition-all shadow-md active:scale-95">
                {isConnecting ? 'Connecting...' : t('connect_wallet')}
              </button>
            )}
          </div>

          <div className="flex items-center md:hidden gap-2">
            <button onClick={toggleTheme} className="p-2">
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-earth-700" />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-earth-700 dark:text-earth-300 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-earth-50 dark:bg-gray-900 border-b border-earth-200 dark:border-gray-800 p-4 space-y-4">
           <button onClick={toggleLanguage} className="flex items-center gap-2 w-full text-left font-bold text-earth-700 dark:text-earth-300">
              <Globe size={20} /> Language: {i18n.language.toUpperCase()}
           </button>
           <Link to="/search" onClick={() => setIsOpen(false)} className="block font-semibold text-earth-800 dark:text-gray-200">{t('search_712')}</Link>
           {account && <Link to="/" onClick={() => setIsOpen(false)} className="block font-semibold text-earth-800 dark:text-gray-200">{t('dashboard')} ({role})</Link>}
           
           <div className="pt-4 border-t border-earth-200 dark:border-gray-800">
             {account ? (
               <button onClick={() => { disconnect(); setIsOpen(false); }} className="w-full py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-bold rounded-xl">Disconnect</button>
             ) : (
               <button onClick={() => { connect(); setIsOpen(false); }} className="w-full py-2 bg-earth-600 text-white font-bold rounded-xl">Connect Wallet</button>
             )}
           </div>
        </div>
      )}
    </nav>
  );
};

function AppContent() {
  const { role, account } = useWallet();

  const getDashboardHome = () => {
    if (!account) return <Landing />;
    switch (role) {
      case 'Talathi': return <Navigate to="/talathi" />;
      case 'SubRegistrar': return <Navigate to="/sub-registrar" />;
      case 'Admin': return <Navigate to="/talathi" />;
      case 'Bank': return <div className="p-8"><h1 className="text-3xl font-bold">Bank Dashboard</h1></div>;
      default: return <Navigate to="/citizen" />;
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200 print:bg-white print:text-black print:min-h-0">
      <Navigation />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route path="/" element={getDashboardHome()} />
          <Route path="/search" element={<Search712 />} />
          <Route path="/extract/:parcelId" element={<ExtractView />} />
          <Route path="/citizen" element={<ProtectedRoute allowedRoles={['Citizen', 'Admin']}><CitizenDashboard /></ProtectedRoute>} />
          <Route path="/talathi" element={<ProtectedRoute allowedRoles={['Talathi', 'Admin']}><TalathiDashboard /></ProtectedRoute>} />
          <Route path="/sub-registrar" element={<ProtectedRoute allowedRoles={['SubRegistrar', 'Admin']}><SubRegistrarDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <WalletProvider>
          <AppContent />
          <Toaster position="bottom-center" toastOptions={{
            style: { background: '#384328', color: '#fff', borderRadius: '12px', fontWeight: '500' },
            success: { iconTheme: { primary: '#819951', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#384328' } },
          }} />
        </WalletProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
