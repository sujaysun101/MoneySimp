// src/components/insights/SpendingTrendChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { BarChart3, Info, MoreVertical, Download, Printer } from "lucide-react" 
import html2canvas from 'html2canvas';
import { useToast } from "@/hooks/use-toast";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const titleString = "Monthly Spending Trend"; 

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
        if (originalId !== undefined) { 
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
    <Card className="shadow-lg min-h-[450px] h-full flex flex-col" ref={chartRef}>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary" />
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
        <CardDescription>Last 6 Months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-full w-full">
        {!hasData ? (
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
                    cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }} 
                    content={<ChartTooltipContent indicator="dot" />} 
                />
                <Bar dataKey="totalSpending" fill="var(--color-totalSpending)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {hasData ? (
          <p>This chart shows your total spending for the last 6 months.</p>
        ) : (
          <p>Track your expenses to see monthly trends.</p>
        )}
      </CardFooter>
    </Card>
  )
}
