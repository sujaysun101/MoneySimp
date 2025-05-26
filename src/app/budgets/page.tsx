
// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BudgetForm, type BudgetFormValues } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import type { Budget } from '@/lib/types';
import { CATEGORIES, BUDGETS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { DollarSign, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { isSameMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const calculateSpentAmountForCurrentMonth = (categoryId: string, expenses: Expense[] = []): number => {
  const today = new Date();
  return expenses
    .filter(expense => expense.categoryId === categoryId && isSameMonth(new Date(expense.date), today))
    .reduce((sum, expense) => sum + expense.amount, 0);
};


export default function BudgetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  useEffect(() => {
    // Simulating auth check
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
        setUserExpenses([]); // Ensure userExpenses is an array even on error
      }
    } else {
      setUserExpenses([]); // Initialize if no expenses are stored
    }
  }, [isLoading]);


  // Load budgets from local storage or initialize
  useEffect(() => {
    if (isLoading) return;

    const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    if (storedBudgets) {
      try {
        const parsedBudgets: Omit<Budget, 'icon' | 'name' | 'spentAmount' >[] = JSON.parse(storedBudgets);
        const fullBudgets = parsedBudgets.map(b => {
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          return {
            ...b,
            id: (b as any).id || uuidv4(),
            name: category?.name || 'Unknown Category',
            icon: category?.icon || DollarSign,
            amount: typeof (b as any).amount === 'number' ? (b as any).amount : 0,
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
  }, [userExpenses, isLoading]);


  // Save budgets to local storage whenever they change
  useEffect(() => {
    if (isLoading) return;
    // Filter out properties not needed for storage (like icon, name, spentAmount)
    const storableBudgets = budgets.map(({ id, categoryId, amount }) => ({ id, categoryId, amount }));
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(storableBudgets));
  }, [budgets, isLoading]);


  const handleBudgetSubmit = (data: BudgetFormValues, editingBudgetId?: string) => {
    const category = CATEGORIES.find(cat => cat.id === data.categoryId);
    if (!category) return;

    if (editingBudgetId) { // Editing existing budget
      setBudgets(prevBudgets =>
        prevBudgets.map(b =>
          b.id === editingBudgetId
            ? { ...b, categoryId: data.categoryId, name: category.name, icon: category.icon, amount: data.amount, spentAmount: calculateSpentAmountForCurrentMonth(data.categoryId, userExpenses) }
            : b
        )
      );
      toast({
        title: "Budget Updated",
        description: `Budget for ${category.name} updated to $${data.amount.toFixed(2)}.`,
      });
      setEditingBudget(null); // Clear editing state
    } else { // Adding new budget
      const newBudget: Budget = {
        id: uuidv4(),
        categoryId: data.categoryId,
        name: category.name,
        icon: category.icon,
        amount: data.amount,
        spentAmount: calculateSpentAmountForCurrentMonth(data.categoryId, userExpenses),
      };
      setBudgets(prevBudgets => [...prevBudgets, newBudget]);
      toast({
        title: "Budget Set",
        description: `Budget for ${category.name} set to $${data.amount.toFixed(2)}.`,
      });
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    const budgetToDelete = budgets.find(b => b.id === budgetId);
    setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
    toast({
      title: "Budget Deleted",
      description: `Budget for ${budgetToDelete?.name || 'Category'} deleted.`,
      variant: "destructive"
    });
    if (editingBudget && editingBudget.id === budgetId) {
        setEditingBudget(null); // Clear edit form if the edited budget is deleted
    }
  };

  const handleEditBudget = (budgetToEdit: Budget) => {
    setEditingBudget(budgetToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  // Update spent amounts when expenses change
  useEffect(() => {
    // Only run if budgets have been loaded/initialized
    if (budgets.length > 0 || localStorage.getItem(BUDGETS_STORAGE_KEY)) {
        setBudgets(prevBudgets =>
            prevBudgets.map(b => ({
                ...b,
                spentAmount: calculateSpentAmountForCurrentMonth(b.categoryId, userExpenses)
            }))
        );
    }
  }, [userExpenses, budgets.length]); // Added budgets.length to avoid running if budgets are empty initially


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
          <CardTitle>{editingBudget ? 'Edit Budget' : 'Set New Budget'}</CardTitle>
          <CardDescription>
            {editingBudget
              ? `Update the budget amount for ${editingBudget.name}.`
              : 'Define a monthly budget for a specific category.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetForm
            onBudgetSubmit={handleBudgetSubmit}
            existingBudgets={budgets.map(b => ({ categoryId: b.categoryId }))}
            editingBudget={editingBudget}
            onCancelEdit={handleCancelEdit}
          />
        </CardContent>
      </Card>

      <BudgetList
        budgets={budgets}
        onDeleteBudget={handleDeleteBudget}
        onEditBudget={handleEditBudget}
      />
    </div>
  );
}
