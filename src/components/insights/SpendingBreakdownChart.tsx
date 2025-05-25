// src/components/insights/SpendingBreakdownChart.tsx
"use client"

import * as React from "react"
import { PieChart as PieChartIcon, Info } from "lucide-react" // Added Info icon
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

// No mock data generation function here

export function SpendingBreakdownChart() {
  // Initialize with an empty array. Data should be fetched or passed as props in a real app.
  const [spendingData, setSpendingData] = React.useState<SpendingDataPoint[]>([]);

  // In a real application, useEffect would be used to fetch data.
  // For now, it remains empty, and the chart will show a "No data" state.

  const chartConfig = React.useMemo(() => {
    if (spendingData.length === 0) return {} as ChartConfig;
    return spendingData.reduce((acc, item) => {
      const categoryDetails = CATEGORIES.find(c => c.name === item.category);
      acc[item.category] = {
        label: item.category,
        color: item.fill,
        icon: categoryDetails?.icon,
      };
      return acc;
    }, {} as ChartConfig);
  }, [spendingData]);

  const totalAmount = React.useMemo(() => {
    return spendingData.reduce((acc, curr) => acc + curr.amount, 0)
  }, [spendingData])

  return (
    <Card className="flex flex-col shadow-lg min-h-[400px]">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center text-lg">
          <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
          Spending Breakdown
        </CardTitle>
        <CardDescription>By Category - This Month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-0">
        {spendingData.length === 0 ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending data available.</p>
            <p className="text-sm">Add expenses to see your breakdown.</p>
          </div>
        ) : (
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
                  data={spendingData}
                  dataKey="amount"
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        {spendingData.length > 0 && (
          <>
            <div className="flex items-center gap-2 font-medium leading-none">
              Total spent this month: {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            <div className="leading-none text-muted-foreground">
              Showing breakdown of your spending categories.
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
