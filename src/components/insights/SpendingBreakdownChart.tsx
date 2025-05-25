// src/components/insights/SpendingBreakdownChart.tsx
"use client"

import * as React from "react"
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { CATEGORIES } from "@/lib/constants"

interface SpendingDataPoint {
  category: string;
  amount: number;
  fill: string;
}

// Mock data - in a real app, this would come from user's expenses
const mockSpendingData: SpendingDataPoint[] = CATEGORIES.slice(0, 5).map((cat, index) => ({
  category: cat.name,
  amount: Math.floor(Math.random() * 500) + 50, // Random amount between 50 and 550
  fill: `hsl(var(--chart-${(index % 5) + 1}))`,
}));

const chartConfig = mockSpendingData.reduce((acc, item) => {
  const categoryDetails = CATEGORIES.find(c => c.name === item.category);
  acc[item.category] = {
    label: item.category,
    color: item.fill,
    icon: categoryDetails?.icon,
  };
  return acc;
}, {} as ChartConfig);


export function SpendingBreakdownChart() {
  const totalAmount = React.useMemo(() => {
    return mockSpendingData.reduce((acc, curr) => acc + curr.amount, 0)
  }, [])

  return (
    <Card className="flex flex-col shadow-lg">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center text-lg">
          <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
          Spending Breakdown
        </CardTitle>
        <CardDescription>By Category - This Month (Mock Data)</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel nameKey="category" />}
              />
              <Pie
                data={mockSpendingData}
                dataKey="amount"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                {mockSpendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        <div className="flex items-center gap-2 font-medium leading-none">
          Total spent this month: ${totalAmount.toFixed(2)}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top 5 spending categories.
        </div>
      </CardFooter>
    </Card>
  )
}
