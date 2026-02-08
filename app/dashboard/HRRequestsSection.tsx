import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { HRRequest } from '../../types';
import {
    Search,
    CheckCircle2,
    XCircle,
    FileText as FileTextIcon
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { generateDocumentBlob } from '../lib/docGenerator';

export const HRRequestsSection: React.FC = () => {
    const [requests, setRequests] = useState<HRRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setIsLoading(true);
        const data = await supabase.hrRequests.list();
        setRequests(data);
        setIsLoading(false);
    };

    const updateStatus = async (id: string, status: 'Approved' | 'Rejected' | 'Completed') => {
        await supabase.hrRequests.updateStatus(id, status);
        loadRequests();
    };

    const generateWordDocument = async (req: HRRequest) => {
        try {
            const typesToGenerate: string[] = [];

            // Identify which specific templates are needed
            if (req.docTypes.some(t => t.toLowerCase().includes('experience'))) typesToGenerate.push('Experience Certificate');
            if (req.docTypes.some(t => t.toLowerCase().includes('employment'))) typesToGenerate.push('Employment Certificate');
            if (req.docTypes.some(t => t.toLowerCase().includes('salary'))) typesToGenerate.push('Salary Certificate');

            // If no specific templates matched (e.g., only "General" or "Embassy"), or if it's mixed with them
            if (typesToGenerate.length === 0) {
                const blob = await generateDocumentBlob(req);
                saveAs(blob, `HR_Request_${req.refNum}_Generic.docx`);
            } else {
                // Generate a file for each specific type found
                for (const type of typesToGenerate) {
                    const blob = await generateDocumentBlob(req, type);
                    const simpleType = type.split(' ')[0]; // Experience, Employment, Salary
                    saveAs(blob, `HR_Request_${req.refNum}_${simpleType}.docx`);
                }
            }
        } catch (error) {
            console.error("Error generating document:", error);
            alert("Failed to generate document. Please try again.");
        }
    };

    const filteredRequests = requests.filter(r =>
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.refNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cpr.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <Search className="w-5 h-5 text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search requests..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border-none outline-none text-sm font-bold text-slate-700 w-64 placeholder:font-medium"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Employee</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Details</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Vacation Info</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRequests.length > 0 ? (
                                filteredRequests.map((req) => (
                                    <tr key={req.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="p-6">
                                            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{req.refNum}</span>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-slate-900">{req.employeeName}</div>
                                            <div className="text-xs font-medium text-slate-400">CPR: {req.cpr}</div>
                                        </td>
                                        <td className="p-6">
                                            {req.type === 'Vacation Request' ? (
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100 w-fit">
                                                        Vacation: {req.leaveType}
                                                    </span>
                                                    <div className="text-[10px] font-bold text-slate-400 flex flex-col">
                                                        <span>Last Vac: {req.lastVacationDate || 'N/A'}</span>
                                                        <span>Return Date: {req.holidayTo}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {req.docTypes.map((type, idx) => (
                                                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                            {type === 'Others' && req.otherDocType ? `Other: ${req.otherDocType}` : type}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            {req.type === 'Vacation Request' ? (
                                                <div className="space-y-1">
                                                    <div className="font-bold text-slate-700 text-xs">
                                                        {req.holidayFrom} → {req.holidayTo}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{req.daysCount} DAYS</span>
                                                    </div>
                                                    {req.notes && (
                                                        <div className="text-[10px] font-medium text-slate-500 bg-amber-50 p-1.5 rounded-lg border border-amber-100 mt-1 max-w-[200px] italic">
                                                            "{req.notes}"
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">{req.reqDate}</div>
                                                    <div className="text-xs text-slate-400 font-medium">{req.deliveryMethod || '—'}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-6">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize
                                                ${req.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    req.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                                                        req.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-amber-100 text-amber-700'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${req.status === 'Completed' ? 'bg-emerald-500' :
                                                    req.status === 'Rejected' ? 'bg-rose-500' :
                                                        req.status === 'Approved' ? 'bg-blue-500' :
                                                            'bg-amber-500'
                                                    }`}></div>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.type !== 'Vacation Request' && (
                                                    <button
                                                        onClick={() => generateWordDocument(req)}
                                                        className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-all"
                                                        title="Download Word Template"
                                                    >
                                                        <FileTextIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {req.status === 'Pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(req.id, 'Approved')}
                                                            className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-all"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(req.id, 'Rejected')}
                                                            className="p-2 hover:bg-rose-100 rounded-lg text-rose-600 transition-all"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                                        No requests found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
