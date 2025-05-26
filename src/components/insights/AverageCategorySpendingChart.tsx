// src/components/insights/AverageCategorySpendingChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts"
import { BarChartHorizontalBig, Info, type LucideIcon, MoreVertical, Download, Printer } from "lucide-react" 
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
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

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
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const titleString = "Average Monthly Spending"; 

  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    return data.reduce((acc, item) => {
      acc[item.categoryName] = { 
        label: item.categoryName,
        color: item.fill,
        icon: item.categoryIcon || BarChartHorizontalBig,
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
      return;
    }
    console.log("handlePrintChart: Chart element found", chartRef.current);

    const printElement = chartRef.current;
    const originalId = printElement.id; 
    const dropdownMenu = printElement.querySelector('.chart-actions-menu'); 

    if (dropdownMenu) {
      console.log("handlePrintChart: Dropdown menu found");
    } else {
      console.warn("handlePrintChart: Dropdown menu NOT found. Printing may include it.");
    }
    
    printElement.id = 'print-target';
    if(dropdownMenu) dropdownMenu.classList.add('no-print');
    console.log("handlePrintChart: Set ID to 'print-target' and added 'no-print' class.");

    window.onafterprint = () => {
      console.log("handlePrintChart: window.onafterprint called.");
      if (originalId) {
        printElement.id = originalId;
      } else {
        printElement.removeAttribute('id'); 
      }
      if(dropdownMenu) dropdownMenu.classList.remove('no-print');
      window.onafterprint = null; 
      console.log("handlePrintChart: Cleaned up after print.");
    };

    console.log("handlePrintChart: Calling window.print()...");
    try {
      window.print(); 
      console.log("handlePrintChart: window.print() called successfully (dialog should be open or closed).");
    } catch (e) {
      console.error("handlePrintChart: Error calling window.print()", e);
      toast({ variant: "destructive", title: "Print Error", description: "Could not initiate printing." });
      // Perform cleanup here as well in case onafterprint doesn't fire
      if (originalId) {
        printElement.id = originalId;
      } else {
        printElement.removeAttribute('id');
      }
      if(dropdownMenu) dropdownMenu.classList.remove('no-print');
      window.onafterprint = null;
    }
  };

  const hasData = data && data.length > 0;

  return (
    <Card className="shadow-lg min-h-[450px] h-full flex flex-col" ref={chartRef}>
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <BarChartHorizontalBig className="h-5 w-5 mr-2 text-primary" />
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
        <CardDescription>Average spending per category across all recorded months.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-full w-full">
        {!hasData ? (
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
                  width={110} 
                  tick={({ x, y, payload }) => {
                    const categoryInfo = data.find(d => d.categoryName === payload.value);
                    const IconComponent = categoryInfo?.categoryIcon || Info;
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <foreignObject x={-105} y={-10} width="100" height="20"> 
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
                      className="text-xs fill-foreground" 
                    />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {hasData ? (
          <p>Shows average monthly spending based on your expense history.</p>
        ) : (
          <p>Track expenses over several months to see average spending patterns.</p>
        )}
      </CardFooter>
    </Card>
  )
}
