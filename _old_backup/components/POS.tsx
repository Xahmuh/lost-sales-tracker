import React, { useState, useEffect, useRef } from 'react';
import { Search, PlusCircle, Trash2, Save, ShoppingCart, PackageOpen, X, UserCircle } from 'lucide-react';
import { Product, LostSale, Branch, Pharmacist } from '../types';
import { db } from '../services/db';

interface POSProps {
  branch: Branch;
  pharmacist: Pharmacist;
  onSuccess: () => void;
}

export const POS: React.FC<POSProps> = ({ branch, pharmacist, onSuccess }) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [cart, setCart] = useState<Partial<LostSale>[]>([]);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [manualProduct, setManualProduct] = useState({ name: '', price: '', agent: '' });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProducts(db.getProducts());

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim().length >= 1) {
      const results = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.agent && p.agent.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 10); // Limit to top 10 for performance/UI
      setFiltered(results);
      setShowDropdown(true);
      setSelectedIndex(-1);
    } else {
      setFiltered([]);
      setShowDropdown(false);
    }
  }, [search, products]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: (item.quantity || 1) + 1, totalValue: ((item.quantity || 1) + 1) * (item.unitPrice || 0) }
          : item
      ));
    } else {
      setCart([...cart, {
        branchId: branch.id,
        pharmacistId: pharmacist.id,
        productId: product.id,
        productName: product.name,
        agentName: product.agent,
        unitPrice: product.defaultPrice,
        quantity: 1,
        totalValue: product.defaultPrice,
        isManual: false,
        timestamp: new Date().toISOString()
      }]);
    }
    setSearch('');
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filtered.length) {
        addToCart(filtered[selectedIndex]);
      } else if (filtered.length === 0 && search.length > 2) {
        setIsManualEntry(true);
        setManualProduct({ ...manualProduct, name: search });
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const addManualToCart = () => {
    if (!manualProduct.name || !manualProduct.price) return;
    const price = parseFloat(manualProduct.price);
    setCart([...cart, {
      branchId: branch.id,
      pharmacistId: pharmacist.id,
      productName: manualProduct.name,
      agentName: manualProduct.agent,
      unitPrice: price,
      quantity: 1,
      totalValue: price,
      isManual: true,
      timestamp: new Date().toISOString()
    }]);
    setManualProduct({ name: '', price: '', agent: '' });
    setIsManualEntry(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    setCart(cart.map((item, i) =>
      i === index ? { ...item, quantity: qty, totalValue: qty * (item.unitPrice || 0) } : item
    ));
  };

  const updatePrice = (index: number, price: number) => {
    setCart(cart.map((item, i) =>
      i === index ? { ...item, unitPrice: price, totalValue: (item.quantity || 1) * price } : item
    ));
  };

  const saveAll = () => {
    const sessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    cart.forEach(item => {
      db.saveLostSale({ ...item, sessionId } as LostSale);
    });
    setCart([]);
    onSuccess();
    alert('Lost sales recorded successfully!');
  };

  const totalCartValue = cart.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* Search & Selector Area */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        <div ref={searchRef} className="relative z-40">
          <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Start typing product name..."
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-lg text-lg focus:ring-2 focus:ring-blue-500 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search size={24} />
              </div>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Typeahead Dropdown */}
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
              <div className="max-h-[300px] overflow-y-auto">
                {filtered.map((product, idx) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`w-full text-left px-6 py-4 border-b border-slate-50 hover:bg-slate-50 transition flex items-center justify-between group ${idx === selectedIndex ? 'bg-slate-50 ring-2 ring-inset ring-brand/20' : ''
                      }`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{product.agent || 'No Agent'}</p>
                    </div>
                    <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-bold text-slate-400">{product.defaultPrice.toFixed(3)} BHD</span>
                      <PlusCircle size={20} className="text-brand" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results / Manual Add */}
          {showDropdown && filtered.length === 0 && search.length > 1 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 text-center z-50">
              <PackageOpen size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium mb-3">Product not found in this branch.</p>
              <button
                onClick={() => {
                  setIsManualEntry(true);
                  setManualProduct({ ...manualProduct, name: search });
                  setShowDropdown(false);
                }}
                className="bg-brand text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-hover transition"
              >
                Add Manually
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry Form */}
        {isManualEntry && (
          <div className="bg-white p-6 rounded-2xl border-2 border-brand/10 shadow-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 flex items-center"><PlusCircle className="mr-2 text-brand" size={20} /> Manual Entry</h3>
              <button onClick={() => setIsManualEntry(false)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Product Name</label>
                <input
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-800 outline-none focus:border-brand"
                  value={manualProduct.name}
                  onChange={e => setManualProduct({ ...manualProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Price (BHD)</label>
                <input
                  type="number"
                  step="0.001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono font-bold text-slate-800 outline-none focus:border-brand"
                  value={manualProduct.price}
                  onChange={e => setManualProduct({ ...manualProduct, price: e.target.value })}
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Agent (Optional)</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-bold text-slate-800 outline-none focus:border-brand"
                  value={manualProduct.agent}
                  onChange={e => setManualProduct({ ...manualProduct, agent: e.target.value })}
                  placeholder="e.g. Wael Pharmacy"
                />
              </div>
            </div>
            <button
              onClick={addManualToCart}
              disabled={!manualProduct.name || !manualProduct.price}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-brand disabled:opacity-50 disabled:hover:bg-slate-900 transition"
            >
              Add to Lost Sales Log
            </button>
          </div>
        )}
      </div>

      {/* Cart Area */}
      <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200 shadow-xl flex flex-col overflow-hidden h-full">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand border border-slate-200 shadow-sm">
              <ShoppingCart size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 leading-none">CURRENT SESSION</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">{cart.length} items logged</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL LOSS</p>
            <p className="text-2xl font-black text-slate-900 leading-none">{totalCartValue.toFixed(3)} <span className="text-xs text-slate-400">BHD</span></p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="mt-4 font-bold text-sm uppercase tracking-widest">No Items Logged</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 group hover:border-brand/30 transition">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">{item.productName}</h4>
                  <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 transition"><Trash2 size={16} /></button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 bg-white rounded-lg border border-slate-200 p-1">
                    <input
                      type="number"
                      className="w-16 p-1 text-center font-mono font-bold text-slate-800 bg-transparent outline-none text-sm"
                      value={item.unitPrice}
                      onChange={e => updatePrice(idx, parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-[10px] font-bold text-slate-400 px-1">BHD</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">x</span>
                    <input
                      type="number"
                      className="w-12 p-1 text-center font-mono font-bold text-slate-800 bg-white rounded-lg border border-slate-200 outline-none text-sm"
                      value={item.quantity}
                      onChange={e => updateQuantity(idx, parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <p className="font-mono font-black text-slate-900 text-sm">{(item.totalValue || 0).toFixed(3)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={saveAll}
            disabled={cart.length === 0}
            className="w-full py-4 bg-brand text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:bg-brand-hover hover:-translate-y-1 transition disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 flex items-center justify-center space-x-3"
          >
            <Save size={20} />
            <span>Confirm & Record Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
