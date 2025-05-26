// src/app/insights/page.tsx
"use client";
import { SpendingBreakdownChart, type SpendingDataPoint } from '@/components/insights/SpendingBreakdownChart';
import { SpendingTrendChart, type TrendDataPoint } from '@/components/insights/SpendingTrendChart';
import { BudgetVsActualChart, type BudgetActualDataPoint } from '@/components/insights/BudgetVsActualChart';
import { AverageCategorySpendingChart, type AverageSpendingDataPoint } from '@/components/insights/AverageCategorySpendingChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Expense, Budget } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { format, subMonths, startOfMonth, endOfMonth, getMonth, getYear, isSameMonth } from 'date-fns';

const EXPENSES_STORAGE_KEY = 'moneySimp-expenses';
const BUDGETS_STORAGE_KEY = 'moneySimp-budgets'; // Using the key from budgets page for now 'pennywise-budgets'

export default function InsightsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [breakdownData, setBreakdownData] = useState<SpendingDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [budgetActualData, setBudgetActualData] = useState<BudgetActualDataPoint[]>([]);
  const [averageSpendingData, setAverageSpendingData] = useState<AverageSpendingDataPoint[]>([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      // Load expenses
      const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
        try {
          const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
            ...exp,
            date: new Date(exp.date),
          }));
          setExpenses(parsedExpenses);
        } catch (error) {
          console.error("Failed to parse expenses from localStorage:", error);
          setExpenses([]);
        }
      }
      // Load budgets
      const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
      if (storedBudgets) {
        try {
          // Assuming budgets are stored with categoryId and amount
          const parsedBudgets: Omit<Budget, 'icon' | 'name' | 'spentAmount' >[] = JSON.parse(storedBudgets);
           const fullBudgets = parsedBudgets.map(b => {
            const category = CATEGORIES.find(c => c.id === b.categoryId);
            return {
              ...b,
              id: (b as any).id || b.categoryId, // Ensure ID exists
              name: category?.name || 'Unknown Category',
              icon: category?.icon || (() => null), // Default icon
              spentAmount: 0, // This will be calculated based on current expenses
            };
          });
          setBudgets(fullBudgets);
        } catch (error) {
          console.error("Failed to parse budgets from localStorage:", error);
          setBudgets([]);
        }
      }
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (expenses.length > 0) {
      // --- Process data for SpendingBreakdownChart (All-time) ---
      const categoryTotals: { [key: string]: number } = {};
      expenses.forEach(expense => {
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
      setBreakdownData(newBreakdownData);

      // --- Process data for SpendingTrendChart (Last 6 months) ---
      const monthlyTotals: { [monthKey: string]: number } = {};
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= sixMonthsAgo) {
          const monthKey = format(expenseDate, 'yyyy-MM');
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
        }
      });
      const newTrendData: TrendDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthKey = format(date, 'yyyy-MM');
          const monthName = format(date, 'MMM');
          newTrendData.push({
            month: monthName,
            totalSpending: monthlyTotals[monthKey] || 0,
          });
      }
      setTrendData(newTrendData);

      // --- Process data for AverageCategorySpendingChart ---
      const categoryMonthlySpending: { [categoryId: string]: { [monthKey: string]: number } } = {};
      expenses.forEach(expense => {
        const monthKey = format(new Date(expense.date), 'yyyy-MM');
        if (!categoryMonthlySpending[expense.categoryId]) {
          categoryMonthlySpending[expense.categoryId] = {};
        }
        categoryMonthlySpending[expense.categoryId][monthKey] = (categoryMonthlySpending[expense.categoryId][monthKey] || 0) + expense.amount;
      });

      const newAverageSpendingData = Object.keys(categoryMonthlySpending).map(categoryId => {
        const monthlyData = categoryMonthlySpending[categoryId];
        const numMonths = Object.keys(monthlyData).length;
        const totalSpendingForCategory = Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
        const average = numMonths > 0 ? totalSpendingForCategory / numMonths : 0;
        const categoryInfo = CATEGORIES.find(c => c.id === categoryId);
        return {
          categoryName: categoryInfo?.name || 'Unknown',
          averageSpending: average,
          categoryIcon: categoryInfo?.icon,
          fill: categoryInfo?.color || 'hsl(var(--chart-3))',
        };
      }).sort((a, b) => b.averageSpending - a.averageSpending);
      setAverageSpendingData(newAverageSpendingData);

    } else {
      setBreakdownData([]);
      setTrendData([]);
      setAverageSpendingData([]);
    }

    // --- Process data for BudgetVsActualChart (Current Month) ---
    if (budgets.length > 0) {
      const today = new Date();
      const currentMonthExpenses = expenses.filter(exp => isSameMonth(new Date(exp.date), today));
      
      const newBudgetActualData = budgets.map(budget => {
        const actualAmount = currentMonthExpenses
          .filter(exp => exp.categoryId === budget.categoryId)
          .reduce((sum, exp) => sum + exp.amount, 0);
        const categoryInfo = CATEGORIES.find(c => c.id === budget.categoryId);
        return {
          categoryName: categoryInfo?.name || 'Unknown',
          categoryIcon: categoryInfo?.icon,
          budgetAmount: budget.amount,
          actualAmount: actualAmount,
          fillBudget: 'hsl(var(--chart-2))',
          fillActual: 'hsl(var(--chart-1))',
        };
      }).filter(item => item.budgetAmount > 0 || item.actualAmount > 0) // Only show if there's budget or spending
        .sort((a,b) => b.budgetAmount - a.budgetAmount);
      setBudgetActualData(newBudgetActualData);
    } else {
        setBudgetActualData([]);
    }

  }, [expenses, budgets]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Spending Insights</h1>
        <p className="text-muted-foreground">Understand your financial habits with visual data.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <SpendingBreakdownChart data={breakdownData} />
        <SpendingTrendChart data={trendData} />
      </div>
       <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <BudgetVsActualChart data={budgetActualData} />
        <AverageCategorySpendingChart data={averageSpendingData} />
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>More Insights Explored!</CardTitle>
          <CardDescription>We've added more detailed analytics to help you manage your finances better.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Considerations for future insights:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Spending by merchant or specific items.</li>
            <li>Savings rate and progress towards financial goals.</li>
            <li>Subscription tracking and management.</li>
            <li>Day of week spending patterns.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
