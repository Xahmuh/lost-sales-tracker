
import { createClient } from '@supabase/supabase-js';
import { LostSale, Product, Branch, Pharmacist, AuthState, Role, Shortage } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing in .env - falling back to offline seeds.");
}

export const supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

const AUTH_KEY = 'tabarak_hub_auth_session';
const SALES_KEY = 'tabarak_offline_sales';
const PRODUCTS_KEY = 'tabarak_offline_products';

// English Seed Data for stability
const SEED_BRANCHES: Branch[] = [
  { id: '06ba725c-93ad-47a3-9a13-216479d502d1', code: 'ADMIN01', name: 'Tabarak Central HQ', role: 'admin' },
  { id: '1b3b2924-ef34-4626-a77f-33227f2915ad', code: 'T001', name: 'Tabarak Pharmacy - Jerdab branch', role: 'branch' },
  { id: '1b75e849-fb83-4f7c-89ec-344068a0c17c', code: 'S001', name: 'Sanad 1 Pharmacy - Club', role: 'branch' },
  { id: '2b062ff8-aa8a-4d75-8cc1-e609c65ab161', code: 'H003', name: 'Alhoda Pharmacy - Isa Town', role: 'branch' },
  { id: '2cb10ffc-fa88-49c9-9b72-a13089c51879', code: 'T005', name: 'Tabarak Pharmacy - West Riffa', role: 'branch' },
  { id: '35448ef7-1b91-4d48-8ad6-73fcfe020767', code: 'T003', name: 'Tabarak Pharmacy - Hidd Station', role: 'branch' },
  { id: '52325c35-d273-4b6f-bed1-aef28d55cc37', code: 'H004', name: 'Alhoda Pharmacy - Sanad branch', role: 'branch' },
  { id: '54c9c2cd-c11f-45e9-ae8b-17af071a9706', code: 'T004', name: 'Tabarak Pharmacy - Janabiya branch', role: 'branch' },
  { id: '575225e6-4dcb-4fd0-806b-e09fc6508477', code: 'T008', name: 'Tabarak Pharmacy - Hidd Club', role: 'branch' },
  { id: '61d320bb-5f30-47ff-bdcc-fa737e837088', code: 'S004', name: 'Janabiya Square Pharmacy', role: 'branch' },
  { id: '67a3254b-ea60-4aed-951f-7138da422597', code: 'D002', name: 'Damistan Pharmacy', role: 'branch' },
  { id: '806e481f-8264-4863-aa5c-6eddd36f7d71', code: 'T002', name: 'Tabarak Pharmacy - Qalali Station', role: 'branch' },
  { id: '8d428bcb-9594-43a9-a2f9-d684c0f7fd25', code: 'S003', name: 'Jamila Pharmacy - Zinj branch', role: 'branch' },
  { id: '9efda513-5566-4ad2-8342-b11732ba3eac', code: 'S002', name: 'Sanad 2 Pharmacy - Station', role: 'branch' },
  { id: 'a26d4e01-3647-4eb3-ba3a-3b5e3c740037', code: 'H005', name: 'Alhoda Pharmacy - Budaiya branch', role: 'branch' },
  { id: 'ac3367db-2d37-4fbd-90f8-466a331dbe43', code: 'T010', name: 'Tabarak Pharmacy - Qalali 2', role: 'branch' },
  { id: 'b9b91ba2-09f8-4d0e-b271-c5ca37472629', code: 'H002', name: 'Alnahar Pharmacy - Jerdab branch', role: 'branch' },
  { id: 'b9ddaed5-b104-4112-8dd9-dad1e1b9b7f3', code: 'H001', name: 'Alhoda Pharmacy - Tubli branch', role: 'branch' },
  { id: 'd108dae1-93ba-4768-af9a-b69d512ad077', code: 'D001', name: 'District Pharmacy', role: 'branch' },
  { id: 'eb8156ab-79e8-40da-8300-1fb08de96a46', code: 'T006', name: 'Tabarak Pharmacy - Juffair branch', role: 'branch' },
  { id: 'eea51a55-f441-4ca4-a70f-2851faf0820a', code: 'T007', name: 'Tabarak Pharmacy - Karana Branch', role: 'branch' },
  { id: 'f42e155a-685b-4789-bed7-c9d419160149', code: 'T009', name: 'Tabarak Pharmacy - Mashtan', role: 'branch' },
];

