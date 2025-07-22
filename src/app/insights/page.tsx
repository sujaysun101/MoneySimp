// src/app/insights/page.tsx
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, memo } from 'react';
import type { Expense, Budget } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { format, subMonths, startOfMonth, isSameMonth } from 'date-fns';
import { ChartModal } from '@/components/shared/ChartModal';
import { Circle } from "lucide-react";
import { useOptimizedExpenses, useOptimizedBudgets } from '@/hooks/useOptimizedData';
import { 
  LazySpendingBreakdownChart,
  LazySpendingTrendChart,
  LazyBudgetVsActualChart,
  LazyAverageCategorySpendingChart,
  LazyChartComponent
} from '@/components/performance/LazyComponents';

// Add missing storage key constants
const EXPENSES_STORAGE_KEY = 'moneySimpExpenses';
const BUDGETS_STORAGE_KEY = 'moneySimpBudgets';

// Type imports for chart data
import type { SpendingDataPoint } from '@/components/insights/SpendingBreakdownChart';
import type { TrendDataPoint } from '@/components/insights/SpendingTrendChart';
import type { BudgetActualDataPoint } from '@/components/insights/BudgetVsActualChart';
import type { AverageSpendingDataPoint } from '@/components/insights/AverageCategorySpendingChart';

// Memoized chart components
const MemoizedSpendingBreakdown = memo(LazySpendingBreakdownChart);
const MemoizedSpendingTrend = memo(LazySpendingTrendChart);
const MemoizedBudgetVsActual = memo(LazyBudgetVsActualChart);
const MemoizedAverageSpending = memo(LazyAverageCategorySpendingChart);

export default function InsightsPage() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();

  // Use optimized data hooks
  const {
    data: expenses,
    isLoading: expensesLoading,
    error: expensesError
  } = useOptimizedExpenses(userId);

  // Local state for expenses loaded from localStorage
  const [localExpenses, setExpenses] = useState<Expense[]>([]);

  // Local state for budgets loaded from localStorage
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [breakdownData, setBreakdownData] = useState<SpendingDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [budgetActualData, setBudgetActualData] = useState<BudgetActualDataPoint[]>([]);
  const [averageSpendingData, setAverageSpendingData] = useState<AverageSpendingDataPoint[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChartTitle, setModalChartTitle] = useState("");
  const [modalChartContent, setModalChartContent] = useState<React.ReactNode | null>(null);

  // Authentication check
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    const storedUserId = localStorage.getItem('moneySimpUserId');
    
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setUserId(storedUserId || 'default-user');
      setIsAuthLoading(false);
    }
  }, [router]);

  const openChartInModal = useCallback((title: string, chartComponent: React.ReactNode) => {
    setModalChartTitle(title);
    setModalChartContent(chartComponent);
    setIsModalOpen(true);
  }, []);

  const processChartData = useCallback(() => {
    if (expenses.length > 0) {
      // SpendingBreakdownChart (All-time)
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

      // SpendingTrendChart (Last 6 months)
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

      // AverageCategorySpendingChart
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

    // BudgetVsActualChart (Current Month)
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
      }).filter(item => item.budgetAmount > 0 || item.actualAmount > 0)
        .sort((a,b) => b.budgetAmount - a.budgetAmount);
      setBudgetActualData(newBudgetActualData);
    } else {
        setBudgetActualData([]);
    }
  }, [expenses, budgets]);


  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

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
        const parsedBudgets: Budget[] = JSON.parse(storedBudgets);
        const fullBudgets = parsedBudgets.map(b => {
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          return {
            ...b,
            id: (b as any).id || b.categoryId,
            name: category?.name || 'Unknown Category',
            icon: category?.icon || Circle, // Use a default LucideIcon if missing
            spentAmount: 0,
          };
        });
        setBudgets(fullBudgets);
      } catch (error) {
        console.error("Failed to parse budgets from localStorage:", error);
        setBudgets([]);
      }
    }
    setIsAuthLoading(false);
  }, [router]);

  useEffect(() => {
    if (!isAuthLoading) {
      processChartData();
    }
  }, [isAuthLoading, processChartData]);


  if (isAuthLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Spending Insights</h1>
        <p className="text-muted-foreground">Understand your financial habits with visual data. Click on charts to enlarge.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 mb-8">
        <div className="cursor-pointer hover:shadow-xl transition-shadow rounded-lg" onClick={() => openChartInModal("Spending Breakdown (All Time)", <LazySpendingBreakdownChart data={breakdownData} />)}>
          <LazySpendingBreakdownChart data={breakdownData} />
        </div>
        <div className="cursor-pointer hover:shadow-xl transition-shadow rounded-lg" onClick={() => openChartInModal("Monthly Spending Trend (Last 6 Months)", <LazySpendingTrendChart data={trendData} />)}>
          <LazySpendingTrendChart data={trendData} />
        </div>
      </div>
       <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <div className="cursor-pointer hover:shadow-xl transition-shadow rounded-lg" onClick={() => openChartInModal(`Budget vs. Actual Spending (${format(new Date(), 'MMMM yyyy')})`, <LazyBudgetVsActualChart data={budgetActualData} />)}>
          <MemoizedBudgetVsActual data={budgetActualData} />
        </div>
        <div className="cursor-pointer hover:shadow-xl transition-shadow rounded-lg" onClick={() => openChartInModal("Average Monthly Spending per Category", <LazyAverageCategorySpendingChart data={averageSpendingData} />)}>
          <LazyAverageCategorySpendingChart data={averageSpendingData} />
        </div>
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
       <ChartModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalChartTitle}
      >
        {modalChartContent}
      </ChartModal>
    </div>
  );
}
