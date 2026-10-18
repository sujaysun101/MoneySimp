"use client";

import { AIFinanceTipCard } from '@/components/shared/AIFinanceTipCard';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { SpendingBreakdownChart, type SpendingDataPoint } from '@/components/insights/SpendingBreakdownChart';
import { SubscriptionReminders } from '@/components/subscriptions/SubscriptionReminders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, TrendingUp, Landmark, PlusCircle, Info, RefreshCw, Target } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense, Goal, Subscription } from '@/lib/types';
import { ACCOUNTS_STORAGE_KEY, BUDGETS_STORAGE_KEY, CATEGORIES, EXPENSES_STORAGE_KEY, GOALS_STORAGE_KEY, SUBSCRIPTIONS_STORAGE_KEY } from '@/lib/constants';
import { isSameMonth, format } from 'date-fns';

function money(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const router = useRouter();
  const [clientTotalBalance, setClientTotalBalance] = useState<string | null>(null);
  const [clientMonthlySpending, setClientMonthlySpending] = useState<string | null>(null);
  const [clientBudgetProgress, setClientBudgetProgress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentMonthChartData, setCurrentMonthChartData] = useState<SpendingDataPoint[]>([]);

  const loadDashboardData = useCallback(() => {
    let expensesData: Expense[] = [];
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (storedExpenses) {
      try {
        expensesData = JSON.parse(storedExpenses).map((exp: Expense) => ({
          ...exp,
          date: new Date(exp.date),
        }));
      } catch (error) {
        console.error("Error parsing expenses for dashboard:", error);
      }
    }
    setExpenses(expensesData);

    let subscriptionData: Subscription[] = [];
    const storedSubscriptions = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (storedSubscriptions) {
      try {
        subscriptionData = JSON.parse(storedSubscriptions).map((sub: Subscription) => ({
          ...sub,
          nextPaymentDate: new Date(sub.nextPaymentDate),
        }));
      } catch (error) {
        console.error("Error parsing subscriptions for dashboard:", error);
      }
    }
    setSubscriptions(subscriptionData);

    let goalData: Goal[] = [];
    const storedGoals = localStorage.getItem(GOALS_STORAGE_KEY);
    if (storedGoals) {
      try {
        const parsed = JSON.parse(storedGoals);
        if (Array.isArray(parsed)) {
          goalData = parsed.map((goal: Goal & { currentAmount?: number }) => ({
            ...goal,
            savedAmount: goal.savedAmount ?? goal.currentAmount ?? 0,
            createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date(),
          }));
        }
      } catch (error) {
        console.error("Error parsing goals for dashboard:", error);
      }
    }
    setGoals(goalData);

    const today = new Date();
    const currentMonthExpenses = expensesData.filter(expense => isSameMonth(new Date(expense.date), today));
    const monthlySpending = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    setClientMonthlySpending(money(monthlySpending));

    let netBalance = 0;
    const storedAccounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (storedAccounts) {
      try {
        const accounts = JSON.parse(storedAccounts) as Array<{ type?: string; balance?: { current?: number } }>;
        netBalance = accounts.reduce((sum, account) => {
          const current = account.balance?.current || 0;
          return account.type === 'credit' || account.type === 'loan' ? sum - current : sum + current;
        }, 0);
      } catch (error) {
        console.error("Error parsing accounts for dashboard:", error);
      }
    }
    setClientTotalBalance(money(netBalance));

    let budgetTotal = 0;
    const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (storedBudgets) {
      try {
        const budgets = JSON.parse(storedBudgets) as Array<{ amount?: number }>;
        budgetTotal = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
      } catch (error) {
        console.error("Error parsing budgets for dashboard:", error);
      }
    }
    const progress = budgetTotal > 0 ? Math.min(100, Math.round((monthlySpending / budgetTotal) * 100)) : 0;
    setClientBudgetProgress(String(progress));

    const categoryTotals: { [key: string]: number } = {};
    currentMonthExpenses.forEach(expense => {
      categoryTotals[expense.categoryId] = (categoryTotals[expense.categoryId] || 0) + expense.amount;
    });
    const newBreakdownData = Object.keys(categoryTotals).map(categoryId => {
      const categoryInfo = CATEGORIES.find(c => c.id === categoryId);
      return {
        category: categoryInfo?.name || 'Unknown',
        amount: categoryTotals[categoryId],
        fill: categoryInfo?.color || 'hsl(var(--muted))',
        icon: categoryInfo?.icon,
      };
    }).sort((a, b) => b.amount - a.amount);
    setCurrentMonthChartData(newBreakdownData);
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }
    loadDashboardData();
    setIsLoading(false);
  }, [router, loadDashboardData]);

  if (isLoading) return <PageSkeleton />;

  const monthLabel = format(new Date(), 'MMMM yyyy');

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-1 py-2 sm:px-2">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Overview</h2>
          <p className="text-muted-foreground">Cash, this month’s spending, and the categories that used the budget.</p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cash minus card balances</CardTitle>
              <DollarSign className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">${clientTotalBalance ?? '0.00'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent in {monthLabel}</CardTitle>
              <TrendingUp className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">${clientMonthlySpending ?? '0.00'}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget used</CardTitle>
              <Landmark className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{clientBudgetProgress ?? '0'}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {currentMonthChartData.length > 0 ? (
              <SpendingBreakdownChart data={currentMonthChartData} title={`Spending in ${monthLabel}`} description="By category" />
            ) : (
              <Card>
                <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Info className="h-10 w-10" />
                  <p>No spending in {monthLabel} yet.</p>
                  <Button asChild>
                    <Link href="/expenses">Add an expense</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <AIFinanceTipCard expenses={expenses} subscriptions={subscriptions} goals={goals} />
            <SubscriptionReminders maxItems={3} />
          </div>
        </div>

        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Add a transaction, adjust a budget, or check a renewal.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="h-auto justify-start p-4 text-left" asChild>
              <Link href="/expenses">
                <PlusCircle className="mr-3 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">Add an expense</span>
                  <span className="block text-xs text-muted-foreground">Log a purchase or scan a receipt.</span>
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-4 text-left" asChild>
              <Link href="/budgets">
                <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">Budgets</span>
                  <span className="block text-xs text-muted-foreground">Compare this month with the limit.</span>
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-4 text-left" asChild>
              <Link href="/subscriptions">
                <RefreshCw className="mr-3 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">Subscriptions</span>
                  <span className="block text-xs text-muted-foreground">See what renews next.</span>
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-4 text-left" asChild>
              <Link href="/goals">
                <Target className="mr-3 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-semibold">Goals</span>
                  <span className="block text-xs text-muted-foreground">Track what you are saving toward.</span>
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
