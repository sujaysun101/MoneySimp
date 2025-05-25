// src/components/shared/AIFinanceTipCard.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { getPersonalizedFinanceTip } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

interface AIFinanceTipCardProps {
  // In a real app, you might pass actual summarized spending habits here
  // For now, we'll use a mock string or a summary of mock expenses
  mockSpendingSummary?: string; 
}

export function AIFinanceTipCard({ mockSpendingSummary }: AIFinanceTipCardProps) {
  const [tip, setTip] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTip = useCallback(async () => {
    setIsLoading(true);
    const spendingHabits = mockSpendingSummary || "User is looking for general finance tips.";
    try {
      const result = await getPersonalizedFinanceTip(spendingHabits);
      setTip(result.tip);
    } catch (error) {
      console.error("Failed to fetch finance tip:", error);
      setTip("Sorry, we couldn't fetch a tip right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [mockSpendingSummary]);

  useEffect(() => {
    fetchTip();
  }, [fetchTip]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <Lightbulb className="mr-2 h-6 w-6 text-accent" />
          Smart Money Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{tip}</p>
        )}
        <Button onClick={fetchTip} disabled={isLoading} variant="outline" size="sm" className="mt-4 group">
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'group-hover:animate-spin-once'}`} />
          {isLoading ? 'Getting New Tip...' : 'Get New Tip'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper for one-time spin animation (add to globals.css or a utility CSS file)
// @keyframes spin-once { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
// .animate-spin-once { animation: spin-once 0.5s linear 1; }
// For simplicity, I'm using animate-spin on hover only
