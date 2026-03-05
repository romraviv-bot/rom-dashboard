'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function ConnectYouTube() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm text-gray-400">
        <div className="w-3 h-3 rounded-full bg-gray-600 animate-pulse" />
        Checking...
      </div>
    );
  }

  if (session?.accessToken) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-gray-300 text-xs">{session.user?.email}</span>
        </div>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-xs text-gray-400 hover:text-white hover:border-[#3a3a3a] transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-medium transition-colors"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
      </svg>
      Connect YouTube Account
    </button>
  );
}
