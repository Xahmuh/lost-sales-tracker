
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { spinWinService } from '../../services/spinWin';
import { supabaseClient } from '../../lib/supabase';
import { SpinSession, Branch } from '../../types';
import {
    QrCode,
    RefreshCcw,
    Clock,
    AlertCircle,
    Smartphone,
    CheckCircle2,
    ExternalLink,
    Users,
    Activity,
    Lock
} from 'lucide-react';

import { NETWORK_CONFIG } from '../../lib/networkConfig';

interface BranchQRGeneratorProps {
    branch: Branch;
    onBack: () => void;
}

export const BranchQRGenerator: React.FC<BranchQRGeneratorProps> = ({ branch, onBack }) => {
    const [session, setSession] = useState<SpinSession | null>(null);
    const [isMultiUse, setIsMultiUse] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLocked, setIsLocked] = useState(branch.isSpinEnabled === false);

    useEffect(() => {
        const checkPermission = async () => {
            const { data } = await supabaseClient
                .from('branches')
                .select('is_spin_enabled')
                .eq('id', branch.id)
                .single();

            if (data && data.is_spin_enabled === false) {
                setIsLocked(true);
            }
        };
        checkPermission();
    }, [branch.id]);

    const generateSession = async (multi: boolean = isMultiUse) => {
        if (isLocked) return;

        setIsLoading(true);
        setError('');
        try {
            const newSession = await spinWinService.sessions.generate(branch.id, multi);
            setSession(newSession);
            setTimeLeft(multi ? 7 * 24 * 60 * 60 : 600); // 7 days or 10 mins
        } catch (err: any) {
            setError(err.message || 'Failed to generate session. Connection error.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLocked) {
            generateSession(isMultiUse);
        }
    }, [isMultiUse, isLocked]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (session) {
            setSession(null);
        }
    }, [timeLeft, session]);

    const baseUrl = window.location.origin;
    const currentHost = window.location.hostname;
    const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

    const effectiveBaseUrl = isLocalhost
        ? `http://${NETWORK_CONFIG.localIp}:${NETWORK_CONFIG.port}`
        : baseUrl;

    const customerUrl = `${effectiveBaseUrl}${window.location.pathname}?token=${session?.token || ''}`;

    // LOCKED STATE UI
    if (isLocked) {
        return (
            <div className="max-w-4xl mx-auto p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-50 overflow-hidden flex flex-col items-center justify-center p-20 text-center relative selection:bg-red-100">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-50 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                    <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-8 relative z-10 animate-in zoom-in duration-500">
                        <Lock className="w-10 h-10" />
                    </div>

                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 relative z-10">Locked by Manager</h2>
                    <p className="text-slate-400 font-medium text-lg max-w-md mx-auto leading-relaxed relative z-10 mb-12">
                        This section has been restricted by the administration.
                    </p>

                    <div className="flex items-center space-x-2 text-red-500 bg-red-50 px-6 py-3 rounded-2xl border border-red-100 relative z-10 animate-pulse">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Status: Inactive</span>
                    </div>

                    <div className="pt-12 mt-4 border-t border-slate-100 w-full max-w-md relative z-10">
                        <button
                            onClick={onBack}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {isLocalhost && (
                <div className="mb-8 bg-emerald-50 border border-emerald-100 p-6 rounded-[2.5rem] flex items-center space-x-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-emerald-950 font-black text-[10px] uppercase tracking-widest mb-1">Network Sync: Active</h4>
                        <p className="text-emerald-700 text-[10px] font-bold leading-relaxed">
                            QR is automatically optimized for mobile access via <span className="underline">{NETWORK_CONFIG.localIp}</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-50 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: QR Display */}
                <div className="md:w-1/2 p-12 bg-slate-50 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                    <div className="relative mb-8 text-center flex flex-col items-center">
                        <div className="absolute -top-6 -left-6 w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand/20 z-10">
                            <QrCode className="w-6 h-6" />
                        </div>

                        <div className={`bg-white p-8 rounded-[2.5rem] shadow-2xl transition-all duration-700 ${!session ? 'blur-sm grayscale opacity-30 shadow-none' : ''}`}>
                            {session ? (
                                <QRCodeSVG value={customerUrl} size={250} level="H" includeMargin={false} />
                            ) : (
                                <div className="w-[250px] h-[250px] flex items-center justify-center bg-slate-100 rounded-3xl">
                                    <QrCode className="w-20 h-20 text-slate-200" />
                                </div>
                            )}
                        </div>

                        {session && (
                            <div className="mt-6 flex flex-col items-center space-y-3">
                                <div className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 shadow-xl whitespace-nowrap">
                                    <Clock className="w-3 h-3 text-brand" />
                                    <span>
                                        {isMultiUse
                                            ? `Expires in ${Math.ceil(timeLeft / (24 * 3600))} Days`
                                            : `Expires in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                                        }
                                    </span>
                                </div>
                                <div className="px-4 py-2 bg-slate-200/50 rounded-xl max-w-[280px]">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Generated Target URL</p>
                                    <code className="text-[10px] text-slate-600 font-bold break-all inline-block">{customerUrl}</code>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full max-w-[280px] bg-white border border-slate-100 p-1.5 rounded-2xl mb-8 flex items-center shadow-sm">
                        <button
                            onClick={() => setIsMultiUse(false)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isMultiUse ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Single Use
                        </button>
                        <button
                            onClick={() => setIsMultiUse(true)}
                            className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isMultiUse ? 'bg-brand text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            Multi Use
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => generateSession(isMultiUse)}
                            disabled={isLoading}
                            className="group flex items-center space-x-3 text-slate-400 hover:text-brand font-black uppercase tracking-[0.3em] text-[10px] transition-all"
                        >
                            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                            <span>Regenerate QR</span>
                        </button>

                        <button
                            onClick={async () => {
                                if (!customerUrl) return;

                                try {
                                    // Robust Copy Logic (Works on HTTP/Non-Secure too)
                                    if (navigator.clipboard && window.isSecureContext) {
                                        await navigator.clipboard.writeText(customerUrl);
                                    } else {
                                        // Fallback for older browsers or non-HTTPS
                                        const textArea = document.createElement("textarea");
                                        textArea.value = customerUrl;
                                        textArea.style.position = "fixed";
                                        textArea.style.left = "-9999px";
                                        textArea.style.top = "0";
                                        document.body.appendChild(textArea);
                                        textArea.focus();
                                        textArea.select();
                                        try {
                                            document.execCommand('copy');
                                        } catch (err) {
                                            console.error('Fallback copy failed', err);
                                            setError('Manual Copy Required: ' + customerUrl);
                                            return;
                                        }
                                        document.body.removeChild(textArea);
                                    }

                                    // Success UI Feedback
                                    const btn = document.getElementById('copy-btn-text');
                                    if (btn) btn.innerText = "COPIED!";
                                    setTimeout(() => {
                                        if (btn) btn.innerText = "COPY LINK";
                                    }, 2000);
                                } catch (err) {
                                    console.error('Copy failed', err);
                                    setError('Could not copy automatically. Please copy the URL below manually.');
                                }
                            }}
                            className="group flex items-center space-x-3 text-slate-400 hover:text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:bg-emerald-50 px-4 py-2 rounded-xl"
                        >
                            <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span id="copy-btn-text">Copy Link</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Instructions & Info */}
                <div className="flex-1 p-12">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 leading-tight">Customer Engagement Generator</h2>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed">
                            Show this QR code to the customer. They must scan it, rate the branch, and spin for a prize.
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        {[
                            { icon: Smartphone, title: 'Step 1: Scan', text: 'Customer scans QR with their mobile device.' },
                            { icon: Users, title: 'Step 2: Authenticate', text: 'Customer enters phone number for verification.' },
                            { icon: CheckCircle2, title: 'Step 3: Review', text: 'Wait for customer to rate branch on Google Maps.' },
                            { icon: ExternalLink, title: 'Step 4: Reward', text: 'Customer wins voucher redeemable anywhere.' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-start space-x-5">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                                    <s.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px] mb-1">{s.title}</h4>
                                    <p className="text-slate-400 text-sm font-medium">{s.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-10 bg-red-50 text-brand p-5 rounded-2xl flex items-center space-x-3 text-xs font-bold border border-red-100">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-8 border-t border-slate-100">
                        <button
                            onClick={onBack}
                            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] transition-all"
                        >
                            Back To Operational Hub
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
