
import React, { useState } from 'react';
import { spinWinService } from '../../services/spinWin';
import { Branch } from '../../types';
import {
    Ticket,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    User,
    MapPin,
    Gift,
    ShieldCheck,
    Loader2
} from 'lucide-react';

interface VoucherRedeemerProps {
    branch: Branch;
    onBack: () => void;
}

export const VoucherRedeemer: React.FC<VoucherRedeemerProps> = ({ branch, onBack }) => {
    const [code, setCode] = useState('VOUCH-');
    const [voucher, setVoucher] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length < 10) return;

        setIsLoading(true);
        setError('');
        setSuccess('');
        setVoucher(null);

        try {
            const data = await spinWinService.vouchers.find(code.trim().toUpperCase());
            if (!data) {
                setError('Voucher code not found in system.');
            } else {
                setVoucher(data);
            }
        } catch (err) {
            setError('Database connection error.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = async () => {
        if (!voucher) return;
        setIsLoading(true);
        try {
            await spinWinService.vouchers.redeem(voucher.id, branch.id);
            setSuccess('Voucher successfully redeemed!');
            // Refresh local state
            setVoucher({ ...voucher, redeemed_at: new Date().toISOString(), redeemed_branch_id: branch.id });
        } catch (err) {
            setError('Redemption failed. Try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isExpired = voucher && !voucher.redeemed_at && (new Date(voucher.created_at).getTime() + 7 * 24 * 60 * 60 * 1000) < Date.now();

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-50 overflow-hidden">
                <div className="p-12">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 leading-tight">Voucher Verification</h2>
                            <p className="text-slate-400 font-medium text-lg leading-relaxed">Secure protocol for redeeming customer rewards.</p>
                        </div>
                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white">
                            <Ticket className="w-8 h-8" />
                        </div>
                    </div>

                    <form onSubmit={handleSearch} className="relative mb-12">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Enter Security Code</label>
                        <div className="relative group">
                            <Ticket className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-brand transition-colors" />
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => {
                                    const val = e.target.value.toUpperCase();
                                    if (!val.startsWith('VOUCH-')) {
                                        if (val === 'VOUCH') setCode('VOUCH-'); // Prevent deleting hyphen
                                        else setCode('VOUCH-' + val.replace('VOUCH-', ''));
                                    } else {
                                        setCode(val);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (code === 'VOUCH-' && (e.key === 'Backspace' || e.key === 'Delete')) {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder="VOUCH-XXXXXX"
                                className="w-full bg-slate-50 border-2 border-slate-50 focus:border-brand focus:bg-white p-6 pl-16 rounded-3xl outline-none font-black text-xl tracking-widest transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || code.length < 10}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900 hover:bg-brand text-white p-3 rounded-2xl transition-all active:scale-95 disabled:opacity-30"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-6 rounded-3xl flex items-center space-x-4 mb-8 border border-red-100 animate-in zoom-in-95">
                            <XCircle className="w-8 h-8 shrink-0" />
                            <p className="font-black text-xs uppercase tracking-widest leading-loose">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-50 text-emerald-600 p-6 rounded-3xl flex items-center space-x-4 mb-8 border border-emerald-100 animate-in zoom-in-95">
                            <CheckCircle2 className="w-8 h-8 shrink-0" />
                            <p className="font-black text-xs uppercase tracking-widest leading-loose">{success}</p>
                        </div>
                    )}

                    {voucher && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Gift className="w-6 h-6 text-brand" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Won Prize</p>
                                            <h4 className="font-black text-slate-900 text-xl">{voucher.prize?.name}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Customer</p>
                                            <h4 className="font-black text-slate-900 text-lg uppercase">{voucher.customer?.first_name} {voucher.customer?.last_name}</h4>
                                            <p className="text-slate-400 font-bold text-xs">+{voucher.customer?.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Clock className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Won Date</p>
                                            <h4 className="font-black text-slate-900">{new Date(voucher.created_at).toLocaleDateString()}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">at {voucher.branch?.name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <MapPin className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Redemption Status</p>
                                            {voucher.redeemed_at ? (
                                                <div className="flex items-center space-x-2 text-emerald-600">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    <span className="font-black text-xs uppercase tracking-widest">Already Redeemed</span>
                                                </div>
                                            ) : isExpired ? (
                                                <div className="flex items-center space-x-2 text-red-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-black text-xs uppercase tracking-widest">Expired</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2 text-blue-500">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    <span className="font-black text-xs uppercase tracking-widest">Valid & Active</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {voucher.redeemed_at ? (
                                <div className="bg-slate-100 p-8 rounded-[2rem] text-center">
                                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">This voucher was redeemed on</p>
                                    <p className="text-slate-600 font-bold mt-1">{new Date(voucher.redeemed_at).toLocaleString()}</p>
                                </div>
                            ) : isExpired ? (
                                <div className="bg-red-50 p-8 rounded-[2rem] text-center border border-red-100">
                                    <p className="text-red-400 font-black text-[10px] uppercase tracking-widest underline underline-offset-4">Security Notice</p>
                                    <p className="text-red-900 font-black mt-2 text-lg">PROTOCOL EXPIRED</p>
                                    <p className="text-red-500 text-xs font-semibold mt-1">This reward is no longer valid for redemption.</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRedeem}
                                    disabled={isLoading}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-4"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                    <span>Authorize & Redeem Reward</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="pt-8 mt-12 border-t border-slate-100">
                        <button
                            onClick={onBack}
                            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] transition-all"
                        >
                            Back To Spin Hub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
