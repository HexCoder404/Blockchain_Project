import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function ParcelIdField({ parcelId, label = 'Parcel ID' }) {
  const [copied, setCopied] = useState(false);

  const copyParcelId = async () => {
    await navigator.clipboard.writeText(parcelId);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-xl border border-earth-200 bg-earth-50 p-3 dark:border-earth-900/60 dark:bg-earth-900/20">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-earth-600 dark:text-earth-400">{label}</span>
        <button
          type="button"
          onClick={copyParcelId}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-earth-700 transition-all hover:bg-earth-200 hover:shadow-sm dark:text-earth-300 dark:hover:bg-earth-900/60"
          title={`Copy ${label}`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="break-all font-mono text-xs leading-5 text-gray-700 dark:text-gray-300">{parcelId}</p>
    </div>
  );
}
