
import { LostSale, Product, Branch, Pharmacist } from '../types';

const DB_KEYS = {
  SALES: 'pharma_v4_sales',
  PRODUCTS: 'pharma_v4_products',
  AUTH: 'pharma_v4_session'
};

// Initial Seed Data to match SQL requirements
const SEED_BRANCHES: Branch[] = [
  { id: 'b1', code: 'B001', name: 'Tabarak – Manama', role: 'admin' },
  { id: 'b2', code: 'B002', name: 'Tabarak – Riffa', role: 'branch' },
  { id: 'b3', code: 'B003', name: 'Tabarak – Muharraq', role: 'branch' },
];

const SEED_PHARMACISTS: Pharmacist[] = [
  { id: 'p1', branchId: 'b1', name: 'Pharmacist A', isActive: true },
  { id: 'p2', branchId: 'b1', name: 'Pharmacist B', isActive: true },
  { id: 'p3', branchId: 'b2', name: 'Pharmacist C', isActive: true },
  { id: 'p4', branchId: 'b3', name: 'Pharmacist D', isActive: true },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Paracetamol 500mg', category: 'Painkiller', agent: 'Medico Supply', defaultPrice: 1.50, isManual: false },
  { id: 'pr2', name: 'Amoxicillin 250mg', category: 'Antibiotic', agent: 'PharmaCorp', defaultPrice: 2.00, isManual: false },
  { id: 'pr3', name: 'Vitamin C 500mg', category: 'Supplement', agent: 'HealthPlus', defaultPrice: 0.80, isManual: false },
  { id: 'pr4', name: 'Cough Syrup 100ml', category: 'Cold & Flu', agent: 'Medico Supply', defaultPrice: 3.00, isManual: false },
];

export const supabase = {
  auth: {
    getSession: () => JSON.parse(localStorage.getItem(DB_KEYS.AUTH) || 'null'),
    setSession: (session: any) => localStorage.setItem(DB_KEYS.AUTH, JSON.stringify(session)),
    signOut: () => localStorage.removeItem(DB_KEYS.AUTH)
  },
  branches: {
    list: () => SEED_BRANCHES,
    findByCode: (code: string) => SEED_BRANCHES.find(b => b.code === code)
  },
  pharmacists: {
    listByBranch: (branchId: string) => SEED_PHARMACISTS.filter(p => p.branchId === branchId)
  },
  products: {
    list: (branchId?: string): Product[] => {
      const custom: Product[] = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
      // RLS logic: global non-manual products + branch specific manual products
      const filteredCustom = custom.filter(p => p.createdByBranch === branchId);
      return [...SEED_PRODUCTS, ...filteredCustom];
    },
    search: (query: string, branchId?: string): Product[] => {
      const all = supabase.products.list(branchId);
      return all.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    },
    create: (product: Omit<Product, 'id'>) => {
      const custom: Product[] = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
      const newProd = { ...product, id: Math.random().toString(36).substring(2, 11) };
      custom.push(newProd);
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(custom));
      return newProd;
    }
  },
  sales: {
    list: (branchId?: string): LostSale[] => {
      const all: LostSale[] = JSON.parse(localStorage.getItem(DB_KEYS.SALES) || '[]');
      return branchId ? all.filter(s => s.branchId === branchId) : all;
    },
    insert: (sale: Omit<LostSale, 'id' | 'totalValue' | 'timestamp' | 'lostDate' | 'lostHour'>) => {
      const sales: LostSale[] = JSON.parse(localStorage.getItem(DB_KEYS.SALES) || '[]');
      const now = new Date();
      const newSale: LostSale = {
        ...sale,
        id: Math.random().toString(36).substring(2, 11),
        totalValue: Number((sale.unitPrice * sale.quantity).toFixed(2)),
        lostDate: now.toISOString().split('T')[0],
        lostHour: now.getHours(),
        timestamp: now.toISOString(),
        isManual: sale.isManual ?? false
      };
      sales.push(newSale);
      localStorage.setItem(DB_KEYS.SALES, JSON.stringify(sales));
      return newSale;
    }
  }
};
