// src/app/dashboard/page.tsx
"use client"; 

import { AIFinanceTipCard } from '@/components/shared/AIFinanceTipCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, TrendingUp, Landmark, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [clientTotalBalance, setClientTotalBalance] = useState<string | null>(null);
  const [clientMonthlySpending, setClientMonthlySpending] = useState<string | null>(null);
  const [clientBudgetProgress, setClientBudgetProgress] = useState<string | null>(null);
  const [spendingHabitsSummary, setSpendingHabitsSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      // Simulate fetching data for an authenticated user
      // In a real app, fetch this data based on the logged-in user
      const currentTotalBalance = 0; 
      const currentMonthlySpending = 0;
      const currentBudgetProgress = 0; 

      setClientTotalBalance(currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setClientMonthlySpending(currentMonthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setClientBudgetProgress(currentBudgetProgress.toFixed(0));

      if (currentTotalBalance > 0 || currentMonthlySpending > 0) {
        setSpendingHabitsSummary(`User has a total balance of $${currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, with monthly spending around $${currentMonthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Budget utilization is at ${currentBudgetProgress}%.`);
      } else {
        setSpendingHabitsSummary(""); 
      }
      setIsLoading(false);
    }
  }, [router]);

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
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
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
                <CardTitle>Visualize Your Spending</CardTitle>
                <CardDescription>Get a clear overview of your financial habits.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <Image
                    src="https://placehold.co/600x300.png"
                    alt="Spending visualization placeholder"
                    width={600}
                    height={300}
                    className="rounded-md mb-4"
                    data-ai-hint="finance chart graph"
                />
                <p className="text-muted-foreground mb-4">Detailed charts are available in the Insights section.</p>
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
    </div>
  );
}
