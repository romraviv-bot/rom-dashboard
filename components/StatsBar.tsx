import { SummaryStats } from '@/lib/types';

interface Props {
  stats: SummaryStats;
  facebookConnected: boolean;
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-mono font-bold ${accent ? 'text-[#FF0000]' : 'text-white'}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function StatsBar({ stats, facebookConnected }: Props) {
  const swipeColor =
    stats.avgSwipeAwayRate === 0
      ? 'text-gray-400'
      : stats.avgSwipeAwayRate < 20
      ? 'text-green-400'
      : stats.avgSwipeAwayRate < 40
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* YouTube views */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#FF0000]">
              <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-wider">YouTube</span>
          </div>
          <span className="text-xl font-mono font-bold text-white">
            {formatNum(stats.totalYtViews)}
          </span>
          <span className="text-xs text-gray-500">views</span>
        </div>

        {/* Facebook views */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#1877f2]">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Facebook</span>
          </div>
          {facebookConnected ? (
            <>
              <span className="text-xl font-mono font-bold text-white">
                {formatNum(stats.totalFbViews)}
              </span>
              <span className="text-xs text-gray-500">views</span>
            </>
          ) : (
            <span className="text-sm text-gray-600 bg-[#1a1a1a] rounded px-2 py-0.5 w-fit mt-1">
              Not connected
            </span>
          )}
        </div>

        {/* Combined */}
        <Stat
          label="Combined"
          value={formatNum(stats.totalCombinedViews)}
          sub="total views"
          accent
        />

        {/* Videos published */}
        <Stat
          label="Published"
          value={String(stats.videoCount)}
          sub="videos this week"
        />

        {/* Avg swipe-away */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Avg Swipe-away</span>
          <span className={`text-xl font-mono font-bold ${swipeColor}`}>
            {stats.avgSwipeAwayRate > 0 ? `${stats.avgSwipeAwayRate}%` : '—'}
          </span>
          <span className="text-xs text-gray-500">hook strength</span>
        </div>

        {/* Best performer */}
        {stats.bestVideo && (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Best Video</span>
            <div className="flex items-center gap-2 mt-1">
              <img
                src={stats.bestVideo.ytVideo.thumbnailUrl}
                alt={stats.bestVideo.ytVideo.title}
                className="w-10 h-7 object-cover rounded"
              />
              <div>
                <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                  {stats.bestVideo.ytVideo.title}
                </p>
                <p className="text-xs font-mono text-[#FF0000] mt-0.5">
                  {formatNum(stats.bestVideo.totalViews)} views
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Worst swipe-away */}
      {stats.worstSwipeVideo && stats.worstSwipeVideo.swipeAwayRate > 0 && (
        <div className="mt-4 pt-4 border-t border-[#1a1a1a] flex items-center gap-3">
          <span className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
            Worst Hook
          </span>
          <img
            src={stats.worstSwipeVideo.thumbnailUrl}
            alt={stats.worstSwipeVideo.title}
            className="w-8 h-6 object-cover rounded"
          />
          <span className="text-xs text-gray-400 truncate max-w-xs">
            {stats.worstSwipeVideo.title}
          </span>
          <span className="text-xs font-mono text-red-400 ml-auto">
            {stats.worstSwipeVideo.swipeAwayRate}% swipe-away
          </span>
        </div>
      )}
    </div>
  );
}
