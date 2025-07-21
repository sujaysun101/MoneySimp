// src/components/shared/AIFinanceTipCard.tsx
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, RefreshCw, TrendingUp, AlertTriangle, DollarSign, Target, Zap } from 'lucide-react';
import { getPersonalizedFinanceTip } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense, Subscription, Goal } from '@/lib/types';
import AIInsightsService, { SpendingInsight } from '@/lib/ai-insights';
// If SpendingInsight is a type you need, ensure it is exported from ai-insights.ts and import it like:
// import AIInsightsService, { SpendingInsight } from '@/lib/ai-insights';

interface AIFinanceTipCardProps {
  expenses?: Expense[];
  subscriptions?: Subscription[];
  goals?: Goal[];
  mockSpendingSummary?: string; 
  showInsights?: boolean;
  insightType?: 'general' | 'anomaly' | 'cost_cutting' | 'forecast' | 'subscription_optimization';
}

interface EnhancedTip {
  tip: string;
  tipType: 'general' | 'anomaly_alert' | 'cost_saving' | 'forecast_warning' | 'subscription_alert';
  priority: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  actionItems: string[];
  category?: string;
}

export function AIFinanceTipCard({ 
  expenses = [], 
  subscriptions = [], 
  goals = [],
  mockSpendingSummary,
  showInsights = true,
  insightType = 'general'
}: AIFinanceTipCardProps) {
  const [tip, setTip] = useState<EnhancedTip | null>(null);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeInsight, setActiveInsight] = useState<SpendingInsight | null>(null);

  const fetchEnhancedTip = useCallback(async () => {
    setIsLoading(true);
    try {
      if (expenses.length > 0) {
        // Get AI-powered tip with spending data
        const enhancedTip = await AIInsightsService.generatePersonalizedTip(
          expenses, 
          subscriptions, 
          goals,
          insightType
        );
        // Ensure enhancedTip matches EnhancedTip type
        if (
          enhancedTip &&
          typeof enhancedTip.tip === 'string' &&
          'tipType' in enhancedTip &&
          typeof (enhancedTip as any).tipType === 'string' &&
          'priority' in enhancedTip &&
          typeof (enhancedTip as any).priority === 'string' &&
          'actionItems' in enhancedTip &&
          Array.isArray((enhancedTip as any).actionItems)
        ) {
          setTip(enhancedTip as EnhancedTip);
        } else if (enhancedTip && typeof enhancedTip.tip === 'string') {
          setTip({
            tip: enhancedTip.tip,
            tipType: 'general',
            priority: 'medium',
            actionItems: ['Follow this general advice']
          });
        } else {
          setTip({
            tip: "Sorry, we couldn't fetch a tip right now. Please try again later.",
            tipType: 'general',
            priority: 'low',
            actionItems: ['Try refreshing the page']
          });
        }

        // Get spending insights if enabled
        if (showInsights) {
          const spendingInsights = await AIInsightsService.generateSpendingInsights(
            expenses,
            subscriptions,
            goals
          );
          setInsights(spendingInsights.slice(0, 3)); // Show top 3 insights
          
          // Set the first high-priority insight as active
          const highPriorityInsight = spendingInsights.find((insight: SpendingInsight) => insight.severity === 'high');
          if (highPriorityInsight) {
            setActiveInsight(highPriorityInsight);
          }
        }
      } else {
        // Fallback to simple tip
        const spendingHabits = mockSpendingSummary || "User is looking for general finance tips.";
        const result = await getPersonalizedFinanceTip(spendingHabits);
        setTip({
          tip: result.tip,
          tipType: 'general',
          priority: 'medium',
          actionItems: ['Follow this general advice']
        });
      }
    } catch (error) {
      console.error("Failed to fetch enhanced finance tip:", error);
      setTip({
        tip: "Sorry, we couldn't fetch a tip right now. Please try again later.",
        tipType: 'general',
        priority: 'low',
        actionItems: ['Try refreshing the page']
      });
    } finally {
      setIsLoading(false);
    }
  }, [expenses, subscriptions, goals, mockSpendingSummary, showInsights, insightType]);

  useEffect(() => {
    fetchEnhancedTip();
  }, [fetchEnhancedTip]);

  const getTipIcon = (tipType: string) => {
    switch (tipType) {
      case 'anomaly_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'cost_saving': return <DollarSign className="h-4 w-4" />;
      case 'forecast_warning': return <TrendingUp className="h-4 w-4" />;
      case 'subscription_alert': return <Zap className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'cost_saving': return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'forecast': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'subscription': return <Zap className="h-4 w-4 text-purple-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center">
              <Lightbulb className="mr-2 h-6 w-6 text-accent" />
              Smart Money Tip
            </div>
            {tip && (
              <Badge variant={getPriorityColor(tip.priority)} className="flex items-center gap-1">
                {getTipIcon(tip.tipType)}
                {tip.priority.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : tip ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{tip.tip}</p>
              
              {tip.potentialSavings && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    Potential monthly savings: <span className="font-semibold text-green-600">${tip.potentialSavings}</span>
                  </AlertDescription>
                </Alert>
              )}
              
              {tip.actionItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Action Steps:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {tip.actionItems.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-accent">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
          
          <Button onClick={fetchEnhancedTip} disabled={isLoading} variant="outline" size="sm" className="mt-4 group">
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'group-hover:animate-spin'}`} />
            {isLoading ? 'Analyzing...' : 'Get New Tip'}
          </Button>
        </CardContent>
      </Card>

      {/* Active High-Priority Insight */}
      {activeInsight && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {getInsightIcon(activeInsight.type)}
              {activeInsight.title}
              <Badge variant="outline" className="text-xs">
                {activeInsight.severity.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-2">{activeInsight.message}</p>
            {activeInsight.potentialSavings && (
              <p className="text-xs text-green-600 font-medium">
                Save up to ${activeInsight.potentialSavings}/month
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Insights Preview */}
      {showInsights && insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Recent Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight) => (
                <div 
                  key={insight.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => setActiveInsight(insight)}
                >
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <span className="text-xs font-medium">{insight.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {insight.type.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
            {insights.length > 2 && (
              <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
                View All Insights ({insights.length})
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
