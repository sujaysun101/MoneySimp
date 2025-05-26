// src/components/insights/SpendingTrendChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { BarChart3, Info } from "lucide-react" 

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

export interface TrendDataPoint {
  month: string;
  totalSpending: number;
}

interface SpendingTrendChartProps {
  data: TrendDataPoint[];
}

const chartConfig = {
  totalSpending: {
    label: "Total Spending",
    color: "hsl(var(--primary))", 
  },
} satisfies ChartConfig

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <Card className="shadow-lg min-h-[450px]"> {/* Increased min-height */}
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChart3 className="h-5 w-5 mr-2 text-primary" />
          Monthly Spending Trend
        </CardTitle>
        <CardDescription>Last 6 Months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-[300px] w-full">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending trend data available.</p>
            <p className="text-sm">Data will appear here as you track expenses over time.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} accessibilityLayer margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${value.toLocaleString('en-US', {})}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  width={80} 
                 />
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} 
                    content={<ChartTooltipContent indicator="dot" />} 
                />
                <Bar dataKey="totalSpending" fill="var(--color-totalSpending)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {data && data.length > 0 ? (
          <p>This chart shows your total spending for the last 6 months.</p>
        ) : (
          <p>Track your expenses to see monthly trends.</p>
        )}
      </CardFooter>
    </Card>
  )
}
