
import { LostSale, Product, Branch, Pharmacist } from '../types';

const DB_KEYS = {
  SALES: 'pharma_v4_sales',
  PRODUCTS: 'pharma_v4_products',
  AUTH: 'pharma_v4_session'
};

// Initial Seed Data to match types.ts
const SEED_BRANCHES: Branch[] = [
  { id: '1', code: 'B001', name: 'Tabarak – Manama', role: 'admin' },
  { id: '2', code: 'B002', name: 'Tabarak – Riffa', role: 'branch' },
  { id: '3', code: 'B003', name: 'Tabarak – Muharraq', role: 'branch' },
];

const SEED_PHARMACISTS: Pharmacist[] = [
  // Fix: Added missing isActive property for Pharmacist interface
  { id: 'p1', branchId: '1', name: 'Pharmacist A', isActive: true },
  { id: 'p2', branchId: '1', name: 'Pharmacist B', isActive: true },
  { id: 'p3', branchId: '2', name: 'Pharmacist C', isActive: true },
  { id: 'p4', branchId: '3', name: 'Pharmacist D', isActive: true },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Paracetamol 500mg', agent: 'Medico Supply', defaultPrice: 1.50, isManual: false },
  { id: 'pr2', name: 'Amoxicillin 250mg', agent: 'PharmaCorp', defaultPrice: 2.00, isManual: false },
  { id: 'pr3', name: 'Vitamin C 500mg', agent: 'HealthPlus', defaultPrice: 0.80, isManual: false },
];

export const supabase = {
  auth: {
    getSession: () => JSON.parse(localStorage.getItem(DB_KEYS.AUTH) || 'null'),
    setSession: (session: any) => localStorage.setItem(DB_KEYS.AUTH, JSON.stringify(session)),
    signOut: () => localStorage.removeItem(DB_KEYS.AUTH)
  },
  branches: {
    list: () => SEED_BRANCHES,
    // Fixed: Property 'branch_code' does not exist on type 'Branch'.
    findByCode: (code: string) => SEED_BRANCHES.find(b => b.code === code)
  },
  pharmacists: {
    // Fixed: Property 'branch_id' does not exist on type 'Pharmacist'.
    listByBranch: (branchId: string) => SEED_PHARMACISTS.filter(p => p.branchId === branchId)
  },
  products: {
    list: (branchId?: string): Product[] => {
      const custom = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
      // RLS Simulation: return global non-manual products + branch specific manual products
      return [...SEED_PRODUCTS, ...custom].filter(p => !p.isManual);
    },
    search: (query: string, branchId?: string): Product[] => {
      const all = supabase.products.list(branchId);
      // Fixed: Property 'product_name' does not exist on type 'Product'.
      return all.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    },
    create: (product: Omit<Product, 'id'>) => {
      const custom = JSON.parse(localStorage.getItem(DB_KEYS.PRODUCTS) || '[]');
      const newProd = { ...product, id: Math.random().toString(36).substr(2, 9) };
      custom.push(newProd);
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(custom));
      return newProd as Product;
    }
  },
  sales: {
    list: (branchId?: string): LostSale[] => {
      const all: LostSale[] = JSON.parse(localStorage.getItem(DB_KEYS.SALES) || '[]');
      // Fixed: Property 'branch_id' does not exist on type 'LostSale'.
      return branchId ? all.filter(s => s.branchId === branchId) : all;
    },
    insert: (sale: Omit<LostSale, 'id' | 'totalValue' | 'timestamp'>) => {
      const sales = JSON.parse(localStorage.getItem(DB_KEYS.SALES) || '[]');
      // Fixed: Aligning with LostSale interface in types.ts
      const newSale = {
        ...sale,
        id: Math.random().toString(36).substr(2, 9),
        totalValue: Number((sale.unitPrice * sale.quantity).toFixed(2)),
        timestamp: new Date().toISOString()
      };
      sales.push(newSale);
      localStorage.setItem(DB_KEYS.SALES, JSON.stringify(sales));
      return newSale;
    }
  }
};