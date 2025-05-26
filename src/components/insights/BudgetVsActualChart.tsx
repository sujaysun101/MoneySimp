// src/components/insights/BudgetVsActualChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LabelList } from "recharts"
import { Target, TrendingDown, TrendingUp, Info, type LucideIcon } from "lucide-react" 

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { CATEGORIES } from "@/lib/constants"

export interface BudgetActualDataPoint {
  categoryName: string;
  categoryIcon?: LucideIcon;
  budgetAmount: number;
  actualAmount: number;
  fillBudget: string;
  fillActual: string;
}

interface BudgetVsActualChartProps {
  data: BudgetActualDataPoint[];
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    
    const config: ChartConfig = {
        budgetAmount: {
            label: "Budgeted",
            color: "hsl(var(--chart-2))", // A neutral or planned color
            icon: Target,
        },
        actualAmount: {
            label: "Actual Spent",
            color: "hsl(var(--chart-1))", // A color for actual spending
            icon: TrendingUp, // or TrendingDown if actual < budget
        },
    };

    // Add category-specific icons if needed, though Recharts may not directly use them in legend items.
    // data.forEach(item => {
    //   if (item.categoryIcon) {
    //     config[item.categoryName] = { // This is more for if categories were series, not X-axis labels
    //       label: item.categoryName,
    //       icon: item.categoryIcon,
    //       color: item.fillActual, // Or a default color
    //     };
    //   }
    // });
    return config;
  }, []);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const categoryData = data.find(d => d.categoryName === label);
      const CategoryIcon = categoryData?.categoryIcon || Info;
      
      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg">
          <div className="flex items-center mb-1">
            <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="font-semibold text-foreground">{label}</p>
          </div>
          {payload.map((entry: any) => (
            <p key={entry.name} style={{ color: entry.color }} className="text-sm">
              {`${entry.name === 'budgetAmount' ? 'Budgeted' : 'Actual Spent'}: $${entry.value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
            </p>
          ))}
           {categoryData && categoryData.budgetAmount > 0 && (
            <p className={`text-xs mt-1 ${categoryData.actualAmount > categoryData.budgetAmount ? 'text-destructive' : 'text-green-600'}`}>
              {categoryData.actualAmount > categoryData.budgetAmount 
                ? `Over budget by $${(categoryData.actualAmount - categoryData.budgetAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                : `Under budget by $${(categoryData.budgetAmount - categoryData.actualAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
              }
            </p>
          )}
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg min-h-[450px]">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Target className="h-5 w-5 mr-2 text-primary" />
          Budget vs. Actual Spending (Current Month)
        </CardTitle>
        <CardDescription>Comparison of budgeted amounts to actual spending for the current month.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-[300px] w-full">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No budget data available or no spending this month.</p>
            <p className="text-sm">Set budgets and track expenses to see this chart.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} accessibilityLayer margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="categoryName"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={60} // Adjust height to accommodate rotated labels
                  interval={0} // Show all labels
                  tick={({ x, y, payload }) => {
                    const category = CATEGORIES.find(cat => cat.name === payload.value);
                    const Icon = category?.icon || Info;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={16} textAnchor="end" fill="hsl(var(--muted-foreground))" transform="rotate(-35)">
                          {payload.value}
                        </text>
                        <Icon x={-5} y={-22} className="h-4 w-4 text-muted-foreground" transform="rotate(-35)" />
                      </g>
                    );
                  }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString('en-US', {})}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80} 
                 />
                <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }} 
                />
                <Legend content={<ChartLegendContent nameKey="name" />} verticalAlign="top" />
                <Bar dataKey="budgetAmount" name="Budgeted" fill="var(--color-budgetAmount)" radius={[4, 4, 0, 0]} barSize={20}>
                   <LabelList dataKey="budgetAmount" position="top" formatter={(value: number) => `$${value.toLocaleString()}`} className="text-xs fill-muted-foreground" />
                </Bar>
                <Bar dataKey="actualAmount" name="Actual Spent" fill="var(--color-actualAmount)" radius={[4, 4, 0, 0]} barSize={20}>
                   <LabelList dataKey="actualAmount" position="top" formatter={(value: number) => `$${value.toLocaleString()}`} className="text-xs fill-muted-foreground" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {data && data.length > 0 ? (
          <p>Compares budgeted vs. actual spending for categories with set budgets for the current month.</p>
        ) : (
          <p>Set budgets and add expenses to compare your spending.</p>
        )}
      </CardFooter>
    </Card>
  )
}
