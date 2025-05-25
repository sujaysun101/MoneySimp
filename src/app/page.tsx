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
  // Mock data for demonstration
  const totalBalance = 12530.75;
  const monthlySpending = 1850.50;
  const budgetProgress = 65; // percentage

  // Simulate spending habits for AI tip
  const spendingHabitsSummary = `User has a total balance of $${totalBalance.toFixed(2)}, with monthly spending around $${monthlySpending.toFixed(2)}. Budget utilization is at ${budgetProgress}%. Key spending areas include groceries and dining out.`;

  const [clientTotalBalance, setClientTotalBalance] = useState<string | null>(null);
  const [clientMonthlySpending, setClientMonthlySpending] = useState<string | null>(null);

  useEffect(() => {
    setClientTotalBalance(totalBalance.toFixed(2));
    setClientMonthlySpending(monthlySpending.toFixed(2));
  }, []); // Empty dependency array to run once on mount


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
            <div className="text-2xl font-bold">${clientTotalBalance !== null ? clientTotalBalance : '...'}</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <TrendingUp className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${clientMonthlySpending !== null ? clientMonthlySpending : '...'}</div>
            <p className="text-xs text-muted-foreground">Compared to $1700 last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Progress</CardTitle>
            <Landmark className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetProgress}% Utilized</div>
            <p className="text-xs text-muted-foreground">35% remaining for this month</p>
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
                    src="https://placehold.co/600x300.png" // Placeholder for a chart/graph image
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
