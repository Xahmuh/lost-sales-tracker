
import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Spinner } from './Spinner';
import { spinWinService } from '../../services/spinWin';
import { SpinPrize, SpinSession, Customer, Branch } from '../../types';
import {
    Phone,
    Mail,
    MapPin,
    Star,
    Trophy,
    Share2,
    CheckCircle2,
    AlertCircle,
    QrCode,
    Smartphone,
    MessageCircle,
    Download,
    UserCircle,
    ArrowRight,
    Loader2,
    Instagram,
    MessagesSquare
} from 'lucide-react';

interface CustomerFlowProps {
    token: string;
}

export const CustomerFlow: React.FC<CustomerFlowProps> = ({ token }) => {
    const [step, setStep] = useState<'validate' | 'info' | 'review' | 'spin' | 'result'>('validate');
    const [session, setSession] = useState<(SpinSession & { branches?: { name?: string, google_maps_link?: string, whatsapp_number?: string } }) | null>(null);
    const voucherRef = useRef<HTMLDivElement>(null);
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [prizes, setPrizes] = useState<SpinPrize[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wonPrize, setWonPrize] = useState<SpinPrize | null>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [error, setError] = useState('');
    const [countryCode, setCountryCode] = useState('+973');
    const [isLoading, setIsLoading] = useState(false);
    const [winningPrize, setWinningPrize] = useState<SpinPrize | null>(null);
    const [hasClickedRate, setHasClickedRate] = useState(false);
    const [skipRating, setSkipRating] = useState(false);

    const countryCodes = [
        { code: '+973', country: 'BH' },
        { code: '+966', country: 'SA' },
        { code: '+965', country: 'KW' },
        { code: '+971', country: 'AE' },
        { code: '+974', country: 'QA' },
        { code: '+968', country: 'OM' },
        { code: '+20', country: 'EG' },
        { code: '+44', country: 'UK' },
        { code: '+1', country: 'US' },
        { code: '+91', country: 'IN' },
        { code: '+63', country: 'PH' },
        { code: '+962', country: 'JO' },
        { code: '+961', country: 'LB' }
    ];

    useEffect(() => {
        const validateToken = async () => {
            try {
                const result = await spinWinService.sessions.validate(token);
                if (result && !result.error) {
                    setSession(result);

                    // Check if skipRating parameter is present (for Talabat customers)
                    const urlParams = new URLSearchParams(window.location.search);
                    const shouldSkipRating = urlParams.get('skipRating') === 'true';
                    setSkipRating(shouldSkipRating);

                    setStep('info');
                } else {
                    const reason = result?.error || 'INVALID_OR_NOT_FOUND';
                    setError(`Security Check Failed: ${reason}. Please ask the pharmacist for a NEW QR code.`);
                }
            } catch (err: any) {
                setError(`Connection error: ${err.message || 'Check network'}`);
            }
        };
        validateToken();
    }, [token]);

    // Clean URL and dynamic title on every step change
    useEffect(() => {
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);

        switch (step) {
            case 'info': document.title = "Register Entry"; break;
            case 'review': document.title = "Unlock Prize"; break;
            case 'spin': document.title = "Lucky Spinner"; break;
            case 'result': document.title = "You Won!"; break;
            default: document.title = "Tabarak Reward Hub";
        }
    }, [step]);

    const [ip, setIp] = useState('');

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone || !firstName || !lastName) return;
        setIsLoading(true);
        const fullPhone = `${countryCode}${phone}`;

        try {
            // 1. Get Client IP for Fraud Prevention
            let clientIp = '';
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
                setIp(clientIp);
            } catch (e) {
                console.warn('Failed to fetch IP', e);
                // We permit continuing if IP fails, but backend might enforce it strictly if updated to do so.
                // For now, we proceed, but ideally we want IP.
            }

            // 2. Upsert Customer
            const cust = await spinWinService.customers.upsert(fullPhone, email, firstName, lastName);
            setCustomer(cust);

            // 3. Check Daily Limit by IP (Anti-Fraud)
            const dailyCount = await spinWinService.spins.getDailyCount(clientIp || cust.id, clientIp ? 'ip' : 'customer');

            if (dailyCount >= 2) {
                setError(`Daily limit reached for this device/connection (2 spins). fraud protection active.`);
                return;
            }

            if (session) {
                // Skip review step for Talabat customers
                if (skipRating) {
                    loadPrizes();
                } else {
                    const hasReviewed = await spinWinService.reviews.checkToday(cust.id, session.branchId);
                    if (hasReviewed) {
                        loadPrizes();
                    } else {
                        setStep('review');
                    }
                }
            }
        } catch (err: any) {
            setError(`Error saving your details: ${err.message || 'Check connection'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPrizes = async () => {
        try {
            const activePrizes = await spinWinService.prizes.list();
            setPrizes(activePrizes.filter(p => p.isActive));
            setStep('spin');
        } catch (err) {
            setError('Error loading prizes.');
        }
    };

    const handleReviewClick = async () => {
        if (!customer || !session) return;
        spinWinService.reviews.log({
            customerId: customer.id,
            branchId: session.branchId,
            reviewClicked: true
        });
        const reviewUrl = session.branches?.google_maps_link || 'https://search.google.com/local/writereview?placeid=ChIJo_Y029TfPTUREonl7Y1yN5A';
        window.open(reviewUrl, '_blank');

        // Show the confirmation button instead of auto-loading
        setHasClickedRate(true);
    };

    const startSpin = async () => {
        if (isSpinning || isLoading) return;

        setIsLoading(true);
        setError('');

        try {
            // BACKEND IS THE SINGLE SOURCE OF TRUTH
            // Weighted selection and DB insertion happen in one atomic RPC call
            const result = await spinWinService.spins.play(token, {
                phone: `${countryCode}${phone}`,
                firstName,
                lastName,
                email,
                ip: ip // Pass the captured IP
            });

            console.log('Backend result received:', result);

            // 1. Prepare result for the end of animation
            setWinningPrize(result.prize);
            setVoucherCode(result.voucherCode);

            // 2. Start the physical rotation animation
            setIsSpinning(true);
        } catch (err: any) {
            console.error('Spin execution failed:', err);
            const msg = err.message || JSON.stringify(err);
            if (msg.includes('TOKEN_INVALID_OR_USED')) setError('This session is no longer valid.');
            else if (msg.includes('NO_PRIZES_CONFIGURED')) setError('No prizes are available right now.');
            else setError(`Server Error: ${msg}`); // Show the actual technical error
        } finally {
            setIsLoading(false);
        }
    };

    const handleSpinFinish = () => {
        setIsSpinning(false);
        setWonPrize(winningPrize);
        setStep('result');

        // Final UI Polish
        const newUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        document.title = "🎁 Your Voucher is Ready!";
    };

    const shareOnWhatsApp = async () => {
        if (!wonPrize || !voucherCode || !customer || !voucherRef.current) return;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);
        const expiryStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const branchName = session?.branches?.name || 'Tabarak Pharmacy';
        const fullName = `${firstName} ${lastName}`;
        const fullPhone = `${countryCode}${phone}`;
        const text = `Hey Tabarak! I just won ${wonPrize.name} at ${branchName}, My voucher code is ${voucherCode} and its expiry is ${expiryStr}.. my name is ${fullName} and my phone number is ${fullPhone}`;

        setIsLoading(true);
        try {
            // Wait for 200ms to ensure rendering of the hidden voucher
            await new Promise(r => setTimeout(r, 200));

            const dataUrl = await toPng(voucherRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#b91c1c'
            });

            // Log Share to Database
            spinWinService.shares.log({
                voucherCode: voucherCode,
                fromCustomerId: customer.id,
                branchId: session.branchId
            });

            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `tabarak-voucher.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    text: text,
                    title: 'My Tabarak Reward'
                });
            } else {
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            }
        } catch (err) {
            console.error('Sharing failed', err);
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadVoucher = async () => {
        if (!voucherRef.current) return;
        setIsLoading(true);
        try {
            await new Promise(r => setTimeout(r, 200));
            const dataUrl = await toPng(voucherRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: '#b91c1c'
            });
            const link = document.createElement('a');
            link.download = `tabarak-voucher-${voucherCode}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed', err);
            setError('Image generation failed. Please take a screenshot.');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <AlertCircle className="w-16 h-16 text-brand mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Oops!</h2>
                    <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm">Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-brand selection:text-white">
            <div className="bg-white p-4 sm:p-6 border-b border-slate-100 flex items-center justify-center space-x-3 shadow-sm sticky top-0 z-50">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
                    <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tighter">Tabarak <span className="text-brand">SPIN & WIN</span></h1>
            </div>

            <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-xl mx-auto w-full">
                {step === 'validate' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6 animate-pulse">
                        <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center">
                            <QrCode className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-900 tracking-tighter">Verifying Token</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Connecting to Secure Node...</p>
                        </div>
                    </div>
                )}

                {step === 'info' && (
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Smartphone className="w-12 h-12 text-brand mb-6" />
                        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">Enter Your Details</h2>
                        <form onSubmit={handleInfoSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-brand outline-none transition-all font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <div className="relative">
                                        <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-brand outline-none transition-all font-bold" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <div className="flex gap-2">
                                    <div className="relative w-24 shrink-0">
                                        <select
                                            aria-label="Country Code"
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="w-full h-full pl-2 pr-6 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-brand outline-none transition-all font-bold text-sm appearance-none"
                                        >
                                            {countryCodes.map((c) => (
                                                <option key={c.code} value={c.code}>{c.code}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-brand outline-none transition-all font-bold"
                                            placeholder="xxxxxxxx"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:bg-white focus:border-brand outline-none transition-all font-bold" />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 hover:bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 disabled:bg-slate-300">
                                {isLoading ? 'Processing...' : 'Continue to Spin'}
                            </button>
                        </form>
                    </div>
                )}

                {(step === 'review' || step === 'spin') && (
                    <div className="flex-1 flex flex-col items-center justify-between py-4 animate-in zoom-in duration-700">
                        <div className="w-full mb-6">
                            <img
                                src="/spin-header-v4.jpg"
                                alt="Spin and Win"
                                className="w-full h-auto object-cover"
                            />
                        </div>

                        <div className={`relative transition-all duration-1000 ${step === 'review' ? 'grayscale opacity-40 scale-90 blur-[2px]' : 'scale-110'}`}>
                            <Spinner
                                prizes={prizes.map(p => ({ id: p.id, name: p.name, color: p.color || '' }))}
                                winner={winningPrize}
                                isSpinning={isSpinning}
                                onFinish={handleSpinFinish}
                            />
                            {step === 'review' && (
                                <div className="absolute inset-0 flex items-center justify-center z-30">
                                    <div className="bg-slate-900/90 text-white p-6 rounded-[2.5rem] shadow-2xl backdrop-blur-md border border-white/10 flex flex-col items-center space-y-3">
                                        <Star className="w-8 h-8 text-brand fill-brand animate-bounce" />
                                        <span className="font-black text-[10px] uppercase tracking-widest text-center">Unlock Wheel <br /> via Google Maps</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="w-full max-w-sm mt-8">
                            {step === 'review' ? (
                                !hasClickedRate ? (
                                    <button onClick={handleReviewClick} className="w-full bg-brand text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3">
                                        <span>Rate Branch to Spin</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button onClick={() => loadPrizes()} className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-3 animate-in zoom-in">
                                        <div className="bg-white/20 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
                                        <span>I Have Rated</span>
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={startSpin}
                                    disabled={isSpinning || isLoading || prizes.length === 0}
                                    className="w-full bg-slate-900 hover:bg-brand text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Authenticating...</span>
                                        </>
                                    ) : isSpinning ? (
                                        <span>Consulting Luck...</span>
                                    ) : (
                                        <span>Tap to Spin Wheel!</span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 'result' && wonPrize && (
                    <div className="bg-white p-6 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.1)] border border-slate-50 text-center animate-in zoom-in duration-700">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">WINNER REWARD</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Vault Authorization Confirmed</p>
                        </div>

                        {/* Professional Voucher Design */}
                        <div className="relative mb-10 group perspective-1000">
                            <div className="bg-[#b91c1c] text-white rounded-[1.5rem] overflow-hidden shadow-2xl flex relative min-h-[160px]">
                                <div className="w-1/4 border-r-2 border-dashed border-white/30 flex flex-col items-center justify-center p-4 relative bg-black/5">
                                    <div className="absolute top-0 right-0 w-4 h-4 bg-white rounded-full -mr-2 -mt-2"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-full -mr-2 -mb-2"></div>
                                    <div className="flex flex-col items-center space-y-1 opacity-80">
                                        <div className="w-full flex justify-between space-x-[2px] h-10">
                                            {[2, 1, 3, 1, 2, 4, 1, 2].map((w, i) => (<div key={i} className="bg-white" style={{ width: `${w}px` }}></div>))}
                                        </div>
                                        <span className="text-[6px] font-mono tracking-tighter">ID-{voucherCode.split('-')[1]}</span>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 flex flex-col justify-between text-left">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-2xl font-black tracking-tight leading-tight mb-1">{wonPrize.name}</h3>
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg"><Trophy className="w-4 h-4 text-[#b91c1c]" /></div>
                                        </div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/60">Expires: {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <div className="flex items-end justify-between mt-4">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Security Code</p>
                                            <div className="text-xl font-bold font-mono tracking-widest">{voucherCode}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => {
                                const expiryDate = new Date();
                                expiryDate.setDate(expiryDate.getDate() + 7);
                                const expiryStr = expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                const branchName = session?.branches?.name || 'Tabarak Pharmacy';
                                const fullName = `${firstName} ${lastName}`;
                                const fullPhone = `${countryCode}${phone}`;
                                const text = `Hey Tabarak! I just won ${wonPrize.name} at ${branchName}, My voucher code is ${voucherCode} and its expiry is ${expiryStr}.. my name is ${fullName} and my phone number is ${fullPhone}`;

                                const targetPhone = session?.branches?.whatsapp_number || '97333616996';
                                window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
                            }} className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center space-y-2 transition-all active:scale-95">
                                <MessageCircle className="w-6 h-6" />
                                <span>Share Voucher with Pharmacy</span>
                            </button>
                            <button onClick={downloadVoucher} disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex flex-col items-center justify-center space-y-2 transition-all active:scale-95">
                                <Download className="w-6 h-6" />
                                <span>{isLoading ? 'Saving...' : 'Save Voucher'}</span>
                            </button>
                        </div>

                        {/* Social Channels - Premium Design */}
                        <div className="grid gap-4 mt-8 animate-in slide-in-from-bottom-6 duration-1000 delay-300">
                            <a
                                href="https://whatsapp.com/channel/0029VaX7ZLf1t90dNDBNaw11"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden bg-[#25D366] text-white p-5 rounded-3xl shadow-lg transition-all active:scale-[0.98] hover:shadow-xl hover:shadow-[#25D366]/30 flex items-center justify-between"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl group-hover:bg-white group-hover:text-[#25D366] transition-colors duration-500">
                                        <MessagesSquare className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-xs uppercase tracking-widest leading-none mb-1">Stay Updated</h4>
                                        <p className="font-semibold text-[10px] opacity-90">Join Official WhatsApp Channel</p>
                                    </div>
                                </div>
                                <div className="relative z-10 bg-white/20 rounded-full p-1.5 group-hover:translate-x-1 transition-transform duration-500">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </a>

                            <a
                                href="https://www.instagram.com/tabarak_pharmacy_group/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden bg-white text-slate-900 p-5 rounded-3xl shadow-lg border border-slate-100 transition-all active:scale-[0.98] hover:shadow-xl hover:border-pink-200 flex items-center justify-between"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-[#833AB4]/5 via-[#FD1D1D]/5 to-[#F77737]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className="p-2.5 bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-2xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-500">
                                        <Instagram className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-widest leading-none mb-1">Follow Us</h4>
                                        <p className="font-semibold text-slate-500 text-[10px]">@tabarak_pharmacy_group</p>
                                    </div>
                                </div>
                                <div className="relative z-10 text-slate-300 group-hover:text-pink-500 transition-colors duration-500">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </a>
                        </div>
                        <p className="mt-8 text-slate-400 font-medium text-[10px] uppercase tracking-widest leading-relaxed">Redeemable at any branch • Valid for 7 days</p>
                    </div>
                )}
            </div>

            <div className="p-8 text-center bg-white border-t border-slate-100 mt-auto">
                <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[8px]">Tabarak Health Systems Protocol v4.0</p>
            </div>

            {/* Hidden Voucher for Image Generation */}
            {wonPrize && (
                <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
                    <div ref={voucherRef} className="w-[600px] h-[300px] bg-[#b91c1c] text-white flex relative overflow-hidden font-sans" style={{ borderRadius: '20px' }}>
                        <div className="w-[150px] border-r-2 border-dashed border-white/30 flex flex-col items-center justify-center p-6 bg-black/10">
                            <div className="w-full h-24 flex justify-between space-x-[3px] px-2">
                                {[3, 1, 4, 1, 2, 5, 1, 2, 1, 3, 1, 2].map((w, i) => (<div key={i} className="bg-white" style={{ width: `${w}px` }}></div>))}
                            </div>
                            <span className="mt-4 text-[10px] font-mono font-bold tracking-[0.2em]">{voucherCode}</span>
                        </div>
                        <div className="flex-1 p-10 flex flex-col justify-between relative">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={150} /></div>
                            <div>
                                <h4 className="text-white/60 font-black uppercase tracking-[0.4em] text-xs mb-2">Exclusive Reward</h4>
                                <h2 className="text-5xl font-black tracking-tighter leading-none mb-4">{wonPrize.name}</h2>
                                <p className="text-white/80 font-bold text-sm">Valid at any Tabarak Pharmacy branch.</p>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-1">Expiry Date</p>
                                    <p className="font-black text-xl">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/40 font-black uppercase tracking-widest text-[10px] mb-1">Customer</p>
                                    <p className="font-bold text-sm">{firstName} {lastName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
