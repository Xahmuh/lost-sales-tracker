
import React, { useState, useEffect, useMemo } from 'react';
import {
    BookOpen,
    Plus,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    ShieldAlert,
    Loader2,
    Search,
    Zap,
    Maximize2,
    ZoomIn,
    ZoomOut,
    Pin,
    Edit2,
    Users,
    Globe,
    Briefcase
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CodexEntry, Role } from '../types';
import Swal from 'sweetalert2';

interface CorporateCodexProps {
    userRole: Role;
    onBack: () => void;
}

export const CorporateCodex: React.FC<CorporateCodexProps> = ({ userRole, onBack }) => {
    const [entries, setEntries] = useState<CodexEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEntry, setActiveEntry] = useState<CodexEntry | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'circular' | 'policy'>('all');
    const [isFlipping, setIsFlipping] = useState(false);
    const [isProcessingPdf, setIsProcessingPdf] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [panning, setPanning] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [filterDept, setFilterDept] = useState('all');

    const [editorData, setEditorData] = useState<Partial<CodexEntry>>({
        title: '',
        description: '',
        type: 'circular',
        priority: 'normal',
        publishDate: new Date().toISOString().split('T')[0],
        pages: [],
        isPublished: true,
        department: 'all',
        tags: []
    });

    const isManager = userRole === 'admin' || userRole === 'manager';

    useEffect(() => {
        fetchEntries();
        loadPdfJs();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeEntry || isEditorOpen) return;
            if (e.key === 'Escape') setActiveEntry(null);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeEntry, isEditorOpen]);

    const fetchEntries = async () => {
        setIsLoading(true);
        try {
            const data = await supabase.codex.list();
            const visibleData = isManager ? data : data.filter(e => e.isPublished);
            setEntries(visibleData);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPdfJs = async () => {
        if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
                (window as any).pdfjsLib = pdfjsLib;
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                resolve(pdfjsLib);
            };
            document.head.appendChild(script);
        });
    };

    const processPdf = async (file: File) => {
        setIsProcessingPdf(true);
        try {
            const pdfjsLib = await loadPdfJs() as any;
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageImages: string[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context!, viewport }).promise;
                pageImages.push(canvas.toDataURL('image/jpeg', 0.8));
            }
            setEditorData(prev => ({ ...prev, pages: [...(prev.pages || []), ...pageImages] }));
        } catch (err) {
            Swal.fire('Error', 'Failed to process PDF.', 'error');
        } finally {
            setIsProcessingPdf(false);
        }
    };

    const filteredEntries = useMemo(() => {
        return entries
            .filter(entry => {
                const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesType = filterType === 'all' || entry.type === filterType;
                const matchesDept = filterDept === 'all' || entry.department === filterDept;
                return matchesSearch && matchesType && matchesDept;
            })
            .sort((a, b) => {
                const priorities = { critical: 0, urgent: 1, normal: 2 };
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                return priorities[a.priority as keyof typeof priorities] - priorities[b.priority as keyof typeof priorities];
            });
    }, [entries, searchTerm, filterType, filterDept]);

    const handleTogglePin = async (entry: CodexEntry) => {
        const targetId = entry.id;
        const newPinState = !entry.isPinned;
        setEntries(prev => prev.map(e => e.id === targetId ? { ...e, isPinned: newPinState } : e));
        try {
            await supabase.codex.upsert({ ...entry, isPinned: newPinState });
        } catch (err) {
            setEntries(prev => prev.map(e => e.id === targetId ? { ...e, isPinned: !newPinState } : e));
            Swal.fire('Error', 'Failed to update pin status', 'error');
        }
    };

    const handleSave = async () => {
        if (!editorData.title || editorData.pages?.length === 0) {
            Swal.fire('Error', 'Please provide a title and at least one page.', 'error');
            return;
        }
        try {
            await supabase.codex.upsert(editorData);
            Swal.fire('Success', 'Codex updated successfully', 'success');
            setIsEditorOpen(false);
            fetchEntries();
        } catch (err) {
            Swal.fire('Error', 'Failed to save entry', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This document will be permanently removed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        });
        if (result.isConfirmed) {
            try {
                await supabase.codex.delete(id);
                fetchEntries();
                Swal.fire('Deleted!', 'Entry removed.', 'success');
            } catch (err) {
                Swal.fire('Error', 'Failed to delete', 'error');
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        Array.from(files).forEach((f: any) => {
            const file = f as File;
            if (file.type === 'application/pdf') {
                processPdf(file);
            } else if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditorData(prev => ({ ...prev, pages: [...(prev.pages || []), reader.result as string] }));
                };
                reader.readAsDataURL(file as Blob);
            }
        });
    };

    const changePage = (delta: number) => {
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentPage(p => {
                const next = p + delta;
                return Math.max(0, Math.min(activeEntry!.pages.length - 1, next));
            });
            setIsFlipping(false);
        }, 300);
    };

    const renderMagazine = () => {
        if (!activeEntry) return null;
        const totalPages = activeEntry.pages.length;

        return (
            <div className="fixed inset-0 bg-slate-900/98 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center p-4 md:p-8 select-none overflow-hidden">
                <button
                    onClick={() => { setActiveEntry(null); setZoom(1); setPanning({ x: 0, y: 0 }); }}
                    className="fixed top-8 right-8 z-[260] w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center transition-all group backdrop-blur-xl border border-white/10 shadow-2xl active:scale-90"
                    title="Close Registry"
                >
                    <X size={24} />
                </button>

                <div className="relative flex-1 w-full flex items-center justify-center z-[220] overflow-hidden p-4">
                    <div
                        onMouseDown={(e) => zoom > 0.5 && setIsDragging(true)}
                        onMouseMove={(e) => {
                            if (isDragging && zoom > 0.5) {
                                setPanning(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
                            }
                        }}
                        onMouseUp={() => setIsDragging(false)}
                        onMouseLeave={() => setIsDragging(false)}
                        style={{
                            transform: `translate(${panning.x}px, ${panning.y}px) scale(${zoom})`,
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
                        }}
                        className={`relative w-full max-w-6xl h-auto max-h-[80vh] aspect-[1/1.41] md:aspect-[1.41/1] bg-white rounded-xl shadow-2xl overflow-hidden flex transition-all duration-500 origin-center ${isFlipping ? 'scale-[0.98] opacity-80 blur-[2px] transition-all duration-300' : 'hover:shadow-[0_40px_100px_rgba(0,0,0,0.4)]'}`}
                    >
                        <div className="absolute inset-y-0 left-1/2 w-px bg-slate-200/20 z-20"></div>
                        <div className="flex-1 relative bg-slate-50 overflow-hidden">
                            <img src={activeEntry.pages[currentPage]} alt="Page" className="w-full h-full object-contain pointer-events-none" />
                            <div className="absolute bottom-4 left-4 text-[9px] font-black text-slate-400 bg-white/60 px-2 py-1 rounded">P{currentPage + 1}</div>
                        </div>
                        <div className="flex-1 relative bg-slate-50 hidden md:block border-l">
                            {currentPage + 1 < totalPages ? (
                                <>
                                    <img src={activeEntry.pages[currentPage + 1]} alt="Page" className="w-full h-full object-contain pointer-events-none" />
                                    <div className="absolute bottom-4 right-4 text-[9px] font-black text-slate-400 bg-white/60 px-2 py-1 rounded">P{currentPage + 2}</div>
                                </>
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center opacity-20"><BookOpen size={60} /></div>
                            )}
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-1.5 rounded-2xl gap-2 z-[240] shadow-2xl">
                        <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg active:scale-90"><ZoomOut size={20} /></button>
                        <div className="px-5 text-[10px] font-black text-white min-w-[70px] text-center uppercase tracking-widest bg-white/5 h-12 flex items-center justify-center rounded-xl border border-white/5 cursor-default">{Math.round(zoom * 100)}%</div>
                        <button onClick={() => setZoom(prev => Math.min(3, prev + 0.25))} className="w-12 h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg active:scale-90"><ZoomIn size={20} /></button>
                        <div className="w-px h-8 bg-white/10 mx-1"></div>
                        <button onClick={() => { setZoom(1); setPanning({ x: 0, y: 0 }); }} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all active:scale-95"><Maximize2 size={18} /></button>
                    </div>
                </div>

                <div className="z-[250] flex items-center gap-4 mt-6 animate-in slide-in-from-bottom duration-700">
                    <button disabled={currentPage === 0 || isFlipping} onClick={() => changePage(-2)} className="flex items-center gap-3 px-8 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-20 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"><ChevronLeft size={18} /><span>Previous</span></button>
                    <div className="px-8 h-12 bg-slate-900 border border-white/10 rounded-xl flex items-center gap-4 shadow-2xl">
                        <span className="text-white text-base font-black tracking-tight min-w-[60px] text-center">{Math.floor(currentPage / 2) + 1} <span className="text-white/20 mx-1">/</span> {Math.ceil(totalPages / 2)}</span>
                    </div>
                    <button disabled={currentPage >= totalPages - 2 || isFlipping} onClick={() => changePage(2)} className="flex items-center gap-3 px-8 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-20 font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95"><span>Next Page</span><ChevronRight size={18} /></button>
                </div>
            </div>
        );
    };

    const renderEditor = () => (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[250] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-8 border-b flex items-center justify-between bg-slate-50">
                    <h3 className="text-xl font-black text-slate-900 uppercase">Registry Architect</h3>
                    <button onClick={() => setIsEditorOpen(false)} className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Title</label>
                            <input type="text" value={editorData.title} onChange={e => setEditorData(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                            <select title="Dept" value={editorData.department} onChange={e => setEditorData(prev => ({ ...prev, department: e.target.value }))} className="w-full bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold">
                                <option value="all">All Departments</option>
                                <option value="HR">Human Resources</option>
                                <option value="Operations">Operations</option>
                                <option value="IT">Information Tech</option>
                                <option value="Finance">Finance</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type & Priority</label>
                            <div className="flex gap-2">
                                <select title="Type" value={editorData.type} onChange={e => setEditorData(prev => ({ ...prev, type: e.target.value as any }))} className="flex-1 bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold">
                                    <option value="circular">Circular</option>
                                    <option value="policy">Policy</option>
                                </select>
                                <select title="Priority" value={editorData.priority} onChange={e => setEditorData(prev => ({ ...prev, priority: e.target.value as any }))} className="flex-1 bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold">
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Publish Date</label>
                            <input type="date" value={editorData.publishDate} onChange={e => setEditorData(prev => ({ ...prev, publishDate: e.target.value }))} className="w-full bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags (Comma separated)</label>
                            <input type="text" value={editorData.tags?.join(', ')} onChange={e => setEditorData(prev => ({ ...prev, tags: e.target.value.split(',').map(t => t.trim()) }))} className="w-full bg-slate-50 border p-4 rounded-xl outline-none text-sm font-bold" placeholder="HR, Update, 2024" />
                        </div>
                        <div className="space-y-2 flex flex-col justify-end">
                            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border cursor-pointer">
                                <input type="checkbox" checked={editorData.isPublished} onChange={e => setEditorData(prev => ({ ...prev, isPublished: e.target.checked }))} className="w-5 h-5 rounded accent-slate-900" />
                                <span className="text-[10px] font-black uppercase">Published / Public</span>
                            </label>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assets (PDF/Images)</label>
                        <label className="w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 cursor-pointer">
                            {isProcessingPdf ? <Loader2 className="animate-spin" /> : <Plus />}
                            <span className="text-[10px] font-black uppercase mt-2">Upload</span>
                            <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" disabled={isProcessingPdf} />
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {editorData.pages?.map((page, idx) => (
                                <div key={idx} className="relative w-16 h-20 rounded border group">
                                    <img src={page} className="w-full h-full object-cover" alt="page" />
                                    <button onClick={() => setEditorData(prev => ({ ...prev, pages: prev.pages?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-500 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-slate-50 flex gap-4">
                    <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Save Registry</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fcfcfc] p-6 md:p-12">
            <div className="max-w-[1400px] mx-auto">
                <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase">Corporate <span className="text-slate-400">Codex</span></h1>
                    <div className="flex gap-4">
                        {isManager && <button onClick={() => { setEditorData({ title: '', description: '', type: 'circular', priority: 'normal', publishDate: new Date().toISOString().split('T')[0], pages: [], isPublished: true, department: 'all', tags: [] }); setIsEditorOpen(true); }} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase"><Plus size={18} className="inline mr-2" /> Add Registry</button>}
                        <button onClick={onBack} className="px-8 py-4 bg-white border rounded-2xl font-black text-[10px] uppercase text-slate-500">Back</button>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="Search by title, description or #tags..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white border p-6 pl-16 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:border-slate-900 transition-all" />
                    </div>
                    <div className="flex bg-white p-1.5 border rounded-[2rem] shadow-sm">
                        {(['all', 'circular', 'policy'] as const).map(type => (
                            <button key={type} onClick={() => setFilterType(type)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${filterType === type ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{type}</button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="w-full md:w-64 flex-shrink-0 space-y-2">
                        <div className="p-4 mb-2"><h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">Departments</h2></div>
                        {[
                            { id: 'all', label: 'All Files', icon: Briefcase },
                            { id: 'HR', label: 'Human Resources', icon: Users },
                            { id: 'Operations', icon: Zap, label: 'Operations' },
                            { id: 'IT', icon: Globe, label: 'Info Tech' },
                            { id: 'Finance', icon: ShieldAlert, label: 'Finance' }
                        ].map(dept => (
                            <button
                                key={dept.id}
                                onClick={() => setFilterDept(dept.id)}
                                className={`w-full flex items-center gap-4 p-5 rounded-[1.8rem] transition-all duration-300 group ${filterDept === dept.id ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                            >
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${filterDept === dept.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-white border'}`}>
                                    <dept.icon size={18} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-wider">{dept.label}</span>
                            </button>
                        ))}
                    </aside>

                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex justify-center py-40"><Loader2 className="animate-spin text-slate-200" size={48} /></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                                {filteredEntries.map(entry => (
                                    <div key={entry.id} className="bg-white rounded-[2.5rem] border overflow-hidden flex flex-col hover:shadow-xl transition-all h-[480px]">
                                        <div className="h-56 bg-slate-100 relative">
                                            <img src={entry.pages[0]} className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-700" alt="cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                {!entry.isPublished && <div className="px-3 py-1 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full text-[8px] font-black uppercase tracking-widest">Draft</div>}
                                                {entry.department && entry.department !== 'all' && (
                                                    <div className="px-3 py-1 bg-blue-500/20 backdrop-blur-md text-blue-200 border border-blue-500/30 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <Briefcase size={10} />{entry.department}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {entry.isPinned && <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle"><Pin size={14} fill="currentColor" /></div>}
                                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border-2 border-white shadow-sm ${entry.priority === 'critical' ? 'bg-red-500 text-white' : entry.priority === 'urgent' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>{entry.priority}</div>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col bg-white">
                                            <h3 className="text-xl font-black uppercase line-clamp-1 text-slate-900">{entry.title}</h3>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{entry.publishDate} • {entry.pages.length} Pages</p>
                                            <div className="mt-4 flex flex-wrap gap-1">
                                                {entry.tags?.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded-md">#{tag}</span>
                                                ))}
                                            </div>
                                            <div className="mt-auto pt-6 flex justify-between items-center border-t border-slate-50">
                                                <div className="flex flex-col">
                                                    <button onClick={() => { setActiveEntry(entry); setCurrentPage(0); }} className="mt-2 text-slate-900 text-[11px] font-black uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 hover:text-emerald-600 hover:border-emerald-600 transition-all">Open Registry</button>
                                                </div>
                                                {isManager && (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleTogglePin(entry)} className={`p-2 rounded-lg transition-all ${entry.isPinned ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-50'}`}><Pin size={16} fill={entry.isPinned ? "currentColor" : "none"} /></button>
                                                        <button onClick={() => { setEditorData(entry); setIsEditorOpen(true); }} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-slate-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete(entry.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {activeEntry && renderMagazine()}
            {isEditorOpen && renderEditor()}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; } 
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle { animation: bounce-subtle 2s infinite ease-in-out; }
            `}</style>
        </div>
    );
};
