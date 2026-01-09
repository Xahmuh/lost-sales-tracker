
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
  Landmark
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
        if (session.user?.role === 'admin') {
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-brand/5 pointer-events-none blur-[120px]"></div>
        <div className="flex-1 w-full flex items-center justify-center p-6">
          <div className="max-w-4xl w-full relative z-10">
            <div className="text-center mb-16">
              <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand/20 overflow-hidden">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter mb-4"> Operational Choice </h2>
              <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Active Session: {authState.user.name}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <button
                onClick={() => setActiveTab('pos')}
                className="group bg-white p-12 rounded-panel border border-slate-100 hover:border-brand shadow-xl hover:shadow-brand/10 transition-all duration-500 text-left flex flex-col justify-between h-[380px] active:scale-[0.98]"
              >
                <div className="w-20 h-20 bg-brand/5 rounded-3xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all duration-500">
                  <ShoppingCart className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Record Lost Sales</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Dedicated terminal for logging out-of-stock items and customer requested deficits.</p>
                </div>
                <div className="flex items-center text-brand font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  <span>Start Logging</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className="group bg-white p-12 rounded-panel border border-slate-100 hover:border-brand shadow-xl hover:shadow-brand/10 transition-all duration-500 text-left flex flex-col justify-between h-[380px] active:scale-[0.98]"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all duration-500">
                  <Activity className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Performance Dashboard</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">Review localized branch performance, lost revenue metrics, and inventory trends.</p>
                </div>
                <div className="flex items-center text-brand font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  <span>View Reports</span>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </div>
              </button>
            </div>

            <div className="mt-16 text-center">
              <button onClick={logout} className="text-slate-300 hover:text-brand font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center mx-auto space-x-3">
                <LogOut className="w-4 h-4" />
                <span>Terminate Session</span>
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
                Node: {authState.user?.code}
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
                <span>LOSS ENTRY</span>
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-3 px-10 py-3.5 rounded-full font-black text-[10px] tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-400 hover:text-slate-900'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>REPORTS</span>
              </button>
            </nav>
          )}

          <div className="flex items-center space-x-8">
            <button
              onClick={logout}
              className="p-4 text-slate-300 hover:text-brand hover:bg-red-50 rounded-2xl transition-all active:scale-90"
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
