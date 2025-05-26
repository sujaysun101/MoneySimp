
// src/app/dashboard/page.tsx
"use client"; 

import { AIFinanceTipCard } from '@/components/shared/AIFinanceTipCard';
import { ChartModal } from '@/components/shared/ChartModal';
import { SpendingBreakdownChart, type SpendingDataPoint } from '@/components/insights/SpendingBreakdownChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, TrendingUp, Landmark, PlusCircle, PieChart, Info } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { CATEGORIES, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { isSameMonth, format } from 'date-fns';


export default function DashboardPage() {
  const router = useRouter();
  const [clientTotalBalance, setClientTotalBalance] = useState<string | null>(null);
  const [clientMonthlySpending, setClientMonthlySpending] = useState<string | null>(null);
  const [clientBudgetProgress, setClientBudgetProgress] = useState<string | null>(null);
  const [spendingHabitsSummary, setSpendingHabitsSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [currentMonthChartData, setCurrentMonthChartData] = useState<SpendingDataPoint[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalChartTitle, setModalChartTitle] = useState("");
  const [modalChartContent, setModalChartContent] = useState<React.ReactNode | null>(null);

  const loadDashboardData = useCallback(() => {
    // Simulate fetching data for an authenticated user
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    let expenses: Expense[] = [];
    if (storedExpenses) {
      try {
        expenses = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date),
        }));
      } catch (e) {
        console.error("Error parsing expenses for dashboard:", e);
      }
    }
    
    const today = new Date();
    const currentMonthExpenses = expenses.filter(expense => isSameMonth(new Date(expense.date), today));
    
    const monthlySpending = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    setClientMonthlySpending(monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

    // For total balance and budget progress, we'd need accounts and budgets data
    // Sticking to 0 for now as per previous logic, unless we implement accounts/full budget integration here.
    const currentTotalBalance = 0; 
    const currentBudgetProgress = 0; 

    setClientTotalBalance(currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setClientBudgetProgress(currentBudgetProgress.toFixed(0));

    if (currentTotalBalance > 0 || monthlySpending > 0) {
      setSpendingHabitsSummary(`User has a total balance of $${currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, with monthly spending around $${monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Budget utilization is at ${currentBudgetProgress}%.`);
    } else {
      setSpendingHabitsSummary("User has no recent spending to analyze."); 
    }

    // Prepare data for current month spending breakdown chart
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
    } else {
      loadDashboardData();
      setIsLoading(false);
    }
  }, [router, loadDashboardData]);

  const handleChartClick = (chartData: SpendingDataPoint[], title: string) => {
    setModalChartTitle(title);
    setModalChartContent(<SpendingBreakdownChart data={chartData} />);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading dashboard...</p>
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Your smart personal finance overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clientTotalBalance !== null ? clientTotalBalance : '0.00'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Spending</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clientMonthlySpending !== null ? clientMonthlySpending : '0.00'}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
            <Landmark className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientBudgetProgress !== null ? clientBudgetProgress : '0'}% Utilized</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your finances with ease.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Link href="/expenses" passHref>
                <Button variant="outline" className="w-full justify-start text-left p-4 h-auto">
                  <PlusCircle className="mr-3 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Add New Expense</p>
                    <p className="text-xs text-muted-foreground">Log your recent spendings.</p>
                  </div>
                </Button>
              </Link>
              <Link href="/budgets" passHref>
                 <Button variant="outline" className="w-full justify-start text-left p-4 h-auto">
                  <TrendingUp className="mr-3 h-5 w-5 text-primary" />
                   <div>
                    <p className="font-semibold">Set/View Budgets</p>
                    <p className="text-xs text-muted-foreground">Manage your monthly budgets.</p>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="mt-6 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5 text-primary" />
                  Spending This Month ({format(new Date(), 'MMMM yyyy')})
                </CardTitle>
                <CardDescription>Overview of your spending by category for the current month.</CardDescription>
            </CardHeader>
            <CardContent 
              className="flex flex-col items-center text-center cursor-pointer hover:bg-muted/50 transition-colors rounded-md p-4"
              onClick={() => handleChartClick(currentMonthChartData, `Spending Breakdown - ${format(new Date(), 'MMMM yyyy')}`)}
            >
              {currentMonthChartData.length > 0 ? (
                <div className="w-full h-[300px]"> {/* Ensure container has dimensions */}
                  <SpendingBreakdownChart data={currentMonthChartData} />
                </div>
              ) : (
                <div className="h-[300px] flex flex-col justify-center items-center text-muted-foreground">
                  <Info className="h-10 w-10 mb-3" />
                  <p>No spending data for this month to display.</p>
                  <p className="text-sm">Add expenses to see your breakdown.</p>
                </div>
              )}
               <p className="text-xs text-muted-foreground mt-2">Click to enlarge</p>
            </CardContent>
             <CardContent className="pt-4 flex flex-col items-center text-center">
                 <p className="text-muted-foreground mb-4">More detailed charts are available in the Insights section.</p>
                <Link href="/insights" passHref>
                    <Button>Go to Insights</Button>
                </Link>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
           <AIFinanceTipCard mockSpendingSummary={spendingHabitsSummary} />
        </div>
      </div>
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
