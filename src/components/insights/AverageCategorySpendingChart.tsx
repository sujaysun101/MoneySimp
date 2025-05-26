
// src/components/insights/AverageCategorySpendingChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts" // Added Cell
import { BarChartHorizontalBig, Info, type LucideIcon } from "lucide-react" 

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
  // ChartTooltipContent, // Using custom tooltip
} from "@/components/ui/chart"
import { CATEGORIES } from "@/lib/constants"

export interface AverageSpendingDataPoint {
  categoryName: string;
  averageSpending: number;
  categoryIcon?: LucideIcon;
  fill: string;
}

interface AverageCategorySpendingChartProps {
  data: AverageSpendingDataPoint[];
}

export function AverageCategorySpendingChart({ data }: AverageCategorySpendingChartProps) {
  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    return data.reduce((acc, item) => {
      acc[item.categoryName] = { 
        label: item.categoryName,
        color: item.fill,
        icon: item.categoryIcon || BarChartHorizontalBig, // Default icon
      };
      return acc;
    }, {} as ChartConfig);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const categoryData = data.find(d => d.categoryName === label);
      const CategoryIcon = categoryData?.categoryIcon || Info;
      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg text-sm">
          <div className="flex items-center mb-1">
            <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="font-semibold text-foreground">{label}</p>
          </div>
          <p style={{ color: payload[0].payload.fill }} className="text-sm">
            {`Avg. Monthly: $${payload[0].value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          </p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg min-h-[450px] h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChartHorizontalBig className="h-5 w-5 mr-2 text-primary" />
          Average Monthly Spending
        </CardTitle>
        <CardDescription>Average spending per category across all recorded months.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-full w-full">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending data available to calculate averages.</p>
            <p className="text-sm">Track expenses over time to see this chart.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="categoryName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={5}
                  width={110} // Adjusted width for icon + text
                  tick={({ x, y, payload }) => {
                    const categoryInfo = data.find(d => d.categoryName === payload.value);
                    const IconComponent = categoryInfo?.categoryIcon || Info;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <foreignObject x={-105} y={-10} width="100" height="20"> {/* Adjusted x for space */}
                          <div className="flex items-center justify-end w-full text-xs text-muted-foreground truncate" title={payload.value}>
                            <span className="truncate mr-1.5">{payload.value}</span>
                            <IconComponent className="h-3.5 w-3.5 shrink-0" style={{color: categoryInfo?.fill}} />
                          </div>
                        </foreignObject>
                      </g>
                    );
                  }}
                />
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }} 
                    content={<CustomTooltip />} 
                />
                <Bar dataKey="averageSpending" name="Average Spending" radius={[0, 4, 4, 0]} barSize={12}>
                   {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                   <LabelList 
                      dataKey="averageSpending" 
                      position="right" 
                      formatter={(value: number) => value > 0 ?`$${value.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits: 0})}` : ''} 
                      className="text-xs fill-foreground" // Changed to foreground for better visibility
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {data && data.length > 0 ? (
          <p>Shows average monthly spending based on your expense history.</p>
        ) : (
          <p>Track expenses over several months to see average spending patterns.</p>
        )}
      </CardFooter>
    </Card>
  )
}
