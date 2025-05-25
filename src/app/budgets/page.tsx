// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { DollarSign, TrendingUp } from 'lucide-react'; // Added TrendingUp
import { useRouter } from 'next/navigation';


const calculateSpentAmount = (categoryId: string, expenses: any[] = []): number => {
  return expenses
    .filter(expense => expense.categoryId === categoryId)
    .reduce((sum, expense) => sum + expense.amount, 0);
};


export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userExpenses, setUserExpenses] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Load budgets from local storage or initialize
  useEffect(() => {
    if (isLoading) return; // Don't load if still verifying auth

    const storedBudgets = localStorage.getItem('pennywise-budgets'); // Using old key for now
    if (storedBudgets) {
      try {
        const parsedBudgets: Omit<Budget, 'icon' | 'name' | 'spentAmount' | 'id'>[] = JSON.parse(storedBudgets);
        const fullBudgets = parsedBudgets.map(b => {
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          return {
            ...b,
            id: (b as any).id || uuidv4(), // Ensure ID exists or generate
            name: category?.name || 'Unknown Category',
            icon: category?.icon || DollarSign,
            amount: (b as any).amount || 0,
            spentAmount: calculateSpentAmount(b.categoryId, userExpenses)
          };
        });
        setBudgets(fullBudgets);
      } catch (error) {
          console.error("Failed to parse budgets from localStorage:", error);
          localStorage.removeItem('pennywise-budgets'); 
          setBudgets([]); 
      }
    } else {
      setBudgets([]); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userExpenses, isLoading]); 


  // Save budgets to local storage whenever they change
  useEffect(() => {
    if (isLoading) return;
    // Filter out properties not needed for storage (like icon, name)
    const storableBudgets = budgets.map(({ id, categoryId, amount, spentAmount }) => ({ id, categoryId, amount, spentAmount }));
    localStorage.setItem('pennywise-budgets', JSON.stringify(storableBudgets));
  }, [budgets, isLoading]);


  const handleBudgetSet = (data: { categoryId: string; amount: number }) => {
    const category = CATEGORIES.find(cat => cat.id === data.categoryId);
    if (!category) return;

    const newBudget: Budget = {
      id: uuidv4(),
      categoryId: data.categoryId,
      name: category.name,
      icon: category.icon,
      amount: data.amount,
      spentAmount: calculateSpentAmount(data.categoryId, userExpenses),
    };
    setBudgets(prevBudgets => [...prevBudgets, newBudget]);
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading budgets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manage Budgets</h1>
        <p className="text-muted-foreground">Set financial goals and track your progress.</p>
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Set New Budget</CardTitle>
          <CardDescription>Define a budget for a specific category.</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm
            onBudgetSet={handleBudgetSet}
            existingBudgets={budgets.map(b => ({ categoryId: b.categoryId }))}
          />
        </CardContent>
      </Card>

      <BudgetList budgets={budgets} onDeleteBudget={handleDeleteBudget} />
    </div>
  );
}