const SEED_PHARMACISTS: Pharmacist[] = [
  { id: '004b08ab-0510-41d5-8d37-b6ab45f5227e', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED ELZEIN', isActive: true },
  { id: '02954b7b-62bc-41aa-acd3-26dc540a45d8', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MAHMOUD ELALFY', isActive: true },
  { id: '048f0e11-e513-439f-a7fd-c148400be626', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'HASNAA ELAGAMY', isActive: true },
  { id: '071572c0-96a3-40dd-b7d2-11fb583691b5', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'NADA MOSTAFA', isActive: true },
  { id: '0cfe6ce3-aece-459c-843e-96a40b4435e3', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'WEAM KHATTAB', isActive: true },
  { id: '164dc8f0-bdde-4a7e-b336-0e6a3227cda5', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MAHMOUD HAMMAD', isActive: true },
  { id: '19bb86f9-4bbc-4c26-ad95-89255887ac05', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MAGED ZOAB', isActive: true },
  { id: '1b27d346-ed82-4a88-863f-6ac5b26230db', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'RABIA ASLAM', isActive: true },
  { id: '24535424-c668-4b61-abe0-d4f132270218', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED WAGIH', isActive: true },
  { id: '24867c37-e964-431b-b4d2-7701ee9df907', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELBAHY', isActive: true },
  { id: '29f5fadd-f3f8-44cc-9d7c-8631d9620207', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'EMAN TOLPA', isActive: true },
  { id: '2d1fefe9-7df2-4b07-a1e4-08b49dc92a7b', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'RAFIDA ELHADDAD', isActive: true },
  { id: '2dc823f4-c175-44f4-a89d-46f4145588dd', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'ISLAM MOSBAH', isActive: true },
  { id: '30fd6f98-f81d-49fa-a084-48c1663bc3c0', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'YUSUF IBRAHIM', isActive: true },
  { id: '35ceaf99-2f12-4435-bd1f-59cf34ce476c', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MAHMOUD FAHMY', isActive: true },
  { id: '39b3d285-729f-4cd9-89ce-fd2abb8709ef', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MINA FALLAH', isActive: true },
  { id: '3a5e8ce7-c56c-4297-815d-68c2fb8b64ad', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'ABDALLA ABDELFATTAH', isActive: true },
  { id: '3e2f346c-1f33-4d38-a135-0bf694bfff00', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'HISHAM ELDALLASH', isActive: true },
  { id: '3ff580b0-6f67-4cb8-84fe-b69043847e70', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHANAD HAMAD', isActive: true },
  { id: '431fb0c9-d79f-463c-ab83-b9c1790e18c0', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AMIRA HAMADA', isActive: true },
  { id: '433e07d0-0661-4a87-be9c-ecb41979e22e', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'SHAWKY HANNA', isActive: true },
  { id: '462ffedb-cdb7-457e-8314-f317c23dd7a2', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MEHIRA ALBASHER', isActive: true },
  { id: '4f74994f-1947-451c-abf8-d7e5df5832f1', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'ESSAM ELKHOLY', isActive: true },
  { id: '4fedfaf6-c27e-4f76-85fe-0f09aaaad77e', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'DALIA ABDELALL', isActive: true },
  { id: '565c3819-7f17-40ca-a299-12b7f44c2a76', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'KARIM MAROOF', isActive: true },
  { id: '5bd04e93-49b5-409a-bd2d-b0d5b1c6e7a0', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELKOUSY', isActive: true },
  { id: '60083ece-f9a4-4f5f-a173-81a2f0a6e7c6', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED ELSAEIDY', isActive: true },
  { id: '65b2cc82-055a-4552-8fec-82cd8b40ae25', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELKHOULY', isActive: true },
  { id: '65fd3aa4-7b53-4a49-acfd-e104453374d6', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED BASHA', isActive: true },
  { id: '663f5c26-1ac4-4a38-8d86-f5a9485ff5b2', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'EMAN MOHAMMED', isActive: true },
  { id: '68d6a1d1-3364-4b02-a622-a2f8977b5f24', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'HALA DAHAB', isActive: true },
  { id: '76c229ba-6037-402d-9690-b04730dab8f5', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED ELEMAWY', isActive: true },
  { id: '792a800d-fe9b-4e25-86a2-24ebf577c287', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'OMNIA ELMOSELHY', isActive: true },
  { id: '84d93be5-4e6b-420d-b27d-404925ceb364', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'ABDELRAHEEM SOLIMAN', isActive: true },
  { id: '9410c2f9-a2b5-47d5-94a7-5055330d8289', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'SALAH ISSA', isActive: true },
  { id: '944bb234-b49d-4232-97d0-7712bb324b5f', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'SAFWAT HASSAN', isActive: true },
  { id: '95f6245a-6a17-4142-b72f-adcdcce1f9b6', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'TAHER MABROUK', isActive: true },
  { id: 'a118bea8-3f44-4e1b-b6fe-bf4c689bcf70', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'ABDELRAHMAN AHMED', isActive: true },
  { id: 'a6099716-f161-4694-b7f6-eae7c21bf2a3', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOHAMED ELMANSI', isActive: true },
  { id: 'aac88ebc-d322-4526-8da1-7651f577ccd9', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AREEJ YOUSSEF', isActive: true },
  { id: 'adfd96f5-02fd-49dd-887d-848a81222c50', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AMIR MOHEMED', isActive: true },
  { id: 'ae029419-c9b3-4427-b8e8-f64e391d0727', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELBARBARY', isActive: true },
  { id: 'b08ed0a0-2019-4f0d-9d85-ed5d0bddafd3', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELKOMY', isActive: true },
  { id: 'b1b9f0c4-cc9c-4c8c-89b5-71d2d7ab8f87', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MAHMOUD ELFAR', isActive: true },
  { id: 'bf890e8d-4d34-427b-b330-c4de04bfea7e', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'HEMAT MOHSEN', isActive: true },
  { id: 'cb170360-ee2e-477f-b6b9-8c6341f23a08', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'HANNAH TORRICO', isActive: true },
  { id: 'cbbf43ee-54ba-4570-8128-9c807590d828', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MICHAEL GERGES', isActive: true },
  { id: 'd052ae48-1f79-417c-87f6-01b208d1ab4b', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AMIRA RADY', isActive: true },
  { id: 'd5e60aed-3c7b-452d-92aa-e1f11ee9836a', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AYMAN KHALIL', isActive: true },
  { id: 'dbe6e95e-26c8-41b0-a8d0-8b3d2ac0fd6d', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MOSTAFA ABDELFATTAH', isActive: true },
  { id: 'e00b5712-e7cf-4ca6-b6e5-c399bcb04ae7', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'AHMED ELKENAWI', isActive: true },
  { id: 'e7f380a3-2173-425d-a383-00b4f466ff3c', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'KARIM ABO ZEID', isActive: true },
  { id: 'ebfbb925-f1fa-4983-bcfa-3c6d9235fd83', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'FATMA AWAD', isActive: true },
  { id: 'ef8352c4-04ca-4818-b358-530969ea2dd2', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'KARIM ZAIN', isActive: true },
  { id: 'f86ab8c9-e7d1-446f-8424-bee4d4c9b047', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'TAHA MOHAMED', isActive: true },
  { id: 'fba457cd-859e-4cc8-9a6b-c7aa24306d5c', branchId: '06ba725c-93ad-47a3-9a13-216479d502d1', name: 'MICHAEL ZAKI', isActive: true },
];

const SEED_PRODUCTS: Product[] = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'Paracetamol 500mg', category: 'Painkiller', agent: 'Medico Supply', defaultPrice: 1.50, isManual: false, internalCode: 'P-100' },
  { id: '00000000-0000-0000-0000-000000000102', name: 'Amoxicillin 250mg', category: 'Antibiotic', agent: 'PharmaCorp', defaultPrice: 2.00, isManual: false, internalCode: 'A-200' },
  { id: '00000000-0000-0000-0000-000000000103', name: 'Vitamin C 1000mg', category: 'Supplement', agent: 'HealthPlus', defaultPrice: 0.80, isManual: false, internalCode: 'V-300' },
];

const isUUID = (str: any) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof str === 'string' && regex.test(str);
};

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
        // Query the join table to get pharmacists for this specific branch
        const { data, error } = await supabaseClient
          .from('pharmacists')
          .select(`
            *,
            pharmacist_branches!inner(branch_id)
          `)
          .eq('pharmacist_branches.branch_id', branchId)
          .eq('is_active', true);

        if (error) throw error;
        if (data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            branchId: branchId,
            name: p.name,
            isActive: p.is_active
          }));
        }
        return SEED_PHARMACISTS;
      } catch (e) {
        // Offline/Fallback logic: Every pharmacist in SEED_PHARMACISTS
        // is considered available for every branchId requested.
        return SEED_PHARMACISTS.map(ph => ({ ...ph, branchId }));
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
          id: p.id, name: p.name, category: p.category, agent: p.agent,
          defaultPrice: Number(p.default_price || 0), isManual: !!p.is_manual,
          internalCode: p.internal_code, internationalCode: p.international_code,
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

      // 1. Try Online Search (Flexible 'Contains' Match)
      try {
        const { data } = await supabaseClient
          .from('products')
          .select('*')
          .or(`name.ilike.%${q}%,internal_code.ilike.${q}%,international_code.eq.${q}`)
          .limit(20);

        if (data && data.length > 0) return data.map(p => ({
          id: p.id, name: p.name, category: p.category, agent: p.agent,
          defaultPrice: Number(p.default_price || 0), isManual: !!p.is_manual,
          internalCode: p.internal_code, internationalCode: p.international_code,
          createdByBranch: p.created_by_branch
        }));

        // If DB returns empty, we usually throw to fallback to seeds/local if we assume DB might be syncing
        // But if DB is truly empty, we might want to just show seeds? 
        // For now, let's treat empty DB result as "Look at seeds/local too" to be safe during this transition phase.
        throw new Error("No remote results, checking local...");
      } catch (e) {
        // 2. Offline / Fallback Search (Seeds + LocalStorage)
        const localProducts: Product[] = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
        const allLocal = [...SEED_PRODUCTS, ...localProducts];

        return allLocal.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.internalCode?.toLowerCase().startsWith(q) ||
          p.internationalCode === q
        ).slice(0, 20); // Limit results
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
          id: data.id, name: data.name, category: data.category, agent: data.agent,
          defaultPrice: Number(data.default_price || 0), isManual: !!data.is_manual,
          internalCode: data.internal_code, internationalCode: data.international_code,
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

  manualProducts: {
    create: async (data: any) => {
      try {
        const { data: result, error } = await supabaseClient.from('manual_products').insert([{
          name: data.name, category: data.category, agent: data.agent,
          default_price: data.defaultPrice, created_by_branch: data.createdByBranch
        }]).select().single();
        if (error) throw error;
        return result;
      } catch (e) {
        const offline = JSON.parse(localStorage.getItem('tabarak_manual_products_log') || '[]');
        const entry = { ...data, id: 'manual-' + Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() };
        offline.push(entry);
        localStorage.setItem('tabarak_manual_products_log', JSON.stringify(offline));
        return entry;
      }
    }
  },

  sales: {
    list: async (branchId?: string, role: Role = 'branch'): Promise<LostSale[]> => {
      let remoteData: LostSale[] = [];
      try {
        let query = supabaseClient.from('lost_sales').select('*');
        if (role === 'admin' && branchId && branchId !== 'all') {
          if (isUUID(branchId)) query = query.eq('branch_id', branchId);
        } else if (role === 'branch') {
          if (isUUID(branchId)) query = query.eq('branch_id', branchId);
        }
        const { data, error } = await query.order('timestamp', { ascending: false });
        if (!error && data) {
          remoteData = data.map(s => ({
            id: s.id, branchId: s.branch_id, pharmacistId: s.pharmacist_id,
            pharmacistName: s.pharmacist_name, productId: s.product_id,
            productName: s.product_name, agentName: s.agent_name, category: s.category,
            unitPrice: Number(s.unit_price || 0), quantity: Number(s.quantity || 0),
            totalValue: Number(s.total_value || 0), lostDate: s.lost_date,
            lostHour: Number(s.lost_hour || 0), timestamp: s.timestamp,
            isManual: !!s.is_manual, priceSource: s.price_source || 'db',
            sessionId: s.session_id, notes: s.notes,
            alternativeGiven: !!s.alternative_given,
            internalTransfer: !!s.internal_transfer,
            internalCode: s.internal_code
          }));
        }
      } catch (e) { }
      const localData: LostSale[] = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
      const filteredLocal = branchId && branchId !== 'all' ? localData.filter(s => s.branchId === branchId) : localData;
      const combined = [...remoteData, ...filteredLocal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set();
      return combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    insert: async (sale: Omit<LostSale, 'id' | 'totalValue' | 'timestamp' | 'lostDate' | 'lostHour'>) => {
      const now = new Date();
      const id = crypto.randomUUID(); // Consistent UUID strategy

      const payload = {
        branch_id: sale.branchId,
        pharmacist_id: sale.pharmacistId,
        pharmacist_name: sale.pharmacistName,
        product_id: isUUID(sale.productId) ? sale.productId : null,
        product_name: sale.productName,
        agent_name: sale.agentName || 'N/A',
        category: sale.category || 'General',
        unit_price: Number(sale.unitPrice || 0),
        quantity: Number(sale.quantity || 1),
        is_manual: !!sale.isManual,
        price_source: sale.priceSource || 'db',
        lost_date: now.toISOString().split('T')[0],
        lost_hour: now.getHours(),
        timestamp: (sale as any).timestamp || now.toISOString(),
        total_value: Number((Number(sale.unitPrice || 0) * Number(sale.quantity || 1)).toFixed(3)),
        notes: sale.notes || null,
        alternative_given: !!sale.alternativeGiven,
        internal_transfer: !!sale.internalTransfer,
        internal_code: (sale as any).internalCode || null
      };

      // SECURITY: Validate UUID format before even trying Supabase
      if (!isUUID(payload.branch_id) || !isUUID(payload.pharmacist_id)) {
        console.error("Critical: Attempted to save with invalid UUID format", payload);
        throw new Error("Invalid Node Identity Configuration");
      }

      try {
        const { data, error } = await supabaseClient.from('lost_sales').insert([payload]).select().single();
        if (error) throw error;

        const mapped: LostSale = {
          ...sale,
          id: data.id,
          totalValue: data.total_value,
          timestamp: data.timestamp,
          lostDate: data.lost_date,
          lostHour: data.lost_hour
        } as LostSale;

        window.dispatchEvent(new CustomEvent('tabarak_sales_updated', { detail: mapped }));
        return mapped;
      } catch (e) {
        console.warn("Supabase Sync Failed - Falling back to LocalPersistence", e);
        const offline = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
        const newSale: LostSale = {
          ...sale,
          id, // Use the pre-generated UUID
          totalValue: payload.total_value,
          timestamp: payload.timestamp,
          lostDate: payload.lost_date,
          lostHour: payload.lost_hour
        } as LostSale;

        offline.push(newSale);
        localStorage.setItem(SALES_KEY, JSON.stringify(offline));
        window.dispatchEvent(new CustomEvent('tabarak_sales_updated', { detail: newSale }));
        return newSale;
      }
    },
    delete: async (id: string) => {
      try {
        if (isUUID(id)) await supabaseClient.from('lost_sales').delete().eq('id', id);
      } catch (e) { }
      const offline = JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
      localStorage.setItem(SALES_KEY, JSON.stringify(offline.filter((s: any) => s.id !== id)));
      window.dispatchEvent(new CustomEvent('tabarak_sales_updated'));
      return true;
    }
  },

  shortages: {
    list: async (branchId?: string, role: Role = 'branch'): Promise<Shortage[]> => {
      let remoteData: Shortage[] = [];
      try {
        let query = supabaseClient.from('shortages').select('*');
        if (role === 'admin' && branchId && branchId !== 'all' && isUUID(branchId)) query = query.eq('branch_id', branchId);
        else if (role === 'branch' && isUUID(branchId)) query = query.eq('branch_id', branchId);
        const { data, error } = await query.order('timestamp', { ascending: false });
        if (!error && data) {
          remoteData = data.map(s => ({
            id: s.id, branchId: s.branch_id, pharmacistId: s.pharmacist_id,
            productId: s.product_id, productName: s.product_name, status: s.status,
            pharmacistName: s.pharmacist_name, timestamp: s.timestamp,
            notes: s.notes, internalCode: s.internal_code, history: s.history || []
          }));
        }
      } catch (e) { }
      const localData = JSON.parse(localStorage.getItem('tabarak_offline_shortages') || '[]');
      const filteredLocal = branchId && branchId !== 'all' ? localData.filter((s: any) => s.branchId === branchId) : localData;
      const combined = [...remoteData, ...filteredLocal].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set();
      return combined.filter((item: any) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    },
    create: async (shortage: Omit<Shortage, 'id'>) => {
      try {
        if (!isUUID(shortage.branchId) || !isUUID(shortage.pharmacistId)) throw new Error("Invalid IDs");
        let query = supabaseClient.from('shortages').select('*').eq('branch_id', shortage.branchId).eq('product_name', shortage.productName);
        if (isUUID(shortage.productId)) query = query.eq('product_id', shortage.productId);
        const { data: existingList } = await query;
        const existing = existingList?.[0];
        if (existing) {
          const history = existing.history || [];
          history.push({ status: existing.status, timestamp: existing.timestamp, pharmacistName: existing.pharmacist_name });
          const { data, error } = await supabaseClient.from('shortages').update({ status: shortage.status, timestamp: shortage.timestamp, pharmacist_name: shortage.pharmacistName, pharmacist_id: shortage.pharmacistId, notes: shortage.notes, internal_code: shortage.internalCode, history }).eq('id', existing.id).select().single();
          if (error) throw error;
          window.dispatchEvent(new CustomEvent('tabarak_shortages_updated'));
          return { id: data.id, branchId: data.branch_id, pharmacistId: data.pharmacist_id, productId: data.product_id, productName: data.product_name, status: data.status, pharmacistName: data.pharmacist_name, timestamp: data.timestamp, history: data.history, notes: data.notes, internalCode: data.internal_code } as Shortage;
        } else {
          const { data, error } = await supabaseClient.from('shortages').insert([{ branch_id: shortage.branchId, pharmacist_id: shortage.pharmacistId, product_id: isUUID(shortage.productId) ? shortage.productId : null, product_name: shortage.productName, status: shortage.status, pharmacist_name: shortage.pharmacistName, timestamp: shortage.timestamp, notes: shortage.notes, internal_code: shortage.internalCode, history: [] }]).select().single();
          if (error) throw error;
          window.dispatchEvent(new CustomEvent('tabarak_shortages_updated'));
          return { id: data.id, branchId: data.branch_id, pharmacistId: data.pharmacist_id, productId: data.product_id, productName: data.product_name, status: data.status, pharmacistName: data.pharmacist_name, timestamp: data.timestamp, history: data.history, notes: data.notes, internalCode: data.internal_code } as Shortage;
        }
      } catch (e) {
        const offline = JSON.parse(localStorage.getItem('tabarak_offline_shortages') || '[]');
        const idx = offline.findIndex((s: any) => s.branchId === shortage.branchId && (shortage.productId ? s.productId === shortage.productId : s.productName === shortage.productName));
        if (idx >= 0) {
          const item = offline[idx];
          const history = item.history || [];
          history.push({ status: item.status, timestamp: item.timestamp, pharmacistName: item.pharmacistName });
          offline[idx] = { ...item, status: shortage.status, timestamp: shortage.timestamp, pharmacistName: shortage.pharmacistName, pharmacistId: shortage.pharmacistId, history };
          localStorage.setItem('tabarak_offline_shortages', JSON.stringify(offline));
          window.dispatchEvent(new CustomEvent('tabarak_shortages_updated'));
          return offline[idx];
        } else {
          const newItem = { ...shortage, id: Math.random().toString(36).substr(2, 9), history: [] };
          offline.push(newItem);
          localStorage.setItem('tabarak_offline_shortages', JSON.stringify(offline));
          window.dispatchEvent(new CustomEvent('tabarak_shortages_updated'));
          return newItem;
        }
      }
    },
    delete: async (id: string) => {
      try {
        if (isUUID(id)) await supabaseClient.from('shortages').delete().eq('id', id);
      } catch (e) { }
      const offline = JSON.parse(localStorage.getItem('tabarak_offline_shortages') || '[]');
      localStorage.setItem('tabarak_offline_shortages', JSON.stringify(offline.filter((s: any) => s.id !== id)));
      window.dispatchEvent(new CustomEvent('tabarak_shortages_updated'));
      return true;
    }
  }
};
