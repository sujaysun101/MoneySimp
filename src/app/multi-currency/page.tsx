// src/app/multi-currency/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { collection, addDoc, getFirestore } from 'firebase/firestore';

import { CurrencyDashboard } from '@/components/currency/CurrencyDashboard';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import type { Expense } from '@/lib/types';

export default function MultiCurrencyPage() {
  const { user } = useAuth();
  const { data: expenses, loading } = useFirestore<Expense>('expenses');

  const handleExpenseAdd = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      await addDoc(expensesRef, expenseData);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access multi-currency features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading currency data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <CurrencyDashboard 
        expenses={expenses || []}
        onExpenseAdd={handleExpenseAdd}
      />
    </div>
  );
}
