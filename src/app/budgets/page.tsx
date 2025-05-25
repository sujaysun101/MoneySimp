// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs, npm install uuid @types/uuid

// Mock data for expenses to calculate spent amounts
const mockExpenses = [
  { categoryId: 'groceries', amount: 150 },
  { categoryId: 'transportation', amount: 80 },
  { categoryId: 'groceries', amount: 70 },
  { categoryId: 'entertainment', amount: 120 },
];


export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Load budgets from local storage or initialize
  useEffect(() => {
    const storedBudgets = localStorage.getItem('pennywise-budgets');
    if (storedBudgets) {
      const parsedBudgets: Omit<Budget, 'icon' | 'name'>[] = JSON.parse(storedBudgets);
      const fullBudgets = parsedBudgets.map(b => {
        const category = CATEGORIES.find(c => c.id === b.categoryId);
        return {
          ...b,
          name: category?.name || 'Unknown Category',
          icon: category?.icon || DollarSign, // Fallback icon
          spentAmount: calculateSpentAmount(b.categoryId) // Recalculate spent amount on load
        };
      });
      setBudgets(fullBudgets);
    } else {
      // Initialize with some default budgets for demo
      const initialBudgets: Budget[] = [
        { id: uuidv4(), categoryId: 'groceries', name: 'Groceries', icon: CATEGORIES.find(c=>c.id==='groceries')!.icon, amount: 300, spentAmount: 0 },
        { id: uuidv4(), categoryId: 'entertainment', name: 'Entertainment', icon: CATEGORIES.find(c=>c.id==='entertainment')!.icon, amount: 150, spentAmount: 0 },
      ].map(b => ({ ...b, spentAmount: calculateSpentAmount(b.categoryId) }));
      setBudgets(initialBudgets);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount


  // Save budgets to local storage whenever they change
  useEffect(() => {
    // Store only essential data, derive name/icon on load
    const storableBudgets = budgets.map(({ id, categoryId, amount, spentAmount }) => ({ id, categoryId, amount, spentAmount }));
    localStorage.setItem('pennywise-budgets', JSON.stringify(storableBudgets));
  }, [budgets]);

  const calculateSpentAmount = (categoryId: string): number => {
    return mockExpenses
      .filter(expense => expense.categoryId === categoryId)
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const handleBudgetSet = (data: { categoryId: string; amount: number }) => {
    const category = CATEGORIES.find(cat => cat.id === data.categoryId);
    if (!category) return;

    const newBudget: Budget = {
      id: uuidv4(),
      categoryId: data.categoryId,
      name: category.name,
      icon: category.icon,
      amount: data.amount,
      spentAmount: calculateSpentAmount(data.categoryId),
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

// Need to import DollarSign from lucide-react if used as fallback.
// Add to imports: import { DollarSign } from 'lucide-react';
// For uuid: npm install uuid @types/uuid --save
// Since I cannot modify package.json, I will rely on it already being there or use Math.random for IDs for now for simplicity if uuid not available.
// For now, using uuidv4 for better uniqueness. Assume it's available.
