import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { encryptFile, getIpfsCid } from '../utils/crypto';

export default function VerifyDocument({ expectedCid }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'failed' | null
  const [computedCid, setComputedCid] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file || !password || !expectedCid) return;
    
    try {
      setStatus(null);
      const arrayBuffer = await file.arrayBuffer();
      // Encrypt the exact same way it was uploaded
      const encryptedBlob = await encryptFile(arrayBuffer, password);
      // Recompute the IPFS CID locally without uploading
      const cid = await getIpfsCid(encryptedBlob);
      
      const formattedCid = `ipfs://${cid}`;
      setComputedCid(formattedCid);
      
      if (formattedCid === expectedCid) {
        setStatus('success');
      } else {
        setStatus('failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
    }
  };

  return (
    <div className="mt-8 border-t-2 border-gray-200 dark:border-gray-800 pt-8 print:hidden">
      <h3 className="text-xl font-bold mb-4">Cryptographic Verification</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        To prove that you have the original, untampered document (Sale Deed or Survey Map), upload the raw file and enter the encryption password. We will re-encrypt it locally in your browser and compare the resulting IPFS Content Identifier (CID) with the one permanently recorded on the blockchain.
      </p>
      
      <form onSubmit={handleVerify} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-bold mb-2">Original Document</label>
          <input required type="file" className="w-full p-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e => setFile(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">Encryption Password</label>
          <input required type="password" placeholder="Password used during upload" className="w-full p-3 border rounded-xl dark:bg-gray-800 dark:border-gray-700" onChange={e => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="w-full py-3 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl dark:bg-gray-700 dark:hover:bg-gray-600">
          Verify Document
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl flex items-start gap-4">
          <ShieldCheck size={28} className="text-green-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-green-800 dark:text-green-400">Verification Successful!</h4>
            <p className="text-green-700 dark:text-green-300 text-sm mt-1">The uploaded document perfectly matches the on-chain record.</p>
            <p className="text-green-700/80 text-xs mt-2 font-mono break-all">Computed Hash: {computedCid}</p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start gap-4">
          <ShieldAlert size={28} className="text-red-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800 dark:text-red-400">Verification Failed</h4>
            <p className="text-red-700 dark:text-red-300 text-sm mt-1">The resulting hash does not match the blockchain record. The document may have been tampered with or the password is incorrect.</p>
            <p className="text-red-700/80 text-xs mt-2 font-mono break-all">Computed Hash: {computedCid}</p>
            <p className="text-red-700/80 text-xs mt-1 font-mono break-all">Expected Hash: {expectedCid}</p>
          </div>
        </div>
      )}
    </div>
  );
}
