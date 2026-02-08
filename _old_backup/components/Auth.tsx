
import React, { useState } from 'react';
import { Lock, Store, UserCircle } from 'lucide-react';
import { db } from '../services/db';
import { Branch, Pharmacist } from '../types';

interface AuthProps {
  onLogin: (branch: Branch) => void;
  onSelectPharmacist: (pharmacist: Pharmacist) => void;
  currentBranch: Branch | null;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSelectPharmacist, currentBranch }) => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = db.getBranches().find(b => b.code === code.toUpperCase());
    // In production, use secure hashing. Mocking password check for "admin" or "branch"
    if (branch && password === '1234') {
      onLogin(branch);
      setError('');
    } else {
      setError('Invalid branch code or password.');
    }
  };

  if (!currentBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Store className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">PharmaTrack</h1>
            <p className="text-slate-500">Branch Authentication</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code</label>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="e.g. CENTRAL01"
                  required
                />
                <Store className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Access Token / Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-200"
            >
              Sign In to Branch
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">
            Use "1234" as password for demo.
          </p>
        </div>
      </div>
    );
  }

  const pharmacists = db.getPharmacistsByBranch(currentBranch.id);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-8">Who is on duty?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pharmacists.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPharmacist(p)}
              className="group bg-white p-6 rounded-xl shadow-md border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all flex items-center space-x-4 text-left"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                <UserCircle className="text-blue-600 group-hover:text-white w-8 h-8" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">{p.name}</p>
                <p className="text-sm text-slate-500">Pharmacist</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
