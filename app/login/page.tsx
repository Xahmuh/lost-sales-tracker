
import React, { useState } from 'react';
import { ChevronRight, ShieldCheck, ShieldAlert, Loader2, Globe, Landmark } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Branch } from '../../types';

interface LoginPageProps {
  onLogin: (branch: Branch) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const branch = await supabase.branches.findByCode(code);
      if (!branch) {
        setError('Branch code not found. Please verify (e.g., B001).');
        setIsLoading(false);
        return;
      }

      if (branch.role === 'admin') {
        if (password === 'admin123') onLogin(branch);
        else setError('Invalid administrator credentials.');
      } else {
        if (password === '1234') onLogin(branch);
        else setError('Invalid branch credentials.');
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message}. System running in Hybrid Mode.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans selection:bg-brand/10">
      <div className="hidden md:flex md:w-1/2 bg-slate-50 border-r border-slate-100 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <svg width="100%" height="100%"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid)" /></svg>
        </div>

        <div className="relative z-10 max-w-lg text-center md:text-left">
          <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center shadow-2xl shadow-brand/30 mb-10 mx-auto md:mx-0 overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 leading-[1.1]">
            Tabarak Pharmacy <br />
            <span className="text-brand">Lost Sales & Shortage Tracking Portal</span>
          </h1>
          <p className="text-slate-500 text-lg font-medium leading-relaxed mb-10">
            Official logging system for Tabarak Pharmacy Group. Secure branch authentication required for all transactions.
          </p>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600 bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100 w-fit mx-auto md:mx-0">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">End-to-End Encryption Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 md:p-20">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign In</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Node Authentication Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Identity Code</label>
              <input
                type="text"
                className="w-full px-6 py-5 rounded-xl border-2 border-slate-100 bg-white text-slate-900 font-bold outline-none focus:border-brand transition-all text-lg placeholder:text-slate-200"
                placeholder="Ex: B001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
              <input
                type="password"
                className="w-full px-6 py-5 rounded-xl border-2 border-slate-100 bg-white text-slate-900 font-bold outline-none focus:border-brand transition-all text-lg placeholder:text-slate-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-brand p-5 rounded-xl text-xs font-bold border border-red-100 flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:bg-brand-hover disabled:bg-slate-300 text-white font-black py-6 rounded-xl transition-all shadow-xl shadow-brand/10 flex items-center justify-center space-x-3 active:scale-[0.99]"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="text-sm tracking-widest uppercase">Verification</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">v1.0.0 LSTP</span>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Developed By Ahmed Elsherbini</p>
          </div>
        </div>
      </div>
    </div>
  );
};
