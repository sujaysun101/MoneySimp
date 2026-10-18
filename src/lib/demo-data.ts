import {
  ACCOUNTS_STORAGE_KEY,
  BUDGETS_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
  GOALS_STORAGE_KEY,
  SUBSCRIPTIONS_STORAGE_KEY,
} from '@/lib/constants';

function atNoon(daysFromToday: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString();
}

export const DEMO_HOUSEHOLD = {
  name: 'Maya Chen',
  email: 'demo@moneysimp.app',
  id: 'demo-household',
};

export function buildDemoExpenses() {
  const rows: Array<[string, number, string, number, string]> = [
    ['exp-rent-0', 1850, 'rent', -17, 'Rent — Cedar Court'],
    ['exp-groc-1', 86.42, 'groceries', -2, 'Harbor Market'],
    ['exp-groc-2', 64.18, 'groceries', -6, 'H Mart'],
    ['exp-groc-3', 42.07, 'groceries', -11, 'Saturday farmers market'],
    ['exp-dine-1', 28.4, 'dining', -1, 'Lantern coffee'],
    ['exp-dine-2', 54.12, 'dining', -4, 'Dumpling House'],
    ['exp-dine-3', 19.8, 'dining', -9, 'Office coffee'],
    ['exp-tran-1', 45, 'transportation', -3, 'Monthly transit pass'],
    ['exp-tran-2', 32.6, 'transportation', -8, 'Rideshare home'],
    ['exp-util-1', 142.6, 'utilities', -12, 'City power and gas'],
    ['exp-health-1', 32, 'healthcare', -5, 'Pharmacy'],
    ['exp-ent-1', 24, 'entertainment', -7, 'Cinema tickets'],
    ['exp-cloth-1', 48.5, 'clothing', -14, 'Uniqlo'],
    ['exp-rent-1', 1850, 'rent', -48, 'Rent — Cedar Court'],
    ['exp-groc-4', 210.33, 'groceries', -40, 'September groceries'],
    ['exp-dine-4', 186.2, 'dining', -36, 'September dining'],
    ['exp-util-2', 128.4, 'utilities', -44, 'September utilities'],
    ['exp-tran-3', 68, 'transportation', -33, 'September transit'],
    ['exp-rent-2', 1850, 'rent', -78, 'Rent — Cedar Court'],
    ['exp-groc-5', 198.1, 'groceries', -70, 'August groceries'],
    ['exp-dine-5', 240.55, 'dining', -66, 'August dining'],
    ['exp-travel-1', 320, 'travel', -60, 'Weekend train'],
    ['exp-rent-3', 1850, 'rent', -109, 'Rent — Cedar Court'],
    ['exp-groc-6', 176.44, 'groceries', -100, 'July groceries'],
    ['exp-dine-6', 150.2, 'dining', -96, 'July dining'],
    ['exp-ent-2', 45, 'entertainment', -90, 'Concert'],
    ['exp-rent-4', 1850, 'rent', -139, 'Rent — Cedar Court'],
    ['exp-groc-7', 188.9, 'groceries', -130, 'June groceries'],
    ['exp-util-3', 110.15, 'utilities', -125, 'June utilities'],
    ['exp-rent-5', 1850, 'rent', -170, 'Rent — Cedar Court'],
    ['exp-groc-8', 164.75, 'groceries', -160, 'May groceries'],
    ['exp-health-2', 90, 'healthcare', -155, 'Dental cleaning'],
  ];
  return rows.map(([id, amount, categoryId, days, description]) => ({
    id,
    amount,
    categoryId,
    date: atNoon(days),
    description,
  }));
}

export function buildDemoBudgets() {
  return [
    { id: 'bud-rent', categoryId: 'rent', amount: 1850 },
    { id: 'bud-groc', categoryId: 'groceries', amount: 400 },
    { id: 'bud-dine', categoryId: 'dining', amount: 250 },
    { id: 'bud-tran', categoryId: 'transportation', amount: 180 },
    { id: 'bud-util', categoryId: 'utilities', amount: 200 },
    { id: 'bud-ent', categoryId: 'entertainment', amount: 80 },
    { id: 'bud-health', categoryId: 'healthcare', amount: 100 },
  ];
}

