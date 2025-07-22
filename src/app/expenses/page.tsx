// src/app/expenses/page.tsx
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useOptimizedExpenses } from '@/hooks/useOptimizedData';
import { 
  LazyExpenseForm, 
  LazyBillUploadForm,
  LazyFormComponent 
} from '@/components/performance/LazyComponents';

// Memoized components for better performance
const MemoizedExpenseList = memo<{
  expenses: Expense[];
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
  onDeleteExpense?: (id: string) => void;
}>(ExpenseList);

export default function ExpensesPage() {
  const router = useRouter();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>();
  
  // Use optimized data hook
  const {
    data: expenses,
    isLoading: expensesLoading,
    error: expensesError,
    addItem: addExpense,
    updateItem: updateExpense,
    removeItem: removeExpense,
    refresh: refreshExpenses
  } = useOptimizedExpenses(userId);

  // Authentication check
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    const storedUserId = localStorage.getItem('moneySimpUserId');
    
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setUserId(storedUserId || 'default-user');
      setIsAuthLoading(false);
    }
  }, [router]);

  const handleAddExpense = useCallback((expenseData: Omit<Expense, 'id' | 'billUrl'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: uuidv4(),
      // Ensure date is a Date object
      date: expenseData.date instanceof Date ? expenseData.date : new Date(expenseData.date),
    };
    addExpense(newExpense);
  }, [addExpense]);
  
  const handleExpenseFormSubmitSuccess = useCallback(() => {
    // Optional callback for form submission success
    console.log('Expense added successfully');
  }, []);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading expenses...</p>
      </div>
    );
  }

  if (expensesError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-red-500">
          <p>Error loading expenses: {expensesError}</p>
          <button onClick={refreshExpenses} className="mt-2 px-4 py-2 bg-red-500 text-white rounded">
            Retry
          </button>
        </div>
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
              <LazyFormComponent>
                <LazyExpenseForm 
                  onAddExpense={handleAddExpense} 
                  onSubmitSuccess={handleExpenseFormSubmitSuccess} 
                />
              </LazyFormComponent>
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
              <LazyFormComponent>
                <LazyBillUploadForm onAddExpense={handleAddExpense} />
              </LazyFormComponent>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <MemoizedExpenseList 
        expenses={expenses} 
        onUpdateExpense={updateExpense}
        onDeleteExpense={removeExpense}
      />
    </div>
  );
}
