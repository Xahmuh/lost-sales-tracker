
import React, { useState, useEffect, useMemo } from 'react';
import { UserCircle, ShieldCheck, ArrowRight, Search, UserCheck, X, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Pharmacist, Branch } from '../../types';

interface SelectPharmacistPageProps {
  branch: Branch;
  onSelect: (pharmacist: Pharmacist) => void;
  onLogout: () => void;
}

export const SelectPharmacistPage: React.FC<SelectPharmacistPageProps> = ({ branch, onSelect, onLogout }) => {
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPharmacists = async () => {
      const data = await supabase.pharmacists.listByBranch(branch.id);
      setPharmacists(data);
    };
    fetchPharmacists();
  }, [branch.id]);

  const filteredPharmacists = useMemo(() => {
    if (!searchQuery.trim()) return pharmacists;
    return pharmacists.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pharmacists, searchQuery]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 relative overflow-hidden font-sans">
      {/* Official Background Grid Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%"><defs><pattern id="grid-official" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#grid-official)" /></svg>
      </div>

      <div className="absolute top-10 right-10 z-[100] animate-in fade-in duration-1000">
        <button
          onClick={onLogout}
          className="group flex items-center space-x-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-brand hover:border-brand hover:shadow-2xl hover:shadow-brand/20 transition-all duration-300"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Change Location</span>
        </button>
      </div>

      <div className="max-w-7xl w-full relative z-10 animate-in fade-in duration-700">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-slate-50 text-brand px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 shadow-sm mb-8">
            <ShieldCheck className="w-4 h-4" />
            <span>Personnel Identification Protocol</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-none">Shift Manager?</h2>
          <p className="text-slate-400 font-medium text-lg">Active Terminal Node: <span className="text-brand font-black uppercase tracking-tight">{branch.name}</span></p>
        </div>

        {/* Professional Search Bar */}
        <div className="max-w-2xl mx-auto mb-16 relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand transition-colors">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-6 pl-16 pr-16 text-xl font-black text-slate-900 placeholder:text-slate-300 outline-none focus:border-brand focus:bg-white transition-all shadow-inner"
            placeholder="Search by Personnel Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
          {filteredPharmacists.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-brand hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 flex flex-col items-center text-center active:scale-[0.98] relative overflow-hidden"
            >
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-brand group-hover:text-white transition-all duration-500 shadow-inner">
                  <UserCircle className="w-10 h-10" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="w-full">
                <p className="text-lg font-black text-slate-800 group-hover:text-brand transition-colors leading-tight mb-2">
                  {p.name}
                </p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-brand/40 transition-colors">On-Duty Pharmacist</p>

                <div className="mt-8 flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <div className="bg-brand text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center">
                    <span>Initialize Session</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredPharmacists.length === 0 && (
            <div className="col-span-full bg-slate-50 p-24 rounded-[3rem] text-center border border-dashed border-slate-200 animate-in fade-in duration-500">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No personnel matches found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        <div className="mt-24 text-center">
          <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.6em]">Secure Multi-Node Identity Authentication Protocol</p>
        </div>
      </div>
    </div>
  );
};
