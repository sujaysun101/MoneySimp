import type { Category } from './types';
import {
  ShoppingCart, Home, Car, Film, Zap, HeartPulse, Utensils, Shirt, Plane, DollarSign,
  LayoutDashboard, CreditCard, TrendingUp, BarChart3, Briefcase, BookOpen, Gift, LogIn, Send,
  BarChartHorizontalBig, Target, RefreshCw, Settings, Landmark
} from 'lucide-react';

export const APP_NAME = "MoneySimp";

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
  matchSegments?: number; 
  isButton?: boolean;
  action?: () => void;
  isExternal?: boolean; // Added for external links
}

export const AUTH_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, matchSegments: 1 },
  { href: '/accounts', label: 'Accounts', icon: Landmark, matchSegments: 1 },
  { href: '/subscriptions', label: 'Subscriptions', icon: RefreshCw, matchSegments: 1 },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, matchSegments: 1 },
  { href: '/budgets', label: 'Budgets', icon: TrendingUp, matchSegments: 1 },
  { href: '/insights', label: 'Insights', icon: BarChart3, matchSegments: 1 },
  { href: '/goals', label: 'Goals', icon: Target, matchSegments: 1 },
  { href: '/settings', label: 'Settings', icon: Settings, matchSegments: 1 },
];

export const UNAUTH_NAV_ITEMS: NavItem[] = [
  { href: '/login', label: 'Login', icon: LogIn },
  { 
    href: 'https://calendly.com/sujay9sundar/30min', 
    label: 'Book A Demo', 
    icon: Send, 
    isExternal: true // Mark as external link
  },
];

// To determine page titles in Header
export const ALL_NAV_ITEMS = [...AUTH_NAV_ITEMS, ...UNAUTH_NAV_ITEMS];

// Local storage keys
export const EXPENSES_STORAGE_KEY = 'moneySimp-expenses';
export const BUDGETS_STORAGE_KEY = 'moneySimp-budgets';
export const SUBSCRIPTIONS_STORAGE_KEY = 'moneySimp-subscriptions';
