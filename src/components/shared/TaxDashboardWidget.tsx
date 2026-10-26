// src/components/shared/TaxDashboardWidget.tsx
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { 
  Receipt, 
  TrendingUp, 
  Calculator, 
  ArrowRight,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

import type { Expense } from '@/lib/types';
import { TaxUtils } from '@/lib/taxUtils';

interface TaxDashboardWidgetProps {
  expenses: Expense[];
  className?: string;
}

export function TaxDashboardWidget({ expenses, className }: TaxDashboardWidgetProps) {
  const router = useRouter();

  const taxData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);
    
    const deductibleExpenses = TaxUtils.getTaxDeductibleExpenses(expenses, yearStart, yearEnd);
    const totalDeductions = deductibleExpenses.reduce((sum, e) => sum + e.amount, 0);
    const potentialSavings = TaxUtils.calculateTaxSavings(totalDeductions, 0.22);
    
    // Get expenses that could be tax deductible but aren't marked
    const potentialDeductible = expenses.filter(e => 
      !e.taxDeductible && 
      e.date >= yearStart && 
      e.date <= yearEnd &&
      TaxUtils.suggestTaxCategories(e).length > 0
    );
    
    const potentialAdditionalSavings = potentialDeductible.reduce((sum, e) => sum + e.amount, 0) * 0.22;
    
    return {
      totalDeductions,
      potentialSavings,
      deductibleCount: deductibleExpenses.length,
      potentialDeductible: potentialDeductible.length,
      potentialAdditionalSavings,
      progress: Math.min((totalDeductions / 25000) * 100, 100) // Assume $25k target
    };
  }, [expenses]);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Receipt className="h-5 w-5" />
              Tax Deductions
            </CardTitle>
            <CardDescription>
              {new Date().getFullYear()} tax year progress
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tax-reports')}
            className="text-xs"
          >
            View Reports
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Deductions</p>
            <p className="text-2xl font-bold">
              ${taxData.totalDeductions.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Potential Savings</p>
            <p className="text-2xl font-bold text-green-600">
              ${taxData.potentialSavings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Deduction Progress</span>
            <span>${taxData.totalDeductions.toLocaleString()} / $25,000</span>
          </div>
          <Progress value={taxData.progress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {taxData.deductibleCount} expenses
            </Badge>
            <span className="text-muted-foreground">tracked</span>
          </div>
          
          {taxData.potentialDeductible > 0 && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-yellow-700 font-medium">
                {taxData.potentialDeductible} missed
              </span>
            </div>
          )}
        </div>

        {/* Potential Additional Savings */}
        {taxData.potentialAdditionalSavings > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Additional Opportunity
              </span>
            </div>
            <p className="text-sm text-yellow-700">
              ${taxData.potentialAdditionalSavings.toFixed(0)} more in potential savings from {taxData.potentialDeductible} unmarked expenses
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/expenses')}
            className="flex-1 text-xs"
          >
            <DollarSign className="h-3 w-3 mr-1" />
            Add Expense
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/tax-reports')}
            className="flex-1 text-xs"
          >
            <Calculator className="h-3 w-3 mr-1" />
            Generate Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaxDashboardWidget;
