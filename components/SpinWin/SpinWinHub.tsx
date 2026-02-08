
import React, { useState, useTransition } from 'react';
import { Branch } from '../../types';
import {
    QrCode,
    Ticket,
    LayoutDashboard,
    ChevronRight,
    ArrowLeft,
    ShieldCheck
} from 'lucide-react';
import { BranchQRGenerator } from './BranchQRGenerator';
import { VoucherRedeemer } from './VoucherRedeemer';
import { BranchDashboard } from './BranchDashboard';
import { ManagerDashboard } from './ManagerDashboard';

interface SpinWinHubProps {
    branch: Branch;
    onBack: () => void;
    userRole: string;
}

export const SpinWinHub: React.FC<SpinWinHubProps> = ({ branch, onBack, userRole }) => {
    const [subTab, setSubTab] = useState<'menu' | 'qr' | 'redeem' | 'dashboard'>('menu');
    const [isPending, startTransition] = useTransition();

    const handleTabChange = (tab: 'menu' | 'qr' | 'redeem' | 'dashboard') => {
        startTransition(() => {
            setSubTab(tab);
        });
    };

    if (userRole === 'manager' || userRole === 'admin') {
        return <ManagerDashboard onBack={onBack} />;
    }

    if (subTab === 'qr') return <BranchQRGenerator branch={branch} onBack={() => handleTabChange('menu')} />;
    if (subTab === 'redeem') return <VoucherRedeemer branch={branch} onBack={() => handleTabChange('menu')} />;
    if (subTab === 'dashboard') return <BranchDashboard branch={branch} onBack={() => handleTabChange('menu')} />;

    const isEnabled = branch.isSpinEnabled !== false; // Default to true if undefined
    const canManage = userRole === 'manager' || userRole === 'admin';

    return (
        <div className={`max-w-6xl mx-auto p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="text-center mb-16">
                <div onClick={onBack} className="inline-flex items-center space-x-2 text-slate-400 hover:text-brand cursor-pointer mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Operational Suite</span>
                </div>
                <h2 className="text-3xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                    Spin & Win <span className="text-brand">Suite</span>
                </h2>
                <div className="flex items-center justify-center space-x-3">
                    <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[10px]">Centralized management for spins, rewards, vouchers, and branch performance tracking.</p>
                    {!isEnabled && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Node Permission Suspended
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 1. QR Generator - Disabled if not enabled */}
                <button
                    onClick={() => handleTabChange('qr')}
                    className={`group p-8 rounded-[2rem] border-2 transition-all duration-700 text-left flex flex-col justify-between h-[340px] active:scale-[0.98] relative overflow-hidden ${isEnabled ? 'bg-white border-slate-50 hover:border-brand shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-brand/20' : 'bg-slate-50 border-slate-100'}`}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-500 relative z-10">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tighter">Generate QR & Link</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed opacity-80">
                            {isEnabled
                                ? 'Generate session tokens for physical customers or shared links for delivery orders.'
                                : 'Access suspended by Global Administrator. Please contact management to re-enable.'
                            }
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 relative z-10">
                        <div className={`h-0.5 w-6 group-hover:w-12 transition-all duration-500 ${isEnabled ? 'bg-brand' : 'bg-slate-300'}`}></div>
                        <span className={`font-black text-[9px] uppercase tracking-[0.3em] ${isEnabled ? 'text-brand' : 'text-slate-300'}`}>
                            {isEnabled ? 'Launch Token Protocol' : 'Protocol Safe-Locked'}
                        </span>
                    </div>
                </button>

                {/* 2. Voucher Redeemer */}
                <button
                    onClick={() => handleTabChange('redeem')}
                    className="group bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-800 hover:border-brand shadow-2xl hover:shadow-brand/30 transition-all duration-700 text-left flex flex-col justify-between h-[340px] active:scale-[0.98] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full -mr-16 -mt-16"></div>
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/30 group-hover:bg-brand group-hover:text-white transition-all duration-500 relative z-10 ring-1 ring-white/10">
                        <Ticket className="w-8 h-8" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white mb-2 tracking-tighter">Redeem Vouchers</h3>
                        <p className="text-white/40 font-medium text-sm leading-relaxed">Verify unique security codes and authorize customer prize redemptions in the database.</p>
                    </div>
                    <div className="flex items-center space-x-3 relative z-10">
                        <div className="h-0.5 bg-brand w-6 group-hover:w-12 transition-all duration-500"></div>
                        <span className="text-brand font-black text-[9px] uppercase tracking-[0.3em]">Verify Security Code</span>
                    </div>
                </button>

                {/* 3. Dashboard Access */}
                <button
                    onClick={() => handleTabChange('dashboard')}
                    className="group bg-white p-8 rounded-[2rem] border-2 border-slate-50 hover:border-emerald-500 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-emerald-500/20 transition-all duration-700 text-left flex flex-col justify-between h-[340px] active:scale-[0.98] relative overflow-hidden"
                >
                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-500/[0.02] rounded-full -mr-20 -mb-20"></div>
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 relative z-10">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tighter uppercase leading-none"> Spin & Win dashboard </h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed opacity-80">Track today's engagement metrics, prizes claimed, and customer activity logs for this node.</p>
                    </div>
                    <div className="flex items-center space-x-3 relative z-10">
                        <div className="h-0.5 bg-emerald-500 w-6 group-hover:w-12 transition-all duration-500"></div>
                        <span className="text-emerald-500 font-black text-[9px] uppercase tracking-[0.3em]">
                            {canManage ? 'Global Manager Dashboard' : 'All metrics'}
                        </span>
                    </div>
                </button>
            </div>

            <div className="w-full mt-12">
                <img
                    src="/spin-suite-footer.jpg"
                    alt="Spin Suite Footer"
                    className="w-full h-auto object-cover"
                />
            </div>
        </div>
    );
};
