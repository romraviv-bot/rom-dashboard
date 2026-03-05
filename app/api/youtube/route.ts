import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchFullYouTubeData } from '@/lib/youtube';

// Cache
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (session.error === 'RefreshAccessTokenError') {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not configured' }, { status: 500 });
    }

    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    const videos = await fetchFullYouTubeData(session.accessToken, channelId);

    const result = { videos };
    cache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  // Force cache bust
  cache = null;
  return NextResponse.json({ ok: true });
}
