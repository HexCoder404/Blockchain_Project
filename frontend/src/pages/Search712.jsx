import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { Search } from 'lucide-react';

export default function Search712() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ district: '', taluka: '', village: '', surveyNumber: '', subNumber: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const encoded = ethers.solidityPacked(
      ['string', 'uint256', 'uint256'], 
      [formData.village, formData.surveyNumber, formData.subNumber]
    );
    const parcelId = ethers.keccak256(encoded);
    navigate(`/extract/${parcelId}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-earth-100 dark:border-gray-800 overflow-hidden">
        <div className="p-8 bg-earth-50 dark:bg-earth-900/20 border-b border-earth-100 dark:border-gray-800">
          <h2 className="text-3xl font-bold text-earth-800 dark:text-gray-100">Public 7/12 Search</h2>
          <p className="text-earth-600 dark:text-gray-400 mt-2 font-medium">Find and verify land records directly from the blockchain.</p>
        </div>
        <form onSubmit={handleSearch} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">District</label>
              <input required type="text" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-earth-500 outline-none transition-all dark:text-white" onChange={e => setFormData({...formData, district: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Taluka</label>
              <input required type="text" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-earth-500 outline-none transition-all dark:text-white" onChange={e => setFormData({...formData, taluka: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Village</label>
              <input required type="text" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-earth-500 outline-none transition-all dark:text-white" onChange={e => setFormData({...formData, village: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Survey Number</label>
              <input required type="number" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-earth-500 outline-none transition-all dark:text-white" onChange={e => setFormData({...formData, surveyNumber: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sub-division Number</label>
              <input required type="number" className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-earth-500 outline-none transition-all dark:text-white" onChange={e => setFormData({...formData, subNumber: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full py-4 mt-4 bg-earth-600 hover:bg-earth-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg">
            <Search size={20} /> Search Blockchain Record
          </button>
        </form>
      </div>
    </div>
  );
}
