
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
  ReceiptText,
  Target,
  Sparkles,
  Package,
  Layers,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';
import { ProductSearch } from '../../components/ProductSearch';
import { ManualProductModal } from '../../components/ManualProductModal';
import { BarcodeScanner } from '../../components/BarcodeScanner';
import { Product, LostSale, Branch, Pharmacist } from '../../types';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/calculations';

interface POSPageProps {
  branch: Branch;
  pharmacist: Pharmacist;
  onBackToPharmacist: () => void;
}

export const POSPage: React.FC<POSPageProps> = ({ branch, pharmacist, onBackToPharmacist }) => {
  const [cart, setCart] = useState<Partial<LostSale>[]>([]);
  const [manualQuery, setManualQuery] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const addItem = (product: Product) => {
    const existingIdx = cart.findIndex(i => i.productId === product.id);
    if (existingIdx !== -1) {
      updateQty(existingIdx, (cart[existingIdx].quantity || 1) + 1);
    } else {
      setCart([{
        branchId: branch.id,
        pharmacistId: pharmacist.id,
        productId: product.id,
        productName: product.name,
        agentName: product.agent,
        category: product.category,
        unitPrice: Number(product.defaultPrice || 0),
        quantity: 1,
        priceSource: 'db',
        isManual: !!product.isManual
      }, ...cart]);
    }
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], quantity: qty };
    setCart(newCart);
  };

  const updatePrice = (idx: number, price: number) => {
    const newCart = [...cart];
    newCart[idx] = { ...newCart[idx], unitPrice: price, priceSource: 'manual' };
    setCart(newCart);
  };

  const removeItem = (idx: number) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      for (const item of cart) {
        await supabase.sales.insert(item as any);
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
            <ProductSearch onSelect={addItem} onManual={(q) => { setManualQuery(q); setIsManualModalOpen(true); }} />
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full md:w-24 h-16 md:h-22 bg-white border border-slate-200 text-brand rounded-[1.5rem] flex items-center justify-center hover:border-brand hover:shadow-lg transition-all shadow-sm shrink-0"
          >
            <ScanLine className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative">
          <div className="px-10 py-12 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">LOSS LOGGING TERMINAL</h2>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">RECORD MISSING SALES & STOCK</p>
            </div>
            <div className="flex items-center bg-slate-50 rounded-xl px-5 py-2.5 border border-slate-100 shadow-inner">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{cart.length} ITEMS IN CURRENT SESSION</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 custom-scrollbar bg-slate-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-24">
                <div className="w-24 h-24 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 shadow-sm mb-6">
                  <PackageSearch className="w-12 h-12" />
                </div>
                <h4 className="font-black text-slate-300 uppercase tracking-widest text-sm">READY TO SCAN</h4>
                <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest italic">PLEASE SCAN ITEM BARCODE TO START LOGGING</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-brand/30 transition-all duration-300 animate-in slide-in-from-left-4">
                  <div className="flex-1 flex items-center space-x-5">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all"><Package className="w-6 h-6" /></div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-slate-800 text-lg leading-tight truncate">{item.productName}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.category || 'Non-Categorized'} • {item.agentName || 'Standard Agent'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <label className="text-[8px] font-black text-slate-300 uppercase mb-1">Unit Price</label>
                      <input
                        type="number"
                        step="0.001"
                        className="w-28 text-right font-mono font-black text-lg bg-slate-50 rounded-xl p-3 border border-transparent focus:border-brand focus:bg-white outline-none transition-all"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(idx, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <label className="text-[8px] font-black text-slate-300 uppercase mb-1">Qty</label>
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-inner">
                        <button onClick={() => updateQty(idx, (item.quantity || 1) - 1)} className="p-2 hover:bg-white rounded-lg transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="px-3 font-black text-slate-800 min-w-[2.5rem] text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(idx, (item.quantity || 1) + 1)} className="p-2 hover:bg-white rounded-lg transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(idx)} className="p-3 text-slate-200 hover:text-brand hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-6 h-6" /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {showSuccess && (
            <div className="absolute inset-x-10 bottom-10 bg-emerald-600 text-white p-8 rounded-[1.5rem] flex items-center space-x-6 animate-in slide-in-from-bottom-12 shadow-2xl z-50">
              <CheckCircle2 className="w-10 h-10" />
              <div>
                <p className="font-black text-2xl tracking-tighter">Authentication Confirmed</p>
                <p className="opacity-80 text-[10px] font-black uppercase tracking-widest">Audit records transmitted successfully.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Identity & Finalize Sidebar */}
      <div className="lg:col-span-4 flex flex-col space-y-8">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10">
          <div className="text-center">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-brand shadow-inner group transition-all hover:bg-brand hover:text-white">
              <UserCircle className="w-14 h-14" />
            </div>
            <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-1">AUTHORIZED AUDITOR</p>
            <h3 className="font-black text-2xl text-slate-900 tracking-tight">{pharmacist.name}</h3>
            <div className="flex flex-col items-center space-y-4 shadow-inner bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
              <div className="flex items-center space-x-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Verified @ {branch.code}</span>
              </div>
              <button
                onClick={onBackToPharmacist}
                className="flex items-center space-x-2 text-[10px] font-black text-brand hover:text-brand-hover uppercase tracking-widest transition-all group"
              >
                <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Switch Personnel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-10 flex-1 flex flex-col">
          <div className="flex-1 space-y-10">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 text-center shadow-inner">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">SESSION LOSS VALUE</p>
              <div className="flex flex-col items-center">
                <p className="text-6xl font-black text-slate-900 tracking-tighter">{grandTotal.toFixed(3)}</p>
                <p className="text-xs font-black text-brand uppercase tracking-[0.5em] mt-2">BHD IMPACT</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">
                <span>DISTINCT PRODUCTS</span>
                <span className="text-slate-900">{cart.length} Items</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">
                <span>SYSTEM CONNECTIVITY</span>
                <span className="text-emerald-500">System Ready</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-brand text-white font-black py-10 rounded-[1.75rem] shadow-2xl shadow-brand/20 hover:bg-brand-hover hover:-translate-y-1 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:shadow-none disabled:translate-y-0 text-xl tracking-widest uppercase flex items-center justify-center space-x-3 mt-10"
          >
            <span>RECORD MISSING ITEM</span>
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      <ManualProductModal
        isOpen={isManualModalOpen}
        initialName={manualQuery}
        onClose={() => setIsManualModalOpen(false)}
        onSave={async (data) => {
          try {
            const newProd = await supabase.products.create({
              name: data.product_name,
              defaultPrice: Number(data.selling_price || 0),
              agent: data.agent_name,
              category: data.category,
              isManual: true,
              createdByBranch: branch.id
            });
            addItem(newProd);
            setIsManualModalOpen(false);
          } catch (err) {
            alert("Record Error: " + (err as any).message);
          }
        }}
      />
      {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};
