// src/components/insights/AverageCategorySpendingChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList } from "recharts"
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
  ChartTooltipContent,
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
      acc[item.categoryName] = { // Use categoryName as key for config
        label: item.categoryName,
        color: item.fill,
        icon: item.categoryIcon,
      };
      return acc;
    }, {} as ChartConfig);
  }, [data]);

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
          <p style={{ color: payload[0].fill }} className="text-sm">
            {`Avg. Monthly: $${payload[0].value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
          </p>
        </div>
      );
    }
    return null;
  };


  return (
    <Card className="shadow-lg min-h-[450px]">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <BarChartHorizontalBig className="h-5 w-5 mr-2 text-primary" />
          Average Monthly Spending
        </CardTitle>
        <CardDescription>Average spending per category across all recorded months.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-[300px] w-full">
        {(!data || data.length === 0) ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending data available to calculate averages.</p>
            <p className="text-sm">Track expenses over time to see this chart.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" accessibilityLayer margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="categoryName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={5}
                  width={100}
                  tick={({ x, y, payload }) => {
                    const categoryInfo = CATEGORIES.find(c => c.name === payload.value);
                    const IconComponent = categoryInfo?.icon || Info;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <foreignObject x={-95} y={-10} width="90" height="20">
                          <div className="flex items-center justify-end w-full text-xs text-muted-foreground truncate" title={payload.value}>
                            <span className="truncate mr-1">{payload.value}</span>
                            <IconComponent className="h-3 w-3 shrink-0" />
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
                <Bar dataKey="averageSpending" name="Average Spending" radius={[0, 4, 4, 0]} barSize={15}>
                   {data.map((entry, index) => (
                    <LabelList 
                      key={`label-${index}`}
                      dataKey="averageSpending" 
                      position="right" 
                      formatter={(value: number) => `$${value.toLocaleString(undefined, {minimumFractionDigits:0, maximumFractionDigits: 0})}`} 
                      className="text-xs fill-muted-foreground" 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {data && data.length > 0 ? (
          <p>Shows the average monthly spending for each category based on your expense history.</p>
        ) : (
          <p>Track your expenses over several months to see average spending patterns.</p>
        )}
      </CardFooter>
    </Card>
  )
}
