
import React, { useState } from 'react';
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
  AlertCircle
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
  onBackToPharmacist: () => void;
}

type Mode = 'sales' | 'shortages';

export const POSPage: React.FC<POSPageProps> = ({ branch, pharmacist, onBackToPharmacist }) => {
  const [mode, setMode] = useState<Mode>('sales');
  const [cart, setCart] = useState<any[]>([]); // Mixed types handled by mode
  const [manualQuery, setManualQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const switchMode = (newMode: Mode) => {
    if (cart.length > 0) {
      if (!confirm('Switching modes will clear current items. Continue?')) return;
    }
    setCart([]);
    setMode(newMode);
  };

  const addItem = (product: Product, initialStatus?: 'Low' | 'Critical' | 'Out of Stock', preferredMode?: 'sales' | 'shortages') => {
    // If voice command specifies a mode, switch to it automatically
    if (preferredMode && preferredMode !== mode) {
      setMode(preferredMode);
    }

    // Use the effective mode (either current or the one we just switched to)
    const effectiveMode = preferredMode || mode;

    const existingIdx = cart.findIndex(i => i.productId === product.id);

    if (existingIdx !== -1 && effectiveMode === 'sales') {
      updateQty(existingIdx, (cart[existingIdx].quantity || 1) + 1);
      return;
    }

    if (existingIdx !== -1 && effectiveMode === 'shortages') {
      alert("Item already in shortage list");
      return;
    }

    if (effectiveMode === 'sales') {
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
        productId: product.isManual ? null : product.id, // null for manual products
        productName: product.name,
        status: initialStatus || 'Low',
        pharmacistName: pharmacist.name,
        timestamp: new Date().toISOString(),
        internalCode: product.internalCode,
        notes: ''
      }, ...cart]);
    }
  };

  const handleVoiceCommand = (cmd: 'finalize') => {
    if (cmd === 'finalize') {
      if (cart.length > 0) {
        handleCheckout();
      } else {
        alert('القائمة فارغة، لا يوجد شيء لتسجيله.');
      }
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
    if (cart.length === 0) return;
    const commonTimestamp = new Date().toISOString();

    try {
      if (mode === 'sales') {
        for (const item of cart) {
          // 1. Log the Lost Sale
          await supabase.sales.insert({ ...item, timestamp: commonTimestamp } as any);

          // 2. AUTOMATICALLY Log as Shortage (Out of Stock)
          // The user requested that any lost sale automatically registers as a shortage
          await supabase.shortages.create({
            branchId: item.branchId,
            pharmacistId: item.pharmacistId,
            pharmacistName: item.pharmacistName,
            productId: item.productId,
            productName: item.productName,
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

      setCart([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert("System Error: " + (err as any).message);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0 h-full animate-in fade-in duration-1000 font-sans">
      {/* Search & Audit Area */}
      <div className="lg:col-span-8 flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 w-full relative">
            <ProductSearch
              onSelect={addItem}
              onManual={(q) => { setManualQuery(q); setIsManualModalOpen(true); }}
              onCommand={handleVoiceCommand}
            />
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full md:w-24 h-16 md:h-22 bg-white border border-slate-200 text-brand rounded-2xl flex items-center justify-center hover:border-brand hover:shadow-lg transition-all shadow-sm shrink-0"
          >
            <ScanLine className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative">
          <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between relative min-h-[100px]">
            {/* Left: Dynamic Title */}
            <div className="flex-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {mode === 'sales' ? 'Loss Logging' : 'Shortage Report'}
              </h2>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1.5">
                {mode === 'sales' ? 'Documenting Gaps' : 'Inventory Audit'}
              </p>
            </div>

            {/* Center: Fixed Mode Switcher */}
            <div className="absolute left-1/2 -translate-x-1/2 flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200/50">
              <button
                onClick={() => switchMode('sales')}
                className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'sales' ? 'bg-white text-brand shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Lost sales
              </button>
              <button
                onClick={() => switchMode('shortages')}
                className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'shortages' ? 'bg-slate-900 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Shortage
              </button>
            </div>

            {/* Right: Status Indicator */}
            <div className="flex-1 flex justify-end">
              <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative">
                  <span className="block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Active Terminal</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 py-20">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Package size={48} strokeWidth={1.5} className="text-slate-200" />
                </div>
                <p className="text-lg font-black uppercase tracking-[0.2em] text-slate-300">Cart Empty</p>
                <p className="text-xs font-bold text-slate-400 mt-2">Scan or search for products to begin</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="group p-6 bg-white rounded-[1.5rem] border border-slate-100 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/5 transition-all flex flex-col items-stretch gap-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center space-x-6 w-full sm:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 ${mode === 'sales' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                        <Package size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 tracking-tight uppercase text-lg leading-tight">{item.productName}</h4>
                        <div className="flex flex-col gap-0.5 mt-1">
                          <p className="text-[10px] font-black text-brand uppercase tracking-widest flex items-center gap-2">
                            <Hash size={10} strokeWidth={3} />
                            <span>{item.internalCode || 'NO CODE'}</span>
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{item.agentName || 'NO AGENT'}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{item.category || 'General'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {mode === 'sales' ? (
                      <div className="flex flex-wrap items-center gap-6 w-full sm:w-auto justify-end">
                        {/* Marks Section */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                          <button
                            onClick={() => toggleAlternative(idx)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border ${item.alternativeGiven ? 'bg-orange-100 border-orange-200 text-orange-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}
                            title="Alternative Suggested"
                          >
                            <Sparkles size={14} />
                            <span>Alternative</span>
                          </button>
                          <button
                            onClick={() => toggleTransfer(idx)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border ${item.internalTransfer ? 'bg-blue-100 border-blue-200 text-blue-700 shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`}
                            title="Internal Transfer Initiated"
                          >
                            <RefreshCcw size={14} />
                            <span>Transfer</span>
                          </button>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Price</span>
                          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 shadow-inner">
                            <span className="text-[10px] font-black text-slate-400 mr-2">BHD</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updatePrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-transparent text-sm font-black text-slate-800 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">Quantity</span>
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg shadow-slate-900/10">
                            <button onClick={() => updateQty(idx, item.quantity - 1)} className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"><Minus size={14} /></button>
                            <span className="w-10 text-center text-xs font-black text-white">{item.quantity}</span>
                            <button onClick={() => updateQty(idx, item.quantity + 1)} className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"><Plus size={14} /></button>
                          </div>
                        </div>

                        <button onClick={() => removeItem(idx)} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={24} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                          <button
                            onClick={() => updateStatus(idx, 'Low')}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'Low' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Low
                          </button>
                          <button
                            onClick={() => updateStatus(idx, 'Critical')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'Critical' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            <AlertTriangle size={14} />
                            <span>Critical</span>
                          </button>
                          <button
                            onClick={() => updateStatus(idx, 'Out of Stock')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.status === 'Out of Stock' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            <Box size={14} />
                            <span>OOS</span>
                          </button>
                        </div>
                        <button onClick={() => removeItem(idx)} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={24} /></button>
                      </div>
                    )}
                  </div>

                  {/* Notes Field */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                    <FileText size={16} className="text-slate-400 mt-1" />
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
            <div className="absolute inset-x-10 bottom-10 bg-slate-900 text-white p-10 rounded-[2.5rem] flex items-center space-x-8 animate-in slide-in-from-bottom-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-50 ring-1 ring-white/10">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <p className="font-black text-3xl tracking-tighter">SUCCESSFULLY SYNCED</p>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Inventory records updated in real-time</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identity & Finalize Sidebar */}
      <div className="lg:col-span-4 flex flex-col space-y-8">
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

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10 flex-1 flex flex-col">
          <div className="flex-1 space-y-12">
            {mode === 'sales' ? (
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">TOTAL LOSS ESTIMATE</p>
                <div className="relative inline-block">
                  <p className="text-7xl font-black text-slate-900 tracking-tighter leading-none">{grandTotal.toFixed(3)}</p>
                  <p className="text-[10px] font-black text-brand uppercase tracking-[0.6em] absolute -bottom-6 left-0 right-0">BAHRAINI DINARS</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">ACTIVE REPORTING</p>
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                  <Target size={40} className="text-slate-300 animate-pulse" />
                </div>
                <p className="text-xl font-black text-slate-900 tracking-tight uppercase">Monitoring Gaps</p>
              </div>
            )}

            <div className="pt-10 space-y-4 border-t border-slate-50">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cart Items</span>
                <span className="px-3 py-1 bg-white rounded-lg text-xs font-black text-slate-900 shadow-sm border border-slate-100">{cart.length}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-black text-slate-900">Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full text-white font-black py-10 rounded-[2rem] shadow-2xl hover:-translate-y-1 active:scale-[0.98] transition-all disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none disabled:translate-y-0 text-xl tracking-[0.2em] uppercase flex items-center justify-center gap-4 mt-12 ${mode === 'sales' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
          >
            <span>{mode === 'sales' ? 'LOG REVENUE LOSS' : 'FINALIZE REPORT'}</span>
            <ChevronRight size={24} />
          </button>
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
    </div>
  );
};
