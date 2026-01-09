
import { createClient } from '@supabase/supabase-js';
import { LostSale, Product, Branch, Pharmacist, AuthState, Role } from '../types';

const supabaseUrl = 'https://rvoqfhvdwadauoeemyvs.supabase.co';
const supabaseAnonKey = 'sb_publishable_lCAW7hZGev2VOk8E5g9Gpw_AHlTfGIU';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const AUTH_KEY = 'tabarak_hub_auth_session';
const SALES_KEY = 'tabarak_offline_sales';
const PRODUCTS_KEY = 'tabarak_offline_products';

// English Seed Data for stability
const SEED_BRANCHES: Branch[] = [
  { id: 'b1', code: 'B001', name: 'Tabarak – Manama Main', role: 'admin' },
  { id: 'b2', code: 'B002', name: 'Tabarak – Riffa Branch', role: 'branch' },
  { id: 'b3', code: 'B003', name: 'Tabarak – Muharraq Node', role: 'branch' },
];

const SEED_PHARMACISTS: Pharmacist[] = [
  { id: 'p1', branchId: 'b1', name: 'Ahmed Elsherbini', isActive: true },
  { id: 'p2', branchId: 'b2', name: 'Shift Manager A', isActive: true },
  { id: 'p3', branchId: 'b3', name: 'Shift Manager B', isActive: true },
];

const SEED_PRODUCTS: Product[] = [
  { id: 'pr1', name: 'Paracetamol 500mg', category: 'Painkiller', agent: 'Medico Supply', defaultPrice: 1.50, isManual: false, internalCode: 'P-100' },
  { id: 'pr2', name: 'Amoxicillin 250mg', category: 'Antibiotic', agent: 'PharmaCorp', defaultPrice: 2.00, isManual: false, internalCode: 'A-200' },
  { id: 'pr3', name: 'Vitamin C 1000mg', category: 'Supplement', agent: 'HealthPlus', defaultPrice: 0.80, isManual: false, internalCode: 'V-300' },
];

