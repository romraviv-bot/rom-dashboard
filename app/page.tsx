'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ConnectYouTube from '@/components/ConnectYouTube';
import RefreshButton from '@/components/RefreshButton';
import StatsBar from '@/components/StatsBar';
import VideoTable from '@/components/VideoTable';
import ScriptModal from '@/components/ScriptModal';
import { DashboardData, SummaryStats } from '@/lib/types';

function computeStats(data: DashboardData): SummaryStats {
  const { videos } = data;
  if (videos.length === 0) {
    return {
      totalYtViews: 0,
      totalFbViews: 0,
      totalCombinedViews: 0,
      videoCount: 0,
      avgViewsPerVideo: 0,
      avgSwipeAwayRate: 0,
      bestVideo: null,
      worstSwipeVideo: null,
    };
  }

  const totalYtViews = videos.reduce((s, v) => s + v.ytVideo.views, 0);
  const totalFbViews = videos.reduce((s, v) => s + (v.fbVideo?.views || 0), 0);
  const totalCombinedViews = videos.reduce((s, v) => s + v.totalViews, 0);
  const videoCount = videos.length;
  const avgViewsPerVideo = Math.round(totalCombinedViews / videoCount);

  const withSwipe = videos.filter((v) => v.ytVideo.swipeAwayRate > 0);
  const avgSwipeAwayRate =
    withSwipe.length > 0
      ? Math.round(
          (withSwipe.reduce((s, v) => s + v.ytVideo.swipeAwayRate, 0) / withSwipe.length) * 10
        ) / 10
      : 0;

  const bestVideo = [...videos].sort((a, b) => b.totalViews - a.totalViews)[0] || null;

  const worstSwipeVideo =
    withSwipe.length > 0
      ? [...withSwipe].sort((a, b) => b.ytVideo.swipeAwayRate - a.ytVideo.swipeAwayRate)[0]
          .ytVideo
      : null;

  return {
    totalYtViews,
    totalFbViews,
    totalCombinedViews,
    videoCount,
    avgViewsPerVideo,
    avgSwipeAwayRate,
    bestVideo,
    worstSwipeVideo,
  };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);

  const fetchDashboard = useCallback(async (bust = false) => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard${bust ? '?bust=1' : ''}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to load');
      setDashboardData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchDashboard();
    }
  }, [session?.accessToken, fetchDashboard]);

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;
  const stats = dashboardData ? computeStats(dashboardData) : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF0000] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">ROM Performance</h1>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {dashboardData && (
              <RefreshButton
                onRefresh={() => fetchDashboard(true)}
                lastUpdated={dashboardData.lastUpdated}
              />
            )}

            {isAuthenticated && dashboardData && dashboardData.videos.length > 0 && (
              <button
                onClick={() => setShowScriptModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-semibold transition-colors shadow-lg shadow-red-900/20"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Generate Ideas + Script</span>
                <span className="sm:hidden">Generate</span>
              </button>
            )}

            <ConnectYouTube />

            {/* Settings */}
            <Link
              href="/settings"
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-white transition-colors"
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Not authenticated state */}
        {status !== 'loading' && !isAuthenticated && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF0000] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-2xl">R</span>
              </div>
              <h2 className="text-2xl font-bold text-white">ROM Performance Dashboard</h2>
              <p className="text-gray-400 mt-2 max-w-md">
                Connect your YouTube account to see your video analytics, retention curves, and
                AI-powered script ideas.
              </p>
            </div>
            <ConnectYouTube />
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>✓ YouTube Analytics</span>
              <span>✓ Retention curves</span>
              <span>✓ AI script generation</span>
            </div>
          </div>
        )}

        {/* Loading auth */}
        {status === 'loading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-[#FF0000] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Authenticated */}
        {isAuthenticated && (
          <>
            {/* Stats bar */}
            {stats && dashboardData && (
              <StatsBar stats={stats} facebookConnected={dashboardData.facebookConnected} />
            )}

            {/* Loading state */}
            {loading && !dashboardData && (
              <div className="space-y-4">
                {/* Skeleton stats */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5 h-24 animate-pulse" />
                {/* Skeleton table */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg animate-pulse" />
                ))}
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <p className="text-red-400 font-medium">Failed to load dashboard</p>
                <p className="text-red-400/70 text-sm mt-1">{error}</p>
                <button
                  onClick={() => fetchDashboard()}
                  className="mt-3 text-sm text-gray-400 hover:text-white underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Video table */}
            {dashboardData && !loading && (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                  <h2 className="text-sm font-semibold text-white">
                    Videos — Last 7 Days
                    <span className="ml-2 text-gray-500 font-normal text-xs">
                      ({dashboardData.videos.length} published)
                    </span>
                  </h2>
                  {loading && (
                    <div className="w-4 h-4 border border-gray-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <VideoTable
                  videos={dashboardData.videos}
                  facebookConnected={dashboardData.facebookConnected}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Script modal */}
      {showScriptModal && dashboardData && (
        <ScriptModal
          videos={dashboardData.videos}
          onClose={() => setShowScriptModal(false)}
        />
      )}
    </div>
  );
}
