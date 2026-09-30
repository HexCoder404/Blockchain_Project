import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield, FileText, Activity } from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-16 py-12 md:py-24">
      {/* Hero */}
      <section className="text-center space-y-6 px-4">
        <h1 className="text-5xl md:text-7xl font-black text-earth-700 dark:text-earth-300 tracking-tight leading-tight">
          {t('hero_title', 'Transparent Land Records')}
        </h1>
        <p className="text-xl md:text-2xl text-earth-700 dark:text-gray-300 max-w-3xl mx-auto font-medium">
          {t('hero_subtitle', 'Secure, immutable, and accessible 7/12 extracts powered by Ethereum blockchain technology.')}
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link to="/search" className="px-8 py-4 bg-earth-600 hover:bg-earth-700 text-white font-bold rounded-2xl shadow-xl shadow-earth-900/20 transition-transform hover:-translate-y-1">
            Search 7/12 Record
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4">
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-earth-100 dark:border-gray-800 text-center hover:border-earth-300 dark:hover:border-earth-700 transition-colors">
          <div className="w-16 h-16 bg-earth-100 dark:bg-earth-900/30 text-earth-600 dark:text-earth-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><FileText size={32} /></div>
          <h3 className="text-xl font-bold mb-2">Immutable Records</h3>
          <p className="text-earth-600 dark:text-gray-400">All 7/12 extracts are permanently stored and verifiable on the blockchain.</p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-earth-100 dark:border-gray-800 text-center hover:border-earth-300 dark:hover:border-earth-700 transition-colors">
          <div className="w-16 h-16 bg-earth-100 dark:bg-earth-900/30 text-earth-600 dark:text-earth-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><Activity size={32} /></div>
          <h3 className="text-xl font-bold mb-2">Transparent Mutations</h3>
          <p className="text-earth-600 dark:text-gray-400">Transfers require buyer acceptance, Sub-Registrar approval, and final Talathi certification.</p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-earth-100 dark:border-gray-800 text-center sm:col-span-2 md:col-span-1 hover:border-earth-300 dark:hover:border-earth-700 transition-colors">
          <div className="w-16 h-16 bg-earth-100 dark:bg-earth-900/30 text-earth-600 dark:text-earth-400 rounded-2xl flex items-center justify-center mx-auto mb-6"><Shield size={32} /></div>
          <h3 className="text-xl font-bold mb-2">Fraud Prevention</h3>
          <p className="text-earth-600 dark:text-gray-400">Disputed or mortgaged lands are cryptographically locked preventing illegal sales.</p>
        </div>
      </section>
    </div>
  );
}
