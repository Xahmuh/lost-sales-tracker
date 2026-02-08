
import React from 'react';
import { Globe, Mail, Phone, MapPin, Shield, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-slate-950 relative overflow-hidden mt-auto">
            {/* Ambient background effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-brand/[0.04] rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-slate-500/[0.03] rounded-full blur-[80px]"></div>
            </div>

            {/* Top decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-brand/40 to-transparent"></div>

            <div className="max-w-[1600px] mx-auto px-8 md:px-12 relative z-10">
                {/* Main footer content */}
                <div className="py-14 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
                    {/* Brand Column */}
                    <div className="md:col-span-4">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20 overflow-hidden ring-1 ring-white/10">
                                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-white tracking-tighter leading-none">Tabarak<span className="text-brand">.</span></h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Pharmacy Group</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-6">
                            Comprehensive pharmacy management and operational intelligence platform. Empowering branches with real-time analytics and seamless workflows.
                        </p>
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">System Online</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-2">LSTP v1.0.0</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-3 md:pl-8">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Platform</h5>
                        <ul className="space-y-3">
                            {['Lost Sales Tracker', 'Performance Dashboard', 'HR Self-Service', 'Cash Flow Planner', 'Spin & Win Rewards', 'Corporate Codex'].map((item) => (
                                <li key={item}>
                                    <span className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-default flex items-center group">
                                        <span className="w-1 h-1 bg-slate-700 rounded-full mr-3 group-hover:bg-brand transition-colors"></span>
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Security & Compliance */}
                    <div className="md:col-span-2">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Security</h5>
                        <ul className="space-y-3">
                            {[
                                { icon: Shield, text: 'SSL Encrypted' },
                                { icon: Shield, text: 'Role-Based Access' },
                                { icon: Shield, text: 'Audit Logging' },
                                { icon: Shield, text: 'Data Protection' },
                            ].map((item) => (
                                <li key={item.text} className="flex items-center space-x-2.5 text-slate-500">
                                    <item.icon className="w-3.5 h-3.5 text-slate-600" />
                                    <span className="text-sm">{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Developer Info */}

                    <div className="md:col-span-3">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Developed By</h5>
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-dark rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-brand/20">
                                AE
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Ahmed Elsherbini</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-slate-800/60 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center space-x-6">
                            <p className="text-[11px] text-slate-600 font-medium">
                                &copy; {currentYear} Tabarak Pharmacy Group. All rights reserved.
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">                            <span className="text-[10px] text-slate-700 font-bold uppercase tracking-widest">BAHRAIN</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
