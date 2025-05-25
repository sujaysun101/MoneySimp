// src/app/page.tsx
"use client"; // Add this directive

import { AIFinanceTipCard } from '@/components/shared/AIFinanceTipCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DollarSign, TrendingUp, Landmark, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  // Initialize with actual data sources or default to 0/empty
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [budgetProgress, setBudgetProgress] = useState(0); // percentage

  const [clientTotalBalance, setClientTotalBalance] = useState<string | null>(null);
  const [clientMonthlySpending, setClientMonthlySpending] = useState<string | null>(null);
  const [clientBudgetProgress, setClientBudgetProgress] = useState<string | null>(null);
  const [spendingHabitsSummary, setSpendingHabitsSummary] = useState<string>("");

  useEffect(() => {
    // In a real app, fetch this data
    // For now, setting to 0 or derived from other sources
    const currentTotalBalance = 0; // Replace with actual data source
    const currentMonthlySpending = 0; // Replace with actual data source
    const currentBudgetProgress = 0; // Replace with actual data source

    setTotalBalance(currentTotalBalance);
    setMonthlySpending(currentMonthlySpending);
    setBudgetProgress(currentBudgetProgress);

    setClientTotalBalance(currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setClientMonthlySpending(currentMonthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setClientBudgetProgress(currentBudgetProgress.toFixed(0));

    if (currentTotalBalance > 0 || currentMonthlySpending > 0) {
      setSpendingHabitsSummary(`User has a total balance of $${currentTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, with monthly spending around $${currentMonthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Budget utilization is at ${currentBudgetProgress}%.`);
    } else {
      setSpendingHabitsSummary(""); // Will trigger fallback in AIFinanceTipCard
    }
  }, []);


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome to PennyWise!</h1>
        <p className="text-muted-foreground">Your smart personal finance dashboard.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clientTotalBalance !== null ? clientTotalBalance : '0.00'}</div>
            {/* <p className="text-xs text-muted-foreground">+2.1% from last month</p> */}
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clientMonthlySpending !== null ? clientMonthlySpending : '0.00'}</div>
            {/* <p className="text-xs text-muted-foreground">Compared to $0 last month</p> */}
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
            <Landmark className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientBudgetProgress !== null ? clientBudgetProgress : '0'}% Utilized</div>
            {/* <p className="text-xs text-muted-foreground">0% remaining for this month</p> */}
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
