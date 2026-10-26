"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CashFlowChart } from '@/components/insights/CashFlowChart';
import { IncomeSourceForm } from '@/components/income/IncomeSourceForm';
import { IncomeSourceList } from '@/components/income/IncomeSourceList';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { CashFlowUtils } from '@/lib/cashFlowUtils';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Settings,
  AlertTriangle,
  Info,
  Plus,
  RefreshCw
} from 'lucide-react';
import { addIncome, updateIncome, removeIncome } from '@/lib/incomeService';
import type { IncomeSource, Expense, CashFlowForecast } from '@/lib/types';

export default function CashFlowPage() {
  const { user } = useAuth();
  const { data: expenses, loading: expensesLoading } = useFirestore<Expense>('expenses');
  const { data: incomeSources, loading: incomeLoading, error: incomeError } = useFirestore<IncomeSource>('income_sources');

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [cashFlowForecast, setCashFlowForecast] = useState<CashFlowForecast | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate cash flow forecast when data changes
  useEffect(() => {
    if (!expenses || !incomeSources || expensesLoading || incomeLoading) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      try {
        const forecast = CashFlowUtils.generateCashFlowForecast(
          expenses,
          incomeSources,
          projectionMonths
        );
        setCashFlowForecast(forecast);
      } catch (error) {
        console.error('Error calculating cash flow forecast:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 100); // Small delay to show loading state
  }, [expenses, incomeSources, projectionMonths, expensesLoading, incomeLoading]);

  const handleAddIncome = async (incomeData: Omit<IncomeSource, 'id'>) => {
    try {
      if (!user?.uid) throw new Error('User not authenticated');
      await addIncome(user.uid, incomeData);
      setShowIncomeForm(false);
    } catch (error) {
      console.error('Error adding income source:', error);
    }
  };

  const handleUpdateIncome = async (incomeData: Omit<IncomeSource, 'id'>) => {
    if (!editingIncome) return;
    
    try {
      await updateIncome(editingIncome.id, incomeData);
      setEditingIncome(null);
    } catch (error) {
      console.error('Error updating income source:', error);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    if (confirm('Are you sure you want to delete this income source?')) {
      try {
        await removeIncome(id);
      } catch (error) {
        console.error('Error deleting income source:', error);
      }
    }
  };

  const handleToggleIncomeActive = async (id: string, isActive: boolean) => {
    const income = incomeSources?.find(i => i.id === id);
    if (!income) return;

    try {
      await updateIncome(id, { ...income, isActive });
    } catch (error) {
      console.error('Error toggling income source:', error);
    }
  };

  const handleEditIncome = (income: IncomeSource) => {
    setEditingIncome(income);
    setShowIncomeForm(false);
  };

  const summary = useMemo(() => {
    if (!cashFlowForecast) return null;

    const activeIncome = incomeSources?.filter(s => s.isActive) || [];
    const recentExpenses = expenses?.filter(e => {
      const expenseDate = new Date(e.date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return expenseDate >= threeMonthsAgo;
    }) || [];

    return {
      totalIncomeSources: activeIncome.length,
      totalMonthlyIncome: cashFlowForecast.summary.averageMonthlyIncome,
      totalMonthlyExpenses: cashFlowForecast.summary.averageMonthlyExpenses,
      netCashFlow: cashFlowForecast.summary.netCashFlow,
      negativeMonths: cashFlowForecast.summary.negativeMonths,
      recentExpensesCount: recentExpenses.length
    };
  }, [cashFlowForecast, incomeSources, expenses]);

  if (!user) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to view your cash flow forecast.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Cash Flow Visualization
          </h1>
          <p className="text-muted-foreground mt-2">
            Forecast your monthly cash flow and identify potential shortfalls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select 
            value={projectionMonths.toString()} 
            onValueChange={(value) => setProjectionMonths(Number(value))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 Month Forecast</SelectItem>
              <SelectItem value="12">12 Month Forecast</SelectItem>
              <SelectItem value="18">18 Month Forecast</SelectItem>
              <SelectItem value="24">24 Month Forecast</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setShowIncomeForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${summary.totalMonthlyIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${summary.totalMonthlyExpenses.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className={`h-5 w-5 ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${summary.netCashFlow.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Negative Months</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summary.negativeMonths}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="income">Income Sources</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          {/* Loading State */}
          {(isCalculating || expensesLoading || incomeLoading) && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Calculating cash flow forecast...
              </AlertDescription>
            </Alert>
          )}

          {/* No Data State */}
          {!isCalculating && !expensesLoading && !incomeLoading && (!incomeSources?.length || !expenses?.length) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    To generate a cash flow forecast, you need both income sources and expense data.
                  </p>
                  <div className="flex gap-2">
                    {!incomeSources?.length && (
                      <Button size="sm" onClick={() => setShowIncomeForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Income Source
                      </Button>
                    )}
                    {!expenses?.length && (
                      <Button size="sm" variant="outline" asChild>
                        <a href="/expenses">Add Expenses</a>
                      </Button>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Cash Flow Chart */}
          {cashFlowForecast && !isCalculating && (
            <CashFlowChart 
              forecast={cashFlowForecast}
              showProjections={true}
            />
          )}
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          {showIncomeForm ? (
            <IncomeSourceForm
              onSubmit={handleAddIncome}
              onCancel={() => setShowIncomeForm(false)}
            />
          ) : editingIncome ? (
            <IncomeSourceForm
              initialData={editingIncome}
              onSubmit={handleUpdateIncome}
              onCancel={() => setEditingIncome(null)}
            />
          ) : (
            <IncomeSourceList
              incomeSources={incomeSources || []}
              onEdit={handleEditIncome}
              onDelete={handleDeleteIncome}
              onToggleActive={handleToggleIncomeActive}
              onAdd={() => setShowIncomeForm(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Forecast Settings
              </CardTitle>
              <CardDescription>
                Configure how your cash flow forecast is calculated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Projection Period</label>
                <Select 
                  value={projectionMonths.toString()} 
                  onValueChange={(value) => setProjectionMonths(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                    <SelectItem value="18">18 Months</SelectItem>
                    <SelectItem value="24">24 Months</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How many months ahead to project your cash flow
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">How forecasting works:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Income is projected based on your configured sources</li>
                      <li>• Expenses are estimated from your historical spending patterns</li>
                      <li>• Seasonal factors are applied based on spending trends</li>
                      <li>• One-time and irregular expenses are excluded from projections</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
