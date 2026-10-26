// src/components/insights/CashFlowChart.tsx
"use client";

import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info,
  DollarSign,
  Calendar,
  BarChart3
} from 'lucide-react';

import type { CashFlowDataPoint, CashFlowForecast } from '@/lib/types';

interface CashFlowChartProps {
  forecast: CashFlowForecast;
  showProjections?: boolean;
  className?: string;
}

export function CashFlowChart({ 
  forecast, 
  showProjections = true, 
  className 
}: CashFlowChartProps) {
  const chartData = useMemo(() => {
    return forecast.data.map(dataPoint => ({
      ...dataPoint,
      displayMonth: `${dataPoint.month} ${dataPoint.year.toString().slice(-2)}`,
      actualNetFlow: dataPoint.netCashFlow,
      projectedNetFlow: dataPoint.projectedNetFlow || null,
      isProjected: dataPoint.projectedNetFlow !== undefined,
      barColor: (dataPoint.projectedNetFlow ?? dataPoint.netCashFlow) < 0 
        ? 'hsl(var(--destructive))' 
        : 'hsl(var(--primary))'
    }));
  }, [forecast.data]);

  const negativeMonths = chartData.filter(d => 
    (d.actualNetFlow < 0) || (d.projectedNetFlow && d.projectedNetFlow < 0)
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProjected = data.isProjected;
      const netFlow = isProjected ? data.projectedNetFlow : data.actualNetFlow;
      const income = isProjected ? data.projectedIncome : data.income;
      const expenses = isProjected ? data.projectedExpenses : data.expenses;

      return (
        <div className="p-3 bg-background border border-border rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            <p className="font-semibold">{label}</p>
            {isProjected && (
              <Badge variant="outline" className="text-xs">
                Projected
              </Badge>
            )}
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-600">Income:</span>
              <span className="font-medium">${income?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-600">Expenses:</span>
              <span className="font-medium">${expenses?.toLocaleString()}</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Net Flow:</span>
                <span className={`font-bold ${netFlow < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${netFlow?.toLocaleString()}
                </span>
              </div>
            </div>
            
            {data.cumulativeCashFlow !== undefined && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Cumulative:</span>
                <span>${data.cumulativeCashFlow.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxisValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    return `$${value}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cash Flow Forecast
            </CardTitle>
            <CardDescription>
              Monthly net cash flow with {forecast.projectionMonths}-month projection
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {forecast.data.length} months
            </Badge>
            {forecast.summary.negativeMonths > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {forecast.summary.negativeMonths} negative
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
            <p className="text-2xl font-bold text-green-600">
              ${forecast.summary.averageMonthlyIncome.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              ${forecast.summary.averageMonthlyExpenses.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Net Cash Flow</p>
            <p className={`text-2xl font-bold ${forecast.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${forecast.summary.netCashFlow.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="displayMonth" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={formatYAxisValue}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Zero line reference */}
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                
                {/* Net Cash Flow Bars */}
                <Bar 
                  dataKey="actualNetFlow" 
                  fill="hsl(var(--primary))"
                  name="Actual Net Flow"
                  radius={[2, 2, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.actualNetFlow < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                    />
                  ))}
                </Bar>

                {/* Projected Net Flow Bars */}
                {showProjections && (
                  <Bar 
                    dataKey="projectedNetFlow" 
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="Projected Net Flow"
                    radius={[2, 2, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`proj-cell-${index}`} 
                        fill={entry.projectedNetFlow && entry.projectedNetFlow < 0 
                          ? 'hsl(var(--destructive))' 
                          : 'hsl(var(--primary))'
                        }
                        fillOpacity={0.6}
                      />
                    ))}
                  </Bar>
                )}

                {/* Cumulative Cash Flow Line */}
                <Line
                  type="monotone"
                  dataKey="cumulativeCashFlow"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Cumulative Flow"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>No cash flow data available</p>
                <p className="text-sm">Add income sources and expenses to see forecast</p>
              </div>
            </div>
          )}
        </div>

        {/* Negative Month Alerts */}
        {negativeMonths.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  {negativeMonths.length} months show negative cash flow:
                </p>
                <div className="flex flex-wrap gap-2">
                  {negativeMonths.slice(0, 6).map((month, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {month.displayMonth}: ${(month.projectedNetFlow ?? month.actualNetFlow).toLocaleString()}
                    </Badge>
                  ))}
                  {negativeMonths.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{negativeMonths.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {forecast.recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {forecast.recommendations.slice(0, 3).map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded" />
            <span>Positive Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded" />
            <span>Negative Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-primary rounded opacity-60" />
            <span>Projected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-chart-2" />
            <span>Cumulative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CashFlowChart;
