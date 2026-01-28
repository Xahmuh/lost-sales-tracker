
import React, { useState, useEffect, useTransition } from 'react';
import { LoginPage } from './app/login/page';
import { SelectPharmacistPage } from './app/select-pharmacist/page';
import { POSPage } from './app/pos/page';
import { DashboardPage } from './app/dashboard/page';
import { Branch, Pharmacist, AuthState } from './types';
import { supabase } from './lib/supabase';
import {
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Activity,
  Globe,
  Store,
  Shield,
  ShieldCheck,
  Landmark,
  RefreshCcw,
  QrCode,
  FileText,
  Loader2,
  Users
} from 'lucide-react';
import { Footer } from './components/Footer';
import { CustomerFlow } from './components/SpinWin/CustomerFlow';
import { SpinWinHub } from './components/SpinWin/SpinWinHub';
import { ManagerDashboard } from './components/SpinWin/ManagerDashboard';
import { HRPortalPage } from './app/hr/page';
// Import the HR Requests component
import { HRRequestsSection } from './app/dashboard/HRRequestsSection';
import { POSGuidelineModal } from './components/POSGuidelineModal';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, pharmacist: null });
  // Added 'hr-manager' to activeTab
  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'selector' | 'spin-win' | 'hr' | 'hr-manager' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showPOSGuideline, setShowPOSGuideline] = useState(false);

  const handleTabChange = (tab: 'pos' | 'dashboard' | 'selector' | 'spin-win' | 'hr' | 'hr-manager' | null) => {
    if (tab === 'pos') {
      setShowPOSGuideline(true);
    }
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  const [customerToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session) {
          setAuthState(session as any);
          const savedTab = sessionStorage.getItem('tabarak_active_tab');
          if (savedTab) {
            setActiveTab(savedTab as any);
          } else if ((session as any).user?.role === 'admin' || (session as any).user?.role === 'manager') {
            setActiveTab('dashboard'); // Default to dashboard for managers, but they can switch
          } else {
            setActiveTab((session as any).pharmacist ? 'selector' : null);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleLogin = (branch: Branch) => {
    const newState = { user: branch, pharmacist: null };
    setAuthState(newState);
    supabase.auth.setSession(newState);

    if (branch.role === 'admin') {
      handleTabChange('selector'); // Changed to selector so they see the menu choice first
    } else {
      handleTabChange('selector');
    }
  };

  const handleSelectPharmacist = (pharmacist: Pharmacist) => {
    const newState = { ...authState, pharmacist };
    setAuthState(newState);
    supabase.auth.setSession(newState as any);
    handleTabChange('selector');
  };

  const logout = () => {
    sessionStorage.removeItem('tabarak_active_tab');
    supabase.auth.signOut();
    window.location.reload();
  };

  const handleBackToPharmacist = () => {
    const newState = { ...authState, pharmacist: null };
    setAuthState(newState);
    supabase.auth.setSession(newState as any);
    handleTabChange(null);
  };

  if (customerToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-100 h-20 shadow-sm flex items-center justify-between px-10">
          <div className="flex items-center space-x-6">
            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
              <QrCode className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tighter">Tabarak<span className="text-brand">.</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Self-Service Portal</p>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <CustomerFlow token={customerToken} />
        </main>
        <Footer />
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-50 border-t-brand rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-brand rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-slate-900 uppercase tracking-[0.4em]">Tabarak Intelligence</p>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Bridging Secure Node Connection...</p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isManager = authState.user.role === 'admin' || authState.user.role === 'manager';
  const isAdmin01 = authState.user.code?.toUpperCase() === 'ADMIN01';

  if (!authState.pharmacist && !isManager) {
    return <SelectPharmacistPage branch={authState.user!} onSelect={handleSelectPharmacist} onLogout={logout} />;
  }

  if (activeTab === null || activeTab === 'selector') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand/10">
        <div className="flex-1 max-w-[1600px] mx-auto w-full px-8 py-12 lg:py-24">
          <div className="mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-brand rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-brand/30 ring-8 ring-brand/5">
                  <Store className="text-white w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Operational Suite</h2>
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Branch ID: {authState.user.code}</span>
                    <span className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Encrypted Connection Active</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-6 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Manager</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-1">{isManager ? 'System Administrator' : authState.pharmacist?.name}</span>
                </div>
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-slate-200 via-transparent to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            {/* 1. Global Analytics / Lost Sales (Top Left) */}
            <button
              onClick={() => handleTabChange(isManager ? 'dashboard' : 'pos')}
              className={`group p-12 rounded-[3.5rem] border-2 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden ${isManager
                ? 'bg-slate-900 border-slate-800 hover:border-brand shadow-2xl hover:shadow-brand/30'
                : 'bg-white border-slate-50 hover:border-brand shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-brand/20'
                } ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 relative z-10 ${isManager ? 'bg-white/5 text-white/30 group-hover:bg-brand group-hover:text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white'
                }`}>
                <Activity className="w-10 h-10" />
              </div>

              <div className="relative z-10">
                <h3 className={`text-4xl font-black mb-4 tracking-tighter ${isManager ? 'text-white' : 'text-slate-900'}`}>
                  {isManager ? 'Global Analytics Portal' : 'Record Lost Sales & Shortage'}
                </h3>
                <p className={`font-medium text-lg leading-relaxed ${isManager ? 'text-white/40' : 'text-slate-500 opacity-80'}`}>
                  {isManager
                    ? 'Access comprehensive network-wide metrics, shortage heatmaps, and ROI tracking for all branch nodes.'
                    : 'Dedicated terminal for logging out-of-stock items and customer requested deficits in real-time.'}
                </p>
              </div>

              <div className="flex items-center space-x-4 relative z-10">
                <div className="h-0.5 bg-brand w-8 group-hover:w-16 transition-all duration-500"></div>
                <span className="text-brand font-black text-[10px] uppercase tracking-[0.4em]">
                  {isManager ? 'Launch Data Intelligence' : 'Initialize Entry Terminal'}
                </span>
              </div>
            </button>

            {/* 2. Performance Portal (Top Right) - Only for Branch */}
            {!isManager && (
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`group bg-slate-900 p-12 rounded-[3.5rem] border-2 border-slate-800 hover:border-brand shadow-2xl hover:shadow-brand/30 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/[0.03] rounded-full -mr-24 -mb-24 blur-3xl"></div>
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/30 group-hover:bg-brand group-hover:text-white transition-all duration-500 relative z-10 ring-1 ring-white/10">
                  <Activity className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Performance Portal</h3>
                  <p className="text-white/40 font-medium text-lg leading-relaxed">Review localized branch performance, lost revenue metrics, and inventory trends.</p>
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="h-0.5 bg-brand w-8 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-brand font-black text-[10px] uppercase tracking-[0.4em]">Audit Branch Intel</span>
                </div>
              </button>
            )}

            {/* 2b. Manager Item (Top Right for Manager) - HR Admin */}
            {isManager && !isAdmin01 && (
              <button
                onClick={() => handleTabChange('hr-manager')}
                className={`group bg-white p-12 rounded-[3.5rem] border-2 border-slate-50 hover:border-blue-500 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-blue-500/20 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 relative z-10">
                  <Users className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">HR Requests Admin</h3>
                  <p className="text-slate-500 opacity-80 font-medium text-lg leading-relaxed">Review incoming employee requests, approve documents, and generate official letterheads.</p>
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="h-0.5 bg-blue-500 w-8 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-blue-500 font-black text-[10px] uppercase tracking-[0.4em]">Launch HR Admin</span>
                </div>
              </button>
            )}

            {/* 3. HR Self-Service (Bottom Left) - Branch only */}
            {!isManager && (
              <button
                onClick={() => handleTabChange('hr')}
                className={`group bg-white p-12 rounded-[3.5rem] border-2 border-slate-50 hover:border-brand shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-brand/20 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-500 relative z-10">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">HR Self-Service</h3>
                  <p className="text-slate-500 opacity-80 font-medium text-lg leading-relaxed">Request official documents, certificates, and payroll letters directly through our secure portal.</p>
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className="h-0.5 bg-brand w-8 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-brand font-black text-[10px] uppercase tracking-[0.4em]">Launch HR Module</span>
                </div>
              </button>
            )}

            {/* 4. Spin & Win (Bottom Right) - ALWAYS VISIBLE */}
            {!isAdmin01 && (
              <button
                onClick={() => handleTabChange('spin-win')}
                className={`group bg-brand p-12 rounded-[3.5rem] border-2 border-brand/20 hover:border-white shadow-2xl hover:shadow-brand/50 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-16 -mb-16"></div>

                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-brand transition-all duration-500 relative z-10 ring-1 ring-white/20">
                  <QrCode className="w-10 h-10" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-4">
                    <h3 className="text-4xl font-black text-white tracking-tighter">
                      {isManager ? 'Main Reward Control' : 'SPIN & WIN'}
                    </h3>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">Engagement Portal</span>
                  </div>
                  <p className="text-white/80 font-medium text-lg leading-relaxed">
                    {isManager
                      ? 'Override branch permissions, manage the prize pool, and audit global customer engagement results.'
                      : 'Deploy interactive customer reward systems. Generate one-time QR tokens to unlock the lucky wheel.'}
                  </p>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center space-x-4">
                    <div className="h-0.5 bg-white w-8 group-hover:w-16 transition-all duration-500"></div>
                    <span className="text-white font-black text-[10px] uppercase tracking-[0.4em]">
                      {isManager ? 'Executive Console' : 'Initialize Reward Protocol'}
                    </span>
                  </div>
                </div>
              </button>
            )}
          </div>

          <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <button
              onClick={logout}
              className="group px-8 py-4 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-brand rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] transition-all flex items-center justify-center mx-auto space-x-4"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Secure Termination</span>
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand/10">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] h-24 shadow-sm print:hidden">
        <div className="max-w-[1600px] mx-auto px-10 h-full flex items-center justify-between">
          <div className="flex items-center space-x-6 cursor-pointer" onClick={() => handleTabChange(authState.user?.role === 'admin' ? 'selector' : 'selector')}>
            <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center shadow-xl shadow-brand/20 overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Tabarak<span className="text-brand">.</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Branch: {authState.user?.code}
              </p>
            </div>
          </div>

          {authState.user?.role === 'branch' && (activeTab === 'pos' || activeTab === 'dashboard') && (
            <nav className="flex items-center bg-slate-100 p-1.5 rounded-full border border-slate-200">
              <button
                onClick={() => handleTabChange('pos')}
                className={`flex items-center space-x-3 px-10 py-3.5 rounded-full font-black text-[10px] tracking-widest transition-all ${activeTab === 'pos' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-900'
                  } ${isPending ? 'opacity-50' : ''}`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ITEMS ENTRY</span>
              </button>
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`flex items-center space-x-3 px-10 py-3.5 rounded-full font-black text-[10px] tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-900'
                  } ${isPending ? 'opacity-50' : ''}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>DASHBOARD & KPIs</span>
              </button>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (activeTab) sessionStorage.setItem('tabarak_active_tab', activeTab);
                window.location.reload();
              }}
              className="p-4 text-slate-300 hover:text-brand hover:bg-red-50 rounded-2xl transition-all active:scale-90 group relative"
              title="Refresh System"
            >
              <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
            </button>
            <button
              onClick={logout}
              className="p-4 text-slate-300 hover:text-brand hover:bg-red-50 rounded-2xl transition-all active:scale-90"
              title="Logout"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-10 py-12">
        {activeTab === 'pos' ? (
          <POSPage branch={authState.user!} pharmacist={authState.pharmacist!} onBackToPharmacist={handleBackToPharmacist} />
        ) : activeTab === 'spin-win' ? (
          <SpinWinHub
            branch={authState.user!}
            onBack={() => handleTabChange('selector')}
            userRole={authState.user?.role || 'branch'}
          />
        ) : activeTab === 'hr' ? (
          <HRPortalPage onBack={() => handleTabChange('selector')} />
        ) : activeTab === 'hr-manager' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">HR Admin Portal</h2>
                <p className="text-slate-500 font-medium">Manage employee requests and approvals</p>
              </div>
              <button onClick={() => handleTabChange('selector')} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50">
                Back to Suite
              </button>
            </div>
            <HRRequestsSection />
          </div>
        ) : (
          <DashboardPage
            user={authState.user!}
            onBack={() => handleTabChange('selector')}
          />
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      <POSGuidelineModal
        isOpen={showPOSGuideline}
        onClose={() => setShowPOSGuideline(false)}
      />
    </div>
  );
};

export default App;
