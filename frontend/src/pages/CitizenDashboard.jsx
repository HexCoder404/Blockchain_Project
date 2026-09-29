import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { encryptFile } from '../utils/crypto';
import { uploadToPinata } from '../utils/pinata';
import toast from 'react-hot-toast';

export default function CitizenDashboard() {
  const { contract, account, executeTransaction } = useWallet();
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [transferParcelId, setTransferParcelId] = useState('');
  const [buyer, setBuyer] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');

  const fetchMyLands = async () => {
    if (!contract || !account) return;
    try {
      const parcelIds = await contract.getLandsByOwner(account);
      const landsData = await Promise.all(parcelIds.map(async (id) => {
        const details = await contract.getLand(id);
        const req = await contract.getTransferRequest(id);
        return { id, details, req };
      }));
      setLands(landsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLands();
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
      await fetchMyLands(); // Refresh UI State
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to process transfer", { id: toastId });
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-xl text-earth-600 animate-pulse">Loading your properties from blockchain...</div>;

  return (
    <div className="py-8 space-y-8 px-4">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Land Holdings</h2>
      
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
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
              <p className="flex justify-between"><span>Village:</span> <strong className="text-gray-900 dark:text-gray-200">{land.details.village}</strong></p>
              <p className="flex justify-between"><span>Area:</span> <strong className="text-gray-900 dark:text-gray-200">{land.details.areaSqM.toString()} Sq.M</strong></p>
              <p className="flex justify-between"><span>Parcel ID:</span> <span className="font-mono text-xs">{land.id.substring(0,10)}...</span></p>
            </div>
            
            {Number(land.req.state) !== 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-900/50">
                Active Transfer (Step {Number(land.req.state)})
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
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 font-mono">ID: {transferParcelId.substring(0,16)}...</p>
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
