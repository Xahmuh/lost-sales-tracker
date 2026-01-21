import React, { useState, useEffect, useMemo } from 'react';
import { LostSale, Branch } from '../../types';
import { supabase } from '../../lib/supabase';
import { ChevronDown, ChevronRight, User, AlertCircle, TrendingUp, Users, ShoppingBag } from 'lucide-react';

interface PharmacistActivityProps {
    sales: LostSale[];
    branches: Branch[];
}

export const PharmacistActivitySection: React.FC<PharmacistActivityProps> = ({ sales, branches }) => {
    const [pharmacistsMap, setPharmacistsMap] = useState<Record<string, string>>({});
    const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fetch all pharmacists name
        const fetchPharmacists = async () => {
            const { data } = await supabase.client.from('pharmacists').select('id, name');
            if (data) {
                const map: Record<string, string> = {};
                data.forEach((p: any) => map[p.id] = p.name);
                setPharmacistsMap(map);
            }
        };
        fetchPharmacists();
    }, []);

    // Initialize expanded branches to include all branches initially or just the first few? 
    // Let's keep them collapsed by default or maybe expand all if few. 
    // User asked for "Display each branch as a collapsible section."
    // Let's expand branches that have data by default? No, standard collapsible.
    // We'll defaulting to having at least the first one expanded if data exists.
    useEffect(() => {
        if (branches.length > 0 && expandedBranches.size === 0) {
            // Expand populated branches by default for better UX
            const populated = branches.filter(b => sales.some(s => s.branchId === b.id)).map(b => b.id);
            setExpandedBranches(new Set(populated));
        }
    }, [branches, sales]);


    const toggleBranch = (branchId: string) => {
        const newSet = new Set(expandedBranches);
        if (newSet.has(branchId)) {
            newSet.delete(branchId);
        } else {
            newSet.add(branchId);
        }
        setExpandedBranches(newSet);
    };

    const activityData = useMemo(() => {
        const grouped: Record<string, { branchName: string; pharmacists: any[] }> = {};

        branches.forEach(branch => {
            // 1. Filter sales for this branch
            const branchSales = sales.filter(s => s.branchId === branch.id);

            // 2. Group by Pharmacist ID
            const pharmaStats: Record<string, { id: string; name: string; totalRevenue: number; customers: Set<string>; incidents: number }> = {};

            branchSales.forEach(s => {
                if (!pharmaStats[s.pharmacistId]) {
                    pharmaStats[s.pharmacistId] = {
                        id: s.pharmacistId,
                        name: s.pharmacistName || pharmacistsMap[s.pharmacistId] || 'Unknown Pharmacist',
                        totalRevenue: 0,
                        customers: new Set(),
                        incidents: 0
                    };
                }
                pharmaStats[s.pharmacistId].totalRevenue += Number(s.totalValue || 0);
                // Use logic for unique customer counting (session or fallback)
                const custId = s.sessionId || `${s.branchId}_${s.lostDate}_${s.lostHour}_${Math.floor(new Date(s.timestamp).getTime() / 1000)}`;
                pharmaStats[s.pharmacistId].customers.add(custId);
                pharmaStats[s.pharmacistId].incidents += 1;
            });

            // 3. Convert to array and filter
            let pharmacistsList = Object.values(pharmaStats).map(p => ({
                ...p,
                uniqueCustomers: p.customers.size
            }));

            // Filter by search term if exists
            if (searchTerm) {
                pharmacistsList = pharmacistsList.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
            }

            // Only include pharmacists with at least one recorded lost sale (already implicitly done by iterating sales, but safeguard)
            pharmacistsList = pharmacistsList.filter(p => p.incidents > 0);

            // Sort by Total Loss Revenue descending
            pharmacistsList.sort((a, b) => b.totalRevenue - a.totalRevenue);

            if (pharmacistsList.length > 0) {
                grouped[branch.id] = {
                    branchName: branch.name,
                    pharmacists: pharmacistsList
                };
            }
        });

        return grouped;
    }, [sales, branches, pharmacistsMap, searchTerm]);

    if (Object.keys(activityData).length === 0) return null;

    return (
        <div className="bg-white rounded-[2.8rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col mt-6">
            <div className="px-10 py-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center">
                        <Users className="w-6 h-6 mr-3 text-brand" />
                        Pharmacist Activity per Branch
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Performance breakdown by personnel</p>
                </div>
                <div className="relative group w-full max-w-xs">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                        <User size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="FILTER BY PHARMACIST NAME..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-brand focus:shadow-sm transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="p-6 md:p-10 space-y-6 bg-slate-50/20">
                {Object.entries(activityData).map(([branchId, data]: [string, any]) => (
                    <div key={branchId} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden">
                        <button
                            onClick={() => toggleBranch(branchId)}
                            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-2 rounded-lg transition-transform duration-300 ${expandedBranches.has(branchId) ? 'bg-brand text-white rotate-90' : 'bg-slate-100 text-slate-400'}`}>
                                    <ChevronRight size={18} />
                                </div>
                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{data.branchName}</h3>
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {data.pharmacists.length} Active Staff
                                </span>
                            </div>
                        </button>

                        {expandedBranches.has(branchId) && (
                            <div className="border-t border-slate-50 p-2 animate-in slide-in-from-top-2">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="text-left p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 first:rounded-tl-xl">Pharmacist Name</th>
                                                <th title="Total financial loss recorded by this pharmacist" className="text-center p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 cursor-help group">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <TrendingUp size={12} className="text-slate-300 group-hover:text-brand" />
                                                        <span>Total Loss (BHD)</span>
                                                    </div>
                                                </th>
                                                <th title="Number of unique customer visits grouped by session" className="text-center p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 cursor-help group">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <Users size={12} className="text-slate-300 group-hover:text-brand" />
                                                        <span>Lost Customers</span>
                                                    </div>
                                                </th>
                                                <th title="Total count of lost items recorded" className="text-center p-6 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 last:rounded-tr-xl cursor-help group">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <ShoppingBag size={12} className="text-slate-300 group-hover:text-brand" />
                                                        <span>Total Incidents</span>
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.pharmacists.map((p, idx) => (
                                                <tr key={idx} className="group hover:bg-slate-50/80 transition-colors border-b last:border-0 border-slate-50">
                                                    <td className="p-5 pl-6">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs ring-4 ring-white shadow-sm group-hover:bg-brand group-hover:text-white transition-all">
                                                                {p.name.charAt(0)}
                                                            </div>
                                                            <span className="font-black text-slate-700 text-xs uppercase tracking-wide">{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="font-black text-slate-900 text-sm bg-red-50 px-3 py-1 rounded-lg border border-red-100 group-hover:border-red-200 transition-colors">
                                                            {p.totalRevenue.toFixed(3)} BHD
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="font-bold text-slate-600 text-xs bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                            {p.uniqueCustomers} Visits
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-center">
                                                        <span className="font-bold text-slate-500 text-xs">
                                                            {p.incidents} Item(s)
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
