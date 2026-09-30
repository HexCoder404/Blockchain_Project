import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import MutationWorkflow from '../components/MutationWorkflow';
import ParcelIdField from '../components/ParcelIdField';

export default function SubRegistrarDashboard() {
  const { contract, executeTransaction } = useWallet();
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingTransfers = async () => {
    if (!contract) return;
    try {
      const parcelIds = await contract.getAllParcelIds();
      const records = await Promise.all(parcelIds.map(async (id) => {
        const [details, request] = await Promise.all([
          contract.getLand(id),
          contract.getTransferRequest(id),
        ]);
        return { id, details, request };
      }));
      setPendingTransfers(records.filter(({ request }) => Number(request.state) === 2));
    } catch (error) {
      console.error('Failed to load pending registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contract) return undefined;

    const refresh = () => fetchPendingTransfers();
    const eventProvider = contract.runner?.provider;
    refresh();
    eventProvider?.on('block', refresh);
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(intervalId);
      eventProvider?.off('block', refresh);
    };
  }, [contract]);

  const handleApprove = async (parcelId) => {
    try {
      await executeTransaction(
        contract.approveRegistration(parcelId),
        'Approving Registration...',
        'Registration approved. The 30-day objection period has started.'
      );
      await fetchPendingTransfers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <MutationWorkflow highlightedSteps={[3]} />

      <section className="rounded-3xl border border-earth-200 bg-white p-8 shadow-xl dark:border-earth-900/60 dark:bg-gray-900">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Mutation Step 3</p>
        <h1 className="text-3xl font-bold text-earth-800 dark:text-earth-300">Pending sale-deed approvals</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Buyer-accepted transfers appear here automatically. Approval begins the 30-day objection period.
        </p>

        {loading ? (
          <div className="py-12 text-center font-bold text-earth-600 animate-pulse">Loading accepted transfers...</div>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {pendingTransfers.map(({ id, details, request }) => (
              <article key={id} className="rounded-2xl border border-earth-200 bg-earth-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey {details.surveyNumber.toString()}/{details.subNumber.toString()}</p>
                    <h2 className="text-xl font-bold text-earth-900 dark:text-earth-200">{details.village}, {details.taluka}</h2>
                  </div>
                  <span className="rounded-full bg-earth-200 px-3 py-1 text-xs font-bold text-earth-800 dark:bg-earth-900/50 dark:text-earth-200">Buyer accepted</span>
                </div>

                <dl className="mb-5 space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Seller</dt><dd className="truncate font-mono" title={details.currentOwner}>{details.currentOwner}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Buyer</dt><dd className="truncate font-mono" title={request.buyer}>{request.buyer}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-gray-500">Price</dt><dd className="font-bold">{request.price.toString()} Wei</dd></div>
                </dl>

                <ParcelIdField parcelId={id} />
                <button onClick={() => handleApprove(id)} className="mt-5 w-full rounded-xl bg-earth-600 py-3 font-bold text-white shadow-md transition-all hover:bg-earth-700 hover:shadow-lg active:scale-95">
                  Approve Registration
                </button>
              </article>
            ))}

            {pendingTransfers.length === 0 && (
              <div className="lg:col-span-2 rounded-2xl border border-dashed border-earth-300 p-10 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No buyer-accepted transfers are waiting for approval. This queue updates automatically.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
