
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingDown, Users, Package, DollarSign, BrainCircuit, RefreshCw } from 'lucide-react';
import { db } from '../services/db';
import { LostSale } from '../types';
import { getAIInsights } from '../services/gemini';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC = () => {
  const [sales, setSales] = useState<LostSale[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  useEffect(() => {
    setSales(db.getLostSales());
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((s, i) => s + i.totalValue, 0);
    const totalUnits = sales.reduce((s, i) => s + i.quantity, 0);
    const uniqueProducts = new Set(sales.map(s => s.productName)).size;
    return { totalRevenue, totalUnits, uniqueProducts, count: sales.length };
  }, [sales]);

  const salesByDay = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      const date = new Date(s.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
      map[date] = (map[date] || 0) + s.totalValue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const salesByBranch = useMemo(() => {
    const map: Record<string, number> = {};
    const branches = db.getBranches();
    sales.forEach(s => {
      const b = branches.find(branch => branch.id === s.branchId)?.name || 'Unknown';
      map[b] = (map[b] || 0) + s.totalValue;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      map[s.productName] = (map[s.productName] || 0) + s.quantity;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [sales]);

  // Fix: Added products argument to getAIInsights call as it expects (sales, availableProducts)
  const fetchInsights = async () => {
    setIsLoadingAi(true);
    const products = db.getProducts();
    const text = await getAIInsights(sales, products);
    setAiInsight(text);
    setIsLoadingAi(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Lost Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={<DollarSign />} color="blue" />
        <StatCard title="Lost Units" value={stats.totalUnits.toString()} icon={<Package />} color="green" />
        <StatCard title="Missed Customers" value={stats.count.toString()} icon={<Users />} color="amber" />
        <StatCard title="Unique Products" value={stats.uniqueProducts.toString()} icon={<TrendingDown />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Lost by Day</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Lost Revenue by Branch</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByBranch}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByBranch.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top 5 Lost Products (Units)</h3>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">{i+1}</div>
                  <span className="text-slate-700 font-medium">{p.name}</span>
                </div>
                <span className="font-mono text-slate-900 font-bold">{p.value} units</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-slate-400 text-center py-8">No data available</p>}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <BrainCircuit className="absolute top-[-20px] right-[-20px] w-48 h-48 opacity-10" />
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center">
                <BrainCircuit className="mr-3 text-blue-300" />
                AI Inventory Insights
              </h3>
              <button 
                onClick={fetchInsights}
                disabled={isLoadingAi}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              >
                <RefreshCw className={`w-5 h-5 ${isLoadingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {!aiInsight && !isLoadingAi && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-blue-200 mb-6">Analyze trends and get automated restocking recommendations.</p>
                <button 
                  onClick={fetchInsights}
                  className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition transform hover:scale-105"
                >
                  Generate Insights
                </button>
              </div>
            )}

            {isLoadingAi && (
              <div className="space-y-4 py-8">
                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-white/10 rounded w-5/6 animate-pulse"></div>
              </div>
            )}

            {aiInsight && !isLoadingAi && (
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-line text-blue-50 leading-relaxed font-light">
                  {aiInsight}
                </p>
                <p className="mt-8 text-xs text-blue-300 italic opacity-75">
                  Insights powered by Gemini AI based on recent {stats.count} transaction records.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'blue' | 'green' | 'amber' | 'red' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>{icon}</div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
};
