import { NextResponse } from 'next/server';
import { fetchFacebookVideos } from '@/lib/facebook';

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return NextResponse.json({ connected: false, videos: [] });
  }

  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const videos = await fetchFacebookVideos(accessToken, pageId);
    const result = { connected: true, videos };
    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Facebook API error:', error);
    return NextResponse.json({ connected: false, videos: [], error: error.message });
  }
}
