
import React, { useState, useEffect, useTransition } from 'react';
import { LoginPage } from './app/login/page';
import { SelectPharmacistPage } from './app/select-pharmacist/page';
import { POSPage } from './app/pos/page';
import { DashboardPage } from './app/dashboard/page';
import { WorkforcePage } from './app/workforce/page';
import { Branch, Pharmacist, AuthState } from './types';
import { supabase } from './lib/supabase';
import {
  LayoutDashboard,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Activity,
  Globe,
  ShieldCheck,
  Landmark,
  RefreshCcw,
  QrCode,
  FileText,
  Loader2,
  Users,
  Wallet,
  BookOpen,
  Settings
} from 'lucide-react';
import { Footer } from './components/Footer';
import { CustomerFlow } from './components/SpinWin/CustomerFlow';
import { SpinWinHub } from './components/SpinWin/SpinWinHub';
import { ManagerDashboard } from './components/SpinWin/ManagerDashboard';
import { HRPortalPage } from './app/hr/page';
// Import the HR Requests component
import { HRRequestsSection } from './app/dashboard/HRRequestsSection';
import { POSGuidelineModal } from './components/POSGuidelineModal';
import { CashFlowPlanner } from './components/CashFlow/CashFlowPlanner';
import { BranchCashTrackerPage } from './components/CashFlow/BranchCashTrackerPage';
import { CorporateCodex } from './components/CorporateCodex';
import { ProjectSettings } from './components/ProjectSettings';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, pharmacist: null });
  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'selector' | 'spin-win' | 'hr' | 'hr-manager' | 'workforce' | 'cash-flow' | 'cash-tracker' | 'corporate-codex' | 'settings' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showPOSGuideline, setShowPOSGuideline] = useState(false);

  const handleTabChange = (tab: 'pos' | 'dashboard' | 'selector' | 'spin-win' | 'hr' | 'hr-manager' | 'workforce' | 'cash-flow' | 'cash-tracker' | 'corporate-codex' | 'settings' | null) => {
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
          let currentSession = session as any;
          if (!currentSession.permissions && currentSession.user) {
            try {
              const perms = await supabase.permissions.listForBranch(currentSession.user.id);
              currentSession.permissions = perms;
              supabase.auth.setSession(currentSession);
            } catch (pErr) {
              console.error("Init permission fetch error:", pErr);
              currentSession.permissions = [];
            }
          }
          setAuthState(currentSession);
          const savedTab = sessionStorage.getItem('tabarak_active_tab');
          if (savedTab) {
            setActiveTab(savedTab as any);
          } else if (currentSession.user?.role === 'admin' || currentSession.user?.role === 'manager') {
            setActiveTab('dashboard');
          } else {
            setActiveTab(currentSession.pharmacist ? 'selector' : null);
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

  const handleLogin = async (branch: Branch) => {
    setIsInitializing(true);
    try {
      const permissions = await supabase.permissions.listForBranch(branch.id);
      const newState = { user: branch, pharmacist: null, permissions };
      setAuthState(newState);
      supabase.auth.setSession(newState);
      handleTabChange('selector');
    } catch (err) {
      console.error("Login permission error:", err);
      const newState = { user: branch, pharmacist: null, permissions: [] };
      setAuthState(newState);
      supabase.auth.setSession(newState);
      handleTabChange('selector');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSelectPharmacist = (pharmacist: Pharmacist) => {
    const newState = { ...authState, pharmacist };
    setAuthState(newState);
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
    handleTabChange(null);
  };

  if (customerToken) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerFlow token={customerToken} />
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-8">
        <div className="relative">
          <div className="w-16 h-16 border-[3px] border-slate-100 border-t-brand rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-brand rounded-lg shadow-lg shadow-brand/20 overflow-hidden">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Tabarak</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Establishing connection...</p>
        </div>
      </div>
    );
  }

  if (!authState.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isManager = authState.user?.role === 'manager' || authState.user?.role === 'admin';
  const isAccounts = authState.user?.role === 'accounts';
  const isAdmin01 = authState.user?.code === 'ADMIN01';

  const checkPermission = (feature: string) => {
    // Admins and Managers have full access by default, but we still check for explicit denies
    if (!authState.permissions) return true;
    const perm = authState.permissions.find(p => p.featureName === feature);
    if (!perm) return true; // Default to allow if no specific rule
    return perm.accessLevel !== 'none';
  };

  if (!authState.pharmacist && !isManager && !isAccounts) {
    return <SelectPharmacistPage branch={authState.user!} onSelect={handleSelectPharmacist} onLogout={logout} />;
  }

  if (activeTab === null || activeTab === 'selector') {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-brand/10">
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-6 md:px-10 py-10 lg:py-20">
          <div className="mb-12 page-enter">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden">
                  <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-1.5">Operational <span className="text-brand">Suite</span></h2>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">{authState.user.code}</span>
                    <span className="flex items-center space-x-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Connected</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:flex items-center space-x-4 bg-white p-3 pr-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">On Duty</span>
                  <span className="text-sm font-bold text-slate-900 leading-none mt-0.5">{isManager ? 'Administrator' : authState.pharmacist?.name}</span>
                </div>
              </div>
            </div>
            <div className="divider-gradient"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 page-enter">
            {/* 1. Global Analytics / Lost Sales */}
            {!isAdmin01 && !isAccounts && (checkPermission('lost_sales') || checkPermission('shortages')) && (
              <button
                onClick={() => handleTabChange('pos')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black mb-1.5 tracking-tight text-slate-900">
                    Lost Sales & Shortage
                  </h3>
                  <p className="font-medium text-sm leading-relaxed text-slate-400">
                    Log out-of-stock items and customer requested deficits in real-time.
                  </p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-brand font-bold text-[10px] uppercase tracking-widest">
                    Open Module
                  </span>
                </div>
              </button>
            )}

            {/* 2. Performance Portal (Branch) / HR Admin (Manager) */}
            {isManager ? (
              isAdmin01 ? (
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Performance Portal</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">Review localized branch performance and inventory trends.</p>
                  </div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                    <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                  </div>
                </button>
              ) : (checkPermission('hr_requests') && (
                <button
                  onClick={() => handleTabChange('hr-manager')}
                  className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">HR Requests Admin</h3>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed">Review incoming employee requests and generate official letterheads.</p>
                  </div>
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                    <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                  </div>
                </button>
              ))
            ) : (!isAccounts && (checkPermission('lost_sales') || checkPermission('shortages')) && (
              <button
                onClick={() => handleTabChange('dashboard')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Performance Portal</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Review localized branch performance and inventory trends.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            ))}

            {/* 3. Workforce (Manager) / HR Self-Service (Branch) */}
            {isManager ? (!isAdmin01 && authState.user?.role === 'manager' && checkPermission('hr_requests') && (
              <button
                onClick={() => handleTabChange('workforce')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Users className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Workforce Analytics</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Optimize staffing levels and calculate relief requirements.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            )) : (!isAccounts && checkPermission('hr_requests') && (
              <button
                onClick={() => handleTabChange('hr')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">HR Self-Service</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Request official documents and certificates directly through our portal.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            ))}

            {/* 4. Cash Flow (Manager) / Cash Tracker (Both) */}
            {isManager ? (!isAdmin01 && checkPermission('cash_flow') && (
              <button
                onClick={() => handleTabChange('cash-flow')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Landmark className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Cash Flow Planner</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Liquidity forecasting, expense planning, and financial risk monitoring.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-brand/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-brand font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            )) : (checkPermission('cash_tracker') && (
              <button
                onClick={() => handleTabChange('cash-tracker')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-slate-800/30 hover:shadow-xl hover:shadow-slate-800/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Branch Cash Tracker</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Log and track daily cash discrepancies between POS and cash count.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-slate-800/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-slate-800 font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            ))}

            {/* 5. Corporate Codex */}
            {!isAdmin01 && !isAccounts && checkPermission('corporate_codex') && (
              <button
                onClick={() => handleTabChange('corporate-codex')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-slate-900/30 hover:shadow-xl hover:shadow-slate-900/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Corporate Codex</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Official policies, administrative circulars, and standard protocols.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-slate-900/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-slate-900 font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            )}

            {/* 6. Settings (Manager Only) */}
            {!isAdmin01 && authState.user?.role === 'manager' && checkPermission('settings') && (
              <button
                onClick={() => handleTabChange('settings')}
                className={`group p-7 rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover hover:border-slate-800/30 hover:shadow-xl hover:shadow-slate-800/5 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all duration-400 relative z-10 shadow-sm">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-slate-900 mb-1.5 tracking-tight">Infrastructure Control</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">Manage branches, personnel credentials, and system permissions.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-slate-800/60 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-slate-800 font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            )}

            {/* 7. Spin & Win */}
            {!isAdmin01 && !isAccounts && checkPermission('spin_win') && (
              <button
                onClick={() => handleTabChange('spin-win')}
                className={`group p-7 rounded-2xl bg-gradient-to-br from-brand to-brand-dark border border-brand/20 hover:border-white/30 shadow-lg hover:shadow-xl hover:shadow-brand/20 transition-all duration-300 text-left flex flex-col justify-between h-[280px] active:scale-[0.98] relative overflow-hidden card-hover ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-2xl"></div>
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center text-white group-hover:bg-white group-hover:text-brand transition-all duration-400 relative z-10 ring-1 ring-white/20 shadow-sm">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-white tracking-tight">{isManager ? 'Reward Control' : 'Spin & Win'}</h3>
                  <p className="text-white/70 font-medium text-sm leading-relaxed mt-1.5">Generate QR tokens for the customer reward wheel.</p>
                </div>
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="h-px bg-white/50 w-6 group-hover:w-12 transition-all duration-400"></div>
                  <span className="text-white/90 font-bold text-[10px] uppercase tracking-widest">Open Module</span>
                </div>
              </button>
            )}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={logout}
              className="group px-6 py-3 bg-white border border-slate-100 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-brand rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center mx-auto space-x-3 shadow-sm"
            >
              <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
        <Footer onNavigate={handleTabChange} permissions={authState.permissions} user={authState.user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col selection:bg-brand/10">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-[100] h-[72px] shadow-sm print:hidden">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-full flex items-center justify-between">
          <div className="flex-1 flex items-center overflow-hidden">
            <div className="flex items-center space-x-4 cursor-pointer group shrink-0" onClick={() => handleTabChange('selector')}>
              <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shadow-md shadow-brand/20 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none">Tabarak<span className="text-brand">.</span></h1>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                  {authState.user?.code}
                </p>
              </div>
            </div>
          </div>

          {/* Centered Switcher */}
          {(activeTab === 'pos' || activeTab === 'dashboard' || activeTab === 'settings') && !isAdmin01 && (
            <div className="flex-1 flex justify-center">
              <div className="flex bg-slate-100/60 p-1 rounded-lg border border-slate-200/50">
                {(checkPermission('lost_sales') || checkPermission('shortages')) && (
                  <button
                    onClick={() => handleTabChange('pos')}
                    className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-2 ${activeTab === 'pos' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Items Entry</span>
                  </button>
                )}
                <button
                  onClick={() => handleTabChange('dashboard')}
                  className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-2 ${activeTab === 'dashboard' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
                {authState.user?.role === 'manager' && (
                  <button
                    onClick={() => handleTabChange('settings')}
                    className={`px-5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center space-x-2 ${activeTab === 'settings' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 flex items-center justify-end space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2.5 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all active:scale-90 group"
              title="Refresh"
            >
              <RefreshCcw className="w-4.5 h-4.5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={logout}
              className="p-2.5 text-slate-300 hover:text-brand hover:bg-brand/5 rounded-lg transition-all active:scale-90"
              title="Sign Out"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {activeTab === 'pos' ? (
          <POSPage branch={authState.user!} pharmacist={authState.pharmacist!} permissions={authState.permissions || []} onBackToPharmacist={handleBackToPharmacist} />
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
        ) : activeTab === 'workforce' ? (
          <WorkforcePage onBack={() => handleTabChange('selector')} />
        ) : activeTab === 'cash-flow' ? (
          <CashFlowPlanner
            onBack={() => handleTabChange('selector')}
            branchId={authState.user?.id}
            userRole={authState.user?.role}
            pharmacistName={authState.pharmacist?.name}
            initialTab="dashboard"
          />
        ) : activeTab === 'cash-tracker' ? (
          <BranchCashTrackerPage
            onBack={() => handleTabChange('selector')}
            branchId={authState.user?.id}
            userRole={authState.user?.role}
            pharmacistName={authState.pharmacist?.name}
          />
        ) : activeTab === 'corporate-codex' ? (
          <CorporateCodex
            userRole={authState.user?.role || 'branch'}
            onBack={() => handleTabChange('selector')}
          />
        ) : activeTab === 'settings' ? (
          <ProjectSettings onBack={() => handleTabChange('selector')} />
        ) : (
          <DashboardPage
            user={authState.user!}
            permissions={authState.permissions || []}
            onBack={() => handleTabChange('selector')}
          />
        )}
      </main>

      <div className="print:hidden">
        <Footer onNavigate={handleTabChange} permissions={authState.permissions} user={authState.user} />
      </div>

      <POSGuidelineModal
        isOpen={showPOSGuideline}
        onClose={() => setShowPOSGuideline(false)}
      />
    </div>
  );
};

export default App;
