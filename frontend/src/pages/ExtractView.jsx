import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { BadgeCheck, Printer, AlertTriangle, Lock } from 'lucide-react';
import contractData from '../contracts/LandRegistry.json';
import VerifyDocument from '../components/VerifyDocument';

// Basic standard RPC to read without requiring MetaMask connect
const READ_PROVIDER = new ethers.JsonRpcProvider('http://127.0.0.1:8545'); 

export default function ExtractView() {
  const { parcelId } = useParams();
  const [land, setLand] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLand = async () => {
      try {
        const contract = new ethers.Contract(contractData.address, contractData.abi, READ_PROVIDER);
        const data = await contract.getLand(parcelId);
        const hist = await contract.getOwnershipHistory(parcelId);
        setLand(data);
        setHistory(hist);
      } catch (err) {
        console.error(err);
        setError("Record not found or invalid parcel ID.");
      } finally {
        setLoading(false);
      }
    };
    if (parcelId) fetchLand();
  }, [parcelId]);

  if (loading) return <div className="text-center py-20 text-xl font-bold animate-pulse text-earth-600">Retrieving from Blockchain...</div>;
  if (error) return <div className="text-center py-20 text-red-500 font-bold text-xl">{error}</div>;

  const STATUS_MAP = ['Active', 'Disputed', 'Frozen'];
  const ENCUMBRANCE_MAP = ['None', 'Mortgaged'];
  const TYPE_MAP = ['Agricultural', 'Non-Agricultural', 'Residential'];

  const status = STATUS_MAP[Number(land.status)];
  const isLocked = status !== 'Active' || ENCUMBRANCE_MAP[Number(land.encumbrance)] === 'Mortgaged';

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Village Form 7/12 Extract</h1>
        <button onClick={() => window.print()} className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors print:hidden">
          <Printer size={18} /> Print / Save PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 p-8 shadow-2xl relative overflow-hidden print:shadow-none print:border-none">
        {/* Verification Ribbon */}
        <div className="absolute top-0 right-0 bg-green-500 text-white px-6 py-2 rounded-bl-2xl font-bold flex items-center gap-2 shadow-lg print:hidden">
          <BadgeCheck size={20} /> Verified on Blockchain
        </div>

        {/* Header Section */}
        <div className="text-center border-b-2 border-gray-300 dark:border-gray-700 pb-6 mb-6 mt-4">
          <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Village Form No. 7 / 12</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">Record of Rights, Crop Register and Mutation Register</p>
        </div>

        {/* Info Grid (Responsive Cards on small, Grid on large) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="text-lg font-bold text-earth-700 dark:text-earth-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Location Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Village:</span> <span className="font-bold">{land.village}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Taluka:</span> <span className="font-bold">{land.taluka}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">District:</span> <span className="font-bold">{land.district}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Survey No:</span> <span className="font-black text-lg">{land.surveyNumber.toString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Sub-Division:</span> <span className="font-black text-lg">{land.subNumber.toString()}</span></div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-6 border border-gray-200 dark:border-gray-700 rounded-xl">
            <h3 className="text-lg font-bold text-earth-700 dark:text-earth-400 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Ownership & Status</h3>
            <div className="space-y-3">
              <div className="flex flex-col"><span className="text-gray-500 dark:text-gray-400">Occupant Name (Hash):</span> <span className="font-mono text-sm break-all font-bold text-blue-600 dark:text-blue-400">{land.ownerNameHash}</span></div>
              <div className="flex flex-col"><span className="text-gray-500 dark:text-gray-400">Current Owner Wallet:</span> <span className="font-mono text-sm break-all">{land.currentOwner}</span></div>
              <div className="flex justify-between mt-4 items-center">
                <span className="text-gray-500 dark:text-gray-400">Area:</span> 
                <span className="font-bold">{land.areaSqM.toString()} Sq.M</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Status:</span> 
                {isLocked ? (
                   <span className="flex items-center gap-1 text-red-600 font-bold bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded"><Lock size={16}/> {status}</span>
                ) : (
                   <span className="text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{status}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ownership History Timeline */}
        <div className="mt-8">
           <h3 className="text-xl font-bold mb-4">Mutation / Ownership History</h3>
           <div className="space-y-4">
             {history.map((owner, idx) => (
               <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                 <div className="w-8 h-8 rounded-full bg-earth-200 dark:bg-earth-800 flex items-center justify-center font-bold text-earth-700 dark:text-earth-300">{idx + 1}</div>
                 <div className="font-mono text-sm break-all flex-1">{owner}</div>
                 {idx === history.length - 1 && <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded uppercase">Current</span>}
               </div>
             ))}
           </div>
        </div>

        {/* Footer & QR */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-8">
           <div className="text-sm text-gray-500 dark:text-gray-400 max-w-lg">
             <p className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Legal Disclaimer</p>
             <p>This extract is cryptographically verified against the Ethereum blockchain. The digital signature ensures the document has not been tampered with. Scan the QR code to verify this exact record on-chain.</p>
           </div>
           <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <QRCodeSVG value={window.location.href} size={120} />
             <span className="text-xs font-bold text-gray-500">Scan to Verify</span>
           </div>
        </div>

        {/* Verification Component */}
        <VerifyDocument expectedCid={land.documentCID} />
      </div>
    </div>
  );
}