export const supabase = {
  client: supabaseClient,
  auth: {
    getSession: (): AuthState | null => {
      const session = localStorage.getItem(AUTH_KEY);
      return session ? JSON.parse(session) : null;
    },
    setSession: (session: AuthState) => {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    },
    signOut: () => {
      localStorage.removeItem(AUTH_KEY);
      window.location.reload();
    }
  },

  branches: {
    list: async () => {
      try {
        const { data, error } = await supabaseClient.from('branches').select('*');
        if (error) throw error;
        return data || SEED_BRANCHES;
      } catch (e) {
        return SEED_BRANCHES;
      }
    },
    findByCode: async (code: string) => {
      try {
        const { data, error } = await supabaseClient.from('branches').select('*').eq('code', code.toUpperCase()).maybeSingle();
        if (error) throw error;
        return data || SEED_BRANCHES.find(b => b.code === code.toUpperCase());
      } catch (e) {
        return SEED_BRANCHES.find(b => b.code === code.toUpperCase());
      }
    }
  },

  pharmacists: {
    listByBranch: async (branchId: string) => {
      try {
        const { data, error } = await supabaseClient.from('pharmacists').select('*').eq('is_active', true);
        if (error) throw error;
        return (data || []).map(p => ({ id: p.id, branchId: p.branch_id, name: p.name, isActive: p.is_active }));
      } catch (e) {
        return SEED_PHARMACISTS;
      }
    },
    findById: async (id: string) => {
      try {
        const { data, error } = await supabaseClient.from('pharmacists').select('*').eq('id', id).single();
        if (error) throw error;
        return { id: data.id, branchId: data.branch_id, name: data.name, isActive: data.is_active };
      } catch (e) {
        return SEED_PHARMACISTS.find(p => p.id === id) || null;
      }
    }
  },

  products: {
    list: async (branchId?: string): Promise<Product[]> => {
      try {
        const { data } = await supabaseClient.from('products').select('*');
        if (data) return data.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          agent: p.agent,
          defaultPrice: Number(p.default_price || 0),
          isManual: !!p.is_manual,
          internalCode: p.internal_code,
          internationalCode: p.international_code,
          createdByBranch: p.created_by_branch
        }));
        return SEED_PRODUCTS;
      } catch (e) {
        return SEED_PRODUCTS;
      }
    },
    search: async (query: string, branchId?: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      try {
        const { data } = await supabaseClient.from('products').select('*').or(`name.ilike.${q}%,internal_code.ilike.${q}%,international_code.eq.${q}`).limit(10);
        if (data && data.length > 0) return data.map(p => ({
          id: p.id, name: p.name, category: p.category, agent: p.agent,
          defaultPrice: Number(p.default_price || 0), isManual: !!p.is_manual,
          internalCode: p.internal_code, internationalCode: p.international_code
        }));
        throw new Error("Offline Mode");
      } catch (e) {
        return SEED_PRODUCTS.filter(p => p.name.toLowerCase().startsWith(q) || p.internalCode?.toLowerCase().startsWith(q));
      }
    },
    create: async (product: Omit<Product, 'id'>) => {
      try {
        const { data, error } = await supabaseClient.from('products').insert([{
          name: product.name, category: product.category, agent: product.agent,
          default_price: Number(product.defaultPrice || 0), is_manual: true,
          created_by_branch: product.createdByBranch
        }]).select().single();
        if (error) throw error;
        return {
          id: data.id,
          name: data.name,
          category: data.category,
          agent: data.agent,
          defaultPrice: Number(data.default_price || 0),
          isManual: !!data.is_manual,
          internalCode: data.internal_code,
          internationalCode: data.international_code,
          createdByBranch: data.created_by_branch
        };
      } catch (e) {
        const newProd = { ...product, id: Math.random().toString(36).substr(2, 9) };
        const offline = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        offline.push(newProd);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(offline));
        return newProd;
      }
    }
  },

  sales: {
    list: async (branchId?: string, role: Role = 'branch'): Promise<LostSale[]> => {
      try {
        let query = supabaseClient.from('lost_sales').select('*');
        if (role === 'admin' && branchId && branchId !== 'all') query = query.eq('branch_id', branchId);
        else if (role === 'branch') query = query.eq('branch_id', branchId);
        const { data, error } = await query.order('timestamp', { ascending: false });
        if (error) throw error;
        return (data || []).map(s => ({
          id: s.id, branchId: s.branch_id, pharmacistId: s.pharmacist_id, productId: s.product_id,
          productName: s.product_name, agentName: s.agent_name, category: s.category,
          unitPrice: Number(s.unit_price || 0), quantity: Number(s.quantity || 0),
          totalValue: Number(s.total_value || 0), lostDate: s.lost_date,
          lostHour: Number(s.lost_hour || 0), timestamp: s.timestamp,
          isManual: !!s.is_manual, priceSource: s.price_source || 'db'
        }));
      } catch (e) {
        const all: LostSale[] = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
        return branchId && branchId !== 'all' ? all.filter(s => s.branchId === branchId) : all;
      }
    },
    insert: async (sale: Omit<LostSale, 'id' | 'totalValue' | 'timestamp' | 'lostDate' | 'lostHour'>) => {
      const now = new Date();
      const unitPrice = Number(sale.unitPrice || 0);
      const quantity = Number(sale.quantity || 0);
      const totalValue = Number((unitPrice * quantity).toFixed(3));

      const payload = {
        branch_id: sale.branchId, pharmacist_id: sale.pharmacistId,
        product_id: sale.productId || null, product_name: sale.productName,
        agent_name: sale.agentName || 'N/A', category: sale.category || 'General',
        unit_price: unitPrice, quantity: quantity, is_manual: !!sale.isManual,
        price_source: sale.priceSource || 'db', lost_date: now.toISOString().split('T')[0],
        lost_hour: now.getHours(), timestamp: now.toISOString(), total_value: totalValue
      };

      try {
        const { data, error } = await supabaseClient.from('lost_sales').insert([payload]).select().single();
        if (error) throw error;
        window.dispatchEvent(new CustomEvent('tabarak_sales_updated', { detail: data }));
        return data;
      } catch (e) {
        const offline: LostSale[] = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
        const newSale = {
          ...sale,
          id: Math.random().toString(36).substr(2, 9),
          totalValue,
          timestamp: now.toISOString(),
          lostDate: now.toISOString().split('T')[0],
          lostHour: now.getHours()
        } as LostSale;
        offline.push(newSale);
        localStorage.setItem(SALES_KEY, JSON.stringify(offline));
        window.dispatchEvent(new CustomEvent('tabarak_sales_updated', { detail: newSale }));
        return newSale;
      }
    }
  }
};
