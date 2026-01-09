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
    cart.forEach(item => {
      db.saveLostSale(item as LostSale);
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
