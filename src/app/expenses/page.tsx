// src/app/expenses/page.tsx
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { BillUploadForm } from '@/components/expenses/BillUploadForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const EXPENSES_STORAGE_KEY = 'moneySimp-expenses';

export default function ExpensesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseListKey, setExpenseListKey] = useState(0); // Used to force re-render of ExpenseList


  // Authentication check
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Load expenses from local storage on mount
  useEffect(() => {
    if (isLoading) return; // Don't load if still verifying auth

    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (storedExpenses) {
      try {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date), // Ensure date is a Date object
        }));
        setExpenses(parsedExpenses);
      } catch (error) {
        console.error("Failed to parse expenses from localStorage:", error);
        localStorage.removeItem(EXPENSES_STORAGE_KEY); 
        setExpenses([]);
      }
    }
  }, [isLoading]);

  // Save expenses to local storage whenever they change
  useEffect(() => {
    if (isLoading) return; // Don't save if initial load is happening
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isLoading]);


  const handleAddExpense = useCallback((expenseData: Omit<Expense, 'id' | 'billUrl'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      // Ensure date is a Date object
      date: expenseData.date instanceof Date ? expenseData.date : new Date(expenseData.date),
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setExpenseListKey(prevKey => prevKey + 1); // Increment key to re-render list
  }, []);
  
  const handleExpenseFormSubmitSuccess = () => {
    // This function can be used if ExpenseForm needs to trigger something in parent
    // For now, re-rendering ExpenseList is handled by handleAddExpense changing expenses state
    // and updating expenseListKey explicitly if needed.
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Manage Expenses</h1>
        <p className="text-muted-foreground">Track your spending and scan bills effortlessly.</p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mb-6">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="scan">Scan Bill</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Add New Expense</CardTitle>
              <CardDescription>Enter your expense details below.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseForm 
                onAddExpense={handleAddExpense} 
                onSubmitSuccess={handleExpenseFormSubmitSuccess} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scan">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Scan a Bill</CardTitle>
              <CardDescription>Upload an image or take a photo of your bill to automatically extract information.</CardDescription>
            </CardHeader>
            <CardContent>
              <BillUploadForm onAddExpense={handleAddExpense} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ExpenseList key={expenseListKey} expenses={expenses} />
    </div>
  );
}
