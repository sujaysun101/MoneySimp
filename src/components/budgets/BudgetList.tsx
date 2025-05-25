// src/components/budgets/BudgetList.tsx
"use client";
import React from 'react';
import type { Budget } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trash2, TrendingUp } from 'lucide-react';

interface BudgetListProps {
  budgets: Budget[];
  onDeleteBudget: (budgetId: string) => void;
}

export function BudgetList({ budgets, onDeleteBudget }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <Card className="mt-8 shadow-md">
        <CardHeader>
          <CardTitle>Your Budgets</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <TrendingUp className="mx-auto h-12 w-12 mb-4" />
          <p>No budgets set yet.</p>
          <p className="text-sm">Create your first budget to start tracking!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {budgets.map((budget) => {
        const progress = budget.amount > 0 ? Math.min((budget.spentAmount / budget.amount) * 100, 100) : 0;
        const remaining = budget.amount - budget.spentAmount;
        const isOverBudget = remaining < 0;

        return (
          <Card key={budget.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    {React.createElement(budget.icon, { className: "mr-2 h-5 w-5 text-primary"})}
                    {budget.name}
                  </CardTitle>
                  <CardDescription>
                    Target: ${budget.amount.toFixed(2)}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDeleteBudget(budget.id)} aria-label={`Delete ${budget.name} budget`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex justify-between text-sm">
                <span>Spent: ${budget.spentAmount.toFixed(2)}</span>
                <span className={isOverBudget ? "text-destructive font-semibold" : "text-muted-foreground"}>
                  {isOverBudget 
                    ? `Over by $${Math.abs(remaining).toFixed(2)}` 
                    : `Remaining: $${remaining.toFixed(2)}`}
                </span>
              </div>
              <Progress value={progress} className={isOverBudget ? "h-3 [&>*]:bg-destructive" : "h-3"} />
              <p className="text-xs text-muted-foreground mt-1 text-right">{progress.toFixed(0)}% of budget used</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
