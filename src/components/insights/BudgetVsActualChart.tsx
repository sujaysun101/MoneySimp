// src/components/insights/BudgetVsActualChart.tsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LabelList } from "recharts"
import { Target, TrendingUp, Info, type LucideIcon, MoreVertical, Download, Printer } from "lucide-react" 
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"


export interface BudgetActualDataPoint {
  categoryName: string;
  categoryIcon?: LucideIcon; 
  budgetAmount: number;
  actualAmount: number;
  fillBudget: string;
  fillActual: string;
}

interface BudgetVsActualChartProps {
  data: BudgetActualDataPoint[];
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const titleString = "Budget vs. Actual Spending"; 

  const chartConfig = React.useMemo(() => {
    if (!data || data.length === 0) return {} as ChartConfig;
    
    const config: ChartConfig = {
        budgetAmount: {
            label: "Budgeted",
            color: "hsl(var(--chart-2))", 
            icon: Target,
        },
        actualAmount: {
            label: "Actual Spent",
            color: "hsl(var(--chart-1))", 
            icon: TrendingUp, 
        },
    };
    data.forEach(item => {
        if (!config[item.categoryName]) {
            config[item.categoryName] = {
                label: item.categoryName,
                color: item.fillActual, 
                icon: item.categoryIcon || Info,
            }
        }
    });
    return config;
  }, [data]);


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const categoryData = data.find(d => d.categoryName === label);
      const CategoryIcon = categoryData?.categoryIcon || Info;
      
      return (
        <div className="p-2 bg-background border border-border rounded-md shadow-lg text-sm">
          <div className="flex items-center mb-2">
            <CategoryIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="font-semibold text-foreground">{label}</p>
          </div>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex justify-between items-center">
                <span style={{ color: entry.color }} className="capitalize">
                {entry.name === 'budgetAmount' ? 'Budget:' : 'Spent:'}
                </span>
                <span style={{ color: entry.color }} className="font-medium ml-2">
                {`$${Number(entry.value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                </span>
            </div>
          ))}
           {categoryData && categoryData.budgetAmount > 0 && (
            <div className={`mt-2 pt-1 border-t border-border text-xs ${categoryData.actualAmount > categoryData.budgetAmount ? 'text-destructive' : 'text-green-600'}`}>
              {categoryData.actualAmount > categoryData.budgetAmount 
                ? `Over budget by $${(categoryData.actualAmount - categoryData.budgetAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                : `Under budget by $${(categoryData.budgetAmount - categoryData.actualAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
              }
            </div>
          )}
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
            <Target className="h-5 w-5 mr-2 text-primary" />
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
        <CardDescription>Current month comparison.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center h-full w-full">
        {!hasData ? (
          <div className="flex flex-col items-center text-center text-muted-foreground">
            <Info className="h-10 w-10 mb-3" />
            <p>No budget data available or no spending this month.</p>
            <p className="text-sm">Set budgets and track expenses to see this chart.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} accessibilityLayer margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="categoryName"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  angle={-35} 
                  textAnchor="end" 
                  height={60} 
                  interval={0} 
                />
                <YAxis
                  tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', {})}`}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={5}
                  width={70} 
                 />
                <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ fill: 'hsl(var(--muted)/0.3)', radius: 4 }} 
                />
                <Legend content={<ChartLegendContent nameKey="name" />} verticalAlign="top" align="center" wrapperStyle={{paddingBottom: '10px'}}/>
                <Bar dataKey="budgetAmount" name="Budgeted" fill="var(--color-budgetAmount)" radius={[4, 4, 0, 0]} barSize={15}>
                   <LabelList dataKey="budgetAmount" position="top" formatter={(value: number) => value > 0 ? `$${Number(value).toLocaleString(undefined, {maximumFractionDigits:0})}`: ''} className="text-xs fill-muted-foreground" />
                </Bar>
                <Bar dataKey="actualAmount" name="Actual Spent" fill="var(--color-actualAmount)" radius={[4, 4, 0, 0]} barSize={15}>
                   <LabelList dataKey="actualAmount" position="top" formatter={(value: number) => value > 0 ? `$${Number(value).toLocaleString(undefined, {maximumFractionDigits:0})}`: ''} className="text-xs fill-muted-foreground" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {hasData ? (
          <p>Compares budgeted vs. actual spending for the current month.</p>
        ) : (
          <p>Set budgets and add expenses to compare your spending.</p>
        )}
      </CardFooter>
    </Card>
  )
}
