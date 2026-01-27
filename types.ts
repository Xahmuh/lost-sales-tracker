
// Define Role type for consistent usage
export type Role = 'admin' | 'branch' | 'manager';

export interface Branch {
  id: string;
  code: string;
  name: string;
  role: Role;
  googleMapsLink?: string;
  isSpinEnabled?: boolean;
  whatsappNumber?: string;
}

export interface Pharmacist {
  id: string;
  branchId: string;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  agent?: string;
  defaultPrice: number;
  isManual: boolean;
  createdByBranch?: string;
  internalCode?: string;
  internationalCode?: string;
}

export interface LostSale {
  id: string;
  branchId: string;
  pharmacistId: string;
  pharmacistName?: string;
  productId?: string;
  productName: string;
  agentName?: string;
  // Fix: Added missing category property to LostSale interface to match POS requirements
  category?: string;
  unitPrice: number;
  quantity: number;
  priceSource: 'db' | 'manual';
  totalValue: number;
  lostDate: string;
  lostHour: number;
  timestamp: string;
  isManual: boolean;
  notes?: string;
  alternativeGiven?: boolean;
  internalTransfer?: boolean;
  internalCode?: string;
  sessionId?: string;
}

export interface AuthState {
  user: Branch | null;
  pharmacist: Pharmacist | null;
}

export type ShortageStatus = 'Low' | 'Critical' | 'Out of Stock';

export interface ShortageHistory {
  status: ShortageStatus;
  timestamp: string;
  pharmacistName: string;
}

export interface Shortage {
  id: string;
  branchId: string;
  pharmacistId: string;
  productId?: string;
  productName: string;
  status: ShortageStatus;
  pharmacistName: string;
  timestamp: string;
  notes?: string;
  internalCode?: string;
  history?: ShortageHistory[];
}

export interface Customer {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: string;
  lastReviewedAt?: string;
}

export interface SpinPrize {
  id: string;
  name: string;
  type: 'discount' | 'free_item' | 'gift';
  value: number;
  probabilityWeight: number;
  dailyLimit?: number;
  isActive: boolean;
  color?: string;
  createdAt: string;
}

export interface SpinSession {
  token: string;
  branchId: string;
  used: boolean;
  isMultiUse?: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface Spin {
  id: string;
  customerId: string;
  branchId: string;
  prizeId: string;
  voucherCode: string;
  createdAt: string;
  redeemedAt?: string;
  redeemedBranchId?: string;
}

export interface BranchReview {
  id: string;
  customerId: string;
  branchId: string;
  reviewedAt: string;
  reviewClicked: boolean;
}

export interface VoucherShare {
  id: string;
  voucherCode: string;
  fromCustomerId: string;
  branchId: string;
  sharedAt: string;
}

export interface HRRequest {
  id: string;
  refNum: string;
  employeeName: string;
  cpr: string;
  docTypes: string[];
  docReason: string;
  reqDate: string;
  deliveryMethod: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  timestamp: string;
  email?: string;
  passport?: string;
  passportName?: string;
  license?: string;
  sponsor?: string;
  joinDate?: string;
  salary?: string; // Monthly salary in BHD
}