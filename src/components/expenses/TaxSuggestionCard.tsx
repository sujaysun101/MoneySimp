// src/components/expenses/TaxSuggestionCard.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Receipt, 
  Lightbulb, 
  Check, 
  X, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

import type { Expense, TaxCategory } from '@/lib/types';
import { TaxUtils } from '@/lib/taxUtils';

interface TaxSuggestionCardProps {
  expense: Expense;
  onUpdateExpense?: (id: string, updates: Partial<Expense>) => void;
}

export function TaxSuggestionCard({ expense, onUpdateExpense }: TaxSuggestionCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Don't show if already tax deductible or dismissed
  if (expense.taxDeductible || isDismissed) {
    return null;
  }

  const suggestions = TaxUtils.suggestTaxCategories(expense);
  
  // Don't show if no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  const handleApplySuggestion = async (taxCategory: TaxCategory) => {
    if (!onUpdateExpense) return;
    
    setIsApplying(true);
    try {
      await onUpdateExpense(expense.id, {
        taxDeductible: true,
        taxCategory: taxCategory.id,
        notes: expense.notes || `Automatically categorized as ${taxCategory.name} based on expense description.`
      });
      setIsDismissed(true);
    } catch (error) {
      console.error('Error applying tax suggestion:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-sm font-medium">Tax Deduction Suggestion</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          This expense might be tax deductible based on its description
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm">
            <p className="font-medium">{expense.description}</p>
            <p className="text-muted-foreground">${expense.amount.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggested Categories:</p>
            {suggestions.slice(0, 2).map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center justify-between p-2 border rounded-lg bg-white"
              >
                <div className="flex items-center gap-2">
                  <suggestion.icon className="h-4 w-4" style={{ color: suggestion.color }} />
                  <div>
                    <p className="text-sm font-medium">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {suggestion.requiresReceipt && (
                    <Badge variant="outline" className="text-xs">
                      <Receipt className="h-2 w-2 mr-1" />
                      Receipt Required
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplySuggestion(suggestion)}
                    disabled={isApplying}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {suggestions[0]?.requiresReceipt && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription className="text-xs">
                Remember to keep receipts for tax documentation
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>
              Potential tax savings: ${(expense.amount * 0.22).toFixed(2)} 
              <span className="text-muted-foreground/80"> (at 22% rate)</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TaxSuggestionCard;
