
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

const COLORS = ['#8B0000', '#c00000', '#5a0000', '#ff4444', '#f43f5e'];

const ChartWrapper: React.FC<{
  children: React.ReactNode;
  height?: number | string;
  aspect?: number
}> = ({
  children,
  height = 400,
  aspect
}) => (
    <div className="w-full relative" style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}>
      <ResponsiveContainer
        width="100%"
        height={aspect ? undefined : (height as any)}
        aspect={aspect}
        debounce={100}
      >
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_12px_rgba(139,0,0,0.8)] animate-pulse"></div>
          <div>
            <p className="text-2xl font-black text-white tabular-nums tracking-tighter leading-none">
              {Number(payload[0].value).toFixed(3)}
            </p>
            <p className="text-[9px] font-black text-brand uppercase tracking-widest mt-1">BHD Lost Value</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ChartWrapper height={400}>
    <AreaChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B0000" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#8B0000" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.04)" strokeDasharray="8 8" />
      <XAxis
        dataKey="name"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900, fontFamily: 'Inter' }}
        dy={15}
        minTickGap={30}
      />
      <YAxis
        orientation="left"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 800, fontFamily: 'Inter' }}
        tickFormatter={(val) => Number(val).toFixed(2)}
        width={60}
      />
      <Tooltip
        content={<CustomTooltip />}
        cursor={{ stroke: '#8B0000', strokeWidth: 2, strokeDasharray: '6 6' }}
      />
      <Area
        type="monotone"
        dataKey="value"
        stroke="#8B0000"
        strokeWidth={4}
        fillOpacity={1}
        fill="url(#colorValue)"
        activeDot={{
          r: 8,
          fill: '#8B0000',
          stroke: '#fff',
          strokeWidth: 4,
          style: { filter: 'drop-shadow(0 0 8px rgba(139,0,0,0.6))' }
        }}
        animationDuration={2500}
      />
    </AreaChart>
  </ChartWrapper>
);

export const TopProductsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ChartWrapper aspect={1.77} height="auto">
    <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40 }}>
      <XAxis type="number" hide />
      <YAxis
        dataKey="name"
        type="category"
        axisLine={false}
        tickLine={false}
        tick={{ fill: '#475569', fontSize: 11, fontWeight: 700, fontFamily: 'Roboto' }}
        width={100}
      />
      <Tooltip
        cursor={{ fill: 'rgba(139, 0, 0, 0.05)' }}
        contentStyle={{
          borderRadius: '16px',
          border: 'none',
          fontFamily: 'Roboto'
        }}
      />
      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Bar>
    </BarChart>
  </ChartWrapper>
);
