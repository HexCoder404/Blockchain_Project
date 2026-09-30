import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { encryptFile } from '../utils/crypto';
import { uploadToPinata } from '../utils/pinata';
import toast from 'react-hot-toast';
import MutationWorkflow from '../components/MutationWorkflow';
import ParcelIdField from '../components/ParcelIdField';

export default function CitizenDashboard() {
  const { contract, account, executeTransaction } = useWallet();
  const [lands, setLands] = useState([]);
  const [pendingPurchases, setPendingPurchases] = useState([]);
  const [registeredTransfers, setRegisteredTransfers] = useState([]);
  const [objectionReasons, setObjectionReasons] = useState({});
  const [loading, setLoading] = useState(true);

  const [transferParcelId, setTransferParcelId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');

  const fetchDashboard = async () => {
    if (!contract || !account) return;
    try {
      const [ownedParcelIds, allParcelIds] = await Promise.all([
        contract.getLandsByOwner(account),
        contract.getAllParcelIds(),
      ]);

      const landsData = await Promise.all(ownedParcelIds.map(async (id) => {
        const details = await contract.getLand(id);
        const req = await contract.getTransferRequest(id);
        return { id, details, req };
      }));

      const transferData = await Promise.all(allParcelIds.map(async (id) => {
        const [details, req] = await Promise.all([
          contract.getLand(id),
          contract.getTransferRequest(id),
        ]);
        return { id, details, req };
      }));

      setLands(landsData);
      setPendingPurchases(transferData.filter(({ req }) => (
        Number(req.state) === 1 && req.buyer.toLowerCase() === account.toLowerCase()
      )));
      setRegisteredTransfers(transferData.filter(({ req }) => Number(req.state) === 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contract || !account) return undefined;

    const refresh = () => fetchDashboard();
    const eventProvider = contract.runner?.provider;
    refresh();
    eventProvider?.on('block', refresh);
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(intervalId);
      eventProvider?.off('block', refresh);
    };
  }, [contract, account]);

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!transferParcelId || !buyer || !price || !file) return toast.error("Please fill all fields and upload the sale deed.");
    
    const toastId = toast.loading("Encrypting Sale Deed and Uploading...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const encryptedBlob = await encryptFile(arrayBuffer, password);
      
      const ipfsHash = await uploadToPinata(encryptedBlob, `saledeed_${transferParcelId.substring(0,8)}.enc`);
      const cid = `ipfs://${ipfsHash}`;
      
      toast.success("Document Uploaded!", { id: toastId });
      
      await executeTransaction(
        contract.initiateTransfer(transferParcelId, buyer, cid, price),
        "Initiating Transfer on Blockchain...",
        "Transfer Initiated successfully!"
      );
      setTransferParcelId('');
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to process transfer", { id: toastId });
    }
  };

  const handleAcceptTransfer = async (parcelId) => {
    try {
      const request = await contract.getTransferRequest(parcelId);
      if (Number(request.state) !== 1) {
        return toast.error('This parcel is not waiting for buyer acceptance.');
      }
      if (request.buyer.toLowerCase() !== account.toLowerCase()) {
        return toast.error('The connected wallet is not the buyer named in this transfer.');
      }

      await executeTransaction(
        contract.acceptTransfer(parcelId),
        'Accepting Transfer...',
        'Transfer accepted. It is now ready for Sub-Registrar approval.'
      );
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileObjection = async (parcelId) => {
    const reasonCID = (objectionReasons[parcelId] || '').trim();
    if (!reasonCID) return toast.error('Enter an objection reason or document CID.');

    try {
      await executeTransaction(
        contract.fileObjection(parcelId, reasonCID),
        'Filing Objection...',
        'Objection filed. The Talathi must review this transfer.'
      );
      setObjectionReasons((current) => ({ ...current, [parcelId]: '' }));
      await fetchDashboard();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-xl text-earth-600 animate-pulse">Loading your properties from blockchain...</div>;

  return (
    <div className="py-8 space-y-8 px-4">
      <MutationWorkflow highlightedSteps={[1, 2]} />

      <section className="rounded-3xl border border-earth-200 bg-white p-6 shadow-lg dark:border-earth-900/60 dark:bg-gray-900 md:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Mutation Step 2</p>
          <h2 className="mt-1 text-2xl font-bold text-earth-800 dark:text-earth-300">Accept a land transfer</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Transfers addressed to this connected wallet appear here automatically.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pendingPurchases.map(({ id, details, req }) => (
            <article key={id} className="rounded-2xl border border-earth-200 bg-earth-50 p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey {details.surveyNumber.toString()}/{details.subNumber.toString()}</p>
                  <h3 className="text-xl font-bold text-earth-900 dark:text-earth-200">{details.village}</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Awaiting you</span>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">Price: <strong>{req.price.toString()} Wei</strong></p>
              <ParcelIdField parcelId={id} />
              <button onClick={() => handleAcceptTransfer(id)} className="mt-4 w-full rounded-xl bg-earth-600 py-3 font-bold text-white shadow-md transition-all hover:bg-earth-700 hover:shadow-lg active:scale-95">
                Accept Transfer
              </button>
            </article>
          ))}
          {pendingPurchases.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-earth-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              No transfers are waiting for this wallet. This list updates automatically.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-earth-200 bg-white p-6 shadow-lg dark:border-earth-900/60 dark:bg-gray-900 md:p-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Public objection period</p>
          <h2 className="mt-1 text-2xl font-bold text-earth-800 dark:text-earth-300">Registered transfers</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">After Sub-Registrar approval, concerned parties may file an objection during the 30-day window.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {registeredTransfers.map(({ id, details, req }) => (
            <article key={id} className="rounded-2xl border border-earth-200 bg-earth-50 p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey {details.surveyNumber.toString()}/{details.subNumber.toString()}</p>
                  <h3 className="text-xl font-bold text-earth-900 dark:text-earth-200">{details.village}</h3>
                </div>
                <span className={req.hasObjection
                  ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}
                >
                  {req.hasObjection ? 'Objection recorded' : 'Window open'}
                </span>
              </div>
              <ParcelIdField parcelId={id} />
              {!req.hasObjection && (
                <div className="mt-4 space-y-3">
                  <input
                    value={objectionReasons[id] || ''}
                    onChange={(e) => setObjectionReasons((current) => ({ ...current, [id]: e.target.value }))}
                    placeholder="Objection reason or IPFS CID"
                    className="w-full rounded-xl border border-earth-200 bg-white p-3 text-sm outline-none focus:border-earth-500 focus:ring-2 focus:ring-earth-200 dark:border-gray-700 dark:bg-gray-900 dark:focus:ring-earth-900"
                  />
                  <button onClick={() => handleFileObjection(id)} className="w-full rounded-xl border-2 border-red-500 py-2.5 font-bold text-red-600 transition-all hover:bg-red-500 hover:text-white dark:text-red-400">
                    File Objection
                  </button>
                </div>
              )}
            </article>
          ))}
          {registeredTransfers.length === 0 && (
            <div className="lg:col-span-2 rounded-2xl border border-dashed border-earth-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">No transfers are currently in the objection period.</div>
          )}
        </div>
      </section>

      <h2 className="text-3xl font-bold text-earth-800 dark:text-earth-300">My Land Holdings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {lands.map((land, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-md hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey No.</span>
                <h3 className="text-3xl font-black text-gray-800 dark:text-white">{land.details.surveyNumber.toString()}</h3>
              </div>
              <Link to={`/extract/${land.id}`} className="p-3 bg-earth-50 dark:bg-gray-800 text-earth-600 dark:text-earth-400 rounded-xl hover:bg-earth-100 dark:hover:bg-earth-900/50 transition-colors tooltip" title="View 7/12 Extract">
                <FileText size={24} />
              </Link>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <p className="flex justify-between"><span>Village:</span> <strong className="text-gray-900 dark:text-gray-200">{land.details.village}</strong></p>
              <p className="flex justify-between"><span>Area:</span> <strong className="text-gray-900 dark:text-gray-200">{land.details.areaSqM.toString()} Sq.M</strong></p>
            </div>
            <div className="mb-6">
              <ParcelIdField parcelId={land.id} />
            </div>
            
            {Number(land.req.state) !== 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-900/50">
                {Number(land.req.state) === 1 && 'Step 1 complete — waiting for buyer'}
                {Number(land.req.state) === 2 && 'Step 2 complete — waiting for Sub-Registrar'}
                {Number(land.req.state) === 3 && 'Step 3 complete — objection period active'}
              </div>
            ) : (
              <button onClick={() => setTransferParcelId(land.id)} className="w-full py-3 border-2 border-earth-600 text-earth-700 dark:text-earth-400 font-bold rounded-xl hover:bg-earth-50 dark:hover:bg-gray-800 transition-colors">
                Initiate Sale / Transfer
              </button>
            )}
          </div>
        ))}
        {lands.length === 0 && (
          <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 text-gray-500">
            You don't own any properties on this network.
          </div>
        )}
      </div>

      {transferParcelId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl w-full max-w-xl">
             <h3 className="text-2xl font-bold mb-2">Initiate Secure Transfer</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Share this Parcel ID with the buyer after initiating the transfer.</p>
             <div className="mb-6">
               <ParcelIdField parcelId={transferParcelId} />
             </div>
             <form onSubmit={handleInitiateTransfer} className="space-y-4">
               <div>
                 <label className="block text-sm font-bold mb-2">Buyer Wallet Address</label>
                 <input required type="text" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800" onChange={e => setBuyer(e.target.value)} />
               </div>
               <div>
                 <label className="block text-sm font-bold mb-2">Sale Price (Wei)</label>
                 <input required type="number" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800" onChange={e => setPrice(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-800 pt-4">
                 <div>
                   <label className="block text-sm font-bold mb-2">Sale Deed Document</label>
                   <input required type="file" className="w-full p-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl text-sm" onChange={e => setFile(e.target.files[0])} />
                 </div>
                 <div>
                   <label className="block text-sm font-bold mb-2">Encryption Password</label>
                   <input required type="password" placeholder="Protect document" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800" onChange={e => setPassword(e.target.value)} />
                 </div>
               </div>
               <div className="pt-4 flex gap-4">
                 <button type="button" onClick={() => setTransferParcelId('')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
                 <button type="submit" className="flex-1 py-3 bg-earth-600 text-white font-bold rounded-xl hover:bg-earth-700 shadow-lg">Encrypt & Submit</button>
               </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
