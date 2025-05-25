// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { DollarSign } from 'lucide-react';

// No mock expenses, this will be calculated from actual expense data in a full app
const calculateSpentAmount = (categoryId: string, expenses: any[] = []): number => {
  // In a real app, 'expenses' would come from a data store (e.g., state, context, API)
  return expenses
    .filter(expense => expense.categoryId === categoryId)
    .reduce((sum, expense) => sum + expense.amount, 0);
};


export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  // In a real app, expenses would be fetched or managed in a global state
  const [userExpenses, setUserExpenses] = useState<any[]>([]); // Placeholder for actual expenses

  // Load budgets from local storage or initialize
  useEffect(() => {
    const storedBudgets = localStorage.getItem('pennywise-budgets');
    if (storedBudgets) {
      try {
        const parsedBudgets: Omit<Budget, 'icon' | 'name' | 'spentAmount'>[] = JSON.parse(storedBudgets);
        const fullBudgets = parsedBudgets.map(b => {
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          return {
            ...b,
            id: (b as any).id || uuidv4(),
            name: category?.name || 'Unknown Category',
            icon: category?.icon || DollarSign,
            amount: (b as any).amount || 0,
            spentAmount: calculateSpentAmount(b.categoryId, userExpenses)
          };
        });
        setBudgets(fullBudgets);
      } catch (error) {
          console.error("Failed to parse budgets from localStorage:", error);
          localStorage.removeItem('pennywise-budgets'); // Clear corrupted data
          setBudgets([]); // Initialize with empty array on error
      }
    } else {
      setBudgets([]); // Initialize with empty array if nothing in storage
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userExpenses]); // Re-calculate spent amounts if userExpenses change


  // Save budgets to local storage whenever they change
  useEffect(() => {
    const storableBudgets = budgets.map(({ id, categoryId, amount, spentAmount }) => ({ id, categoryId, amount, spentAmount }));
    localStorage.setItem('pennywise-budgets', JSON.stringify(storableBudgets));
  }, [budgets]);


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
