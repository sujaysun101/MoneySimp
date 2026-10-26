// src/lib/cashFlowUtils.ts
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, parseISO } from 'date-fns';
import type { Expense, IncomeSource, CashFlowDataPoint, CashFlowForecast } from '@/lib/types';

export class CashFlowUtils {
  /**
   * Calculate monthly income from income sources
   */
  static calculateMonthlyIncome(incomeSources: IncomeSource[], targetMonth: Date): number {
    return incomeSources
      .filter(source => source.isActive)
      .reduce((total, source) => {
        const monthlyAmount = this.convertToMonthlyAmount(source.amount, source.frequency);
        
        // Check if income source is active for this month
        if (source.startDate <= targetMonth && (!source.endDate || source.endDate >= targetMonth)) {
          return total + monthlyAmount;
        }
        
        return total;
      }, 0);
  }

  /**
   * Calculate monthly expenses from expense data
   */
  static calculateMonthlyExpenses(expenses: Expense[], targetMonth: Date): number {
    return expenses
      .filter(expense => isSameMonth(expense.date, targetMonth))
      .reduce((total, expense) => total + expense.amount, 0);
  }

  /**
   * Convert different frequency amounts to monthly equivalent
   */
  static convertToMonthlyAmount(amount: number, frequency: IncomeSource['frequency']): number {
    switch (frequency) {
      case 'weekly':
        return amount * 4.33; // Average weeks per month
      case 'biweekly':
        return amount * 2.17; // 26 pay periods / 12 months
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      case 'one-time':
        return 0; // One-time payments need special handling
      default:
        return amount;
    }
  }

  /**
   * Generate cash flow data for historical and projected periods
   */
  static generateCashFlowForecast(
    expenses: Expense[],
    incomeSources: IncomeSource[],
    projectionMonths: number = 12,
    historicalMonths: number = 6
  ): CashFlowForecast {
    const data: CashFlowDataPoint[] = [];
    const currentDate = new Date();
    let cumulativeCashFlow = 0;

    // Generate historical data
    for (let i = historicalMonths - 1; i >= 0; i--) {
      const targetMonth = subMonths(startOfMonth(currentDate), i);
      const monthKey = format(targetMonth, 'yyyy-MM');
      const monthName = format(targetMonth, 'MMM');
      const year = targetMonth.getFullYear();

      const income = this.calculateMonthlyIncome(incomeSources, targetMonth);
      const expenseAmount = this.calculateMonthlyExpenses(expenses, targetMonth);
      const netCashFlow = income - expenseAmount;
      cumulativeCashFlow += netCashFlow;

      data.push({
        month: monthName,
        year,
        monthKey,
        income,
        expenses: expenseAmount,
        netCashFlow,
        cumulativeCashFlow,
        isNegative: netCashFlow < 0
      });
    }

    // Generate projected data
    const averageMonthlyExpenses = this.calculateAverageMonthlyExpenses(expenses);
    const seasonalFactors = this.calculateSeasonalFactors(expenses);

    for (let i = 0; i < projectionMonths; i++) {
      const targetMonth = addMonths(startOfMonth(currentDate), i);
      const monthKey = format(targetMonth, 'yyyy-MM');
      const monthName = format(targetMonth, 'MMM');
      const year = targetMonth.getFullYear();
      const monthIndex = targetMonth.getMonth();

      const projectedIncome = this.calculateMonthlyIncome(incomeSources, targetMonth);
      const seasonalFactor = seasonalFactors[monthIndex] || 1;
      const projectedExpenses = averageMonthlyExpenses * seasonalFactor;
      const projectedNetFlow = projectedIncome - projectedExpenses;
      cumulativeCashFlow += projectedNetFlow;

      data.push({
        month: monthName,
        year,
        monthKey,
        income: 0, // Historical income is 0 for future months
        expenses: 0, // Historical expenses is 0 for future months
        netCashFlow: 0, // Historical net flow is 0 for future months
        cumulativeCashFlow,
        isNegative: projectedNetFlow < 0,
        projectedIncome,
        projectedExpenses,
        projectedNetFlow
      });
    }

    // Calculate summary statistics
    const summary = this.calculateSummary(data);
    const recommendations = this.generateRecommendations(data, summary);

    return {
      period: 'monthly',
      projectionMonths,
      data,
      summary,
      recommendations
    };
  }

