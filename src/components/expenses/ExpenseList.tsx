// src/components/expenses/ExpenseList.tsx
"use client";
import React, { useState, useEffect } from 'react';
import type { Expense } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';

// Mock data for demonstration
const mockExpenses: Expense[] = [
  { id: '1', description: 'Groceries from Walmart', amount: 75.50, categoryId: 'groceries', date: new Date(2024, 6, 15) },
  { id: '2', description: 'Monthly Rent', amount: 1200.00, categoryId: 'rent', date: new Date(2024, 6, 1) },
  { id: '3', description: 'Gasoline for car', amount: 50.25, categoryId: 'transportation', date: new Date(2024, 6, 10) },
  { id: '4', description: 'Movie tickets', amount: 30.00, categoryId: 'entertainment', date: new Date(2024, 6, 12) },
  { id: '5', description: 'Electricity Bill', amount: 85.00, categoryId: 'utilities', date: new Date(2024, 6, 5) },
];

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    // In a real app, fetch expenses here
    setExpenses(mockExpenses);
  }, []);

  const getCategory = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId);
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <DollarSign className="mx-auto h-12 w-12 mb-4" />
          <p>No expenses recorded yet.</p>
          <p className="text-sm">Start by adding your first expense above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-md">
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const category = getCategory(expense.categoryId);
                return (
                  <TableRow key={expense.id}>
                    <TableCell>{format(expense.date, 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>
                      {category && (
                        <Badge variant="outline" style={{ borderColor: category.color, color: category.color }} className="flex items-center gap-1 w-fit">
                          <category.icon className="h-3 w-3" />
                          {category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
