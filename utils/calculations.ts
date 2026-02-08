
import { LostSale } from '../types';

export const calculateTotal = (price: number, qty: number): number => {
  return Number((price * qty).toFixed(3));
};

export const getGrandTotal = (items: Partial<LostSale>[]): number => {
  return items.reduce((sum, item) => sum + (item.totalValue || 0), 0);
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-BH', {
    style: 'currency',
    currency: 'BHD',
    minimumFractionDigits: 3,
  }).format(value);
};

export const getTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
