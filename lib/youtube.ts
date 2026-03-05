import { YouTubeVideo } from './types';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2';

export async function fetchRecentVideos(
  accessToken: string,
  channelId: string,
  maxResults = 25
): Promise<{ id: string; title: string; publishedAt: string; thumbnailUrl: string }[]> {
  const searchUrl = new URL(`${YT_BASE}/search`);
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('channelId', channelId);
  searchUrl.searchParams.set('maxResults', String(maxResults));
  searchUrl.searchParams.set('order', 'date');
  searchUrl.searchParams.set('type', 'video');

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`YouTube search failed: ${searchRes.status} ${err}`);
  }

  const searchData = await searchRes.json();
  const items = searchData.items || [];

  return items.map((item: any) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    publishedAt: item.snippet.publishedAt,
    thumbnailUrl: `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
  }));
}

export async function fetchVideoStats(
  accessToken: string,
  videoIds: string[]
): Promise<Record<string, number>> {
  if (videoIds.length === 0) return {};

  const statsUrl = new URL(`${YT_BASE}/videos`);
  statsUrl.searchParams.set('part', 'statistics');
  statsUrl.searchParams.set('id', videoIds.join(','));

  const statsRes = await fetch(statsUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!statsRes.ok) {
    const err = await statsRes.text();
    throw new Error(`YouTube stats failed: ${statsRes.status} ${err}`);
  }

  const statsData = await statsRes.json();
  const result: Record<string, number> = {};

  for (const item of statsData.items || []) {
    result[item.id] = parseInt(item.statistics?.viewCount || '0', 10);
  }

  return result;
}

export async function fetchRetentionData(
  accessToken: string,
  videoId: string,
  publishDate: string
): Promise<{ timeRatio: number; watchRatio: number }[]> {
  const today = new Date().toISOString().split('T')[0];
  const startDate = publishDate.split('T')[0];

  const url = new URL(`${YT_ANALYTICS_BASE}/reports`);
  url.searchParams.set('ids', 'channel==MINE');
  url.searchParams.set('metrics', 'audienceWatchRatio');
  url.searchParams.set('dimensions', 'elapsedVideoTimeRatio');
  url.searchParams.set('filters', `video==${videoId}`);
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', today);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    // Retention data is best-effort — return empty on failure
    return [];
  }

  const data = await res.json();
  const rows: [number, number][] = data.rows || [];

  return rows.map(([timeRatio, watchRatio]) => ({ timeRatio, watchRatio }));
}

export function calculateSwipeAwayRate(
  retention: { timeRatio: number; watchRatio: number }[]
): number {
  if (retention.length === 0) return 0;

  // Find the watch ratio at ~3% (first 3 seconds of a ~100s video ≈ 3% elapsed)
  const earlyPoints = retention.filter((p) => p.timeRatio <= 0.05);
  if (earlyPoints.length === 0) return 0;

  const earliest = earlyPoints[earlyPoints.length - 1];
  return Math.round((1 - earliest.watchRatio) * 100 * 10) / 10;
}

export function calculateAvgRetention(
  retention: { timeRatio: number; watchRatio: number }[]
): number {
  if (retention.length === 0) return 0;
  const sum = retention.reduce((acc, p) => acc + p.watchRatio, 0);
  return Math.round((sum / retention.length) * 100 * 10) / 10;
}

export async function fetchFullYouTubeData(
  accessToken: string,
  channelId: string
): Promise<YouTubeVideo[]> {
  const rawVideos = await fetchRecentVideos(accessToken, channelId);
  const videoIds = rawVideos.map((v) => v.id);
  const statsMap = await fetchVideoStats(accessToken, videoIds);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentVideos = rawVideos.filter(
    (v) => new Date(v.publishedAt) >= sevenDaysAgo
  );

  const videos: YouTubeVideo[] = await Promise.all(
    recentVideos.map(async (v) => {
      const retention = await fetchRetentionData(accessToken, v.id, v.publishedAt);
      return {
        id: v.id,
        title: v.title,
        publishedAt: v.publishedAt,
        thumbnailUrl: v.thumbnailUrl,
        views: statsMap[v.id] || 0,
        retention,
        swipeAwayRate: calculateSwipeAwayRate(retention),
        avgRetention: calculateAvgRetention(retention),
      };
    })
  );

  return videos.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
