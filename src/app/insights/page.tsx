// src/app/insights/page.tsx
"use client";
import { SpendingBreakdownChart, type SpendingDataPoint } from '@/components/insights/SpendingBreakdownChart';
import { SpendingTrendChart, type TrendDataPoint } from '@/components/insights/SpendingTrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Expense } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const EXPENSES_STORAGE_KEY = 'moneySimp-expenses';

export default function InsightsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [breakdownData, setBreakdownData] = useState<SpendingDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

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
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (expenses.length > 0) {
      // Process data for SpendingBreakdownChart
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
      }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
      setBreakdownData(newBreakdownData);

      // Process data for SpendingTrendChart (last 6 months)
      const monthlyTotals: { [monthKey: string]: number } = {};
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)); // Include current month + 5 past months

      expenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= sixMonthsAgo) {
          const monthKey = format(expenseDate, 'yyyy-MM'); // e.g., "2023-03"
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
        }
      });
      
      const newTrendData: TrendDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
          const date = subMonths(new Date(), i);
          const monthKey = format(date, 'yyyy-MM');
          const monthName = format(date, 'MMM');
          newTrendData.push({
            month: monthName, // e.g., "Mar"
            totalSpending: monthlyTotals[monthKey] || 0,
          });
      }
      setTrendData(newTrendData);
    } else {
      setBreakdownData([]);
      setTrendData([]);
    }
  }, [expenses]);

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

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <SpendingBreakdownChart data={breakdownData} />
        <SpendingTrendChart data={trendData} />
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>More Insights Coming Soon!</CardTitle>
          <CardDescription>We're working on adding more detailed analytics to help you manage your finances better.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Future insights could include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Comparison with previous periods (e.g., month-over-month).</li>
            <li>Spending by merchant or specific items.</li>
            <li>Savings rate and progress towards financial goals.</li>
            <li>Subscription tracking and management.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
