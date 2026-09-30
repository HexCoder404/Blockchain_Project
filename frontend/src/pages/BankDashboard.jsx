import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import ParcelIdField from '../components/ParcelIdField';

const ENCUMBRANCE_LABELS = ['Clear', 'Mortgaged'];

export default function BankDashboard() {
  const { contract, executeTransaction } = useWallet();
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchParcels = async () => {
    if (!contract) return;
    try {
      const parcelIds = await contract.getAllParcelIds();
      const records = await Promise.all(parcelIds.map(async (id) => ({
        id,
        details: await contract.getLand(id),
      })));
      setParcels(records);
    } catch (error) {
      console.error('Failed to load bank parcel records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contract) return undefined;
    const refresh = () => fetchParcels();
    const eventProvider = contract.runner?.provider;
    refresh();
    eventProvider?.on('block', refresh);
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(intervalId);
      eventProvider?.off('block', refresh);
    };
  }, [contract]);

  const toggleEncumbrance = async (parcelId, currentValue) => {
    const nextValue = Number(currentValue) === 0 ? 1 : 0;
    try {
      await executeTransaction(
        contract.setEncumbrance(parcelId, nextValue),
        nextValue === 1 ? 'Recording Mortgage...' : 'Clearing Mortgage...',
        nextValue === 1 ? 'Mortgage recorded.' : 'Mortgage cleared.'
      );
      await fetchParcels();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="rounded-3xl border border-earth-200 bg-white p-8 shadow-xl dark:border-earth-900/60 dark:bg-gray-900">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Bank authority</p>
        <h1 className="text-3xl font-bold text-earth-800 dark:text-earth-300">Land encumbrances</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Record or clear a mortgage. Mortgaged parcels cannot enter the transfer workflow.</p>

        {loading ? (
          <div className="py-12 text-center font-bold text-earth-600 animate-pulse">Loading parcels...</div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {parcels.map(({ id, details }) => {
              const encumbrance = Number(details.encumbrance);
              return (
                <article key={id} className="rounded-2xl border border-earth-200 bg-earth-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey {details.surveyNumber.toString()}/{details.subNumber.toString()}</p>
                      <h2 className="text-xl font-bold text-earth-900 dark:text-earth-200">{details.village}</h2>
                    </div>
                    <span className={encumbrance === 1
                      ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'rounded-full bg-earth-200 px-3 py-1 text-xs font-bold text-earth-800 dark:bg-earth-900/50 dark:text-earth-200'}
                    >
                      {ENCUMBRANCE_LABELS[encumbrance]}
                    </span>
                  </div>
                  <ParcelIdField parcelId={id} />
                  <button onClick={() => toggleEncumbrance(id, encumbrance)} className="mt-4 w-full rounded-xl border-2 border-earth-600 py-3 font-bold text-earth-700 transition-all hover:bg-earth-600 hover:text-white dark:text-earth-300">
                    {encumbrance === 0 ? 'Record Mortgage' : 'Clear Mortgage'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
