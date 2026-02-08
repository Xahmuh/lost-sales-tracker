
import React, { useState, useEffect } from 'react';
import { spinWinService } from '../../services/spinWin';
import { Branch } from '../../types';
import ExcelJS from 'exceljs';
import { mapBranchName } from '../../utils/excelUtils';
import { RangeDatePicker } from '../RangeDatePicker';
import {
    Users,
    Trophy,
    TrendingUp,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Clock,
    User,
    Bell,
    Gift,
    XCircle,
    RefreshCcw,
    Target,
    Activity,
    CheckCircle,
    Download,
    Search,
    Filter,
    ChevronDown,
    MessageCircle
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import { supabaseClient } from '../../lib/supabase';

interface BranchDashboardProps {
    branch: Branch;
    onBack: () => void;
}

const StrategicKPI: React.FC<{
    label: string;
    value: string | number;
    icon: React.ReactNode;
    isCurrency?: boolean;
    trend?: string;
    isPrimary?: boolean;
    subtext?: string;
    critical?: boolean;
    description?: string;
    unit?: string;
}> = ({ label, value, icon, isCurrency, trend, isPrimary, subtext, critical, description, unit }) => {
    return (
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 relative flex flex-col justify-between min-h-[180px] group ${isPrimary
            ? 'bg-red-900 border-red-900 text-white overflow-hidden shadow-2xl shadow-red-900/20'
            : critical
                ? 'bg-white border-red-100 text-slate-900 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10'
                : 'bg-white border-slate-100 text-slate-900 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10'
            }`}>
            {isPrimary && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            )}

            {!isPrimary && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/[0.02] rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
            )}

            {critical && !isPrimary && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-100 rounded-full shadow-sm z-20">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                    <span className="text-[7px] font-black text-red-600 uppercase tracking-[0.1em]">Protocol Active</span>
                </div>
            )}

            <div className={`flex items-start justify-between relative z-10 ${critical ? 'mt-4' : ''}`}>
                <div>
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isPrimary ? 'text-white/60' : 'text-slate-400 group-hover:text-brand transition-colors'}`}>
                        {label}
                    </h3>
                    {description && (
                        <p className={`mt-1 text-[11px] font-bold leading-tight ${isPrimary ? 'text-white' : 'text-[#1f161b]'}`}>
                            "{description}"
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-all duration-500 ${isPrimary
                    ? 'bg-white/10 border-white/10 text-white'
                    : critical
                        ? 'bg-red-50 border-red-100 text-red-600'
                        : 'bg-slate-50 border-slate-100 text-slate-400 group-hover:bg-brand group-hover:border-brand group-hover:text-white'
                    }`}>
                    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: 20 }) : icon}
                </div>
            </div>

            <div className="mt-4 relative z-10 flex flex-col">
                <div className="flex items-baseline gap-2">
                    {(isCurrency || unit) && (
                        <span className={`text-sm font-black tracking-tighter ${isPrimary ? 'text-white/40' : 'text-slate-300'}`}>
                            {isCurrency ? 'BHD' : unit}
                        </span>
                    )}
                    <span className={`text-5xl font-black tracking-tighter tabular-nums ${isPrimary ? 'text-white' : critical ? 'text-red-700' : 'text-slate-900 group-hover:text-brand transition-colors'}`}>
                        {value}
                    </span>
                </div>

                {subtext ? (
                    <div className={`mt-4 w-fit px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${isPrimary
                        ? 'bg-white/10 text-white/80'
                        : critical ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'
                        }`}>
                        {subtext}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export const BranchDashboard: React.FC<BranchDashboardProps> = ({ branch, onBack }) => {
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        searchTerm: '',
        dateType: 'today' as 'today' | '7d' | 'month' | 'custom' | 'all'
    });
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [manualStart, setManualStart] = useState('');
    const [manualEnd, setManualEnd] = useState('');

    const parseManualDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts;
        if (y.length !== 4 || m.length !== 2 || d.length !== 2) return null;
        return `${y}-${m}-${d}`;
    };

    const loadHistory = async () => {
        try {
            const data = await spinWinService.spins.list({
                branchId: branch.id,
                startDate: filters.startDate,
                endDate: filters.endDate
            });
            setHistory(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadStats = async () => {
        try {
            const data = await spinWinService.spins.getBranchStats(branch.id, filters.startDate, filters.endDate);
            setStats(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const now = new Date();
        if (filters.dateType === 'today') {
            const start = new Date(now.setHours(0, 0, 0, 0)).toISOString();
            setFilters(f => ({ ...f, startDate: start, endDate: '' }));
        } else if (filters.dateType === '7d') {
            const start = new Date(now.setDate(now.getDate() - 7)).toISOString();
            setFilters(f => ({ ...f, startDate: start, endDate: '' }));
        } else if (filters.dateType === 'month') {
            const start = new Date(now.setDate(now.getDate() - 30)).toISOString();
            setFilters(f => ({ ...f, startDate: start, endDate: '' }));
        } else if (filters.dateType === 'all') {
            setFilters(f => ({ ...f, startDate: '', endDate: '' }));
        }
    }, [filters.dateType]);

    useEffect(() => {
        loadHistory();
        loadStats();

        // Real-time Subscription for New Spins
        const channel = supabaseClient
            .channel('branch-spins')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'spins',
                    filter: `branch_id=eq.${branch.id}`
                },
                async (payload) => {
                    console.log('New Spin Detected!', payload);

                    // Fetch Customer/Prize details for notification
                    const [customer, prize] = await Promise.all([
                        supabaseClient.from('customers').select('first_name, phone').eq('id', payload.new.customer_id).single(),
                        supabaseClient.from('spin_prizes').select('name').eq('id', payload.new.prize_id).single()
                    ]);

                    const newNotification = {
                        name: customer.data?.first_name || 'New Customer',
                        phone: customer.data?.phone,
                        prize: prize.data?.name,
                        vCode: payload.new.voucher_code
                    };

                    setNotification(newNotification);
                    loadStats(); // Update dashboard automatically
                    loadHistory();

                    // Auto hide after 10s
                    setTimeout(() => setNotification(null), 10000);
                }
            )
            .subscribe();

        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [branch.id, filters.startDate, filters.endDate]);

    const exportData = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Branch Audit');

        sheet.columns = [
            { header: 'Date & Time', key: 'created_at', width: 25 },
            { header: 'Voucher Code', key: 'voucher_code', width: 15 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Customer Phone', key: 'phone', width: 15 },
            { header: 'Prize', key: 'prize_name', width: 25 },
            { header: 'Value (BHD)', key: 'value', width: 15 },
            { header: 'Branch Giver', key: 'branch_name', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Redeemed At', key: 'redeemed_at', width: 25 },
            { header: 'Redeemed Location', key: 'redeemed_location', width: 30 }
        ];

        history.forEach(s => {
            const redeemedBranchName = s.redeemed_branch?.name || (s.redeemed_branch_id ? 'Loading...' : '-');

            sheet.addRow({
                created_at: new Date(s.created_at).toLocaleString(),
                voucher_code: s.voucher_code,
                customer_name: s.customer?.first_name || 'N/A',
                phone: s.customer?.phone || 'N/A',
                prize_name: s.prize?.name || 'N/A',
                value: s.prize?.value || 0,
                branch_name: mapBranchName(s.branch?.name || branch.name),
                status: s.redeemed_at ? 'REDEEMED' : 'PENDING',
                redeemed_at: s.redeemed_at ? new Date(s.redeemed_at).toLocaleString() : '-',
                redeemed_location: mapBranchName(s.redeemed_branch?.name || (s.redeemed_branch_id ? 'External Branch' : '-'))
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Branch_${branch.code}_Audit.xlsx`;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Real-time Notification Alert */}
            {notification && (
                <div className="fixed top-8 right-8 z-[100] w-96 bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-4 border-brand p-8 animate-in slide-in-from-right duration-500 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative flex items-center space-x-6">
                        <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/20 animate-bounce">
                            <Bell className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-brand font-black text-[10px] uppercase tracking-widest mb-1">New Voucher Claimed!</h4>
                            <p className="text-slate-900 font-black text-lg leading-tight mb-1">{notification.name}</p>
                            <p className="text-slate-400 font-bold text-xs">+{notification.phone}</p>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Gift className="w-4 h-4 text-emerald-500" />
                            <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">{notification.prize}</span>
                        </div>
                        <code className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-mono font-black text-slate-400">{notification.vCode}</code>
                    </div>
                    <button
                        onClick={() => setNotification(null)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 transition-colors"
                        aria-label="Close notification"
                    >
                        <XCircle size={20} />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 uppercase">Spin & Win dashboard</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em]">Engagement Analytics: {branch.name}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative z-50">
                        <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-red-200 transition-all shadow-sm">
                            <Calendar size={16} className="text-red-600" />
                            <span>{filters.dateType === 'today' ? 'Today' : filters.dateType === '7d' ? 'Last 7 Days' : filters.dateType === 'month' ? 'Last Month' : filters.dateType === 'custom' ? 'Custom Period' : 'All Time'}</span>
                            <ChevronDown size={14} />
                        </button>
                        {isDatePickerOpen && (
                            <div className={`absolute top-full right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-[100] animate-in slide-in-from-top-5 duration-300 ${filters.dateType === 'custom' ? 'w-auto' : 'w-72'}`}>
                                {filters.dateType !== 'custom' ? (
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {[
                                            { id: 'all', label: 'All Time', sub: 'Total Historical Archive' },
                                            { id: 'today', label: 'Today', sub: 'Active Duty Records' },
                                            { id: '7d', label: 'Last 7 Days', sub: 'Weekly Performance' },
                                            { id: 'month', label: 'Last Month', sub: '30-Day Fiscal Cycle' },
                                            { id: 'custom', label: 'Choose Period', sub: 'Manual Calendar Protocol' }
                                        ].map(t => (
                                            <button key={t.id} onClick={() => { setFilters(f => ({ ...f, dateType: t.id as any })); if (t.id !== 'custom') setIsDatePickerOpen(false); }}
                                                className={`w-full text-left p-4 rounded-xl transition-all ${filters.dateType === t.id ? 'bg-red-900 text-white shadow-lg' : 'hover:bg-slate-50'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-widest">{t.label}</p>
                                                <p className={`text-[8px] font-bold ${filters.dateType === t.id ? 'text-white/60' : 'text-slate-400'} uppercase mt-1 tracking-tighter`}>{t.sub}</p>
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
                                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black outline-none focus:border-red-600 transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">To (DD-MM-YYYY)</label>
                                                <input
                                                    type="text"
                                                    placeholder="31-01-2026"
                                                    value={manualEnd}
                                                    onChange={(e) => setManualEnd(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10px] font-black outline-none focus:border-red-600 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const s = parseManualDate(manualStart);
                                                const e = parseManualDate(manualEnd);
                                                if (s && e) {
                                                    setFilters(f => ({ ...f, startDate: s, endDate: e }));
                                                    setIsDatePickerOpen(false);
                                                } else {
                                                    alert("Invalid Format. Please use DD-MM-YYYY (e.g., 09-01-2026)");
                                                }
                                            }}
                                            className="w-full bg-slate-900 text-white p-3.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-red-800 transition-all"
                                        >
                                            Confirm Period
                                        </button>
                                        <button
                                            onClick={() => {
                                                setManualStart('');
                                                setManualEnd('');
                                                setFilters(f => ({ ...f, dateType: 'all', startDate: '', endDate: '' }));
                                                setIsDatePickerOpen(false);
                                            }}
                                            className="w-full text-slate-400 text-[8px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
                                        >
                                            Reset Filter
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={onBack}
                        className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        back to Spin & Win Suite
                    </button>
                </div>
            </div>

            {/* Network Intel / Strategic KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StrategicKPI
                    label="TOTAL PARTICIPATION"
                    value={stats?.spins?.length || 0}
                    icon={<RefreshCcw size={20} />}
                    isPrimary
                    description="Spins Captured"
                    subtext="Total Filtered"
                />
                <StrategicKPI
                    label="CONVERSION VELOCITY"
                    value={`${stats?.spins?.length > 0 ? ((stats?.redeemsCount || 0) / stats.spins.length * 100).toFixed(1) : '0.0'}%`}
                    icon={<Target size={20} />}
                    critical
                    description={`${stats?.redeemsCount || 0} Authorized Vouchers`}
                    subtext="Live Redemption"
                />
                <StrategicKPI
                    label="REDEEMED VOUCHERS"
                    value={stats?.redeemsCount || 0}
                    icon={<CheckCircle size={20} />}
                    description="Verified In-Store"
                    subtext="Successful Claims"
                />
                <StrategicKPI
                    label="PLAYER REACH"
                    value={stats?.uniqueCustomersToday || 0}
                    icon={<Users size={20} />}
                    unit="Users"
                    description="Unique IDs Active"
                    subtext="Visits Overview"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden min-h-[600px] group hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-700">
                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6 bg-slate-50/30">
                    <div className="flex items-center space-x-6 flex-1 min-w-[300px]">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand transition-colors" />
                            <input
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white outline-none focus:border-brand text-[10px] font-bold text-slate-900 transition-all shadow-sm"
                                placeholder="SEARCH VOUCHERS, PHONES..."
                                value={filters.searchTerm}
                                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                            />
                        </div>
                    </div>

                    <button
                        onClick={exportData}
                        className="bg-slate-900 hover:bg-brand text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-3 transition-all active:scale-95 shadow-lg shadow-slate-200"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Data</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prize Won</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history
                                .filter(s =>
                                    !filters.searchTerm ||
                                    s.voucher_code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                    s.customer?.phone?.includes(filters.searchTerm)
                                )
                                .map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                                <div>
                                                    <p className="text-slate-900 font-black uppercase text-xs">{s.customer?.first_name || 'Incognito'}</p>
                                                    <p className="text-[10px] text-slate-400">+{s.customer?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-brand font-black uppercase text-xs">{s.prize?.name}</td>
                                        <td className="px-8 py-6">
                                            <code className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-mono tracking-widest">{s.voucher_code}</code>
                                        </td>
                                        <td className="px-8 py-6">
                                            {s.redeemed_at ? (
                                                <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    <span className="font-black text-[8px] uppercase tracking-[0.2em]">Redeemed</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full w-fit">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="font-black text-[8px] uppercase tracking-[0.2em]">Pending</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col text-[10px] font-black tabular-nums items-end">
                                                <span className="text-slate-900">{new Date(s.created_at).toLocaleDateString()}</span>
                                                <span className="text-slate-300 uppercase tracking-widest mt-1">{new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {!s.redeemed_at && (() => {
                                                const createdDate = new Date(s.created_at);
                                                const expiryDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                                                const now = new Date();
                                                const daysLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                const isUrgent = daysLeft <= 3 && daysLeft >= 0;
                                                const isExpired = daysLeft < 0;

                                                if (isExpired) return null;

                                                return (
                                                    <button
                                                        onClick={async () => {
                                                            const phone = s.customer?.phone || '';
                                                            const voucherCode = s.voucher_code;
                                                            const message = `*Time is running out!*\nRedeem your Tabarak Pharmacies voucher no ${voucherCode} now and make the most of your savings.\n\n*لا تضيع الفرصة!*\nقسيمتك ${voucherCode} من صيدليات تبارك  بتخلص قريب استعملها الحين واستمتع بأقوى توفير.`;

                                                            try {
                                                                // Try to fetch and share image with text (Mobile)
                                                                const response = await fetch('/spin-header-v4.jpg');
                                                                const blob = await response.blob();
                                                                const file = new File([blob], 'tabarak-reminder.jpg', { type: 'image/jpeg' });

                                                                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                                                                    await navigator.share({
                                                                        text: message,
                                                                        files: [file]
                                                                    });
                                                                } else {
                                                                    // Fallback to WhatsApp text-only (Desktop)
                                                                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                                }
                                                            } catch (err) {
                                                                console.error('Share failed:', err);
                                                                // Final fallback
                                                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                                                            }
                                                        }}
                                                        className={`px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 flex items-center space-x-2 shadow-lg ${isUrgent
                                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                                                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                                                            }`}
                                                    >
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                        <span>Remind Customer</span>
                                                    </button>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">
                                        No activity recorded for this period
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

