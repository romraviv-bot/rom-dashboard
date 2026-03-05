'use client';

import { useState } from 'react';
import { MatchedVideo } from '@/lib/types';
import { RetentionSparkline, RetentionFullChart } from './RetentionChart';
import PlatformBar from './PlatformBar';

type SortKey = 'date' | 'ytViews' | 'fbViews' | 'totalViews' | 'swipeRate';

interface Props {
  videos: MatchedVideo[];
  facebookConnected: boolean;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function SwipeRate({ rate }: { rate: number }) {
  if (rate === 0) return <span className="text-gray-600 font-mono text-sm">—</span>;
  const color = rate < 20 ? 'text-green-400' : rate < 40 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-mono text-sm font-bold ${color}`}>{rate}%</span>;
}

export default function VideoTable({ videos, facebookConnected }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...videos].sort((a, b) => {
    let aVal = 0;
    let bVal = 0;
    switch (sortKey) {
      case 'date':
        aVal = new Date(a.ytVideo.publishedAt).getTime();
        bVal = new Date(b.ytVideo.publishedAt).getTime();
        break;
      case 'ytViews':
        aVal = a.ytVideo.views;
        bVal = b.ytVideo.views;
        break;
      case 'fbViews':
        aVal = a.fbVideo?.views || 0;
        bVal = b.fbVideo?.views || 0;
        break;
      case 'totalViews':
        aVal = a.totalViews;
        bVal = b.totalViews;
        break;
      case 'swipeRate':
        aVal = a.ytVideo.swipeAwayRate;
        bVal = b.ytVideo.swipeAwayRate;
        break;
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`text-xs uppercase tracking-wider transition-colors ${
        sortKey === k ? 'text-white' : 'text-gray-500 hover:text-gray-300'
      }`}
    >
      {label}
      {sortKey === k && (
        <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>
      )}
    </button>
  );

  if (videos.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <p className="text-lg">No videos in the last 7 days</p>
        <p className="text-sm mt-2">Make sure your YouTube channel ID is configured correctly.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Table header */}
      <div className="min-w-[800px]">
        <div className="grid grid-cols-[80px_1fr_80px_100px_90px_100px_100px_100px] gap-3 px-4 py-2 text-xs border-b border-[#1a1a1a]">
          <div />
          <SortBtn k="date" label="Title / Date" />
          <div className="text-xs text-gray-500 uppercase tracking-wider">Retention</div>
          <SortBtn k="swipeRate" label="Swipe-away" />
          <SortBtn k="ytViews" label="YT Views" />
          <SortBtn k="fbViews" label="FB Views" />
          <SortBtn k="totalViews" label="Total" />
          <div className="text-xs text-gray-500 uppercase tracking-wider">Split</div>
        </div>

        {/* Rows */}
        {sorted.map((row) => {
          const isExpanded = expandedId === row.ytVideo.id;
          return (
            <div key={row.ytVideo.id}>
              {/* Main row */}
              <div
                className={`grid grid-cols-[80px_1fr_80px_100px_90px_100px_100px_100px] gap-3 px-4 py-3 border-b border-[#1a1a1a] cursor-pointer transition-colors min-w-[800px] ${
                  isExpanded ? 'bg-[#111]' : 'hover:bg-[#0f0f0f]'
                }`}
                onClick={() => setExpandedId(isExpanded ? null : row.ytVideo.id)}
              >
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={row.ytVideo.thumbnailUrl}
                    alt={row.ytVideo.title}
                    className="w-20 h-[45px] object-cover rounded-md"
                  />
                  {row.fbVideo && (
                    <span
                      title="Matched with Facebook"
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#1877f2] rounded-full border border-[#0a0a0a] flex items-center justify-center"
                    >
                      <svg viewBox="0 0 10 10" className="w-2 h-2 fill-white">
                        <path d="M8 0H2a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V2a2 2 0 00-2-2zm-1.5 5.5H5.5V8H4.5V5.5H3V4.5h1.5V3.3c0-.83.5-1.3 1.3-1.3H7V3h-.5c-.28 0-.5.1-.5.5v1h1l-.5 1z"/>
                      </svg>
                    </span>
                  )}
                </div>

                {/* Title + date */}
                <div className="flex flex-col justify-center min-w-0">
                  <p className="text-sm text-white font-medium line-clamp-2 leading-snug">
                    {row.ytVideo.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(row.ytVideo.publishedAt)}
                  </p>
                </div>

                {/* Retention sparkline */}
                <div className="flex items-center">
                  <RetentionSparkline
                    data={row.ytVideo.retention}
                    swipeAwayRate={row.ytVideo.swipeAwayRate}
                  />
                </div>

                {/* Swipe-away */}
                <div className="flex items-center">
                  <SwipeRate rate={row.ytVideo.swipeAwayRate} />
                </div>

                {/* YT Views */}
                <div className="flex items-center">
                  <span className="font-mono text-sm text-white">
                    {formatNum(row.ytVideo.views)}
                  </span>
                </div>

                {/* FB Views */}
                <div className="flex items-center">
                  {facebookConnected ? (
                    row.fbVideo ? (
                      <span className="font-mono text-sm text-white">
                        {formatNum(row.fbVideo.views)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-600 bg-[#1a1a1a] rounded px-1.5 py-0.5">
                      Not connected
                    </span>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center">
                  <span className="font-mono text-sm font-bold text-[#FF0000]">
                    {formatNum(row.totalViews)}
                  </span>
                </div>

                {/* Platform bar */}
                <div className="flex items-center">
                  <PlatformBar
                    ytPercent={row.ytPercent}
                    fbPercent={row.fbPercent}
                    show={facebookConnected && !!row.fbVideo}
                  />
                </div>
              </div>

              {/* Expanded retention chart */}
              {isExpanded && (
                <div className="bg-[#0c0c0c] border-b border-[#1a1a1a] px-6 py-4 min-w-[800px]">
                  <RetentionFullChart
                    data={row.ytVideo.retention}
                    swipeAwayRate={row.ytVideo.swipeAwayRate}
                    avgRetention={row.ytVideo.avgRetention}
                    title={row.ytVideo.title}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
