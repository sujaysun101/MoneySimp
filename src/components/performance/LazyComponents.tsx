// src/components/performance/LazyComponents.tsx
import { lazy, Suspense, Component, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Error Boundary for Lazy Components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-red-500">
          Failed to load component. Please refresh the page.
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Skeletons
export const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-[200px] w-full" />
    <div className="flex space-x-2">
      <Skeleton className="h-4 w-[100px]" />
      <Skeleton className="h-4 w-[100px]" />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-full" />
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-[100px]" />
      <Skeleton className="h-10 w-[100px]" />
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4 border rounded">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-4 w-[100px]" />
      </div>
    ))}
  </div>
);

// Lazy Components with proper loading states
export const LazySpendingTrendChart = lazy(() => 
  import('@/components/insights/SpendingTrendChart').then(module => ({
    default: module.SpendingTrendChart
  }))
);

export const LazySpendingBreakdownChart = lazy(() => 
  import('@/components/insights/SpendingBreakdownChart').then(module => ({
    default: module.SpendingBreakdownChart
  }))
);

export const LazyBudgetVsActualChart = lazy(() => 
  import('@/components/insights/BudgetVsActualChart').then(module => ({
    default: module.BudgetVsActualChart
  }))
);

export const LazyAverageCategorySpendingChart = lazy(() => 
  import('@/components/insights/AverageCategorySpendingChart').then(module => ({
    default: module.AverageCategorySpendingChart
  }))
);

export const LazyExpenseForm = lazy(() => 
  import('@/components/expenses/ExpenseForm').then(module => ({
    default: module.ExpenseForm
  }))
);

export const LazyBudgetForm = lazy(() => 
  import('@/components/budgets/BudgetForm').then(module => ({
    default: module.BudgetForm
  }))
);

export const LazySubscriptionForm = lazy(() => 
  import('@/components/subscriptions/SubscriptionForm').then(module => ({
    default: module.SubscriptionForm
  }))
);

export const LazyBillUploadForm = lazy(() => 
  import('@/components/expenses/BillUploadForm').then(module => ({
    default: module.BillUploadForm
  }))
);

export const LazyCancellationHelper = lazy(() => 
  import('@/components/subscriptions/CancellationHelper').then(module => ({
    default: module.CancellationHelper
  }))
);

// Wrapper component with error boundary and loading state
interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

export const LazyWrapper = ({ 
  children, 
  fallback = <ChartSkeleton />, 
  errorFallback 
}: LazyWrapperProps) => (
  <LazyErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  </LazyErrorBoundary>
);

// Pre-configured lazy components with appropriate loading states
export const LazyChartComponent = ({ children }: { children: ReactNode }) => (
  <LazyWrapper fallback={<ChartSkeleton />}>
    {children}
  </LazyWrapper>
);

export const LazyFormComponent = ({ children }: { children: ReactNode }) => (
  <LazyWrapper fallback={<FormSkeleton />}>
    {children}
  </LazyWrapper>
);

export const LazyListComponent = ({ children }: { children: ReactNode }) => (
  <LazyWrapper fallback={<ListSkeleton />}>
    {children}
  </LazyWrapper>
);
