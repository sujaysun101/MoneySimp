// src/components/insights/SpendingTrendChart.tsx
"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { BarChart3 } from "lucide-react"
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

// Mock data for monthly spending trends
const mockTrendData = [
  { month: "Jan", totalSpending: Math.floor(Math.random() * 2000) + 500 },
  { month: "Feb", totalSpending: Math.floor(Math.random() * 2000) + 500 },
  { month: "Mar", totalSpending: Math.floor(Math.random() * 2000) + 500 },
  { month: "Apr", totalSpending: Math.floor(Math.random() * 2000) + 500 },
  { month: "May", totalSpending: Math.floor(Math.random() * 2000) + 500 },
  { month: "Jun", totalSpending: Math.floor(Math.random() * 2000) + 500 },
]

const chartConfig = {
  totalSpending: {
    label: "Total Spending",
    color: "hsl(var(--primary))", // Use primary color (Teal)
  },
} satisfies ChartConfig

export function SpendingTrendChart() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Monthly Spending Trend
        </CardTitle>
        <CardDescription>Last 6 Months (Mock Data)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockTrendData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                tickFormatter={(value) => `$${value / 1000}k`}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
               />
              <Tooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <Bar dataKey="totalSpending" fill="var(--color-totalSpending)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <p>This chart shows your total spending for each of the last 6 months.</p>
      </CardFooter>
    </Card>
  )
}
