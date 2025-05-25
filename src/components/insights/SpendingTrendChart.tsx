// src/components/insights/SpendingTrendChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { BarChart3, Info } from "lucide-react" // Added Info icon

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
} from "@/components/ui/chart"

interface TrendDataPoint {
  month: string;
  totalSpending: number;
}

// No mock data generation function here

const chartConfig = {
  totalSpending: {
    label: "Total Spending",
    color: "hsl(var(--primary))", // Use primary color (Teal)
  },
} satisfies ChartConfig

export function SpendingTrendChart() {
  // Initialize with an empty array. Data should be fetched or passed as props in a real app.
  const [trendData, setTrendData] = React.useState<TrendDataPoint[]>([]);

  // In a real application, useEffect would be used to fetch data.
  // For now, it remains empty, and the chart will show a "No data" state.

  return (
    <Card className="shadow-lg min-h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Monthly Spending Trend
        </CardTitle>
        <CardDescription>Last 6 Months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-[300px] w-full">
        {trendData.length === 0 ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending trend data available.</p>
            <p className="text-sm">Data will appear here as you track expenses over time.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toLocaleString('en-US', {})}k`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                 />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <Bar dataKey="totalSpending" fill="var(--color-totalSpending)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {trendData.length > 0 ? (
          <p>This chart shows your total spending for available months.</p>
        ) : (
          <p>Track your expenses to see monthly trends.</p>
        )}
      </CardFooter>
    </Card>
  )
}
