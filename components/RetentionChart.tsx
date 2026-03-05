'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, ReferenceArea } from 'recharts';
import { RetentionPoint } from '@/lib/types';

interface SparklineProps {
  data: RetentionPoint[];
  swipeAwayRate: number;
}

interface FullChartProps {
  data: RetentionPoint[];
  swipeAwayRate: number;
  avgRetention: number;
  title: string;
}

export function RetentionSparkline({ data }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-8 w-20">
        <span className="text-xs text-gray-600 font-mono">No data</span>
      </div>
    );
  }

  const chartData = data.map((p) => ({
    x: Math.round(p.timeRatio * 100),
    y: Math.round(p.watchRatio * 100),
  }));

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="y"
            stroke="#FF0000"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RetentionFullChart({ data, swipeAwayRate, avgRetention, title }: FullChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No retention data available for this video
      </div>
    );
  }

  const chartData = data.map((p) => ({
    x: Math.round(p.timeRatio * 100),
    y: Math.round(p.watchRatio * 100),
  }));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300 truncate max-w-xs">{title}</h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-gray-400">
            Avg retention: <span className="text-white">{avgRetention}%</span>
          </span>
          <span className="text-gray-400">
            Swipe-away:{' '}
            <span className={swipeAwayRate > 40 ? 'text-red-400' : 'text-green-400'}>
              {swipeAwayRate}%
            </span>
          </span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            {/* Swipe zone highlight */}
            <ReferenceArea x1={0} x2={5} fill="#FF0000" fillOpacity={0.07} />

            <XAxis
              dataKey="x"
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 6,
                fontSize: 11,
                color: '#fff',
              }}
              formatter={(value: any) => [`${value}%`, 'Watching']}
              labelFormatter={(l) => `${l}% through video`}
            />
            <ReferenceLine
              y={avgRetention}
              stroke="#666"
              strokeDasharray="3 3"
              label={{ value: 'Avg', fill: '#666', fontSize: 10, position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="y"
              stroke="#FF0000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#FF0000' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
        <div className="w-3 h-2 bg-[#FF0000] opacity-20 rounded-sm" />
        <span>Swipe zone (first 5%)</span>
        <div className="w-6 border-t border-dashed border-gray-600 ml-3" />
        <span>Channel average</span>
      </div>
    </div>
  );
}
