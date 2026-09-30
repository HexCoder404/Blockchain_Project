import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { encryptFile, generateSaltedHash } from '../utils/crypto';
import { uploadToPinata } from '../utils/pinata';
import toast from 'react-hot-toast';
import MutationWorkflow from '../components/MutationWorkflow';
import ParcelIdField from '../components/ParcelIdField';

const LOCAL_RPC_URL = 'http://127.0.0.1:8545';

const callLocalRpc = async (method, params = []) => {
  const response = await fetch(LOCAL_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
  });
  if (!response.ok) throw new Error(`Local RPC returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message || `Local RPC method ${method} failed`);
  return payload.result;
};

export default function TalathiDashboard() {
  const { contract, executeTransaction } = useWallet();
  const [formData, setFormData] = useState({ s: '', sub: '', v: '', t: '', d: '', a: '', type: '0', owner: '', name: '', salt: '', password: '' });
  const [file, setFile] = useState(null);
  
  const [mutationId, setMutationId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSalt, setNewSalt] = useState('');
  const [pendingMutations, setPendingMutations] = useState([]);
  const [chainTimestamp, setChainTimestamp] = useState(0);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const inputClass = 'w-full rounded-xl border border-earth-200 bg-earth-50 p-3 outline-none focus:border-earth-500 focus:ring-2 focus:ring-earth-200 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-earth-900';

  const fetchPendingMutations = async () => {
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
      const latestBlock = await contract.runner.provider.getBlock('latest');
      setChainTimestamp(Number(latestBlock.timestamp));
      setPendingMutations(records.filter(({ request }) => Number(request.state) === 3));
    } catch (error) {
      console.error('Failed to load registered mutations:', error);
    }
  };

  useEffect(() => {
    if (!contract) return undefined;

    const refresh = () => fetchPendingMutations();
    const eventProvider = contract.runner?.provider;
    refresh();
    eventProvider?.on('block', refresh);
    const intervalId = window.setInterval(refresh, 5000);

    return () => {
      window.clearInterval(intervalId);
      eventProvider?.off('block', refresh);
    };
  }, [contract]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload the property document/survey map.");
    
    let cid = "ipfs://none";
    
    const toastId = toast.loading("Encrypting and Uploading to IPFS...");
    try {
      // 1. Encrypt File
      const arrayBuffer = await file.arrayBuffer();
      const encryptedBlob = await encryptFile(arrayBuffer, formData.password);
      
      // 2. Upload to Pinata
      const ipfsHash = await uploadToPinata(encryptedBlob, `land_${formData.v}_${formData.s}_${formData.sub}.enc`);
      cid = `ipfs://${ipfsHash}`;
      
      // 3. Generate Salted Hash for Name
      const nameHash = generateSaltedHash(formData.name, formData.salt);
      
      toast.success("IPFS Upload Complete!", { id: toastId });
      
      // 4. Send Transaction
      await executeTransaction(
        contract.registerLand(formData.s, formData.sub, formData.v, formData.t, formData.d, formData.a, formData.type, formData.owner, nameHash, cid),
        "Registering Land on Blockchain...",
        "Land registered successfully!"
      );
    } catch(err) {
      console.error(err);
      toast.error(err.message || "Failed to process document", { id: toastId });
    }
  };

  const handleCertify = async (e) => {
    e.preventDefault();
    try {
      const request = await contract.getTransferRequest(mutationId);
      if (Number(request.state) !== 3) {
        return toast.error('This parcel is not waiting for mutation certification.');
      }
      if (request.hasObjection) {
        return toast.error('This mutation has an objection and must be rejected or resolved.');
      }

      const latestBlock = await contract.runner.provider.getBlock('latest');
      const remainingSeconds = Number(request.registeredAt) + (30 * 24 * 60 * 60) - Number(latestBlock.timestamp);
      if (remainingSeconds > 0) {
        const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));
        return toast.error(`The objection period is active for ${remainingDays} more day(s).`);
      }

      const hash = generateSaltedHash(newName, newSalt);
      await executeTransaction(
        contract.certifyMutation(mutationId, hash), 
        "Certifying Mutation...", 
        "Mutation Certified Successfully!"
      );
      setMutationId('');
      setNewName('');
      setNewSalt('');
      await fetchPendingMutations();
    } catch(e) {
      console.error(e);
    }
  };

  const handleAdvanceLocalTime = async () => {
    if (!import.meta.env.DEV) return;
    try {
      const chainId = await callLocalRpc('eth_chainId');
      if (Number.parseInt(chainId, 16) !== 31337) {
        return toast.error('The demo time control is available only on Hardhat localhost.');
      }
      await callLocalRpc('evm_increaseTime', [(30 * 24 * 60 * 60) + 1]);
      await callLocalRpc('evm_mine');
      await fetchPendingMutations();
      const latestBlock = await callLocalRpc('eth_getBlockByNumber', ['latest', false]);
      setChainTimestamp(Number.parseInt(latestBlock.timestamp, 16));
      toast.success('Local blockchain time advanced by 30 days. Ready mutations can now be certified.');
    } catch (error) {
      console.error(error);
      toast.error('Could not advance the local blockchain time.');
    }
  };

  const handleReject = async (parcelId) => {
    const reasonCID = (rejectionReasons[parcelId] || '').trim();
    if (!reasonCID) return toast.error('Enter a rejection reason or document CID.');

    try {
      await executeTransaction(
        contract.rejectTransfer(parcelId, reasonCID),
        'Rejecting Transfer...',
        'Transfer rejected and removed from the mutation queue.'
      );
      setRejectionReasons((current) => ({ ...current, [parcelId]: '' }));
      await fetchPendingMutations();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="py-8 grid grid-cols-1 xl:grid-cols-2 gap-8 px-4">
       <div className="xl:col-span-2">
         <MutationWorkflow highlightedSteps={[4]} />
       </div>

       <section className="xl:col-span-2 rounded-3xl border border-earth-200 bg-white p-8 shadow-xl dark:border-earth-900/60 dark:bg-gray-900">
         <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-earth-500">Mutation Step 4</p>
         <h2 className="text-2xl font-bold text-earth-800 dark:text-earth-300">Registered mutations</h2>
         <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sub-Registrar-approved transfers appear here automatically. Certification becomes available after the objection period.</p>
         {import.meta.env.DEV && (
           <button type="button" onClick={handleAdvanceLocalTime} className="mt-4 rounded-xl border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
             Local demo: advance blockchain time by 30 days
           </button>
         )}

         <div className="mt-6 grid gap-5 lg:grid-cols-2">
           {pendingMutations.map(({ id, details, request }) => {
             const objectionEndsAt = Number(request.registeredAt) + (30 * 24 * 60 * 60);
             const remainingSeconds = Math.max(0, objectionEndsAt - chainTimestamp);
             const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));
             const canCertify = remainingSeconds === 0 && !request.hasObjection;

             return (
               <article key={id} className="rounded-2xl border border-earth-200 bg-earth-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                 <div className="mb-4 flex items-start justify-between gap-3">
                   <div>
                     <p className="text-xs font-bold uppercase tracking-wider text-earth-500">Survey {details.surveyNumber.toString()}/{details.subNumber.toString()}</p>
                     <h3 className="text-xl font-bold text-earth-900 dark:text-earth-200">{details.village}</h3>
                   </div>
                   <span className={request.hasObjection
                     ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-300'
                     : canCertify
                       ? 'rounded-full bg-earth-200 px-3 py-1 text-xs font-bold text-earth-800 dark:bg-earth-900/50 dark:text-earth-200'
                       : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}
                   >
                     {request.hasObjection ? 'Objection filed' : canCertify ? 'Ready to certify' : `${remainingDays} day(s) remaining`}
                   </span>
                 </div>
                 <ParcelIdField parcelId={id} />
                 {request.hasObjection ? (
                   <div className="mt-4 space-y-3">
                     <input
                       value={rejectionReasons[id] || ''}
                       onChange={(e) => setRejectionReasons((current) => ({ ...current, [id]: e.target.value }))}
                       placeholder="Rejection reason or IPFS CID"
                       className="w-full rounded-xl border border-red-200 bg-white p-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-red-900/60 dark:bg-gray-900"
                     />
                     <button type="button" onClick={() => handleReject(id)} className="w-full rounded-xl bg-red-600 py-3 font-bold text-white shadow-md transition-all hover:bg-red-700">
                       Reject Transfer
                     </button>
                   </div>
                 ) : (
                   <button
                     type="button"
                     disabled={!canCertify}
                     onClick={() => setMutationId(id)}
                     className="mt-4 w-full rounded-xl bg-earth-600 py-3 font-bold text-white shadow-md transition-all hover:bg-earth-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
                   >
                     {canCertify ? 'Use for certification' : 'Objection period active'}
                   </button>
                 )}
               </article>
             );
           })}

           {pendingMutations.length === 0 && (
             <div className="lg:col-span-2 rounded-2xl border border-dashed border-earth-300 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
               No Sub-Registrar-approved mutations are waiting. This queue updates automatically.
             </div>
           )}
         </div>
       </section>
       {/* Register Land */}
       <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-earth-200 dark:border-earth-900/60">
         <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500 mb-1">Initial record setup</p>
         <h2 className="text-2xl font-bold mb-2 text-earth-800 dark:text-earth-300">Register New Land</h2>
         <p className="text-gray-500 mb-6 text-sm">Create the parcel's first blockchain record. This is separate from the four-step ownership mutation workflow.</p>
         <form onSubmit={handleRegister} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Survey No</label>
               <input required type="number" className={inputClass} onChange={e=>setFormData({...formData, s:e.target.value})}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Sub No</label>
               <input required type="number" className={inputClass} onChange={e=>setFormData({...formData, sub:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Village</label>
               <input required className={inputClass} onChange={e=>setFormData({...formData, v:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Taluka</label>
               <input required className={inputClass} onChange={e=>setFormData({...formData, t:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">District</label>
               <input required className={inputClass} onChange={e=>setFormData({...formData, d:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Area (Sq.M)</label>
               <input required type="number" className={inputClass} onChange={e=>setFormData({...formData, a:e.target.value})}/>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
             <label className="block text-xs font-bold text-gray-500 mb-1">Owner Wallet Address</label>
             <input required className={inputClass} onChange={e=>setFormData({...formData, owner:e.target.value})}/>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Owner Legal Name</label>
               <input required className={inputClass} onChange={e=>setFormData({...formData, name:e.target.value})}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Name Salt (Secret)</label>
               <input required className={inputClass} onChange={e=>setFormData({...formData, salt:e.target.value})}/>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Document (Map/Deed)</label>
               <input required type="file" className={`${inputClass} text-sm`} onChange={e=>setFile(e.target.files[0])}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Encryption Password</label>
               <input required type="password" placeholder="Secure Document" className={inputClass} onChange={e=>setFormData({...formData, password:e.target.value})}/>
             </div>
           </div>
           
           <button type="submit" className="w-full py-4 mt-4 bg-earth-600 hover:bg-earth-700 text-white font-bold rounded-xl shadow-lg transition-all">Encrypt & Register Land</button>
         </form>
       </div>

       {/* Certify Mutation */}
       <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-earth-200 dark:border-earth-900/60 h-fit">
         <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500 mb-1">Mutation Step 4</p>
         <h2 className="text-2xl font-bold mb-2 text-earth-800 dark:text-earth-300">Certify Mutation</h2>
         <p className="text-sm text-gray-500 mb-8">Finalize a transfer after buyer acceptance, Sub-Registrar approval, and the 30-day objection period.</p>
         <form onSubmit={handleCertify} className="space-y-6">
           <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Parcel ID (bytes32)</label>
             <input required readOnly value={mutationId} placeholder="Choose a ready mutation above" className={`${inputClass} cursor-default p-4 font-mono text-sm`} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Owner Name</label>
               <input required value={newName} className={`${inputClass} p-4`} onChange={e=>setNewName(e.target.value)}/>
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Owner Salt</label>
               <input required value={newSalt} className={`${inputClass} p-4`} onChange={e=>setNewSalt(e.target.value)}/>
             </div>
           </div>
           <button type="submit" disabled={!mutationId} className="w-full py-4 bg-earth-600 hover:bg-earth-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none dark:disabled:bg-gray-700 dark:disabled:text-gray-400 text-white font-bold rounded-xl shadow-lg transition-all">Certify Mutation</button>
         </form>
       </div>
    </div>
  );
}
