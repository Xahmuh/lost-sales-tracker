
import React, { useState, useEffect, useMemo } from 'react';
import { spinWinService } from '../../services/spinWin';
import { SpinPrize, Spin, Branch } from '../../types';
import {
    Trophy,
    Settings,
    BarChart3,
    Users,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Filter,
    Download,
    Search,
    CheckCircle2,
    Clock,
    Ticket,
    RefreshCcw,
    Calendar,
    Target,
    Activity,
    Landmark,
    TrendingUp,
    Store,
    MapPin,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    MessageCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { RangeDatePicker } from '../RangeDatePicker';
import { SpinHeatmapCalendar } from './SpinHeatmapCalendar';
import { formatCurrency } from '../../utils/calculations';
import { mapBranchName } from '../../utils/excelUtils';
import { supabaseClient } from '../../lib/supabase';

interface ManagerDashboardProps {
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

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onBack }) => {
    const [activeView, setActiveView] = useState<'analytics' | 'prizes' | 'branches'>('analytics');
    const [prizes, setPrizes] = useState<SpinPrize[]>([]);
    const [spins, setSpins] = useState<any[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [isAddingPrize, setIsAddingPrize] = useState(false);
    const [editingPrizeId, setEditingPrizeId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<SpinPrize>>({});
    const [newPrize, setNewPrize] = useState<Partial<SpinPrize>>({
        name: '',
        probabilityWeight: 1,
        isActive: true,
        color: '#F43F5E'
    });

    const [isAddingBranch, setIsAddingBranch] = useState(false);
    const [newBranch, setNewBranch] = useState({
        name: '',
        code: '',
        whatsappNumber: '',
        googleMapsLink: ''
    });

    const [filters, setFilters] = useState({
        branchId: 'all',
        startDate: '',
        endDate: '',
        dateType: 'all' as 'all' | 'today' | '7d' | 'month' | 'custom',
        searchTerm: ''
    });

    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Pagination for Leaderboard
    const [leaderboardPage, setLeaderboardPage] = useState(1);

    // Manual Date Input State
    const [manualStart, setManualStart] = useState('');
    const [manualEnd, setManualEnd] = useState('');

    // Notification System
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const parseManualDate = (dateStr: string) => {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts;
        if (y.length !== 4 || m.length !== 2 || d.length !== 2) return null;
        return `${y}-${m}-${d}`;
    };

    const loadData = async () => {
        setIsSyncing(true);
        try {
            const [prizeList, spinList, branchList] = await Promise.all([
                spinWinService.prizes.list(),
                spinWinService.spins.list({
                    branchId: filters.branchId === 'all' ? undefined : filters.branchId,
                    startDate: filters.startDate,
                    endDate: filters.endDate
                }),
                spinWinService.management.branches.list()
            ]);
            setPrizes(prizeList);
            setSpins(spinList);
            setBranches(branchList);
        } catch (err) {
            console.error('Error loading manager data', err);
        } finally {
            setIsSyncing(false);
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
        loadData();
    }, [filters.branchId, filters.startDate, filters.endDate]);

    // Analytics Calculations
    const rankingMetrics = useMemo(() => {
        const branchStats: Record<string, { spins: number, redemptions: number }> = {};

        spins.forEach(s => {
            const name = s.branch?.name || 'Unknown Node';
            if (!branchStats[name]) branchStats[name] = { spins: 0, redemptions: 0 };
            branchStats[name].spins += 1;
            if (s.redeemed_at) branchStats[name].redemptions += 1;
        });

        const sortedByTraffic = Object.entries(branchStats)
            .sort((a, b) => b[1].spins - a[1].spins)
            .map(([name, data]) => ({ name, value: data.spins }));

        const sortedByRedemption = Object.entries(branchStats)
            .sort((a, b) => b[1].redemptions - a[1].redemptions)
            .map(([name, data]) => ({ name, value: data.redemptions }));

        const totalValueGranted = spins.reduce((acc, s) => acc + (Number(s.prize?.value) || 0), 0);
        const avgPrizeValue = spins.length > 0 ? totalValueGranted / spins.length : 0;

        return {
            total: spins.length,
            redeemed: spins.filter(s => s.redeemed_at).length,
            redemptionRate: spins.length > 0 ? (spins.filter(s => s.redeemed_at).length / spins.length) * 100 : 0,
            totalValueGranted,
            avgPrizeValue,
            uniqueCustomers: new Set(spins.map(s => s.customer_id)).size,
            repeatedVisits: spins.length - new Set(spins.map(s => s.customer_id)).size,
            topTraffic: sortedByTraffic,
            topRedemption: sortedByRedemption,
            topBranch: sortedByTraffic[0] ? [sortedByTraffic[0].name, sortedByTraffic[0].value] : ['N/A', 0]
        };
    }, [spins]);

    const metrics = rankingMetrics; // Maintain compatibility with existing code

    const exportAudit = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Spin Audit');

        sheet.columns = [
            { header: 'Date & Time', key: 'created_at', width: 25 },
            { header: 'Voucher Code', key: 'voucher_code', width: 15 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Customer Phone', key: 'phone', width: 15 },
            { header: 'Prize', key: 'prize_name', width: 25 },
            { header: 'Value (BHD)', key: 'value', width: 15 },
            { header: 'Branch', key: 'branch_name', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Redeemed At', key: 'redeemed_at', width: 25 }
        ];

        spins.forEach(s => {
            sheet.addRow({
                created_at: new Date(s.created_at).toLocaleString(),
                voucher_code: s.voucher_code,
                customer_name: s.customer?.first_name || 'N/A',
                phone: s.customer?.phone || 'N/A',
                prize_name: s.prize?.name || 'N/A',
                value: s.prize?.value || 0,
                branch_name: mapBranchName(s.branch?.name || 'N/A'),
                status: s.redeemed_at ? 'REDEEMED' : 'PENDING',
                redeemed_at: s.redeemed_at ? new Date(s.redeemed_at).toLocaleString() : '-'
            });
        });

        // Styling
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `SpinWin_Audit_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
    };

    const handleCreatePrize = async () => {
        if (!newPrize.name) return;
        try {
            await spinWinService.prizes.create({
                ...newPrize,
                type: 'general',
                value: 0,
                dailyLimit: 0
            } as Omit<SpinPrize, 'id' | 'createdAt'>);
            setIsAddingPrize(false);
            setNewPrize({ name: '', probabilityWeight: 1, isActive: true, color: '#F43F5E' });
            loadData();
            showNotification('success', 'Prize Configuration Implemented Successfully');
        } catch (err) {
            showNotification('error', 'Error creating prize configuration');
        }
    };

    const handleBulkStatusChange = async (enabled: boolean) => {
        if (!confirm(`Are you sure you want to ${enabled ? 'ENABLE' : 'DISABLE'} the Spin & Win protocol for ALL branches?`)) return;

        setIsSyncing(true);
        const branchesToUpdate = branches.filter(b => b.role === 'branch');
        console.log(`🔄 Starting bulk ${enabled ? 'activation' : 'suspension'} for ${branchesToUpdate.length} branches...`);

        let successCount = 0;
        let failCount = 0;
        const errors: any[] = [];

        try {
            const results = await Promise.allSettled(
                branchesToUpdate.map(async (b) => {
                    try {
                        console.log(`📍 Updating ${b.name} (${b.id}) - Setting isSpinEnabled to: ${enabled}`);
                        await spinWinService.management.branches.update(b.id, { isSpinEnabled: enabled });
                        successCount++;
                        console.log(`✅ Successfully updated ${b.name}`);
                        return { success: true, branch: b.name };
                    } catch (error) {
                        failCount++;
                        console.error(`❌ Failed to update ${b.name}:`, error);
                        errors.push({ branch: b.name, error });
                        throw error;
                    }
                })
            );

            console.log(`📊 Update Summary: ${successCount} succeeded, ${failCount} failed`);

            // Force reload data from database
            await loadData();

            if (failCount === 0) {
                showNotification('success', `✓ All ${branchesToUpdate.length} Branches ${enabled ? 'ACTIVATED' : 'SUSPENDED'}`);
            } else if (successCount > 0) {
                showNotification('error', `⚠ Partial Update: ${successCount} success, ${failCount} failed`);
            } else {
                showNotification('error', `❌ Complete Failure: All updates failed`);
            }
        } catch (err) {
            console.error('❌ Critical bulk update error:', err);
            showNotification('error', 'Critical error during bulk update');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCreateBranch = async () => {
        if (!newBranch.name || !newBranch.code) return;
        try {
            await spinWinService.management.branches.create({
                name: newBranch.name,
                code: newBranch.code,
                role: 'branch',
                whatsappNumber: newBranch.whatsappNumber,
                googleMapsLink: newBranch.googleMapsLink
            });
            setIsAddingBranch(false);
            setNewBranch({ name: '', code: '', whatsappNumber: '', googleMapsLink: '' });
            loadData();
            showNotification('success', 'New Branch Node Initialized');
        } catch (err: any) {
            console.error('Create branch caught error:', err);
            showNotification('error', `Error creating branch: ${err.message || 'Unknown Error'}`);
        }
    };

    const handleDeletePrize = async (id: string) => {
        if (!confirm('Are you sure you want to delete this prize?')) return;
        try {
            await spinWinService.prizes.delete(id);
            await spinWinService.prizes.delete(id);
            loadData();
            showNotification('success', 'Prize Removed from Inventory');
        } catch (err) {
            showNotification('error', 'Error deleting prize');
        }
    };

    const togglePrizeStatus = async (prize: SpinPrize) => {
        try {
            await spinWinService.prizes.update(prize.id, { isActive: !prize.isActive });
            loadData();
            showNotification('success', `Prize ${!prize.isActive ? 'Activated' : 'Deactivated'}`);
        } catch (err) {
            showNotification('error', 'Error updating prize status');
        }
    };

    const startEditing = (prize: SpinPrize) => {
        setEditingPrizeId(prize.id);
        setEditForm({ ...prize });
    };

    const cancelEditing = () => {
        setEditingPrizeId(null);
        setEditForm({});
    };

    const handleUpdatePrize = async () => {
        if (!editingPrizeId || !editForm.name) return;
        try {
            await spinWinService.prizes.update(editingPrizeId, {
                name: editForm.name,
                probabilityWeight: editForm.probabilityWeight,
                value: editForm.value,
                type: editForm.type,
                dailyLimit: editForm.dailyLimit
            });
            setEditingPrizeId(null);
            loadData();
            showNotification('success', 'Prize Details Updated');
        } catch (err) {
            showNotification('error', 'Error updating prize details');
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-4 lg:p-10 animate-in fade-in duration-700 relative">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-[200] px-6 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 animate-in slide-in-from-right-10 duration-500 border-l-4 ${notification.type === 'success'
                    ? 'bg-white text-emerald-600 border-emerald-500'
                    : 'bg-white text-red-600 border-red-500'
                    }`}>
                    <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {notification.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                    </div>
                    <div>
                        <h4 className={`font-black uppercase text-[10px] tracking-widest ${notification.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                            {notification.type === 'success' ? 'System Success' : 'Operation Failed'}
                        </h4>
                        <p className="text-xs font-bold text-slate-600">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-slate-300 hover:text-slate-900" title="Close Notification" aria-label="Close notification">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-10">

                {/* Sidebar Nav */}
                <aside className="lg:w-80 space-y-6">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-brand/30 transition-all duration-1000"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none">Manager<span className="text-brand">.</span></h2>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">Group Loyalty Hub</p>
                        </div>
                    </div>

                    <nav className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border-2 border-slate-100 p-4 space-y-2 shadow-xl shadow-slate-200/50 sticky top-32">
                        {[
                            { id: 'analytics', label: 'Network Intel', icon: BarChart3 },
                            { id: 'prizes', label: 'Reward Engine', icon: Trophy },
                            { id: 'branches', label: 'Node Control', icon: Landmark },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id as any)}
                                className={`w-full flex items-center space-x-4 px-6 py-5 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest transition-all duration-500 ${activeView === item.id
                                    ? 'bg-brand text-white shadow-xl shadow-brand/30 scale-105'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${activeView === item.id ? 'animate-pulse' : ''}`} />
                                <span>{item.label}</span>
                            </button>
                        ))}

                        <div className="pt-10">
                            <button
                                onClick={onBack}
                                className="w-full flex items-center space-x-4 px-6 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-brand hover:bg-red-50/50 transition-all border border-transparent hover:border-red-100"
                            >
                                <X className="w-5 h-5" />
                                <span>back to Spin & Win Suite</span>
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 space-y-10">

                    {activeView === 'analytics' && (
                        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Network Overview</h2>
                                    <p className="text-slate-400 font-medium text-sm">Real-time performance metrics</p>
                                </div>
                                <div className="relative z-50">
                                    <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                        className="flex items-center gap-3 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-white hover:border-red-200 transition-all">
                                        <Calendar size={16} className="text-red-600" />
                                        <span>{filters.dateType === 'today' ? 'Today' : filters.dateType === '7d' ? 'Last 7 Days' : filters.dateType === 'month' ? 'Last Month' : filters.dateType === 'custom' ? 'Custom Period' : 'Archive View'}</span>
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
                                                        <button key={t.id} onClick={() => { setFilters(f => ({ ...f, dateType: t.id as any, startDate: '', endDate: '' })); if (t.id !== 'custom') setIsDatePickerOpen(false); }}
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
                                                                showNotification('error', "Invalid Format. Please use DD-MM-YYYY");
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
                                                            setFilters(f => ({ ...f, startDate: '', endDate: '', dateType: 'all' }));
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
                            </div>

                            {/* Stats Grid */}
                            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StrategicKPI
                                    label="TOTAL PARTICIPATION"
                                    value={metrics.total}
                                    icon={<RefreshCcw size={20} />}
                                    isPrimary
                                    description="Spins Captured Across Network"
                                    subtext="Protocol Healthy"
                                />
                                <StrategicKPI
                                    label="CONVERSION VELOCITY"
                                    value={`${metrics.redemptionRate.toFixed(1)}%`}
                                    icon={<Target size={20} />}
                                    critical
                                    description={`${metrics.redeemed} Authorized Vouchers`}
                                    subtext="Live Redemption"
                                />
                                <StrategicKPI
                                    label="REDEEMED VOUCHERS"
                                    value={metrics.redeemed}
                                    icon={<CheckCircle2 size={20} />}
                                    description="Verified In-Store"
                                    subtext="Successful Claims"
                                />
                                <StrategicKPI
                                    label="PEAK NODE"
                                    value={metrics.topBranch[1]}
                                    icon={<Landmark size={20} />}
                                    unit="Wins"
                                    description={metrics.topBranch[0].split('-')[1] || metrics.topBranch[0]}
                                    subtext="High Traffic Node"
                                />
                            </section>

                            {/* Large Heatmap Row */}
                            <div className="w-full">
                                <SpinHeatmapCalendar spins={spins} />
                            </div>

                            {/* Branch Performance Leaderboard */}
                            <section className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden p-8 md:p-12 relative group hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-700">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white mr-4 shadow-lg shadow-slate-200">
                                            <Trophy size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Branch Engagement Leaderboard</h2>
                                            <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">Real-time Network Rankings</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setLeaderboardPage(p => Math.max(1, p - 1))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Previous Page" aria-label="Previous Page">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black tabular-nums shadow-lg">
                                            PAGE {leaderboardPage} / {Math.max(1, Math.ceil(metrics.topTraffic.length / 5))}
                                        </div>
                                        <button onClick={() => setLeaderboardPage(p => Math.min(Math.ceil(metrics.topTraffic.length / 5), p + 1))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" title="Next Page" aria-label="Next Page">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                                <th className="pb-4 pl-4 text-center w-16">Rank</th>
                                                <th className="pb-4">Branch Node</th>
                                                <th className="pb-4 text-center">Engagement Vol</th>
                                                <th className="pb-4 text-center">Conversion</th>
                                                <th className="pb-4 pr-4 w-1/3">Performance Distribution</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm font-bold text-slate-700">
                                            {metrics.topTraffic.slice((leaderboardPage - 1) * 5, leaderboardPage * 5).map((node, idx) => {
                                                const absIdx = (leaderboardPage - 1) * 5 + idx;
                                                const redemptionCount = metrics.topRedemption.find(r => r.name === node.name)?.value || 0;
                                                const rate = node.value > 0 ? (redemptionCount / node.value) * 100 : 0;
                                                const maxVal = metrics.topTraffic[0]?.value || 1;

                                                return (
                                                    <tr key={node.name} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group/row">
                                                        <td className="py-5 pl-4 text-center">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] mx-auto ${absIdx === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' :
                                                                absIdx === 1 ? 'bg-slate-300 text-white' :
                                                                    absIdx === 2 ? 'bg-amber-700/50 text-white' :
                                                                        'bg-slate-100 text-slate-400'
                                                                }`}>
                                                                #{absIdx + 1}
                                                            </div>
                                                        </td>
                                                        <td className="py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900 uppercase tracking-tight">{node.name}</span>
                                                                <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${rate > 50 ? 'bg-emerald-500' : rate > 20 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                                    {rate.toFixed(1)}% Conv. Rate
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 text-center">
                                                            <span className="px-4 py-2 bg-slate-50 rounded-xl text-slate-900 text-xs font-black tabular-nums border border-slate-100">
                                                                {node.value}
                                                            </span>
                                                        </td>
                                                        <td className="py-5 text-center">
                                                            <span className="px-4 py-2 bg-white rounded-xl text-brand text-xs font-black tabular-nums border border-slate-100 shadow-sm">
                                                                {redemptionCount} Used
                                                            </span>
                                                        </td>
                                                        <td className="py-5 pr-4">
                                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                                                                <div
                                                                    className="h-full bg-slate-900 group-hover/row:bg-brand transition-colors duration-500"
                                                                    style={{ width: `${(node.value / maxVal) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                {/* Strategic Score Card */}
                                <div className="lg:col-span-3 bg-slate-900 rounded-[3rem] p-16 text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] -mr-96 -mt-96"></div>
                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10">
                                                <TrendingUp className="text-brand w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Strategic Impact Index</span>
                                            </div>
                                            <h3 className="text-6xl font-black tracking-tighter leading-none">Intelligence <br /><span className="text-brand">Overlay.</span></h3>
                                        </div>

                                        <div className="flex gap-16">
                                            <div className="space-y-2">
                                                <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Acquisition Depth</p>
                                                <div className="text-7xl font-black text-white italic tracking-tighter">
                                                    {((metrics.uniqueCustomers / (metrics.total || 1)) * 100).toFixed(0)}<span className="text-2xl text-brand ml-1">%</span>
                                                </div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">Growth Velocity</p>
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <p className="text-brand/30 text-[9px] font-black uppercase tracking-[0.4em] mb-4">Loyalty Loop</p>
                                                <div className="text-7xl font-black text-brand italic tracking-tighter">{metrics.repeatedVisits}</div>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-4">Retained Asset</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* Filters & Table */}
                            <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden min-h-[600px] group hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-700">
                                <div className="p-8 border-b border-slate-50 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center space-x-6 flex-1 min-w-[300px]">
                                        {/* Branch Filter */}
                                        <select
                                            className="px-6 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 outline-none text-[10px] font-black uppercase tracking-widest text-slate-600 focus:border-brand transition-all"
                                            value={filters.branchId}
                                            onChange={(e) => setFilters(f => ({ ...f, branchId: e.target.value }))}
                                            title="Filter by Branch"
                                            aria-label="Filter by Branch"
                                        >
                                            <option value="all">Global Network</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>

                                        {/* Time Filter */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                                className="px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center space-x-3 hover:bg-white transition-all group shadow-sm active:scale-95"
                                            >
                                                <Calendar className="w-4 h-4 text-slate-400 group-hover:text-brand transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                                                    {filters.startDate ? `${filters.startDate} → ${filters.endDate}` : 'Temporal Filter'}
                                                </span>
                                            </button>

                                            {isDatePickerOpen && (
                                                <div className="absolute top-full left-0 mt-4 z-[100] shadow-2xl">
                                                    <RangeDatePicker
                                                        startDate={filters.startDate}
                                                        endDate={filters.endDate}
                                                        onSelect={(s, e) => setFilters(f => ({ ...f, startDate: s, endDate: e, dateType: 'custom' }))}
                                                        onClose={() => setIsDatePickerOpen(false)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative flex-1 group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand transition-colors" />
                                            <input
                                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:bg-white focus:border-brand text-[10px] font-bold text-slate-900 transition-all"
                                                placeholder="SEARCH SECURITY CODES OR NUMBERS..."
                                                value={filters.searchTerm}
                                                onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={exportAudit}
                                        className="bg-slate-900 hover:bg-brand text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center space-x-3 transition-all active:scale-95 shadow-lg shadow-slate-200"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>Export Secure Audit</span>
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prize Won</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voucher Code</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Branch Scanned</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date/Time</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {spins
                                                .filter(s =>
                                                    !filters.searchTerm ||
                                                    s.voucher_code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                                    s.customer?.phone?.includes(filters.searchTerm)
                                                )
                                                .map((spin) => (
                                                    <tr key={spin.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="font-bold text-slate-900 tabular-nums">{spin.customer?.phone}</div>
                                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{spin.customer?.first_name || 'Anonymous User'}</div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-[11px] text-slate-900 uppercase tracking-tighter">{spin.prize?.name}</span>
                                                                <span className="text-[8px] font-black text-brand uppercase tracking-widest mt-1">{spin.prize?.type}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit">
                                                                <code className="font-mono text-xs font-black text-brand tracking-widest">{spin.voucher_code}</code>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{spin.branch?.name?.split('-')[1] || spin.branch?.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {spin.redeemed_at ? (
                                                                <div className="flex items-center space-x-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full w-fit">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span className="font-black text-[8px] uppercase tracking-[0.2em]">Authorized</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full w-fit">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span className="font-black text-[8px] uppercase tracking-[0.2em]">Unredeemed</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col text-[10px] font-black tabular-nums">
                                                                <span className="text-slate-900">{new Date(spin.created_at).toLocaleDateString()}</span>
                                                                <span className="text-slate-300 uppercase tracking-widest mt-1">{new Date(spin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            {!spin.redeemed_at && (() => {
                                                                const createdDate = new Date(spin.created_at);
                                                                const expiryDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                                                                const now = new Date();
                                                                const daysLeft = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                                                const isUrgent = daysLeft <= 3 && daysLeft >= 0;
                                                                const isExpired = daysLeft < 0;

                                                                if (isExpired) return null;

                                                                return (
                                                                    <button
                                                                        onClick={async () => {
                                                                            const phone = spin.customer?.phone || '';
                                                                            const voucherCode = spin.voucher_code;
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
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'prizes' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Inventory Reward Optimization</h3>
                                <button
                                    onClick={() => setIsAddingPrize(true)}
                                    className="bg-brand text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20 flex items-center space-x-3 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Configure New Prize</span>
                                </button>
                            </div>

                            {isAddingPrize && (
                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white animate-in zoom-in duration-500">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Prize Label</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand"
                                                placeholder="Ex: 20% Discount"
                                                value={newPrize.name}
                                                onChange={(e) => setNewPrize(p => ({ ...p, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Analytical Weight (1-100)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand"
                                                value={newPrize.probabilityWeight}
                                                onChange={(e) => setNewPrize(p => ({ ...p, probabilityWeight: parseInt(e.target.value) }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Display Color</label>
                                            <div className="flex items-center space-x-3">
                                                <input
                                                    type="color"
                                                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none appearance-none"
                                                    value={newPrize.color || '#F43F5E'}
                                                    onChange={(e) => setNewPrize(p => ({ ...p, color: e.target.value }))}
                                                />
                                                <span className="text-white/60 text-xs font-mono">{newPrize.color || '#F43F5E'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end space-x-4">
                                        <button onClick={() => setIsAddingPrize(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Discard</button>
                                        <button onClick={handleCreatePrize} className="bg-brand text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20">Implement Configuration</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {prizes.map((prize) => (
                                    <div key={prize.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm group hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-700 relative overflow-hidden">
                                        {!prize.isActive && !editingPrizeId && (
                                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                                <div className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.3em] pointer-events-auto">Inactive Node</div>
                                            </div>
                                        )}

                                        {editingPrizeId === prize.id ? (
                                            <div className="space-y-4 relative z-20">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Prize Name</label>
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand"
                                                        value={editForm.name || ''}
                                                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Weight</label>
                                                    <input
                                                        type="number"
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-brand"
                                                        value={editForm.probabilityWeight || 0}
                                                        onChange={e => setEditForm(p => ({ ...p, probabilityWeight: parseInt(e.target.value) }))}
                                                    />
                                                </div>
                                                <div className="space-y-2 pt-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Color Code</label>
                                                    <div className="flex items-center space-x-3">
                                                        <input
                                                            type="color"
                                                            className="w-full h-10 rounded-xl cursor-pointer bg-slate-50 border border-slate-100 p-1"
                                                            value={editForm.color || '#F43F5E'}
                                                            onChange={(e) => setEditForm(p => ({ ...p, color: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 pt-4">
                                                    <button onClick={handleUpdatePrize} className="flex-1 bg-brand text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-800">
                                                        Save
                                                    </button>
                                                    <button onClick={cancelEditing} className="px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start justify-between mb-8 relative z-20">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl`} style={{ backgroundColor: prize.color || '#3B82F6' }}>
                                                        <Trophy className="w-7 h-7" />
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => togglePrizeStatus(prize)}
                                                            className={`p-3 transition-all rounded-xl ${prize.isActive ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-300 bg-slate-50 hover:bg-slate-100'}`}
                                                            title={prize.isActive ? 'Deactivate' : 'Activate'}
                                                            aria-label={prize.isActive ? 'Deactivate' : 'Activate'}
                                                        >
                                                            <Activity className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => startEditing(prize)} className="p-3 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 rounded-xl hover:bg-slate-100" title="Edit Prize" aria-label="Edit Prize">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeletePrize(prize.id)} className="p-3 text-slate-300 hover:text-red-600 transition-all bg-slate-50 rounded-xl hover:bg-red-50" title="Delete Prize" aria-label="Delete Prize">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 relative z-20">{prize.name}</h4>
                                                <p className="text-brand font-black text-[10px] uppercase tracking-widest mb-6 relative z-20">Probability Weight: {prize.probabilityWeight}</p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeView === 'branches' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Branch Operational Control</h3>
                                    <p className="text-slate-400 font-medium text-lg">Central hub to manage branch locations and feature permissions.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-3 mr-4">
                                        <button
                                            onClick={() => handleBulkStatusChange(true)}
                                            disabled={isSyncing}
                                            className="px-6 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Activate All Branches</span>
                                        </button>
                                        <button
                                            onClick={() => handleBulkStatusChange(false)}
                                            disabled={isSyncing}
                                            className="px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>Suspend All Branches</span>
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setIsAddingBranch(true)}
                                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 hover:bg-brand transition-colors shadow-lg shadow-slate-200"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Add New Branch</span>
                                    </button>
                                    <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center space-x-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">{branches.filter(b => b.role === 'branch').length} Nodes Active</span>
                                    </div>
                                </div>
                            </div>

                            {isAddingBranch && (
                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white animate-in zoom-in duration-500 mb-8">
                                    <h4 className="text-2xl font-black tracking-tighter mb-8 text-white">Initialize New Branch Node</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Branch Name</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand text-white"
                                                placeholder="Ex: City Centre Branch"
                                                value={newBranch.name}
                                                onChange={(e) => setNewBranch(p => ({ ...p, name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Branch Code</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand text-white"
                                                placeholder="Ex: BH-CC-01"
                                                value={newBranch.code}
                                                onChange={(e) => setNewBranch(p => ({ ...p, code: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">WhatsApp Number</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand text-white"
                                                placeholder="With Country Code (Ex: 97333344445)"
                                                value={newBranch.whatsappNumber}
                                                onChange={(e) => setNewBranch(p => ({ ...p, whatsappNumber: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Google Maps Link</label>
                                            <input
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand text-white"
                                                placeholder="https://maps.app.goo.gl/..."
                                                value={newBranch.googleMapsLink}
                                                onChange={(e) => setNewBranch(p => ({ ...p, googleMapsLink: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end space-x-4">
                                        <button onClick={() => setIsAddingBranch(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Cancel</button>
                                        <button onClick={handleCreateBranch} className="bg-brand text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand/20">Create Node</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {branches.filter(b => b.role === 'branch').map((b) => (
                                    <div key={b.id} className="bg-white p-10 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10 group hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-700">
                                        <div className="flex items-center space-x-8 flex-1">
                                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500 ${b.isSpinEnabled ? 'bg-brand shadow-brand/30' : 'bg-slate-200 text-slate-400 shadow-none'}`}>
                                                <Store className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-4 w-full max-w-xl">
                                                <div className="flex items-center space-x-3">
                                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{b.name}</h4>
                                                    <span className="px-3 py-1 bg-slate-100 rounded-lg font-black text-[9px] text-slate-400 uppercase tracking-widest">{b.code}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                    <div className="flex items-center space-x-3 text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all">
                                                        <MapPin className="w-4 h-4 shrink-0" />
                                                        <input
                                                            type="text"
                                                            defaultValue={b.googleMapsLink || ''}
                                                            onBlur={async (e) => {
                                                                const val = e.target.value;
                                                                if (val !== b.googleMapsLink) {
                                                                    await spinWinService.management.branches.update(b.id, { googleMapsLink: val });
                                                                    loadData();
                                                                }
                                                            }}
                                                            placeholder="Google Maps Link..."
                                                            className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-700 w-full placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20 transition-all">
                                                        <MessageCircle className="w-4 h-4 shrink-0" />
                                                        <input
                                                            type="text"
                                                            defaultValue={b.whatsappNumber || ''}
                                                            onBlur={async (e) => {
                                                                const val = e.target.value;
                                                                if (val !== b.whatsappNumber) {
                                                                    await spinWinService.management.branches.update(b.id, { whatsappNumber: val });
                                                                    loadData();
                                                                }
                                                            }}
                                                            placeholder="WhatsApp Number..."
                                                            className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-700 w-full placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-10 shrink-0">
                                            <div className="flex flex-col items-center space-y-3">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spin Permission</span>
                                                <button
                                                    onClick={async () => {
                                                        await spinWinService.management.branches.update(b.id, { isSpinEnabled: !b.isSpinEnabled });
                                                        loadData();
                                                        showNotification('success', `Node Permission ${!b.isSpinEnabled ? 'Granted' : 'Revoked'}`);
                                                    }}
                                                    className={`w-20 h-10 rounded-full p-1.5 transition-all duration-500 relative ${b.isSpinEnabled ? 'bg-brand' : 'bg-slate-100'}`}
                                                    title={b.isSpinEnabled ? 'Disable Spin' : 'Enable Spin'}
                                                    aria-label={b.isSpinEnabled ? 'Disable Spin' : 'Enable Spin'}
                                                >
                                                    <div className={`w-7 h-7 bg-white rounded-full shadow-lg transform transition-transform duration-500 ${b.isSpinEnabled ? 'translate-x-10' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="hidden lg:block h-12 w-px bg-slate-100"></div>

                                            <div className="flex items-center space-x-3">
                                                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${b.isSpinEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {b.isSpinEnabled ? 'ENABLED' : 'DISABLED'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
