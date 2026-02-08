
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
    Lock,
    MessageCircle
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

    // Editable message states
    const [talabatMessage, setTalabatMessage] = useState(`*طلبكم بالطريق!*
شكراً لثقتكم بصيدليات تبارك

*استمتع بهدية خاصة!*
دوّر العجلة واربح قسائم وخصومات حصرية مقدمة من صيدليات تبارك
و يمكنكم الاستفادة بالقسائم داخل الفروع او من خلال الطلب واتساب
التوصيل مجاني لجميع مناطق البحرين

*Your order is on the way!*
Thank you for trusting Tabarak Pharmacies

*Enjoy a special gift!*
Spin the wheel and win exclusive vouchers and discounts
from Tabarak Pharmacies, you can use the vouchers inside the branches or through WhatsApp
Free delivery to all areas of Bahrain
`);

    const [whatsappMessage, setWhatsappMessage] = useState(`*العب واربح!*
دوّر العجلة واحصل على قسائم حصرية من صيدليات تبارك
التوصيل مجاني لجميع مناطق البحرين

*Spin and Win!*
Win exclusive vouchers from Tabarak Pharmacies
Free delivery to all areas of Bahrain`);

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
    const talabatUrl = `${effectiveBaseUrl}${window.location.pathname}?token=${session?.token || ''}&skipRating=true`;

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

            {/* Back Button */}
            <div className="mb-6 text-center">
                <button
                    onClick={onBack}
                    className="px-8 py-4 bg-white border border-slate-200 hover:border-red-200 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] text-slate-500 hover:text-slate-900 transition-all shadow-sm hover:shadow-md"
                >
                    ← Back To Spin & Win Suite
                </button>
            </div>

            {/* Customer Engagement Generator - SAAS Style */}
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 px-8 py-8 border-b border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200/50">
                                <QrCode className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Customer Engagement Generator</h2>
                                <p className="text-sm text-gray-600 font-medium">Generate QR codes for customer rewards campaigns</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-blue-200">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Session Active</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Left: QR Code Display */}
                    <div className="bg-gradient-to-br from-gray-50 to-white p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100">
                        <div className="flex flex-col items-center">
                            {/* QR Code */}
                            <div className="mb-8">
                                <div className={`bg-white p-8 rounded-3xl shadow-lg border-2 border-gray-100 transition-all duration-700 ${!session ? 'opacity-30 grayscale' : ''}`}>
                                    {session ? (
                                        <QRCodeSVG value={customerUrl} size={220} level="H" includeMargin={false} />
                                    ) : (
                                        <div className="w-[220px] h-[220px] flex items-center justify-center bg-gray-100 rounded-2xl">
                                            <QrCode className="w-16 h-16 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Session Info */}
                            {session && (
                                <div className="w-full max-w-[300px] space-y-3 mb-8">
                                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        <span className="text-xs font-bold uppercase tracking-wider">
                                            {isMultiUse
                                                ? `Expires in ${Math.ceil(timeLeft / (24 * 3600))} Days`
                                                : `Expires in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                                            }
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target URL</p>
                                        <code className="text-xs text-gray-700 font-mono break-all">{customerUrl}</code>
                                    </div>
                                </div>
                            )}

                            {/* Mode Toggle */}
                            <div className="w-full max-w-[300px] bg-gray-100 p-1.5 rounded-xl mb-6 flex items-center">
                                <button
                                    onClick={() => setIsMultiUse(false)}
                                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!isMultiUse ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Single Use
                                </button>
                                <button
                                    onClick={() => setIsMultiUse(true)}
                                    className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${isMultiUse ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Multi Use
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[300px]">
                                <button
                                    onClick={() => generateSession(isMultiUse)}
                                    disabled={isLoading}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl uppercase tracking-wide text-xs transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                    <span>Regenerate</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!customerUrl) return;

                                        try {
                                            if (navigator.clipboard && window.isSecureContext) {
                                                await navigator.clipboard.writeText(customerUrl);
                                            } else {
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

                                            const btn = document.getElementById('copy-btn-text');
                                            if (btn) btn.innerText = "COPIED!";
                                            setTimeout(() => {
                                                if (btn) btn.innerText = "COPY";
                                            }, 2000);
                                        } catch (err) {
                                            console.error('Copy failed', err);
                                            setError('Could not copy automatically.');
                                        }
                                    }}
                                    className="flex-1 bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-600 font-bold py-3 px-4 rounded-xl uppercase tracking-wide text-xs transition-all hover:shadow-md flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    <span id="copy-btn-text">Copy</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Instructions */}
                    <div className="p-8 lg:p-12">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-3">How It Works</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Show this QR code to customers. They scan it, rate your branch, and spin for rewards.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Smartphone, title: 'Scan QR Code', text: 'Customer scans with mobile device', color: 'blue' },
                                { icon: Users, title: 'Enter Details', text: 'Provide phone number for verification', color: 'indigo' },
                                { icon: CheckCircle2, title: 'Rate Branch', text: 'Leave a Google Maps review', color: 'green' },
                                { icon: ExternalLink, title: 'Win Reward', text: 'Spin wheel for voucher prizes', color: 'orange' },
                            ].map((step, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className={`w-11 h-11 bg-${step.color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}>
                                        <step.icon className={`w-5 h-5 text-${step.color}-600`} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h4>
                                        <p className="text-xs text-gray-600">{step.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-semibold text-red-900 mb-1">Error</p>
                                    <p className="text-xs text-red-700">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Talabat Customer Engagement Section - SAAS Style */}
            <div className="mt-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 px-8 py-8 border-b border-orange-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200/50">
                                <Smartphone className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Talabat Customers</h3>
                                <p className="text-sm text-gray-600 font-medium">Send personalized delivery notifications with rewards</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-orange-200">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Campaign</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Send to Customer Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Customer Details</h4>
                                    <p className="text-xs text-gray-500">Enter phone to send via WhatsApp</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Country Code</label>
                                    <input
                                        type="text"
                                        id="talabat-country-code"
                                        defaultValue="973"
                                        placeholder="973"
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="talabat-phone"
                                        placeholder="33XXXXXX"
                                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold text-sm placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const countryCode = (document.getElementById('talabat-country-code') as HTMLInputElement)?.value || '973';
                                        const phone = (document.getElementById('talabat-phone') as HTMLInputElement)?.value;

                                        if (!phone) {
                                            alert('Please enter customer phone number');
                                            return;
                                        }

                                        const fullPhone = `${countryCode}${phone}`;
                                        const message = `${talabatMessage}\n\n Click here to play:\n${talabatUrl}`;

                                        window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-4 rounded-xl uppercase tracking-wide text-sm transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>Send via WhatsApp</span>
                                </button>
                            </div>
                        </div>

                        {/* Message Preview Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Message Template</h4>
                                        <p className="text-xs text-gray-500">Customize your message</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setTalabatMessage(`*طلبكم بالطريق!*
شكراً لثقتكم بصيدليات تبارك

*استمتع بهدية خاصة!*
دوّر العجلة واربح قسائم وخصومات حصرية مقدمة من صيدليات تبارك
و يمكنكم الاستفادة بالقسائم داخل الفروع او من خلال الطلب واتساب
التوصيل مجاني لجميع مناطق البحرين

*Your order is on the way!*
Thank you for trusting Tabarak Pharmacies

*Enjoy a special gift!*
Spin the wheel and win exclusive vouchers and discounts
from Tabarak Pharmacies, you can use the vouchers inside the branches or through WhatsApp
Free delivery to all areas of Bahrain
`)}
                                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-all"
                                >
                                    Reset
                                </button>
                            </div>

                            <textarea
                                value={talabatMessage}
                                onChange={(e) => setTalabatMessage(e.target.value)}
                                rows={12}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium leading-relaxed outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all resize-none"
                                placeholder="Edit your message here..."
                            />
                            <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Link will be added automatically</span>
                                <span className="text-gray-400">{talabatMessage.length} characters</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* WhatsApp Customer Engagement Section - SAAS Style */}
            <div className="mt-8 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 px-8 py-8 border-b border-green-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-200/50">
                                <MessageCircle className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">WhatsApp Customers</h3>
                                <p className="text-sm text-gray-600 font-medium">Share rewards campaign with your contacts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Campaign</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quick Share Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Quick Share</h4>
                                    <p className="text-xs text-gray-500">Broadcast to all contacts</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const message = `${whatsappMessage}\n\n Click here to play:\n${customerUrl}`;
                                    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-5 rounded-xl uppercase tracking-wide text-sm transition-all shadow-lg shadow-green-200 hover:shadow-xl hover:shadow-green-300 active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
                            >
                                <MessageCircle className="w-5 h-5" />
                                <span>Share via WhatsApp</span>
                            </button>

                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-900 mb-1">How it works</p>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Opens WhatsApp with your message pre-filled. Select contacts from your list to share the campaign.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message Template Card */}
                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Message Template</h4>
                                        <p className="text-xs text-gray-500">Customize your message</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setWhatsappMessage(`*العب واربح!*
دوّر العجلة واحصل على قسائم حصرية من صيدليات تبارك
التوصيل مجاني لجميع مناطق البحرين

*Spin and Win!*
Win exclusive vouchers from Tabarak Pharmacies
Free delivery to all areas of Bahrain`)}
                                    className="text-xs font-semibold text-green-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-all"
                                >
                                    Reset
                                </button>
                            </div>

                            <textarea
                                value={whatsappMessage}
                                onChange={(e) => setWhatsappMessage(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 text-sm font-medium leading-relaxed outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 transition-all resize-none"
                                placeholder="Edit your WhatsApp message here..."
                            />
                            <div className="mt-3 flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Link will be added automatically</span>
                                <span className="text-gray-400">{whatsappMessage.length} characters</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