  /**
   * Calculate average monthly expenses with seasonal adjustments
   */
  private static calculateAverageMonthlyExpenses(expenses: Expense[]): number {
    const now = new Date();
    const monthlyTotals: number[] = [];

    // Calculate last 12 months of expenses
    for (let i = 1; i <= 12; i++) {
      const targetMonth = subMonths(now, i);
      const monthlyTotal = this.calculateMonthlyExpenses(expenses, targetMonth);
      if (monthlyTotal > 0) {
        monthlyTotals.push(monthlyTotal);
      }
    }

    if (monthlyTotals.length === 0) return 0;
    
    return monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length;
  }

  /**
   * Calculate seasonal spending factors (0-12 month indices)
   */
  private static calculateSeasonalFactors(expenses: Expense[]): Record<number, number> {
    const now = new Date();
    const monthlyTotals: Record<number, number[]> = {};

    // Initialize monthly arrays
    for (let i = 0; i < 12; i++) {
      monthlyTotals[i] = [];
    }

    // Collect 2+ years of data if available
    for (let year = 0; year < 3; year++) {
      for (let month = 0; month < 12; month++) {
        const targetDate = new Date(now.getFullYear() - year, month);
        if (targetDate <= now) {
          const monthlyTotal = this.calculateMonthlyExpenses(expenses, targetDate);
          if (monthlyTotal > 0) {
            monthlyTotals[month].push(monthlyTotal);
          }
        }
      }
    }

    // Calculate average for each month and convert to factors
    const overallAverage = Object.values(monthlyTotals)
      .flat()
      .reduce((sum, val, _, arr) => sum + val / arr.length, 0);

    const factors: Record<number, number> = {};
    
    for (let month = 0; month < 12; month++) {
      const monthData = monthlyTotals[month];
      if (monthData.length > 0) {
        const monthAverage = monthData.reduce((sum, val) => sum + val, 0) / monthData.length;
        factors[month] = overallAverage > 0 ? monthAverage / overallAverage : 1;
      } else {
        factors[month] = 1; // Default factor if no data
      }
    }

    return factors;
  }

  /**
   * Calculate summary statistics for cash flow forecast
   */
  private static calculateSummary(data: CashFlowDataPoint[]): CashFlowForecast['summary'] {
    const futureData = data.filter(d => d.projectedNetFlow !== undefined);
    const historicalData = data.filter(d => d.projectedNetFlow === undefined);

    const totalIncome = data.reduce((sum, d) => sum + d.income + (d.projectedIncome || 0), 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses + (d.projectedExpenses || 0), 0);
    const netCashFlow = totalIncome - totalExpenses;

    const averageMonthlyIncome = totalIncome / data.length;
    const averageMonthlyExpenses = totalExpenses / data.length;

    const negativeMonths = data.filter(d => 
      (d.netCashFlow < 0) || (d.projectedNetFlow && d.projectedNetFlow < 0)
    ).length;

    // Find worst and best months
    const worstMonth = data.reduce((worst, current) => {
      const currentFlow = current.projectedNetFlow ?? current.netCashFlow;
      const worstFlow = worst.projectedNetFlow ?? worst.netCashFlow;
      return currentFlow < worstFlow ? current : worst;
    });

    const bestMonth = data.reduce((best, current) => {
      const currentFlow = current.projectedNetFlow ?? current.netCashFlow;
      const bestFlow = best.projectedNetFlow ?? best.netCashFlow;
      return currentFlow > bestFlow ? current : best;
    });

    return {
      totalIncome,
      totalExpenses,
      netCashFlow,
      averageMonthlyIncome,
      averageMonthlyExpenses,
      negativeMonths,
      worstMonth,
      bestMonth
    };
  }

