import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

export default function SubRegistrarDashboard() {
  const { contract, executeTransaction } = useWallet();
  const [parcelId, setParcelId] = useState('');

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await executeTransaction(
        contract.approveRegistration(parcelId), 
        "Approving Registration...", 
        "Registration Approved and Signed!"
      );
    } catch(e) {}
  };

  return (
    <div className="py-12 max-w-2xl mx-auto px-4">
       <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12 shadow-2xl border border-purple-100 dark:border-purple-900/30">
         <h2 className="text-3xl font-bold mb-2 text-purple-600 dark:text-purple-400">Approve Sale Deed Registration</h2>
         <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">
           This is Step 3 of the mutation workflow. Enter the Parcel ID below to officially approve the registration.
         </p>
         
         <form onSubmit={handleApprove} className="space-y-6">
           <div>
             <label className="block font-bold mb-2 text-gray-700 dark:text-gray-300">Parcel ID (bytes32)</label>
             <input 
               required 
               placeholder="0x..." 
               className="w-full p-4 border rounded-xl dark:bg-gray-800 dark:border-gray-700 font-mono focus:ring-2 focus:ring-purple-500 outline-none" 
               onChange={e=>setParcelId(e.target.value)}
             />
           </div>
           <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-lg shadow-xl shadow-purple-600/20 active:scale-95 transition-all">
             Approve Registration
           </button>
         </form>
       </div>
    </div>
  );
}
