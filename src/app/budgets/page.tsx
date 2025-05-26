// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { CATEGORIES, BUDGETS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants'; // Use constants for keys
import { v4 as uuidv4 } from 'uuid';
import { DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { isSameMonth } from 'date-fns';


const calculateSpentAmountForCurrentMonth = (categoryId: string, expenses: Expense[] = []): number => {
  const today = new Date();
  return expenses
    .filter(expense => expense.categoryId === categoryId && isSameMonth(new Date(expense.date), today))
    .reduce((sum, expense) => sum + expense.amount, 0);
};


export default function BudgetsPage() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Load expenses (needed to calculate spent amounts for budgets)
  useEffect(() => {
    if (isLoading) return;
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (storedExpenses) {
      try {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date), 
        }));
        setUserExpenses(parsedExpenses);
      } catch (error) {
        console.error("Failed to parse expenses for budget calculation:", error);
      }
    }
  }, [isLoading]);


  // Load budgets from local storage or initialize
  useEffect(() => {
    if (isLoading) return; 

    const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (storedBudgets) {
      try {
        const parsedBudgets: Omit<Budget, 'icon' | 'name' | 'spentAmount' | 'id'>[] = JSON.parse(storedBudgets);
        const fullBudgets = parsedBudgets.map(b => {
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          return {
            ...b,
            id: (b as any).id || uuidv4(), 
            name: category?.name || 'Unknown Category',
            icon: category?.icon || DollarSign,
            amount: (b as any).amount || 0, // Ensure amount is a number
            spentAmount: calculateSpentAmountForCurrentMonth(b.categoryId, userExpenses)
          };
        });
        setBudgets(fullBudgets);
      } catch (error) {
          console.error("Failed to parse budgets from localStorage:", error);
          localStorage.removeItem(BUDGETS_STORAGE_KEY); 
          setBudgets([]); 
      }
    } else {
      setBudgets([]); 
    }
  }, [userExpenses, isLoading]); // Recalculate budgets if expenses or loading state changes


  // Save budgets to local storage whenever they change
  useEffect(() => {
    if (isLoading) return;
    // Filter out properties not needed for storage (like icon, name, spentAmount)
    const storableBudgets = budgets.map(({ id, categoryId, amount }) => ({ id, categoryId, amount }));
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(storableBudgets));
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
      spentAmount: calculateSpentAmountForCurrentMonth(data.categoryId, userExpenses),
    };
    setBudgets(prevBudgets => [...prevBudgets, newBudget]);
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
  };
  
  // Update spent amounts when expenses change
  useEffect(() => {
    setBudgets(prevBudgets => 
        prevBudgets.map(b => ({
            ...b,
            spentAmount: calculateSpentAmountForCurrentMonth(b.categoryId, userExpenses)
        }))
    );
  }, [userExpenses]);


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
        <p className="text-muted-foreground">Set financial goals and track your progress for the current month.</p>
      </div>

      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle>Set New Budget</CardTitle>
          <CardDescription>Define a monthly budget for a specific category.</CardDescription>
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
