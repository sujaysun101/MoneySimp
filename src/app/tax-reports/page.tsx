// src/app/tax-reports/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Receipt, 
  Download, 
  FileText, 
  Calculator, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar as CalendarIcon,
  Filter,
  DollarSign,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  Building
} from 'lucide-react';
import { format, startOfYear, endOfYear, subYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import type { Expense, TaxReport, TaxDeductionSummary } from '@/lib/types';
import { TAX_CATEGORIES } from '@/lib/constants';
import { TaxUtils } from '@/lib/taxUtils';

const EXPENSES_STORAGE_KEY = 'moneySimp_expenses';

export default function TaxReportsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<'annual' | 'quarterly' | 'monthly'>('annual');
  const [customDateRange, setCustomDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [taxRate, setTaxRate] = useState(22); // Default 22% tax bracket
  
  const router = useRouter();
  const { toast } = useToast();

  // Load expenses from localStorage
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn) {
      router.replace('/login');
      return;
    }

    try {
      const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
      if (storedExpenses) {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date),
        }));
        setExpenses(parsedExpenses);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
        description: "Failed to load expense data. Please try refreshing the page."
      });
    } finally {
      setIsLoading(false);
    }
  }, [router, toast]);

  // Generate current tax report
  const currentTaxReport = useMemo(() => {
    if (expenses.length === 0) return null;
    return TaxUtils.generateTaxReport(expenses, selectedYear, reportType);
  }, [expenses, selectedYear, reportType]);

  // Get available years from expenses
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach(expense => {
      years.add(expense.date.getFullYear());
    });
    // Add current year and previous 2 years if not present
    for (let i = 0; i < 3; i++) {
      years.add(new Date().getFullYear() - i);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  // Calculate tax statistics
  const taxStats = useMemo(() => {
    if (!currentTaxReport) return null;

    const potentialSavings = TaxUtils.calculateTaxSavings(currentTaxReport.totalDeductions, taxRate / 100);
    const deductibleCount = currentTaxReport.expenses.length;
    const totalExpenses = expenses.filter(e => 
      e.date >= currentTaxReport.periodStart && 
      e.date <= currentTaxReport.periodEnd
    ).length;
    const deductiblePercentage = totalExpenses > 0 ? (deductibleCount / totalExpenses) * 100 : 0;

    return {
      totalDeductions: currentTaxReport.totalDeductions,
      potentialSavings,
      deductibleCount,
      totalExpenses,
      deductiblePercentage,
      averageDeduction: deductibleCount > 0 ? currentTaxReport.totalDeductions / deductibleCount : 0
    };
  }, [currentTaxReport, taxRate, expenses]);

  const handleExportCSV = () => {
    if (!currentTaxReport) return;

    const csvData = TaxUtils.exportToCSV(currentTaxReport.expenses, {
      format: 'csv',
      includeReceipts: true,
      groupByCategory: false,
      includeNonDeductible: false,
      dateRange: {
        start: currentTaxReport.periodStart,
        end: currentTaxReport.periodEnd
      }
    });

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-deductions-${selectedYear}-${reportType}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Tax report exported as CSV for ${selectedYear}.`
    });
  };

  const handleExportQuickBooks = () => {
    if (!currentTaxReport) return;

    const qbData = TaxUtils.exportToQuickBooks(currentTaxReport.expenses, {
      format: 'quickbooks',
      includeReceipts: true,
      groupByCategory: true,
      includeNonDeductible: false,
      dateRange: {
        start: currentTaxReport.periodStart,
        end: currentTaxReport.periodEnd
      }
    });

    const blob = new Blob([qbData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickbooks-import-${selectedYear}.iif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "QuickBooks Export Ready",
      description: "Import file generated. Upload to QuickBooks desktop version."
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading tax reports...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Tax Optimization Reports</h1>
        <p className="text-muted-foreground">
          Track tax-deductible expenses and generate reports for tax preparation.
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Tax Year</Label>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report Period</Label>
              <Select 
                value={reportType} 
                onValueChange={(value: 'annual' | 'quarterly' | 'monthly') => setReportType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tax Bracket (%)</Label>
              <Input
                type="number"
                min="10"
                max="37"
                value={taxRate}
                onChange={(e) => setTaxRate(parseInt(e.target.value) || 22)}
                placeholder="22"
              />
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button onClick={handleExportCSV} size="sm" disabled={!currentTaxReport}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button onClick={handleExportQuickBooks} size="sm" variant="outline" disabled={!currentTaxReport}>
                  <Building className="h-4 w-4 mr-1" />
                  QB
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {taxStats && currentTaxReport ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                        <p className="text-2xl font-bold">
                          ${taxStats.totalDeductions.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${taxStats.potentialSavings.toLocaleString()}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      At {taxRate}% tax rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Deductible Expenses</p>
                        <p className="text-2xl font-bold">
                          {taxStats.deductibleCount}
                        </p>
                      </div>
                      <Receipt className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {taxStats.deductiblePercentage.toFixed(1)}% of all expenses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Deduction</p>
                        <p className="text-2xl font-bold">
                          ${taxStats.averageDeduction.toLocaleString()}
                        </p>
                      </div>
                      <Calculator className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress towards common limits */}
              <Card>
                <CardHeader>
                  <CardTitle>Deduction Progress</CardTitle>
                  <CardDescription>
                    Track progress towards common deduction limits and thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Business Deductions</span>
                      <span>${taxStats.totalDeductions.toLocaleString()}</span>
                    </div>
                    <Progress 
                      value={Math.min((taxStats.totalDeductions / 50000) * 100, 100)} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Target: $50,000 annual business deductions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Tax Data Available</h3>
                <p className="text-muted-foreground mb-4">
                  Start marking your expenses as tax-deductible to generate reports.
                </p>
                <Button onClick={() => router.push('/expenses')}>
                  Add Tax-Deductible Expenses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {currentTaxReport && currentTaxReport.deductionsByCategory.length > 0 ? (
            <div className="grid gap-4">
              {currentTaxReport.deductionsByCategory.map((category) => {
                const taxCategory = TAX_CATEGORIES.find(tc => tc.id === category.categoryId);
                return (
                  <Card key={category.categoryId}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {taxCategory && (
                            <taxCategory.icon className="h-6 w-6" style={{ color: taxCategory.color }} />
                          )}
                          <div>
                            <h3 className="font-semibold">{category.categoryName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.expenseCount} expenses • Avg: ${category.averageAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            ${category.totalAmount.toLocaleString()}
                          </p>
                          <Badge variant="secondary">
                            {category.percentageOfTotal.toFixed(1)}% of total
                          </Badge>
                        </div>
                      </div>
                      
                      {taxCategory && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {taxCategory.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                              {taxCategory.irs_form}
                            </Badge>
                            {taxCategory.requiresReceipt && (
                              <Badge variant="outline">
                                <Receipt className="h-3 w-3 mr-1" />
                                Receipt Required
                              </Badge>
                            )}
                            {taxCategory.deductionLimit && (
                              <Badge variant="outline">
                                Limit: ${taxCategory.deductionLimit.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Progress 
                        value={category.percentageOfTotal} 
                        className="mt-4 h-2"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Categories Available</h3>
                <p className="text-muted-foreground">
                  Add tax-deductible expenses with categories to see breakdown.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          {currentTaxReport && currentTaxReport.expenses.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Tax-Deductible Expenses</CardTitle>
                <CardDescription>
                  All expenses marked as tax-deductible for {selectedYear}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentTaxReport.expenses.map((expense) => {
                    const taxCategory = TAX_CATEGORIES.find(tc => tc.id === expense.taxCategory);
                    const validation = TaxUtils.validateTaxDeduction(expense);
                    
                    return (
                      <div 
                        key={expense.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          {taxCategory && (
                            <taxCategory.icon 
                              className="h-5 w-5" 
                              style={{ color: taxCategory.color }} 
                            />
                          )}
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{format(expense.date, 'MMM dd, yyyy')}</span>
                              {expense.vendor && (
                                <>
                                  <span>•</span>
                                  <span>{expense.vendor}</span>
                                </>
                              )}
                              {taxCategory && (
                                <>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs">
                                    {taxCategory.name}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">
                            ${expense.amount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {validation.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {validation.isValid ? 'Valid' : `${validation.warnings.length} warnings`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Tax-Deductible Expenses</h3>
                <p className="text-muted-foreground mb-4">
                  Mark your business and other qualifying expenses as tax-deductible.
                </p>
                <Button onClick={() => router.push('/expenses')}>
                  Manage Expenses
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          {currentTaxReport && currentTaxReport.expenses.length > 0 ? (
            <div className="space-y-4">
              {currentTaxReport.expenses.map((expense) => {
                const validation = TaxUtils.validateTaxDeduction(expense);
                const taxCategory = TAX_CATEGORIES.find(tc => tc.id === expense.taxCategory);
                
                if (validation.isValid) return null; // Only show items with issues
                
                return (
                  <Card key={expense.id} className="border-yellow-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{expense.description}</h4>
                            <span className="font-semibold">${expense.amount.toLocaleString()}</span>
                          </div>
                          
                          <div className="space-y-2">
                            {validation.warnings.map((warning, index) => (
                              <Alert key={index} className="border-yellow-200">
                                <AlertDescription className="text-sm">
                                  {warning}
                                </AlertDescription>
                              </Alert>
                            ))}
                            
                            {validation.requirements.length > 0 && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-2">Required Actions:</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {validation.requirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Summary of validation results */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const validCount = currentTaxReport.expenses.filter(e => 
                      TaxUtils.validateTaxDeduction(e).isValid
                    ).length;
                    const totalCount = currentTaxReport.expenses.length;
                    const invalidCount = totalCount - validCount;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Valid Expenses</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {validCount} of {totalCount}
                          </Badge>
                        </div>
                        
                        {invalidCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span>Need Attention</span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              {invalidCount} of {totalCount}
                            </Badge>
                          </div>
                        )}
                        
                        <Progress 
                          value={(validCount / totalCount) * 100} 
                          className="h-2"
                        />
                        
                        <p className="text-sm text-muted-foreground">
                          {validCount === totalCount 
                            ? "All expenses are properly documented for tax purposes!"
                            : `${invalidCount} expenses need additional documentation or corrections.`
                          }
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Expenses to Validate</h3>
                <p className="text-muted-foreground">
                  Add tax-deductible expenses to check their compliance status.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
