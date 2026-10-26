import type { Category, TaxCategory } from './types';
import {
  ShoppingCart, Home, Car, Film, Zap, HeartPulse, Utensils, Shirt, Plane, DollarSign,
  LayoutDashboard, CreditCard, TrendingUp, BarChart3, Briefcase, BookOpen, Gift, LogIn, Send,
  BarChartHorizontalBig, Target, RefreshCw, Settings, Landmark, Receipt, Calculator,
  FileText, Heart, GraduationCap, Building, Wrench, Phone, Car as CarIcon, Activity, Users
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

// Tax-deductible categories for business/freelance users
export const TAX_CATEGORIES: TaxCategory[] = [
  {
    id: 'business_meals',
    name: 'Business Meals',
    description: 'Meals with clients, business partners, or while traveling for business',
    icon: Utensils,
    color: 'hsl(var(--chart-1))',
    deductionLimit: undefined, // 50% deduction typically
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'business_travel',
    name: 'Business Travel',
    description: 'Transportation, lodging, and other travel expenses for business',
    icon: Plane,
    color: 'hsl(var(--chart-2))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'office_supplies',
    name: 'Office Supplies',
    description: 'Business supplies, software, equipment, and materials',
    icon: FileText,
    color: 'hsl(var(--chart-3))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'professional_services',
    name: 'Professional Services',
    description: 'Legal, accounting, consulting, and other professional fees',
    icon: Briefcase,
    color: 'hsl(var(--chart-4))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'home_office',
    name: 'Home Office',
    description: 'Portion of home expenses used for business (rent, utilities, etc.)',
    icon: Home,
    color: 'hsl(var(--chart-5))',
    requiresReceipt: true,
    irs_form: 'Form 8829'
  },
  {
    id: 'vehicle_business',
    name: 'Vehicle - Business Use',
    description: 'Business use of personal vehicle or business vehicle expenses',
    icon: CarIcon,
    color: 'hsl(var(--chart-1))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'education_business',
    name: 'Business Education',
    description: 'Courses, conferences, books, and training related to business',
    icon: GraduationCap,
    color: 'hsl(var(--chart-2))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'communications',
    name: 'Communications',
    description: 'Phone, internet, and other communication expenses for business',
    icon: Phone,
    color: 'hsl(var(--chart-3))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'equipment_depreciation',
    name: 'Equipment & Depreciation',
    description: 'Business equipment, computers, furniture, and depreciation',
    icon: Building,
    color: 'hsl(var(--chart-4))',
    requiresReceipt: true,
    irs_form: 'Form 4562'
  },
  {
    id: 'maintenance_repairs',
    name: 'Maintenance & Repairs',
    description: 'Repairs and maintenance of business property and equipment',
    icon: Wrench,
    color: 'hsl(var(--chart-5))',
    requiresReceipt: true,
    irs_form: 'Schedule C'
  },
  {
    id: 'medical_deductible',
    name: 'Medical Expenses',
    description: 'Qualifying medical and dental expenses',
    icon: HeartPulse,
    color: 'hsl(var(--chart-1))',
    requiresReceipt: true,
    irs_form: 'Schedule A'
  },
  {
    id: 'charitable_donations',
    name: 'Charitable Donations',
    description: 'Cash and non-cash donations to qualified organizations',
    icon: Heart,
    color: 'hsl(var(--chart-2))',
    requiresReceipt: true,
    irs_form: 'Schedule A'
  }
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
  { href: '/cash-flow', label: 'Cash Flow', icon: Activity, matchSegments: 1 },
  { href: '/multi-currency', label: 'Multi-Currency', icon: Calculator, matchSegments: 1 },
  { href: '/insights', label: 'Insights', icon: BarChart3, matchSegments: 1 },
  { href: '/tax-reports', label: 'Tax Reports', icon: Receipt, matchSegments: 1 },
  { href: '/goals', label: 'Goals', icon: Target, matchSegments: 1 },
  { href: '/community', label: 'Community', icon: Users, matchSegments: 1 },
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
export const ACCOUNTS_STORAGE_KEY = 'moneySimp-accounts';