  /**
   * Generate actionable recommendations based on cash flow analysis
   */
  private static generateRecommendations(
    data: CashFlowDataPoint[], 
    summary: CashFlowForecast['summary']
  ): string[] {
    const recommendations: string[] = [];

    // Negative cash flow months
    if (summary.negativeMonths > 0) {
      recommendations.push(
        `You have ${summary.negativeMonths} months with negative cash flow. Consider building an emergency fund.`
      );
    }

    // High expense months
    const expenseThreshold = summary.averageMonthlyExpenses * 1.3;
    const highExpenseMonths = data.filter(d => 
      (d.expenses > expenseThreshold) || (d.projectedExpenses && d.projectedExpenses > expenseThreshold)
    );

    if (highExpenseMonths.length > 0) {
      recommendations.push(
        `${highExpenseMonths.length} months show higher than average expenses. Review spending in ${highExpenseMonths[0].month}.`
      );
    }

    // Low income months
    if (summary.averageMonthlyIncome > 0) {
      const incomeThreshold = summary.averageMonthlyIncome * 0.8;
      const lowIncomeMonths = data.filter(d => 
        (d.income > 0 && d.income < incomeThreshold) || 
        (d.projectedIncome && d.projectedIncome < incomeThreshold)
      );

      if (lowIncomeMonths.length > 0) {
        recommendations.push(
          `Consider diversifying income sources to reduce dependency on main income stream.`
        );
      }
    }

    // Overall cash flow health
    if (summary.netCashFlow < 0) {
      recommendations.push(
        `Overall net cash flow is negative. Focus on increasing income or reducing expenses.`
      );
    } else if (summary.netCashFlow > 0 && summary.negativeMonths === 0) {
      recommendations.push(
        `Excellent cash flow management! Consider investing surplus funds for future growth.`
      );
    }

    // Emergency fund recommendation
    const emergencyFundMonths = 3;
    const emergencyFundNeeded = summary.averageMonthlyExpenses * emergencyFundMonths;
    recommendations.push(
      `Build an emergency fund of $${emergencyFundNeeded.toFixed(0)} (${emergencyFundMonths} months of expenses).`
    );

    return recommendations;
  }

  /**
   * Get default income sources for users who haven't set up income tracking
   */
  static getDefaultIncomeSources(): IncomeSource[] {
    return [
      {
        id: 'default-salary',
        name: 'Monthly Salary',
        amount: 0,
        frequency: 'monthly',
        startDate: new Date(),
        isActive: false,
        category: 'salary',
        isRecurring: true
      }
    ];
  }

  /**
   * Analyze cash flow trends
   */
  static analyzeCashFlowTrends(data: CashFlowDataPoint[]): {
    trend: 'improving' | 'declining' | 'stable';
    trendStrength: number; // -1 to 1
    volatility: number; // 0 to 1
    analysis: string;
  } {
    if (data.length < 3) {
      return {
        trend: 'stable',
        trendStrength: 0,
        volatility: 0,
        analysis: 'Insufficient data for trend analysis'
      };
    }

    // Calculate trend using linear regression on net cash flow
    const recentData = data.slice(-6); // Last 6 months
    const xValues = recentData.map((_, index) => index);
    const yValues = recentData.map(d => d.projectedNetFlow ?? d.netCashFlow);

    const n = recentData.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendStrength = Math.max(-1, Math.min(1, slope / 1000)); // Normalize

    // Calculate volatility
    const mean = sumY / n;
    const variance = yValues.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / n;
    const volatility = Math.min(1, Math.sqrt(variance) / Math.abs(mean || 1));

    let trend: 'improving' | 'declining' | 'stable';
    let analysis: string;

    if (Math.abs(trendStrength) < 0.1) {
      trend = 'stable';
      analysis = 'Cash flow remains relatively stable with minimal trend changes.';
    } else if (trendStrength > 0) {
      trend = 'improving';
      analysis = 'Cash flow shows an improving trend with increasing net positive flow.';
    } else {
      trend = 'declining';
      analysis = 'Cash flow shows a declining trend. Consider reviewing expenses and income sources.';
    }

    return { trend, trendStrength, volatility, analysis };
  }
}

export default CashFlowUtils;
