import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { encryptFile, generateSaltedHash } from '../utils/crypto';
import { uploadToPinata } from '../utils/pinata';
import toast from 'react-hot-toast';

export default function TalathiDashboard() {
  const { contract, executeTransaction } = useWallet();
  const [formData, setFormData] = useState({ s: '', sub: '', v: '', t: '', d: '', a: '', type: '0', owner: '', name: '', salt: '', password: '' });
  const [file, setFile] = useState(null);
  
  const [mutationId, setMutationId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSalt, setNewSalt] = useState('');

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
      const hash = generateSaltedHash(newName, newSalt);
      await executeTransaction(
        contract.certifyMutation(mutationId, hash), 
        "Certifying Mutation...", 
        "Mutation Certified Successfully!"
      );
    } catch(e) {}
  };

  return (
    <div className="py-8 grid grid-cols-1 xl:grid-cols-2 gap-8 px-4">
       {/* Register Land */}
       <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800">
         <h2 className="text-2xl font-bold mb-2 text-blue-600 dark:text-blue-400">Register New Land</h2>
         <p className="text-gray-500 mb-6 text-sm">Upload documents (encrypted securely) and register the genesis block.</p>
         <form onSubmit={handleRegister} className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Survey No</label>
               <input required type="number" className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, s:e.target.value})}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Sub No</label>
               <input required type="number" className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, sub:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Village</label>
               <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, v:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Taluka</label>
               <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, t:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">District</label>
               <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, d:e.target.value})}/>
             </div>
             <div className="col-span-2 sm:col-span-1">
               <label className="block text-xs font-bold text-gray-500 mb-1">Area (Sq.M)</label>
               <input required type="number" className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, a:e.target.value})}/>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
             <label className="block text-xs font-bold text-gray-500 mb-1">Owner Wallet Address</label>
             <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, owner:e.target.value})}/>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Owner Legal Name</label>
               <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, name:e.target.value})}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Name Salt (Secret)</label>
               <input required className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, salt:e.target.value})}/>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Document (Map/Deed)</label>
               <input required type="file" className="w-full p-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 text-sm" onChange={e=>setFile(e.target.files[0])}/>
             </div>
             <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Encryption Password</label>
               <input required type="password" placeholder="Secure Document" className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setFormData({...formData, password:e.target.value})}/>
             </div>
           </div>
           
           <button type="submit" className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg">Encrypt & Register Land</button>
         </form>
       </div>

       {/* Certify Mutation */}
       <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800 h-fit">
         <h2 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">Certify Mutation (Step 4)</h2>
         <p className="text-sm text-gray-500 mb-8">Finalize a pending transfer after Sub-Registrar approval.</p>
         <form onSubmit={handleCertify} className="space-y-6">
           <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Parcel ID (bytes32)</label>
             <input required placeholder="0x..." className="w-full p-4 border rounded-xl dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" onChange={e=>setMutationId(e.target.value)}/>
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Owner Name</label>
               <input required className="w-full p-4 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setNewName(e.target.value)}/>
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Owner Salt</label>
               <input required className="w-full p-4 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e=>setNewSalt(e.target.value)}/>
             </div>
           </div>
           <button type="submit" className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg">Certify Mutation</button>
         </form>
       </div>
    </div>
  );
}