export function buildDemoSubscriptions() {
  return [
    {
      id: 'sub-netflix',
      name: 'Netflix',
      amount: 15.49,
      frequency: 'monthly',
      nextPaymentDate: atNoon(3),
      categoryId: 'entertainment',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 5,
      provider: 'Netflix',
      notes: 'Standard plan',
    },
    {
      id: 'sub-spotify',
      name: 'Spotify',
      amount: 11.99,
      frequency: 'monthly',
      nextPaymentDate: atNoon(12),
      categoryId: 'entertainment',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 3,
      provider: 'Spotify',
    },
    {
      id: 'sub-icloud',
      name: 'iCloud+',
      amount: 2.99,
      frequency: 'monthly',
      nextPaymentDate: atNoon(6),
      categoryId: 'utilities',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 7,
      provider: 'Apple',
    },
    {
      id: 'sub-gym',
      name: 'Planet Fitness',
      amount: 24.99,
      frequency: 'monthly',
      nextPaymentDate: atNoon(2),
      categoryId: 'healthcare',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 5,
      provider: 'Planet Fitness',
    },
    {
      id: 'sub-nyt',
      name: 'New York Times',
      amount: 17,
      frequency: 'monthly',
      nextPaymentDate: atNoon(20),
      categoryId: 'entertainment',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 3,
      provider: 'NYT',
    },
    {
      id: 'sub-adobe',
      name: 'Adobe Photoshop',
      amount: 22.99,
      frequency: 'monthly',
      nextPaymentDate: atNoon(9),
      categoryId: 'business',
      isActive: true,
      detectedFromBank: false,
      reminderEnabled: true,
      reminderDays: 5,
      provider: 'Adobe',
      notes: 'Photography plan',
    },
  ];
}

export function buildDemoAccounts() {
  return [
    {
      id: 'demo-checking',
      institutionId: 'demo-northwind',
      institutionName: 'Northwind Credit Union',
      accountId: 'demo-checking',
      name: 'Everyday Checking',
      officialName: 'Everyday Checking (sample)',
      type: 'checking',
      balance: { available: 4186.22, current: 4280.16 },
      mask: '4412',
      isActive: true,
      lastSynced: atNoon(0),
      currency: 'USD',
      provider: 'demo',
    },
    {
      id: 'demo-savings',
      institutionId: 'demo-northwind',
      institutionName: 'Northwind Credit Union',
      accountId: 'demo-savings',
      name: 'Emergency Savings',
      officialName: 'High-yield savings (sample)',
      type: 'savings',
      balance: { available: 12640, current: 12640 },
      mask: '2290',
      isActive: true,
      lastSynced: atNoon(0),
      currency: 'USD',
      provider: 'demo',
    },
    {
      id: 'demo-card',
      institutionId: 'demo-northwind',
      institutionName: 'Northwind Credit Union',
      accountId: 'demo-card',
      name: 'Rewards Visa',
      officialName: 'Rewards Visa (sample)',
      type: 'credit',
      balance: { current: 1842.55, limit: 8000, available: 6157.45 },
      mask: '8831',
      isActive: true,
      lastSynced: atNoon(0),
      currency: 'USD',
      provider: 'demo',
    },
  ];
}

export function buildDemoGoals() {
  return [
    {
      id: 'goal-emergency',
      name: 'Emergency fund',
      targetAmount: 15000,
      currentAmount: 6400,
      savedAmount: 6400,
      targetDate: atNoon(240),
      description: 'Six months of rent and groceries, kept in savings.',
      isCompleted: false,
    },
    {
      id: 'goal-lisbon',
      name: 'Lisbon trip',
      targetAmount: 3500,
      currentAmount: 1280,
      savedAmount: 1280,
      targetDate: atNoon(160),
      description: 'Flights and a week of lodging, paid in cash.',
      isCompleted: false,
    },
    {
      id: 'goal-card',
      name: 'Pay off rewards card',
      targetAmount: 1842.55,
      currentAmount: 420,
      savedAmount: 420,
      targetDate: atNoon(90),
      description: 'Extra payments on top of the monthly minimum.',
      isCompleted: false,
    },
  ];
}

export function demoStorageEntries(): Array<[string, string]> {
  return [
    [EXPENSES_STORAGE_KEY, JSON.stringify(buildDemoExpenses())],
    [BUDGETS_STORAGE_KEY, JSON.stringify(buildDemoBudgets())],
    [SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(buildDemoSubscriptions())],
    [ACCOUNTS_STORAGE_KEY, JSON.stringify(buildDemoAccounts())],
    [GOALS_STORAGE_KEY, JSON.stringify(buildDemoGoals())],
  ];
}
