export interface RetentionPoint {
  timeRatio: number;
  watchRatio: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  views: number;
  retention: RetentionPoint[];
  swipeAwayRate: number; // percentage (0-100)
  avgRetention: number;  // percentage (0-100)
}

export interface FacebookVideo {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  views: number;
}

export interface MatchedVideo {
  ytVideo: YouTubeVideo;
  fbVideo: FacebookVideo | null;
  matchScore: number | null; // 0-1
  totalViews: number;
  ytPercent: number;
  fbPercent: number;
}

export interface SummaryStats {
  totalYtViews: number;
  totalFbViews: number;
  totalCombinedViews: number;
  videoCount: number;
  avgViewsPerVideo: number;
  avgSwipeAwayRate: number;
  bestVideo: MatchedVideo | null;
  worstSwipeVideo: YouTubeVideo | null;
}

export interface GeneratedScript {
  idea: string;
  why: string;
  script: string;
}

export interface DashboardData {
  videos: MatchedVideo[];
  facebookConnected: boolean;
  lastUpdated: string;
}
