import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Banknote,
  Package,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronDown,
  CalendarDays,
  Landmark,
  Globe,
  MonitorCheck,
  ChevronRight,
  Clock,
  ArrowDownWideNarrow,
  AlertTriangle,
  Download,
  MapPin,
  ChevronLeft,
  Search,
  PieChart as PieChartIcon,
  ShieldCheck,
  Zap,
  Lock,
  Database,
  FileSpreadsheet,
  ArrowUpRight,
  RefreshCcw,
  Info,
  Filter,
  Maximize2
} from 'lucide-react';
import { RevenueChart } from '../../components/Charts';
import { DailyPerformanceCalendar } from '../../components/DailyPerformanceCalendar';
import { RangeDatePicker } from '../../components/RangeDatePicker';
import { supabase } from '../../lib/supabase';
import { LostSale, Branch, Product } from '../../types';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

// --- المكون الفرعي لكروت المؤشرات (KPI) مع معالجة العملة والتوسيط الدقيق ---
const StrategicKPI: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  isCurrency?: boolean;
  trend?: string;
}> = ({ label, value, icon, isCurrency, trend }) => {

  const processValue = (val: string | number) => {
    if (!isCurrency) return val;
    return String(val).replace(/[^\d.]/g, '');
  };

  return (
    <div className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center group hover:border-brand transition-all duration-500 relative overflow-hidden text-center min-h-[165px] md:min-h-[185px]">
      {/* Decorative Background Element */}
      <div className="absolute -right-6 -top-6 w-20 h-20 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      {/* Icon Sphere */}
      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white mb-4 shadow-xl group-hover:bg-brand group-hover:rotate-[360deg] transition-all duration-700 relative z-10">
        {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: 2.5 })}
      </div>

      <div className="flex flex-col items-center relative z-10 w-full">
        <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none antialiased">
          {label}
        </p>

        <div className="flex flex-col items-center justify-center">
          {isCurrency && (
            <span className="text-[10px] font-black text-brand mb-1 uppercase tracking-tighter leading-none antialiased">
              BHD
            </span>
          )}
          <div className="flex items-baseline justify-center">
            <span className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
              {processValue(value)}
            </span>
            {trend && <span className="text-[8px] font-bold text-emerald-500 ml-1">+{trend}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DashboardPageProps {
  user: Branch;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  // --- States Management System ---
  const [sales, setSales] = useState<LostSale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(user.role === 'admin' ? 'all' : user.id);
  const [dateType, setDateType] = useState<'all' | 'today' | '7d' | 'month' | 'custom'>('7d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paretoPage, setParetoPage] = useState(1);
  const [branchPage, setBranchPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(true);
  const [viewMode, setViewMode] = useState<'standard' | 'expanded'>('standard');

  const isAdmin = user.role === 'admin';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Helper to convert DD-MM-YYYY to YYYY-MM-DD
  const parseManualDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    if (y.length !== 4 || m.length !== 2 || d.length !== 2) return null;
    return `${y}-${m}-${d}`;
  };

  const formatToManual = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const [manualStart, setManualStart] = useState(formatToManual(startDate));
  const [manualEnd, setManualEnd] = useState(formatToManual(endDate));

  // --- Data Fetching Logic (Supabase Integration) ---
  const syncDashboardData = async () => {
    setIsSyncing(true);
    try {
      const activeBranchId = isAdmin ? selectedBranch : user.id;
      let rawData: LostSale[] = await supabase.sales.list(activeBranchId, user.role);

      const referenceDate = new Date();
      if (dateType === 'all') {
        // Do nothing, show all data
      } else if (dateType === 'today') {
        const threshold = new Date(); threshold.setHours(0, 0, 0, 0);
        rawData = rawData.filter(s => new Date(s.timestamp) >= threshold);
      } else if (dateType === '7d') {
        const threshold = new Date(); threshold.setDate(referenceDate.getDate() - 7);
        rawData = rawData.filter(s => new Date(s.timestamp) >= threshold);
      } else if (dateType === 'month') {
        const threshold = new Date(); threshold.setDate(referenceDate.getDate() - 30);
        rawData = rawData.filter(s => new Date(s.timestamp) >= threshold);
      } else if (dateType === 'custom' && startDate && endDate) {
        const start = new Date(startDate); start.setHours(0, 0, 0, 0);
        const end = new Date(endDate); end.setHours(23, 59, 59, 999);
        rawData = rawData.filter(s => {
          const d = new Date(s.timestamp);
          return d >= start && d <= end;
        });
      }
      setSales(rawData);
    } catch (error) {
      console.error("Critical Failure in Data Sync:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const initializeSystem = async () => {
      const [branchList, productList] = await Promise.all([
        supabase.branches.list(),
        supabase.products.list(user.id)
      ]);
      setBranches(branchList.filter(b => b.role === 'branch'));
      setProducts(productList);
      await syncDashboardData();
    };
    initializeSystem();

    // Real-time Update Listener
    const channel = supabase.client
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lost_sales' }, () => {
        syncDashboardData();
      })
      .subscribe();

    return () => { supabase.client.removeChannel(channel); };
  }, [selectedBranch, dateType, startDate, endDate]);

  // --- Analytics & Mathematical Engines ---
  const aggregateMetrics = useMemo(() => {
    const totalRevenue = sales.reduce((acc, sale) => acc + (Number(sale.totalValue) || 0), 0);
    const totalUnits = sales.reduce((acc, sale) => acc + (Number(sale.quantity) || 0), 0);
    const skuCount = new Set(sales.map(s => s.productName)).size;
    const averageOrderLoss = sales.length > 0 ? totalRevenue / sales.length : 0;

    const categoryFrequency: Record<string, number> = {};
    sales.forEach(s => {
      const cat = s.category || 'Standard';
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });
    const mostImpactedCategory = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { totalRevenue, totalUnits, incidentCount: sales.length, skuCount, averageOrderLoss, mostImpactedCategory };
  }, [sales]);

  const paretoAnalysis = useMemo(() => {
    const productMap: Record<string, { total: number, count: number }> = {};
    sales.forEach(s => {
      if (!productMap[s.productName]) productMap[s.productName] = { total: 0, count: 0 };
      productMap[s.productName].total += (Number(s.totalValue) || 0);
      productMap[s.productName].count += (Number(s.quantity) || 0);
    });

    const sortedImpact = Object.entries(productMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({ name, ...data }));

    const totalLossPool = sortedImpact.reduce((acc, item) => acc + item.total, 0);
    let runningSum = 0;

    return sortedImpact.map(item => {
      runningSum += item.total;
      const cumulativePercentage = (runningSum / (totalLossPool || 1)) * 100;
      return { ...item, isPriority: cumulativePercentage <= 80 };
    }).filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sales, searchTerm]);

  const temporalMatrix = useMemo(() => {
    const slots = Array.from({ length: 24 }, (_, i) => ({ hour: i, value: 0 }));
    sales.forEach(s => {
      const h = parseInt(s.lostHour);
      if (!isNaN(h)) slots[h].value += Number(s.totalValue);
    });
    return slots;
  }, [sales]);

  const geographicDistribution = useMemo(() => {
    const nodeMap: Record<string, number> = {};
    sales.forEach(s => {
      const branchName = branches.find(b => b.id === s.branchId)?.name || 'Ghost Node';
      nodeMap[branchName] = (nodeMap[branchName] || 0) + (Number(s.totalValue) || 0);
    });
    return Object.entries(nodeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [sales, branches]);

  const performanceTrend = useMemo(() => {
    const trendMap: Record<string, number> = {};
    sales.forEach(s => {
      const dateStr = new Date(s.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      trendMap[dateStr] = (trendMap[dateStr] || 0) + Number(s.totalValue);
    });

    const timeline = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const platformLaunchDate = new Date('2026-01-01');
    platformLaunchDate.setHours(0, 0, 0, 0);

    let trendStartDate: Date;
    let trendEndDate: Date = new Date(now);

    if (dateType === 'today') {
      trendStartDate = new Date(now);
      trendStartDate.setDate(now.getDate() - 1);
    } else if (dateType === '7d') {
      trendStartDate = new Date(now);
      trendStartDate.setDate(now.getDate() - 6);
    } else if (dateType === 'month') {
      trendStartDate = new Date(now);
      trendStartDate.setDate(now.getDate() - 29);
    } else if (dateType === 'all') {
      trendStartDate = platformLaunchDate;
      // If there's data after today, show it, otherwise show until today
      const sorted = [...sales].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (sorted.length > 0) {
        const lastDataPoint = new Date(sorted[sorted.length - 1].timestamp);
        lastDataPoint.setHours(0, 0, 0, 0);
        trendEndDate = lastDataPoint > now ? lastDataPoint : now;
      }
    } else { // Custom
      if (!startDate || !endDate) return [];
      trendStartDate = new Date(startDate);
      trendEndDate = new Date(endDate);
    }

    const current = new Date(trendStartDate);
    while (current <= trendEndDate) {
      const dateStr = current.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      timeline.push({
        name: dateStr,
        value: trendMap[dateStr] || 0
      });
      current.setDate(current.getDate() + 1);
    }

    return timeline;
  }, [sales, dateType, startDate, endDate]);

  // --- Operational Handlers ---
  const triggerExport = async () => {
    setIsSyncing(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Lost Sales Audit');

      // 1. Fetch Fresh Product Mapping with a high limit to ensure we don't skip items
      const { data: dbProducts } = await supabase.client
        .from('products')
        .select('id, name, internal_code, category, agent')
        .limit(5000);

      const productMap = new Map();
      const productByName = new Map();

      // More lenient cleaning for Arabic/Multilingual support
      const clean = (str: string) => str?.toLowerCase().trim().replace(/\s+/g, ' ') || '';

      if (dbProducts) {
        dbProducts.forEach(p => {
          if (p.id) productMap.set(p.id, p);
          if (p.name) productByName.set(clean(p.name), p);
        });
      }

      // Define columns exactly as per screenshot
      worksheet.columns = [
        { header: 'Internal Code', key: 'internalCode', width: 22 },
        { header: 'Product Name', key: 'productName', width: 45 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Logged Time', key: 'loggedTime', width: 14 },
        { header: 'Branch Name', key: 'branchName', width: 25 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Unit Price (BHD)', key: 'unitPrice', width: 18 },
        { header: 'Total Value (BHD)', key: 'totalValue', width: 18 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Agent', key: 'agent', width: 20 },
      ];

      // Style Header Row
      worksheet.getRow(1).font = { bold: true, size: 11 };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 25;

      // Fill Data
      sales.forEach(s => {
        // Find product with recursive fallbacks
        let product = productMap.get(s.productId);

        // Fallback 1: Match by name if ID fails
        if (!product) {
          product = productByName.get(clean(s.productName));
        }

        // Fallback 2: Check if productId ITSELF looks like an internal code (starts with I or numeric)
        let codeToShow = 'N/A';
        if (product?.internal_code) {
          codeToShow = product.internal_code;
        } else if (s.productId && (s.productId.startsWith('I') || /^\d+$/.test(s.productId))) {
          // If productId is already a code (like I10813), use it
          codeToShow = s.productId;
        }

        const dateObj = new Date(s.timestamp);
        const loggedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        worksheet.addRow({
          internalCode: codeToShow,
          productName: s.productName,
          date: s.lostDate,
          loggedTime: loggedTime,
          branchName: branches.find(b => b.id === s.branchId)?.name || 'Unknown',
          quantity: s.quantity,
          unitPrice: Number(s.unitPrice || 0).toFixed(3),
          totalValue: Number(s.totalValue).toFixed(3),
          category: s.category || product?.category || 'Standard',
          agent: s.agentName || product?.agent || 'N/A'
        });
      });

      // Add Summation Row
      const totalLoss = sales.reduce((acc, s) => acc + Number(s.totalValue), 0);
      const sumRow = worksheet.addRow({
        internalCode: 'Total loss revenue',
        totalValue: totalLoss.toFixed(3)
      });

      // Style Summation Row
      const labelCell = sumRow.getCell(1);
      const valueCell = sumRow.getCell(8);

      [labelCell, valueCell].forEach(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF00' } // Yellow
        };
        cell.font = {
          bold: true,
          size: 14,
          color: { argb: 'FF000000' } // Black
        };
        cell.alignment = { horizontal: 'center' };
      });

      // Generate and Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Tabarak_Audit_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Export failed: Please check your connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  const activeBranchLabel = selectedBranch === 'all' ? 'CENTRAL CONSOLE' : branches.find(b => b.id === selectedBranch)?.name;

  return (
    <div className="max-w-[1650px] mx-auto space-y-6 md:space-y-8 px-4 md:px-8 py-6 animate-in fade-in duration-1000">

      {/* --- Section 1: Command Header --- */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative z-50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-brand rounded-[2rem] flex items-center justify-center shadow-2xl shadow-brand/30 group cursor-pointer overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Insights Dashbaord</h1>
            <div className="flex items-center mt-3 space-x-3 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 w-fit">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Node: {activeBranchLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10">
          {isAdmin && (
            <div className="relative">
              <button onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className="flex items-center space-x-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-brand hover:bg-white transition-all shadow-sm">
                <MapPin size={16} className="text-brand" />
                <span className="max-w-[120px] truncate">{activeBranchLabel}</span>
                <ChevronDown size={14} className={`transition-transform duration-500 ${isBranchDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isBranchDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-[100] animate-in zoom-in-95 duration-300">
                  <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    <button onClick={() => { setSelectedBranch('all'); setIsBranchDropdownOpen(false); }} className={`w-full text-left p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranch === 'all' ? 'bg-brand text-white shadow-lg' : 'hover:bg-slate-50'}`}>All Global Branches</button>
                    {branches.map(b => (
                      <button key={b.id} onClick={() => { setSelectedBranch(b.id); setIsBranchDropdownOpen(false); }} className={`w-full text-left p-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedBranch === b.id ? 'bg-brand text-white shadow-lg' : 'hover:bg-slate-50'}`}>{b.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center space-x-3 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-brand hover:bg-white transition-all shadow-sm">
              <CalendarDays size={16} className="text-brand" />
              <span>{dateType === 'today' ? 'Today' : dateType === '7d' ? 'Last 7 Days' : dateType === 'month' ? 'Last Month' : dateType === 'custom' ? 'Custom Period' : 'Archive View'}</span>
              <ChevronDown size={14} />
            </button>
            {isDatePickerOpen && (
              <div className={`absolute top-full right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-[100] animate-in slide-in-from-top-5 duration-300 ${dateType === 'custom' ? 'w-auto' : 'w-72'}`}>
                {dateType !== 'custom' ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { id: 'all', label: 'All Time', sub: 'Total Historical Archive' },
                      { id: 'today', label: 'Today', sub: 'Active Duty Records' },
                      { id: '7d', label: 'Last 7 Days', sub: 'Weekly Performance' },
                      { id: 'month', label: 'Last Month', sub: '30-Day Fiscal Cycle' },
                      { id: 'custom', label: 'Choose Period', sub: 'Manual Calendar Protocol' }
                    ].map(t => (
                      <button key={t.id} onClick={() => { setDateType(t.id as any); if (t.id !== 'custom') setIsDatePickerOpen(false); }}
                        className={`w-full text-left p-4 rounded-xl transition-all ${dateType === t.id ? 'bg-brand text-white shadow-lg' : 'hover:bg-slate-50'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest">{t.label}</p>
                        <p className={`text-[8px] font-bold ${dateType === t.id ? 'text-white/60' : 'text-slate-400'} uppercase mt-1 tracking-tighter`}>{t.sub}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-[280px] p-2 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">From (DD-MM-YYYY)</label>
                        <input
                          type="text"
                          placeholder="01-01-2026"
                          value={manualStart}
                          onChange={(e) => setManualStart(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black outline-none focus:border-brand transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">To (DD-MM-YYYY)</label>
                        <input
                          type="text"
                          placeholder="31-01-2026"
                          value={manualEnd}
                          onChange={(e) => setManualEnd(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black outline-none focus:border-brand transition-all"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const s = parseManualDate(manualStart);
                        const e = parseManualDate(manualEnd);
                        if (s && e) {
                          setStartDate(s);
                          setEndDate(e);
                          setIsDatePickerOpen(false);
                        } else {
                          alert("Invalid Format. Please use DD-MM-YYYY (e.g., 09-01-2026)");
                        }
                      }}
                      className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-brand transition-all"
                    >
                      Confirm Period
                    </button>
                    <button
                      onClick={() => {
                        setManualStart('');
                        setManualEnd('');
                        setStartDate('');
                        setEndDate('');
                        setDateType('all');
                        setIsDatePickerOpen(false);
                      }}
                      className="w-full text-slate-400 text-[8px] font-black uppercase tracking-widest hover:text-brand transition-colors"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={triggerExport} className="flex items-center space-x-3 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] hover:bg-brand transition-all shadow-xl hover:-translate-y-1">
            <Download size={16} />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </header>

      {/* --- Section 2: Macro KPI Grid (Currency Fix Applied) --- */}
      <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StrategicKPI label="TOTAL LOSS VALUE" value={aggregateMetrics.totalRevenue.toFixed(3)} icon={<Banknote />} isCurrency trend="4.2" />
        <StrategicKPI label="MISSED OPPORTUNITY" value={aggregateMetrics.totalUnits} icon={<Package />} />
        <StrategicKPI label="OUT-OF-STOCK SKUS" value={aggregateMetrics.skuCount} icon={<Activity />} />
        <StrategicKPI label="TOTAL INCIDENTS" value={aggregateMetrics.incidentCount} icon={<Users />} />
        <StrategicKPI label="AVG. LOSS PER ORDER" value={aggregateMetrics.averageOrderLoss.toFixed(3)} icon={<TrendingUp />} isCurrency />

        {/* Category Specific Card */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-brand transition-all duration-500 min-h-[165px] md:min-h-[185px]">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white mb-4 group-hover:bg-brand transition-all relative z-10">
            <Layers size={24} />
          </div>
          <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">CRITICAL SECTOR</p>
          <p className="text-xs md:text-sm lg:text-base font-black text-slate-900 uppercase tracking-tighter truncate max-w-full px-4">
            {aggregateMetrics.mostImpactedCategory}
          </p>
        </div>
      </section>

      {/* --- Section 3: Performance Calendar (RESTORED) --- */}
      <section className="w-full bg-white rounded-[2.8rem] border border-slate-100 shadow-sm overflow-hidden group transition-all duration-500">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white mr-4 group-hover:bg-brand transition-colors">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Operational Heatmap</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Temporal distribution of fiscal leakage</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-white border border-slate-100 px-4 py-2 rounded-xl text-[9px] font-black text-slate-400 space-x-3">
              <div className="flex items-center"><div className="w-2 h-2 bg-slate-100 rounded-sm mr-2"></div> Low</div>
              <div className="flex items-center"><div className="w-2 h-2 bg-brand/40 rounded-sm mr-2"></div> Med</div>
              <div className="flex items-center"><div className="w-2 h-2 bg-brand rounded-sm mr-2"></div> High</div>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6 overflow-x-auto custom-scrollbar">
          <DailyPerformanceCalendar sales={sales} />
        </div>
      </section>

      {/* --- Section 4: Deep Analytics Row --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 items-stretch">

        {/* REVENUE LEAKAGE (Pareto Optimization) */}
        <div className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col min-h-[520px] md:min-h-[580px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-2">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter flex items-center uppercase">
                <ArrowDownWideNarrow className="w-6 h-6 mr-3 text-brand" />
                Revenue Leakage
              </h2>
              <p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">Pareto Principal Analysis (80/20 Risk)</p>
            </div>
            <div className="relative group w-full sm:max-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-brand transition-colors" />
              <input type="text" placeholder="QUERY SKU NAME..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase outline-none focus:border-brand focus:bg-white transition-all shadow-inner" />
            </div>
          </div>

          <div className="space-y-3 flex-1 px-1">
            {paretoAnalysis.slice((paretoPage - 1) * 5, paretoPage * 5).map((item, idx) => (
              <div key={idx} className={`p-4 md:p-5 rounded-[1.8rem] flex items-center justify-between border transition-all duration-500 hover:scale-[1.01] ${item.isPriority ? 'bg-red-50/30 border-brand/5' : 'bg-slate-50 border-transparent'}`}>
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center font-black text-[10px] md:text-xs shadow-sm transition-colors ${item.isPriority ? 'bg-brand text-white' : 'bg-white text-slate-300'}`}>
                    {(paretoPage - 1) * 5 + idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-slate-800 text-sm md:text-base tracking-tight truncate max-w-[160px] md:max-w-[280px] leading-tight uppercase">
                      {item.name}
                    </p>
                    <div className="flex items-center mt-2 space-x-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">Freq: {item.count}</span>
                      {item.isPriority && <span className="text-[8px] font-black text-brand uppercase animate-pulse flex items-center"><Zap size={10} className="mr-1" /> High Risk SKU</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end shrink-0 pl-4">
                  <span className="text-[9px] font-black text-brand uppercase leading-none mb-1.5 opacity-70">BHD</span>
                  <span className="font-black text-slate-900 text-lg md:text-2xl tracking-tighter tabular-nums leading-none">
                    {item.total.toFixed(3)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between px-2">
            <button onClick={() => setParetoPage(p => Math.max(1, p - 1))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black text-slate-900 uppercase tabular-nums">Page {paretoPage} OF {Math.ceil(paretoAnalysis.length / 5) || 1}</span>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: Math.min(5, Math.ceil(paretoAnalysis.length / 5)) }).map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all ${paretoPage === i + 1 ? 'w-5 bg-brand' : 'w-1 bg-slate-200'}`}></div>
                ))}
              </div>
            </div>
            <button onClick={() => setParetoPage(p => Math.min(Math.ceil(paretoAnalysis.length / 5), p + 1))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* RISK PEAK HOURS (Temporal Matrix - Compact) */}
        <div className="bg-slate-900 rounded-[2rem] p-5 md:p-6 shadow-2xl relative overflow-hidden flex flex-col min-h-[520px] md:min-h-[580px]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand/10 rounded-full blur-[100px] animate-pulse"></div>

          <div className="flex items-center justify-between mb-8 relative z-10 px-2">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter flex items-center uppercase">
                <Clock className="w-6 h-6 mr-3 text-brand" />
                Risk Peak Hours
              </h2>
              <p className="text-[8px] font-black text-slate-500 uppercase mt-1 tracking-widest">Temporal Node distribution Analysis</p>
            </div>
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-brand animate-bounce">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 md:gap-4 flex-1 overflow-y-auto pr-3 custom-scrollbar-dark relative z-10 px-2">
            {temporalMatrix.map((h, i) => {
              const maxVal = Math.max(...temporalMatrix.map(d => d.value)) || 1;
              const ratio = h.value / maxVal;
              return (
                <div key={i} className="group relative aspect-square">
                  <div className="w-full h-full rounded-[1.2rem] flex flex-col items-center justify-center border border-white/5 transition-all duration-300 hover:scale-110 cursor-pointer shadow-xl"
                    style={{ backgroundColor: `rgba(139, 0, 0, ${Math.max(0.08, ratio)})` }}>
                    <span className="text-white/20 font-black text-[10px] group-hover:text-white transition-colors">{h.hour}h</span>
                    {ratio > 0.7 && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-brand rounded-full"></div>}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] bg-white p-4 rounded-[1.2rem] shadow-2xl min-w-[130px] border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-1">Impact at {h.hour}:00</p>
                    <p className="text-slate-900 font-black text-sm tabular-nums">{h.value.toFixed(3)} BHD</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white"></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 relative z-10 px-2">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-white/10 rounded-full border border-white/5"></div>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Normal Ops</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-brand rounded-full animate-ping"></div>
                <span className="text-[8px] font-black text-brand uppercase tracking-widest">Peak Leakage</span>
              </div>
            </div>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">
              <RefreshCcw size={10} className="text-brand animate-spin" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">Live Node Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 5: Trends & Node Dynamics (Final Matched Layer) --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 items-stretch pb-12">

        {/* LOSS TRENDING ANALYSIS */}
        <div className="bg-white rounded-[2.8rem] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col min-h-[550px] group">
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter flex items-center uppercase">
                <BarChart3 className="w-7 h-7 mr-3 text-brand" />
                Weekly Momentum
              </h2>
              <div className="flex items-center space-x-3 mt-1">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">7-Day Fiscal Trend Analysis</p>
                <span className="px-2 py-0.5 bg-brand text-white text-[8px] font-black rounded-md">1W</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-brand transition-colors">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="flex-1 min-h-[350px] relative">
            <RevenueChart data={performanceTrend} />
          </div>
        </div>

        {/* GEOGRAPHIC NODE IMPACT */}
        <div className="bg-white rounded-[2.8rem] p-6 md:p-10 border border-slate-100 shadow-sm flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter flex items-center uppercase">
                <PieChartIcon className="w-7 h-7 mr-3 text-brand" />
                Loss By Node
              </h2>
              <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-widest">Distribution across global network</p>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 font-black text-[10px] text-slate-500 tabular-nums">
              BATCH {branchPage} / {Math.ceil(geographicDistribution.length / 4) || 1}
            </div>
          </div>

          <div className="space-y-10 flex-1 px-2">
            {geographicDistribution.slice((branchPage - 1) * 4, branchPage * 4).map((b, i) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between items-end mb-4 px-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-2.5 h-2.5 bg-brand rounded-full group-hover:scale-[2] transition-transform duration-500 shadow-[0_0_10px_rgba(139,0,0,0.4)]"></div>
                    <span className="font-black text-slate-800 text-xs md:text-sm uppercase tracking-tight antialiased">{b.name}</span>
                  </div>
                  <div className="text-right flex flex-col items-center">
                    <span className="text-[9px] font-black text-brand uppercase leading-none mb-1 shadow-sm px-1.5 py-0.5 bg-red-50 rounded">BHD</span>
                    <span className="font-black text-slate-900 text-xl md:text-2xl tracking-tighter tabular-nums leading-none">
                      {b.value.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative shadow-inner">
                  <div
                    className="h-full bg-brand shadow-[0_0_20px_rgba(139,0,0,0.4)] transition-all duration-[2000ms] ease-out relative rounded-full"
                    style={{ width: `${(b.value / (aggregateMetrics.totalRevenue || 1)) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </div>
                </div>
              </div>
            ))}
            {geographicDistribution.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-200 py-20">
                <Database size={64} className="mb-4 opacity-10" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">No Remote Nodes Detected</span>
              </div>
            )}
          </div>

          <div className="mt-10 pt-10 border-t border-slate-50 flex items-center justify-between px-2">
            <button
              onClick={() => setBranchPage(p => Math.max(1, p - 1))}
              disabled={branchPage === 1}
              className="p-4 bg-slate-50 rounded-2xl disabled:opacity-20 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-3">
              {Array.from({ length: Math.ceil(geographicDistribution.length / 4) || 1 }, (_, i) => i + 1).map(p => (
                <div key={p} className={`h-2 rounded-full transition-all duration-700 ${branchPage === p ? 'w-12 bg-brand shadow-[0_0_15px_rgba(139,0,0,0.4)]' : 'w-2 bg-slate-100'}`}></div>
              ))}
            </div>
            <button
              onClick={() => setBranchPage(p => Math.min(Math.ceil(geographicDistribution.length / 4), p + 1))}
              disabled={branchPage === Math.ceil(geographicDistribution.length / 4)}
              className="p-4 bg-slate-50 rounded-2xl disabled:opacity-20 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Section 6: Government Footer --- */}
      <footer className="py-2 border-t border-slate-100 mt-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-30 italic">
        </div>
      </footer>
    </div>
  );
};