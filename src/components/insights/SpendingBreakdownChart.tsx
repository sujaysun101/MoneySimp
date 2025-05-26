
// src/components/insights/SpendingBreakdownChart.tsx
"use client"

import * as React from "react"
import { PieChart as PieChartIcon, Info, type LucideIcon } from "lucide-react" 
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts"

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
  ChartLegendContent, // Updated import
} from "@/components/ui/chart"

export interface SpendingDataPoint {
  category: string;
  amount: number;
  fill: string;
  icon?: LucideIcon;
}

interface SpendingBreakdownChartProps {
  data: SpendingDataPoint[];
}

export function SpendingBreakdownChart({ data }: SpendingBreakdownChartProps) {
  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    return data.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
        icon: item.icon || PieChartIcon, // Provide a default icon if undefined
      };
      return acc;
    }, {} as ChartConfig);
  }, [data]);

  const totalAmount = React.useMemo(() => {
    if (!data) return 0;
    return data.reduce((acc, curr) => acc + curr.amount, 0)
  }, [data])

  return (
    <Card className="flex flex-col shadow-lg min-h-[450px] h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center text-lg">
          <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
          Spending Breakdown
        </CardTitle>
        <CardDescription>By Category</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-0">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending data available.</p>
            <p className="text-sm">Add expenses to see your breakdown.</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] w-full h-full" // Ensure ChartContainer takes full height
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="category" />}
                />
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category" // Used by ChartTooltipContent and Legend
                  innerRadius={60}
                  strokeWidth={2} // Reduced stroke width for potentially more segments
                  labelLine={false}
                  // label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, category }) => {
                  //   const RADIAN = Math.PI / 180;
                  //   const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  //   const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  //   const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  //   return (
                  //     <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
                  //       {`${(percent * 100).toFixed(0)}%`}
                  //     </text>
                  //   );
                  // }}
                >
                  {data.map((entry) => (
                    <Cell key={`cell-${entry.category}`} fill={entry.fill} name={entry.category} />
                  ))}
                </Pie>
                 <Legend content={<ChartLegendContent nameKey="category"/>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        {data && data.length > 0 && (
          <>
            <div className="flex items-center gap-2 font-medium leading-none">
              Total spent: {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
            <div className="leading-none text-muted-foreground text-center">
              Showing breakdown of your spending categories.
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
