// src/app/insights/page.tsx
import { SpendingBreakdownChart } from '@/components/insights/SpendingBreakdownChart';
import { SpendingTrendChart } from '@/components/insights/SpendingTrendChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InsightsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Spending Insights</h1>
        <p className="text-muted-foreground">Understand your financial habits with visual data.</p>
      </div>

      {/* Removed the demo data alert */}

      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        <SpendingBreakdownChart />
        <SpendingTrendChart />
      </div>

      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>More Insights Coming Soon!</CardTitle>
          <CardDescription>We're working on adding more detailed analytics to help you manage your finances better.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Future insights could include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Comparison with previous periods (e.g., month-over-month).</li>
            <li>Spending by merchant or specific items.</li>
            <li>Savings rate and progress towards financial goals.</li>
            <li>Subscription tracking and management.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
