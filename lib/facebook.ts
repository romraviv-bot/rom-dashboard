import { FacebookVideo } from './types';

const FB_BASE = 'https://graph.facebook.com/v19.0';

export async function fetchFacebookVideos(
  accessToken: string,
  pageId: string
): Promise<FacebookVideo[]> {
  const fields = 'id,title,description,created_time,views';

  // Fetch regular videos
  const videosUrl = `${FB_BASE}/${pageId}/videos?fields=${fields}&access_token=${accessToken}&limit=25`;
  // Fetch reels
  const reelsUrl = `${FB_BASE}/${pageId}/video_reels?fields=${fields}&access_token=${accessToken}&limit=25`;

  const [videosRes, reelsRes] = await Promise.allSettled([
    fetch(videosUrl),
    fetch(reelsUrl),
  ]);

  const videos: FacebookVideo[] = [];

  if (videosRes.status === 'fulfilled' && videosRes.value.ok) {
    const data = await videosRes.value.json();
    for (const item of data.data || []) {
      videos.push({
        id: item.id,
        title: item.title || item.description || '',
        description: item.description || '',
        publishedAt: item.created_time,
        views: item.views || 0,
      });
    }
  }

  if (reelsRes.status === 'fulfilled' && reelsRes.value.ok) {
    const data = await reelsRes.value.json();
    for (const item of data.data || []) {
      // Avoid duplicates
      if (!videos.find((v) => v.id === item.id)) {
        videos.push({
          id: item.id,
          title: item.title || item.description || '',
          description: item.description || '',
          publishedAt: item.created_time,
          views: item.views || 0,
        });
      }
    }
  }

  return videos.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
