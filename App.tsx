
import React, { useState, useEffect } from 'react';
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
  RefreshCcw
} from 'lucide-react';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, pharmacist: null });
  const [activeTab, setActiveTab] = useState<'pos' | 'dashboard' | 'selector' | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      const session = supabase.auth.getSession();
      if (session) {
        setAuthState(session);
        // Recover tab if refresh happened
        const savedTab = sessionStorage.getItem('tabarak_active_tab');
        if (savedTab) {
          setActiveTab(savedTab as any);
        } else if (session.user?.role === 'admin') {
          setActiveTab('dashboard');
        } else {
          setActiveTab(session.pharmacist ? 'selector' : null);
        }
      }
      setIsInitializing(false);
    };
    init();
  }, []);

  const handleLogin = (branch: Branch) => {
    const newState = { user: branch, pharmacist: null };
    setAuthState(newState);
    supabase.auth.setSession(newState);

    if (branch.role === 'admin') {
      setActiveTab('dashboard');
    } else {
      setActiveTab(null);
    }
  };

  const handleSelectPharmacist = (pharmacist: Pharmacist) => {
    const newState = { ...authState, pharmacist };
    setAuthState(newState);
    supabase.auth.setSession(newState);
    setActiveTab('selector');
  };

  const logout = () => {
    sessionStorage.removeItem('tabarak_active_tab');
    supabase.auth.signOut();
  };

  const handleBackToPharmacist = () => {
    const newState = { ...authState, pharmacist: null };
    setAuthState(newState);
    supabase.auth.setSession(newState);
    setActiveTab(null);
  };

  if (isInitializing) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Landmark className="w-16 h-16 text-brand animate-pulse" />
    </div>
  );

  if (!authState.user) return <LoginPage onLogin={handleLogin} />;

  if (authState.user.role === 'branch' && !authState.pharmacist) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="flex-1 flex flex-col">
          <SelectPharmacistPage branch={authState.user} onSelect={handleSelectPharmacist} onLogout={logout} />
        </div>
        <Footer />
      </div>
    );
  }

  if (authState.user.role === 'branch' && activeTab === 'selector') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden font-sans">
        {/* Subtle background detail */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand/[0.02] rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand/[0.01] rounded-full blur-[100px] -ml-72 -mb-72 pointer-events-none"></div>

        <div className="flex-1 w-full flex items-center justify-center p-6 lg:p-12">
          <div className="max-w-5xl w-full relative z-10">
            <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-1000">
              <div className="w-24 h-24 bg-white rounded-[2rem] border-2 border-slate-50 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-slate-200 overflow-hidden group hover:scale-105 transition-transform duration-500">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-4">
                Operational <span className="text-brand">Choice</span>
              </h2>
              <div className="flex items-center justify-center space-x-3">
                <div className="h-px bg-slate-100 w-12"></div>
                <p className="text-slate-400 font-bold uppercase tracking-[0.5em] text-[10px]">
                  Active Node Identity: <span className="text-brand">{authState.user.code}</span>
                </p>
                <div className="h-px bg-slate-100 w-12"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <button
                onClick={() => setActiveTab('pos')}
                className="group bg-white p-12 rounded-[3.5rem] border-2 border-slate-50 hover:border-brand shadow-[0_30px_70px_-20px_rgba(0,0,0,0.06)] hover:shadow-brand/20 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/[0.02] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>

                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand/30 transition-all duration-500 relative z-10">
                  <ShoppingCart className="w-10 h-10" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">Record Lost Sales & Shortage</h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed opacity-80">Dedicated terminal for logging out-of-stock items and customer requested deficits in real-time.</p>
                </div>

                <div className="flex items-center space-x-4 relative z-10">
                  <div className="h-0.5 bg-brand w-8 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-brand font-black text-[10px] uppercase tracking-[0.4em]">Initialize Entry Terminal</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="group bg-slate-900 p-12 rounded-[3.5rem] border-2 border-slate-800 hover:border-brand shadow-2xl hover:shadow-brand/30 transition-all duration-700 text-left flex flex-col justify-between h-[420px] active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/[0.03] rounded-full -mr-24 -mb-24 blur-3xl"></div>

                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/30 group-hover:bg-brand group-hover:text-white group-hover:shadow-xl group-hover:shadow-brand/30 transition-all duration-500 relative z-10 ring-1 ring-white/10">
                  <Activity className="w-10 h-10" />
                </div>

                <div className="relative z-10">
                  <h3 className="text-4xl font-black text-white mb-4 tracking-tighter">Performance Portal</h3>
                  <p className="text-white/40 font-medium text-lg leading-relaxed">Review localized branch performance, lost revenue metrics, and high-risk inventory trends.</p>
                </div>

                <div className="flex items-center space-x-4 relative z-10">
                  <div className="h-0.5 bg-brand w-8 group-hover:w-16 transition-all duration-500"></div>
                  <span className="text-brand font-black text-[10px] uppercase tracking-[0.4em]">Audit Branch Intel</span>
                </div>
              </button>
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
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand/10">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] h-24 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-10 h-full flex items-center justify-between">
          <div className="flex items-center space-x-6 cursor-pointer" onClick={() => setActiveTab(authState.user?.role === 'admin' ? 'dashboard' : 'selector')}>
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

          {authState.user?.role === 'branch' && (
            <nav className="flex items-center bg-slate-100 p-1.5 rounded-full border border-slate-200">
              <button
                onClick={() => setActiveTab('pos')}
                className={`flex items-center space-x-3 px-10 py-3.5 rounded-full font-black text-[10px] tracking-widest transition-all ${activeTab === 'pos' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-900'
                  }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ITEMS ENTRY</span>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-3 px-10 py-3.5 rounded-full font-black text-[10px] tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-900'
                  }`}
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
              className="p-4 text-slate-300 hover:text-brand hover:bg-red-50 rounded-2xl transition-all active:scale-90group relative"
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
        ) : (
          <DashboardPage user={authState.user!} />
        )}
      </main>

      <Footer />

    </div>
  );
};

export default App;
