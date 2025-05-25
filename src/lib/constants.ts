import type { Category } from './types';
import { 
  ShoppingCart, Home, Car, Film, Zap, HeartPulse, Utensils, Shirt, Plane, DollarSign, 
  LayoutDashboard, CreditCard, TrendingUp, BarChart3, Briefcase, BookOpen, Gift
} from 'lucide-react';

export const APP_NAME = "PennyWise";

export const CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', icon: ShoppingCart, color: 'hsl(var(--chart-1))' },
  { id: 'rent', name: 'Rent/Mortgage', icon: Home, color: 'hsl(var(--chart-2))' },
  { id: 'transportation', name: 'Transportation', icon: Car, color: 'hsl(var(--chart-3))' },
  { id: 'entertainment', name: 'Entertainment', icon: Film, color: 'hsl(var(--chart-4))' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: 'hsl(var(--chart-5))' },
  { id: 'healthcare', name: 'Healthcare', icon: HeartPulse, color: 'hsl(var(--chart-1))' },
  { id: 'dining', name: 'Dining Out', icon: Utensils, color: 'hsl(var(--chart-2))' },
  { id: 'clothing', name: 'Clothing', icon: Shirt, color: 'hsl(var(--chart-3))' },
  { id: 'travel', name: 'Travel', icon: Plane, color: 'hsl(var(--chart-4))' },
  { id: 'education', name: 'Education', icon: BookOpen, color: 'hsl(var(--chart-5))' },
  { id: 'business', name: 'Business', icon: Briefcase, color: 'hsl(var(--chart-1))' },
  { id: 'gifts', name: 'Gifts/Donations', icon: Gift, color: 'hsl(var(--chart-2))' },
  { id: 'other', name: 'Other', icon: DollarSign, color: 'hsl(var(--chart-3))' },
];

export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  matchSegments?: number; // For dynamic route matching
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, matchSegments: 0 },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, matchSegments: 1 },
  { href: '/budgets', label: 'Budgets', icon: TrendingUp, matchSegments: 1 },
  { href: '/insights', label: 'Insights', icon: BarChart3, matchSegments: 1 },
];
