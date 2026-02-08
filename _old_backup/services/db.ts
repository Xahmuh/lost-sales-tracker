
import { LostSale, Branch, Pharmacist, Product } from '../types';
import { INITIAL_BRANCHES, INITIAL_PHARMACISTS, INITIAL_PRODUCTS } from '../constants';

const SALES_KEY = 'pharmatrack_lost_sales';
const PRODUCTS_KEY = 'pharmatrack_custom_products';

export const db = {
  getBranches: (): Branch[] => INITIAL_BRANCHES,
  
  getPharmacistsByBranch: (branchId: string): Pharmacist[] => 
    INITIAL_PHARMACISTS.filter(p => p.branchId === branchId),

  getProducts: (): Product[] => {
    const custom = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    return [...INITIAL_PRODUCTS, ...custom];
  },

  saveLostSale: (sale: Omit<LostSale, 'id'>): LostSale => {
    const id = Math.random().toString(36).substr(2, 9);
    const newSale = { ...sale, id };
    const sales = db.getLostSales();
    sales.push(newSale);
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    return newSale;
  },

  getLostSales: (): LostSale[] => {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
  },

  getBranchSales: (branchId: string): LostSale[] => {
    return db.getLostSales().filter(s => s.branchId === branchId);
  }
};
