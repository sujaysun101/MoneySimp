// src/components/insights/SpendingBreakdownChart.tsx
"use client"

import * as React from "react"
import { PieChart as PieChartIcon, Info, type LucideIcon, MoreVertical, Download, Printer, Cell as RechartsCell } from "lucide-react" 
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
  title?: string; 
  description?: string; 
}

export function SpendingBreakdownChart({ 
  data, 
  title = "Spending Breakdown", 
  description = "By Category" 
}: SpendingBreakdownChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const titleString = title; 

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
    if (!chartRef.current) {
      toast({ variant: "destructive", title: "Download Failed", description: "Chart element not found." });
      return;
    }
    toast({ title: "Preparing Download...", description: "Your chart image is being generated." });
    try {
      html2canvas(chartRef.current, { 
        backgroundColor: 'white', 
        scale: 2, 
        useCORS: true, 
      }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `${titleString.toLowerCase().replace(/\s+/g, '_')}_chart.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Download Started", description: "Chart image download has started." });
      }).catch(err => {
        console.error("Error generating chart image with html2canvas:", err);
        toast({ variant: "destructive", title: "Download Failed", description: "Could not generate chart image." });
      });
    } catch (error) {
        console.error("Error in handleDownloadPNG:", error);
        toast({ variant: "destructive", title: "Download Error", description: "An unexpected error occurred." });
    }
  };

  const handlePrintChart = () => {
    if (!chartRef.current) {
      toast({ variant: "destructive", title: "Print Failed", description: "Chart element not found." });
      console.error("handlePrintChart: chartRef.current is null or undefined at the beginning.");
      return;
    }

    const printElement = chartRef.current;
    let originalId: string | undefined = undefined;
    let dropdownMenu: Element | null = null;

    try {
      console.log("handlePrintChart: Starting print setup. Element:", printElement);
      originalId = printElement.id; 
      dropdownMenu = printElement.querySelector('.chart-actions-menu');

      printElement.id = 'print-target'; 
      if (dropdownMenu) {
        dropdownMenu.classList.add('no-print'); 
        console.log("handlePrintChart: Added 'no-print' to dropdown menu.");
      } else {
        console.warn("handlePrintChart: Dropdown menu '.chart-actions-menu' not found inside printElement.");
      }

      window.onafterprint = () => {
        console.log("handlePrintChart: 'onafterprint' event triggered.");
        if (printElement) { 
          if (originalId) {
            printElement.id = originalId;
          } else {
            printElement.removeAttribute('id');
          }
          if (dropdownMenu) {
            dropdownMenu.classList.remove('no-print');
          }
          console.log("handlePrintChart: Cleanup finished.");
        } else {
          console.warn("handlePrintChart: 'onafterprint' - printElement is no longer valid.");
        }
        window.onafterprint = null; 
      };

      console.log("handlePrintChart: Calling window.print()...");
      window.print(); 
      console.log("handlePrintChart: window.print() called successfully (dialog should be open or closed by now).");

    } catch (error) {
      console.error("handlePrintChart: Error during print setup or call:", error);
      toast({ variant: "destructive", title: "Print Error", description: "An error occurred while preparing to print." });
      
      if (printElement) {
        if (originalId !== undefined) { // Check if originalId was actually stored
            printElement.id = originalId;
        } else {
            printElement.removeAttribute('id');
        }
        if (dropdownMenu) {
            dropdownMenu.classList.remove('no-print');
        }
      }
      window.onafterprint = null; 
    }
  };
  
  const hasData = data && data.length > 0;

  return (
    <Card className="flex flex-col shadow-lg min-h-[450px] h-full" ref={chartRef}>
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
                <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                <CardTitle className="text-lg">{titleString}</CardTitle>
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
                  <DropdownMenuItem onSelect={handleDownloadPNG} disabled={!hasData}>
                    <Download className="mr-2 h-4 w-4" />
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handlePrintChart} disabled={!hasData}>
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
