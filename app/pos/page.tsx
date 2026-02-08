
import React, { useState, useEffect } from 'react';
import {
  Save,
  Trash2,
  PackageSearch,
  ScanLine,
  ArrowRight,
  Plus,
  Minus,
  Zap,
  Hash,
  Box,
  UserCircle,
  CheckCircle2,
  FileText,
  Target,
  Sparkles,
  Package,
  Layers,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  ArrowLeft,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { ProductSearch } from '../../components/ProductSearch';
import { ManualProductModal } from '../../components/ManualProductModal';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { Product, LostSale, Branch, Pharmacist, Shortage } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/calculations';

interface POSPageProps {
  branch: Branch;
  pharmacist: Pharmacist;
  permissions: any[]; // Changed from FeaturePermission[] to any[] for simplicity in this turn
  onBackToPharmacist: () => void;
}

type Mode = 'sales' | 'shortages';

export const POSPage: React.FC<POSPageProps> = ({ branch, pharmacist, permissions, onBackToPharmacist }) => {
  const getPermission = (feature: string) => {
    return permissions.find(p => p.featureName === feature)?.accessLevel || 'edit';
  };

  const salesPerm = getPermission('lost_sales');
  const shortagesPerm = getPermission('shortages');

  const initialMode = salesPerm !== 'none' ? 'sales' : 'shortages';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [cart, setCart] = useState<any[]>([]); // Mixed types handled by mode
  const [manualQuery, setManualQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Draft Persistence Management ---
  const DRAFT_KEY = `tabarak_pos_draft_${branch.id}_${pharmacist.id}`;

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const { mode: savedMode, cart: savedCart } = JSON.parse(savedDraft);
        setMode(savedMode);
        setCart(savedCart);
        console.log("Draft session restored successfully.");
      } catch (e) {
        console.error("Failed to parse POS draft:", e);
      }
    }
  }, []);

  // 2. Auto-save on every change
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ mode, cart }));
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, [cart, mode, DRAFT_KEY]);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToastMessage(e.detail);
      setTimeout(() => setToastMessage(null), 5000);
    };
    window.addEventListener('tabarak_toast', handleToast);
    return () => window.removeEventListener('tabarak_toast', handleToast);
  }, []);

  const switchMode = (newMode: Mode) => {
    if (cart.length > 0) {
      if (!confirm('Switching modes will clear current items. Continue?')) return;
    }
    setCart([]);
    setMode(newMode);
  };

  const addItem = (product: Product) => {
    const existingIdx = cart.findIndex(i => i.productId === product.id);

    if (existingIdx !== -1 && mode === 'sales') {
      updateQty(existingIdx, (cart[existingIdx].quantity || 1) + 1);
      return;
    }

    if (existingIdx !== -1 && mode === 'shortages') {
      alert("Item already in shortage list");
      return;
    }

    if (mode === 'sales') {
      setCart([{
        branchId: branch.id,
        pharmacistId: pharmacist.id,
        pharmacistName: pharmacist.name,
        productId: product.isManual ? null : product.id, // null for manual products
        productName: product.name,
        agentName: product.agent,
        category: product.category,
        unitPrice: Number(product.defaultPrice || 0),
        quantity: 1,
        priceSource: product.isManual ? 'manual' : 'db',
        isManual: !!product.isManual,
        alternativeGiven: false,
        internalTransfer: false,
        internalCode: product.internalCode,
        notes: ''
      }, ...cart]);
    } else {
      setCart([{
        branchId: branch.id,
        pharmacistId: pharmacist.id,
        pharmacistName: pharmacist.name,
        productId: product.id,
        productName: product.name,
        agentName: product.agent,
        status: 'Out of Stock',
        internalCode: product.internalCode,
        notes: ''
      }, ...cart]);
    }
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], quantity: qty };
    setCart(newCart);
  };

  const toggleAlternative = (idx: number) => {
    const newCart = [...cart];
    const isNowActive = !newCart[idx].alternativeGiven;
    newCart[idx] = {
      ...newCart[idx],
      alternativeGiven: isNowActive,
      internalTransfer: isNowActive ? false : newCart[idx].internalTransfer
    };
    setCart(newCart);
  };

  const toggleTransfer = (idx: number) => {
    const newCart = [...cart];
    const isNowActive = !newCart[idx].internalTransfer;
    newCart[idx] = {
      ...newCart[idx],
      internalTransfer: isNowActive,
      alternativeGiven: isNowActive ? false : newCart[idx].alternativeGiven
    };
    setCart(newCart);
  };

  const updatePrice = (idx: number, price: number) => {
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], unitPrice: price, priceSource: 'manual' };
    setCart(newCart);
  };

  const updateNotes = (idx: number, notes: string) => {
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], notes };
    setCart(newCart);
  };

  const updateStatus = (idx: number, status: 'Low' | 'Critical' | 'Out of Stock') => {
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], status };
    setCart(newCart);
  };

  const removeItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;
    const commonTimestamp = new Date().toISOString();
    setIsSubmitting(true);

    try {
      if (mode === 'sales') {
        for (const item of cart) {
          // 1. Log the Lost Sale
          await supabase.sales.insert({ ...item, timestamp: commonTimestamp } as any);

          // 2. AUTOMATICALLY Log as Shortage (Out of Stock)
          await supabase.shortages.create({
            branchId: item.branchId,
            pharmacistId: item.pharmacistId,
            pharmacistName: item.pharmacistName,
            productId: item.productId,
            productName: item.productName,
            agentName: item.agentName,
            status: 'Out of Stock',
            timestamp: commonTimestamp,
            internalCode: item.internalCode,
            notes: `Auto-generated from Lost Sale: ${item.notes || ''}`
          } as any);
        }
      } else {
        for (const item of cart) {
          await supabase.shortages.create({ ...item, timestamp: commonTimestamp } as any);
        }
      }

      console.log(`Successfully logged ${cart.length} items to ${mode}`);
      window.dispatchEvent(new CustomEvent('tabarak_toast', {
        detail: { message: `Successfully logged ${cart.length} items`, type: 'success' }
      }));

      // Clear the local draft after successful logging
      localStorage.removeItem(DRAFT_KEY);

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Checkout Error:", err);
      alert("System Error: " + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScan = async (code: string) => {
    const results = await supabase.products.search(code, branch.id);
    const product = results.find(p => p.internationalCode === code || p.internalCode === code);
    if (product) {
      addItem(product);
    } else {
      setManualQuery(code);
      setIsManualModalOpen(true);
    }
    setIsScannerOpen(false);
  };

  const grandTotal = cart.reduce((sum, item) => sum + ((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0)), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 h-full page-enter font-sans">
        {/* Search & Audit Area */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          {branch.isItemsEntryEnabled !== false && (
            <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3">
              <div className="flex-1 w-full relative">
                <ProductSearch
                  onSelect={addItem}
                  onManual={(q) => { setManualQuery(q); setIsManualModalOpen(true); }}
                />
              </div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full md:w-20 h-14 md:h-[58px] bg-white border border-slate-200 text-slate-400 hover:text-brand hover:border-brand/40 rounded-xl flex items-center justify-center transition-all shrink-0"
                aria-label="Open barcode scanner"
              >
                <ScanLine className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col relative">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between relative">
              {/* Left: Dynamic Title */}
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">
                  {mode === 'sales' ? 'Loss Logging' : 'Shortage Report'}
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {mode === 'sales' ? 'Documenting Gaps' : 'Inventory Audit'}
                </p>
              </div>

              {/* Center: Fixed Mode Switcher */}
              <div className="absolute left-1/2 -translate-x-1/2 flex bg-slate-100/60 p-1 rounded-lg border border-slate-200/50">
                {salesPerm !== 'none' && (
                  <button
                    onClick={() => switchMode('sales')}
                    className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'sales' ? 'bg-white text-brand shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Lost Sales
                  </button>
                )}
                {shortagesPerm !== 'none' && (
                  <button
                    onClick={() => switchMode('shortages')}
                    className={`px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'shortages' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Shortage
                  </button>
                )}
              </div>

              {/* Right: Status Indicator */}
              <div className="flex-1 flex justify-end">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
                    <Package size={32} strokeWidth={1.5} className="text-slate-200" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-300">Cart Empty</p>
                  <p className="text-xs text-slate-400 mt-1.5">Scan or search for products to begin</p>
                </div>
            ) : (
              cart.map((item, idx) => (
                  <div key={idx} className="group p-5 bg-white rounded-xl border border-slate-100 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all flex flex-col items-stretch gap-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${mode === 'sales' ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                          <Package size={22} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 tracking-tight uppercase text-base leading-tight">{item.productName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                              <Hash size={9} strokeWidth={3} />
                              <span>{item.internalCode || 'NO CODE'}</span>
                            </p>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.agentName || 'NO AGENT'}</span>
                        </div>
                      </div>
                    </div>

                    {mode === 'sales' ? (
                      <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-end">
                          {/* Marks Section */}
                          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <button
                              onClick={() => toggleAlternative(idx)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all border ${item.alternativeGiven ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}
                              title="Alternative Suggested"
                            >
                              <Sparkles size={12} />
                              <span>Alt</span>
                            </button>
                            <button
                              onClick={() => toggleTransfer(idx)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all border ${item.internalTransfer ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}
                              title="Internal Transfer Initiated"
                            >
                              <RefreshCcw size={12} />
                              <span>Transfer</span>
                            </button>
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Price</span>
                            <div className="flex items-center bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
                              <span className="text-[9px] font-bold text-slate-400 mr-1.5">BHD</span>
                              <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-transparent text-sm font-black text-slate-800 outline-none"
                              title="Unit price in BHD"
                              aria-label="Unit price"
                            />
                          </div>
                        </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Qty</span>
                            <div className="flex items-center bg-slate-900 rounded-lg overflow-hidden">
                              <button onClick={() => updateQty(idx, item.quantity - 1)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors" aria-label="Decrease quantity"><Minus size={13} /></button>
                              <span className="w-8 text-center text-xs font-black text-white">{item.quantity}</span>
                              <button onClick={() => updateQty(idx, item.quantity + 1)} className="p-2 text-white/40 hover:text-white hover:bg-white/10 transition-colors" aria-label="Increase quantity"><Plus size={13} /></button>
                            </div>
                          </div>

                          <button onClick={() => removeItem(idx)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" aria-label="Remove item from cart"><Trash2 size={20} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-100">
                          <button
                              onClick={() => updateStatus(idx, 'Low')}
                              className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${item.status === 'Low' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Low
                            </button>
                            <button
                              onClick={() => updateStatus(idx, 'Critical')}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${item.status === 'Critical' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <AlertTriangle size={12} />
                              <span>Critical</span>
                            </button>
                            <button
                              onClick={() => updateStatus(idx, 'Out of Stock')}
                              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${item.status === 'Out of Stock' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Box size={12} />
                              <span>OOS</span>
                            </button>
                          </div>
                          <button onClick={() => removeItem(idx)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" aria-label="Remove item from cart"><Trash2 size={20} /></button>
                      </div>
                    )}
                  </div>

                    {/* Notes Field */}
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                      <FileText size={14} className="text-slate-400 mt-1" />
                    <textarea
                      placeholder="Add a remark or note for the warehouse/audit..."
                      value={item.notes || ''}
                      onChange={(e) => updateNotes(idx, e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-slate-600 outline-none resize-none min-h-[40px] placeholder:text-slate-300 placeholder:italic"
                    />
                  </div>
                </div>
              ))
            )}
          </div>

            {showSuccess && (
              <div className="absolute inset-x-6 bottom-6 bg-slate-900 text-white p-8 rounded-2xl flex items-center space-x-6 animate-in slide-in-from-bottom-10 shadow-2xl z-50 ring-1 ring-white/10">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <p className="font-black text-xl tracking-tight">SUCCESSFULLY SYNCED</p>
                  <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">Inventory records updated in real-time</p>
                </div>
              </div>
            )}
        </div>
      </div>

        {/* Identity & Finalize Sidebar */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="min-h-[140px] flex flex-col items-center justify-center mb-8">
                {mode === 'sales' ? (
                  <div className="text-center space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TOTAL LOSS ESTIMATE</p>
                    <div className="relative inline-block">
                      <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{grandTotal.toFixed(3)}</p>
                      <p className="text-[9px] font-bold text-brand uppercase tracking-widest absolute -bottom-5 left-0 right-0">BAHRAINI DINARS</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">ACTIVE REPORTING</p>
                  <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                    <Target size={40} className="text-slate-300 animate-pulse" />
                  </div>
                  <p className="text-xl font-black text-slate-900 tracking-tight uppercase">Monitoring Gaps</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-slate-50 pt-10">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Items</span>
                <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-slate-900 shadow-sm border border-slate-100">{cart.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl transition-all">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-black text-slate-900">Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Finalize Button */}
          {(mode === 'sales' ? salesPerm === 'edit' : shortagesPerm === 'edit') ? (
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className={`w-full text-white font-black py-10 rounded-[2rem] shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none disabled:translate-y-0 text-xl tracking-[0.2em] uppercase flex items-center justify-center gap-4 mt-12 ${isSubmitting ? 'bg-slate-400' : 'bg-brand hover:bg-brand-hover shadow-brand/20'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'sales' ? 'LOG REVENUE LOSS' : 'FINALIZE REPORT'}</span>
                  <ChevronRight size={24} />
                </>
              )}
            </button>
          ) : (
            <div className="w-full bg-slate-50 text-slate-400 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-slate-100 flex items-center justify-center space-x-3 mt-12">
              <AlertTriangle size={18} />
              <span>Read-Only Access</span>
            </div>
          )}
        </div>

        {/* Pharmacist Identity Card - Now on Bottom */}
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-brand/10 transition-all duration-700"></div>
          <div className="relative z-10 text-center">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-105 transition-all duration-500">
              <div className="w-20 h-20 bg-brand rounded-[2rem] flex items-center justify-center text-white shadow-lg shadow-brand/20">
                <UserCircle size={48} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-3">Certified Pharmacist</p>
            <h3 className="font-black text-3xl text-white tracking-tighter mb-8 leading-tight">{pharmacist.name}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/20 text-brand flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Branch Access</span>
                </div>
                <span className="text-xs font-black text-white">{branch.code}</span>
              </div>

              <button
                onClick={onBackToPharmacist}
                className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-black text-white/50 hover:text-white uppercase tracking-[0.3em] transition-all border border-transparent hover:border-white/10 group"
              >
                <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                <span>Switch Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ManualProductModal
        isOpen={isManualModalOpen}
        initialName={manualQuery}
        onClose={() => setIsManualModalOpen(false)}
        onSave={(data) => {
          // Create a temporary product object WITHOUT saving to products table
          const tempProduct = {
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
            name: data.product_name,
            defaultPrice: Number(data.selling_price || 0),
            agent: data.agent_name,
            category: data.category,
            isManual: true,
            createdByBranch: branch.id,
            internalCode: data.internal_code || undefined,
            internationalCode: undefined
          };

          // Add directly to cart without saving to products table
          addItem(tempProduct as any);
          setIsManualModalOpen(false);
        }}
      />
      {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-[2rem] shadow-2xl z-[500] animate-in slide-in-from-bottom-5 flex items-center gap-4 border border-white/10 backdrop-blur-xl ${toastMessage.type === 'error' ? 'bg-red-950 text-white' :
          toastMessage.type === 'success' ? 'bg-emerald-900 text-white' :
            'bg-slate-900 text-white'
          }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${toastMessage.type === 'error' ? 'bg-red-400 animate-pulse' :
            toastMessage.type === 'success' ? 'bg-emerald-400 animate-pulse' :
              'bg-brand animate-pulse'
            }`}></div>
          <span className="text-sm font-black uppercase tracking-widest">{toastMessage.message}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-6 text-white/40 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};
