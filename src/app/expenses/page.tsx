// src/app/expenses/page.tsx
"use client"; 

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { BillUploadForm } from '@/components/expenses/BillUploadForm';
import { ExpenseList } from '@/components/expenses/ExpenseList';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpensesPage() {
  const router = useRouter();
  const [key, setKey] = useState(0); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleExpenseAdded = () => {
    setKey(prevKey => prevKey + 1); 
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
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
              <ExpenseForm onSubmitSuccess={handleExpenseAdded} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scan">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Scan a Bill</CardTitle>
              <CardDescription>Upload an image of your bill to automatically extract information. (OCR functionality is conceptual)</CardDescription>
            </CardHeader>
            <CardContent>
              <BillUploadForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ExpenseList key={key} />
    </div>
  );
}
