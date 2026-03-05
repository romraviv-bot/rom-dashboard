'use client';

import { useState, useCallback, useEffect } from 'react';
import { MatchedVideo, GeneratedScript } from '@/lib/types';

interface Props {
  videos: MatchedVideo[];
  onClose: () => void;
}

export default function ScriptModal({ videos, onClose }: Props) {
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Generation failed');
      }

      setScripts(data.ideas || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [videos]);

  // Auto-generate on open
  useEffect(() => {
    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-[#0f0f0f] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-lg font-bold text-white">Generate Ideas + Scripts</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              AI-powered ROM scripts based on your top performing content
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-2 border-[#FF0000] border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Analyzing your content + generating scripts...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">Error generating scripts</p>
              <p className="text-red-400/70 text-xs mt-1">{error}</p>
              <p className="text-gray-500 text-xs mt-2">
                Make sure ANTHROPIC_API_KEY is set in your environment variables.
              </p>
            </div>
          )}

          {!loading && scripts.map((s, idx) => (
            <div
              key={idx}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#FF0000] bg-[#FF0000]/10 px-2 py-0.5 rounded">
                      IDEA {idx + 1}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mt-2 leading-snug">{s.idea}</h3>
                  <p className="text-xs text-gray-400 mt-1 italic">{s.why}</p>
                </div>
              </div>

              {/* Script */}
              <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Script</span>
                  <button
                    onClick={() => copyToClipboard(s.script, idx)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 hover:text-white transition-colors"
                  >
                    {copiedIdx === idx ? (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-green-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-line font-mono">
                  {s.script}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!loading && (scripts.length > 0 || error) && (
          <div className="px-6 py-4 border-t border-[#1a1a1a] flex items-center justify-between">
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-300 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Generate More
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
