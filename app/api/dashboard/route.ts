import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchFullYouTubeData } from '@/lib/youtube';
import { fetchFacebookVideos } from '@/lib/facebook';
import { findBestMatch } from '@/lib/fuzzyMatch';
import { MatchedVideo } from '@/lib/types';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bust = url.searchParams.get('bust') === '1';

  if (bust) cache = null;

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json({ error: 'YOUTUBE_CHANNEL_ID not configured' }, { status: 500 });
    }

    // Fetch YT and FB in parallel
    const [ytVideos, fbResult] = await Promise.allSettled([
      fetchFullYouTubeData(session.accessToken, channelId),
      fetchFacebookData(),
    ]);

    const ytData = ytVideos.status === 'fulfilled' ? ytVideos.value : [];
    const { fbVideos, facebookConnected } =
      fbResult.status === 'fulfilled'
        ? fbResult.value
        : { fbVideos: [], facebookConnected: false };

    // Fuzzy match
    const fbTitles = fbVideos.map((v: any) => v.title);
    const matched: MatchedVideo[] = ytData.map((ytVideo) => {
      const match = findBestMatch(ytVideo.title, fbTitles);
      const fbVideo = match !== null ? fbVideos[match.index] : null;

      const ytViews = ytVideo.views;
      const fbViews = fbVideo?.views || 0;
      const total = ytViews + fbViews;

      return {
        ytVideo,
        fbVideo: fbVideo || null,
        matchScore: match?.score || null,
        totalViews: total,
        ytPercent: total > 0 ? Math.round((ytViews / total) * 100) : 100,
        fbPercent: total > 0 ? Math.round((fbViews / total) * 100) : 0,
      };
    });

    const result = {
      videos: matched,
      facebookConnected,
      lastUpdated: new Date().toISOString(),
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function fetchFacebookData(): Promise<{ fbVideos: any[]; facebookConnected: boolean }> {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return { fbVideos: [], facebookConnected: false };
  }

  try {
    const videos = await fetchFacebookVideos(accessToken, pageId);
    return { fbVideos: videos, facebookConnected: true };
  } catch {
    return { fbVideos: [], facebookConnected: false };
  }
}
