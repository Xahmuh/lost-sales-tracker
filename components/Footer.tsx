
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-slate-900 border-t border-slate-800 py-10 mt-auto relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>

            <div className="max-w-[1600px] mx-auto px-10 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 mb-8 border-b border-slate-800">
                    <div className="flex items-center space-x-6">
                        <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center shadow-2xl shadow-brand/20 overflow-hidden">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-white tracking-tighter leading-none">Tabarak<span className="text-brand">.</span></h4>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2.5">LSTP v1.0.0</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em]">Developed by</span>
                        <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">Ahmed Elsherbini</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                    <div className="flex items-center space-x-6">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">© {new Date().getFullYear()} Tabarak. All Rights Reserved.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
