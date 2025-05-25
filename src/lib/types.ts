import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
  color?: string; // For charts and tags
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  date: Date;
  description: string;
  billUrl?: string; 
}

export interface Budget {
  id: string;
  categoryId: string;
  name: string; // Category name for display
  icon: LucideIcon; // Category icon for display
  amount: number;
  spentAmount: number; 
}
