'use client';

import { useState } from 'react';

interface Props {
  onRefresh: () => void;
  lastUpdated: string | null;
}

export default function RefreshButton({ onRefresh, lastUpdated }: Props) {
  const [spinning, setSpinning] = useState(false);

  const handleClick = () => {
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 1500);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {lastUpdated && (
        <span className="text-xs text-gray-500 font-mono">
          Updated {formatTime(lastUpdated)}
        </span>
      )}
      <button
        onClick={handleClick}
        title="Refresh data"
        className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-white transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`w-4 h-4 transition-transform duration-700 ${spinning ? 'rotate-[360deg]' : ''}`}
          style={{ transition: spinning ? 'transform 0.7s linear' : undefined }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
