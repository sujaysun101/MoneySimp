// src/lib/taxUtils.ts
import { Expense, TaxCategory, TaxReport, TaxDeductionSummary, TaxExportOptions } from '@/lib/types';
import { TAX_CATEGORIES } from '@/lib/constants';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';

export class TaxUtils {
  /**
   * Get all tax-deductible expenses within a date range
   */
  static getTaxDeductibleExpenses(
    expenses: Expense[], 
    startDate: Date, 
    endDate: Date
  ): Expense[] {
    return expenses.filter(expense => 
      expense.taxDeductible === true &&
      expense.date >= startDate && 
      expense.date <= endDate
    );
  }

  /**
   * Categorize tax-deductible expenses by tax category
   */
  static categorizeByTaxType(expenses: Expense[]): Record<string, Expense[]> {
    const categorized: Record<string, Expense[]> = {};
    
    expenses.forEach(expense => {
      if (expense.taxDeductible && expense.taxCategory) {
        if (!categorized[expense.taxCategory]) {
          categorized[expense.taxCategory] = [];
        }
        categorized[expense.taxCategory].push(expense);
      }
    });

    return categorized;
  }

  /**
   * Generate tax deduction summary by category
   */
  static generateTaxSummary(expenses: Expense[]): TaxDeductionSummary[] {
    const categorized = this.categorizeByTaxType(expenses);
    const totalDeductible = expenses
      .filter(e => e.taxDeductible)
      .reduce((sum, e) => sum + e.amount, 0);
    
    return Object.entries(categorized).map(([categoryId, categoryExpenses]) => {
      const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const taxCategory = TAX_CATEGORIES.find(tc => tc.id === categoryId);
      
      return {
        categoryId,
        categoryName: taxCategory?.name || 'Unknown Category',
        totalAmount,
        expenseCount: categoryExpenses.length,
        averageAmount: totalAmount / categoryExpenses.length,
        percentageOfTotal: totalDeductible > 0 ? (totalAmount / totalDeductible) * 100 : 0
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Generate comprehensive tax report
   */
  static generateTaxReport(
    expenses: Expense[],
    taxYear: number,
    reportType: 'annual' | 'quarterly' | 'monthly' = 'annual'
  ): TaxReport {
    const { periodStart, periodEnd } = this.getReportPeriod(taxYear, reportType);
    const deductibleExpenses = this.getTaxDeductibleExpenses(expenses, periodStart, periodEnd);
    const deductionsByCategory = this.generateTaxSummary(deductibleExpenses);
    const totalDeductions = deductibleExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      id: `tax-report-${taxYear}-${reportType}-${Date.now()}`,
      taxYear,
      generatedDate: new Date(),
      totalDeductions,
      deductionsByCategory,
      expenses: deductibleExpenses,
      reportType,
      periodStart,
      periodEnd
    };
  }

  /**
   * Get report period dates based on type
   */
  private static getReportPeriod(
    year: number, 
    type: 'annual' | 'quarterly' | 'monthly'
  ): { periodStart: Date; periodEnd: Date } {
    const baseDate = new Date(year, 0, 1);
    
    switch (type) {
      case 'annual':
        return {
          periodStart: startOfYear(baseDate),
          periodEnd: endOfYear(baseDate)
        };
      case 'quarterly':
        // Default to Q1, could be parameterized
        return {
          periodStart: startOfQuarter(baseDate),
          periodEnd: endOfQuarter(baseDate)
        };
      case 'monthly':
        // Default to January, could be parameterized
        return {
          periodStart: startOfMonth(baseDate),
          periodEnd: endOfMonth(baseDate)
        };
      default:
        return {
          periodStart: startOfYear(baseDate),
          periodEnd: endOfYear(baseDate)
        };
    }
  }

  /**
   * Export tax data to CSV format
   */
  static exportToCSV(expenses: Expense[], options: TaxExportOptions): string {
    const filteredExpenses = options.includeNonDeductible 
      ? expenses.filter(e => e.date >= options.dateRange.start && e.date <= options.dateRange.end)
      : expenses.filter(e => 
          e.taxDeductible && 
          e.date >= options.dateRange.start && 
          e.date <= options.dateRange.end
        );

    // CSV Headers
    const headers = [
      'Date',
      'Description',
      'Amount',
      'Category',
      'Tax Category',
      'Tax Deductible',
      'Vendor',
      'Receipt Number',
      'Notes'
    ];

    // CSV Rows
    const rows = filteredExpenses.map(expense => [
      format(expense.date, 'yyyy-MM-dd'),
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.amount.toFixed(2),
      expense.categoryId,
      expense.taxCategory || '',
      expense.taxDeductible ? 'Yes' : 'No',
      expense.vendor || '',
      expense.receiptNumber || '',
      `"${(expense.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Export tax data for QuickBooks format
   */
  static exportToQuickBooks(expenses: Expense[], options: TaxExportOptions): string {
    const deductibleExpenses = expenses.filter(e => 
      e.taxDeductible && 
      e.date >= options.dateRange.start && 
      e.date <= options.dateRange.end
    );

    // QuickBooks IIF format headers
    const headers = [
      '!TRNS',
      'TRNSTYPE',
      'DATE',
      'ACCNT',
      'NAME',
      'AMOUNT',
      'DOCNUM',
      'MEMO',
      'TAXABLE'
    ];

    const rows = deductibleExpenses.map((expense, index) => {
      const taxCategory = TAX_CATEGORIES.find(tc => tc.id === expense.taxCategory);
      return [
        'EXPENSE',
        'EXPENSE',
        format(expense.date, 'MM/dd/yyyy'),
        taxCategory?.name || 'Business Expense',
        expense.vendor || 'Various',
        expense.amount.toFixed(2),
        expense.receiptNumber || `EXP-${index + 1}`,
        expense.description,
        'Y'
      ];
    });

    return [headers.join('\t'), ...rows.map(row => row.join('\t'))].join('\n');
  }

  /**
   * Get tax category information
   */
  static getTaxCategory(categoryId: string): TaxCategory | undefined {
    return TAX_CATEGORIES.find(tc => tc.id === categoryId);
  }

  /**
   * Calculate potential tax savings
   */
  static calculateTaxSavings(
    totalDeductions: number, 
    taxRate: number = 0.22 // Default 22% tax bracket
  ): number {
    return totalDeductions * taxRate;
  }

  /**
   * Validate expense for tax deduction requirements
   */
  static validateTaxDeduction(expense: Expense): {
    isValid: boolean;
    warnings: string[];
    requirements: string[];
  } {
    const warnings: string[] = [];
    const requirements: string[] = [];
    let isValid = true;

    if (!expense.taxDeductible) {
      return { isValid: false, warnings: ['Expense is not marked as tax deductible'], requirements: [] };
    }

    const taxCategory = this.getTaxCategory(expense.taxCategory || '');
    
    if (!taxCategory) {
      warnings.push('No tax category assigned');
      isValid = false;
    } else {
      if (taxCategory.requiresReceipt && !expense.receiptNumber && !expense.billUrl) {
        warnings.push('Receipt required for this category but not provided');
        requirements.push('Upload receipt or add receipt number');
      }

      if (taxCategory.deductionLimit && expense.amount > taxCategory.deductionLimit) {
        warnings.push(`Amount exceeds annual limit of $${taxCategory.deductionLimit}`);
      }
    }

    if (!expense.vendor && expense.taxCategory === 'business_meals') {
      warnings.push('Business meals require vendor information');
      requirements.push('Add vendor/restaurant name');
    }

    if (!expense.description || expense.description.length < 5) {
      warnings.push('Description should be more detailed for tax purposes');
      requirements.push('Add detailed description of business purpose');
    }

    return { isValid: warnings.length === 0, warnings, requirements };
  }

  /**
   * Get suggested tax categories based on expense details
   */
  static suggestTaxCategories(expense: Expense): TaxCategory[] {
    const suggestions: TaxCategory[] = [];
    const description = expense.description.toLowerCase();
    const amount = expense.amount;

    // Simple keyword matching for suggestions
    if (description.includes('meal') || description.includes('restaurant') || description.includes('lunch') || description.includes('dinner')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'business_meals');
      if (category) suggestions.push(category);
    }

    if (description.includes('travel') || description.includes('hotel') || description.includes('flight') || description.includes('uber') || description.includes('taxi')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'business_travel');
      if (category) suggestions.push(category);
    }

    if (description.includes('office') || description.includes('supplies') || description.includes('software') || description.includes('computer')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'office_supplies');
      if (category) suggestions.push(category);
    }

    if (description.includes('phone') || description.includes('internet') || description.includes('mobile')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'communications');
      if (category) suggestions.push(category);
    }

    if (description.includes('medical') || description.includes('doctor') || description.includes('dental') || description.includes('prescription')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'medical_deductible');
      if (category) suggestions.push(category);
    }

    if (description.includes('donation') || description.includes('charity') || description.includes('church')) {
      const category = TAX_CATEGORIES.find(tc => tc.id === 'charitable_donations');
      if (category) suggestions.push(category);
    }

    return suggestions;
  }
}

export default TaxUtils;
