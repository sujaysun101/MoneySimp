// src/components/insights/SpendingBreakdownChart.tsx
"use client"

import * as React from "react"
import { PieChart as PieChartIcon, Info, type LucideIcon, MoreVertical, Download, Printer } from "lucide-react" 
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts"
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";

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
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface SpendingDataPoint {
  category: string;
  amount: number;
  fill: string;
  icon?: LucideIcon;
}

interface SpendingBreakdownChartProps {
  data: SpendingDataPoint[];
  title?: string; // Optional title prop
  description?: string; // Optional description prop
}

export function SpendingBreakdownChart({ 
  data, 
  title = "Spending Breakdown", 
  description = "By Category" 
}: SpendingBreakdownChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    return data.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
        icon: item.icon || PieChartIcon,
      };
      return acc;
    }, {} as ChartConfig);
  }, [data]);

  const totalAmount = React.useMemo(() => {
    if (!data) return 0;
    return data.reduce((acc, curr) => acc + curr.amount, 0)
  }, [data])

  const handleDownloadPNG = () => {
    if (chartRef.current) {
      toast({ title: "Preparing Download...", description: "Your chart image is being generated." });
      html2canvas(chartRef.current, { 
        backgroundColor: "hsl(var(--card))", // Use card background for better image
        scale: 2, // Increase scale for better resolution
        useCORS: true, // If you ever use external images in charts
      }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_chart.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download Started", description: "Chart image download has started." });
      }).catch(err => {
        console.error("Error generating chart image:", err);
        toast({ variant: "destructive", title: "Download Failed", description: "Could not generate chart image." });
      });
    }
  };

  const handlePrintChart = () => {
    if (chartRef.current) {
      const printElement = chartRef.current;
      const originalId = printElement.id;
      const dropdownMenu = printElement.querySelector('.chart-actions-menu');
      
      printElement.id = 'print-target';
      if(dropdownMenu) dropdownMenu.classList.add('no-print');

      window.onafterprint = () => {
        printElement.id = originalId;
        if(dropdownMenu) dropdownMenu.classList.remove('no-print');
        window.onafterprint = null; 
      };
      window.print();
    }
  };
  
  const hasData = data && data.length > 0;

  return (
    <Card className="flex flex-col shadow-lg min-h-[450px] h-full" ref={chartRef}>
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {hasData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="chart-actions-menu h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Chart actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={handleDownloadPNG}>
                    <Download className="mr-2 h-4 w-4" />
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handlePrintChart}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Chart
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-0">
        {!hasData ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No spending data available.</p>
            <p className="text-sm">Add expenses to see your breakdown.</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[300px] w-full h-full"
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
                  nameKey="category"
                  innerRadius={60}
                  strokeWidth={2}
                  labelLine={false}
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
        {hasData && (
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
