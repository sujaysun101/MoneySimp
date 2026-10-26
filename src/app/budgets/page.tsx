// src/app/budgets/page.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetForm, type BudgetFormValues } from '@/components/budgets/BudgetForm';
import { BudgetList } from '@/components/budgets/BudgetList';
import { GamificationDashboard } from '@/components/budgets/GamificationDashboard';
import { BadgeNotification, useBadgeNotifications } from '@/components/budgets/BadgeNotification';
import type { Budget } from '@/lib/types';
import { CATEGORIES, BUDGETS_STORAGE_KEY, EXPENSES_STORAGE_KEY } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { DollarSign, Edit, Trophy, TrendingUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Expense } from '@/lib/types';
import { isSameMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { auth } from '@/lib/firebase';

const calculateSpentAmountForCurrentMonth = (categoryId: string, expenses: Expense[] = []): number => {
  const today = new Date();
  return expenses
    .filter(expense => expense.categoryId === categoryId && isSameMonth(new Date(expense.date), today))
    .reduce((sum, expense) => sum + expense.amount, 0);
};


export default function BudgetsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userExpenses, setUserExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'budgets');
  const initialSaveEffectRun = useRef(true); // Ref to control initial save

  // Get current user ID for gamification
  const userId = auth?.currentUser?.uid;
  
  // Gamification hooks
  const { 
    gamificationData, 
    leaderboard, 
    newBadges, 
    clearNewBadge, 
    clearAllNewBadges,
    refresh: refreshGamification 
  } = useGamification(userId);
  
  const { showBadge, dismissBadge, dismissAllBadges } = useBadgeNotifications();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('moneySimpLoggedIn');
    if (!isLoggedIn && !(auth && auth.currentUser)) { 
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // Set active tab from URL params
  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['budgets', 'gamification'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load expenses (needed to calculate spent amounts for budgets)
  useEffect(() => {
    if (isLoading) return;
    const storedExpenses = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (storedExpenses) {
      try {
        const parsedExpenses: Expense[] = JSON.parse(storedExpenses).map((exp: any) => ({
          ...exp,
          date: new Date(exp.date), 
        }));
        setUserExpenses(parsedExpenses);
      } catch (error) {
        console.error("[BudgetsPage] Failed to parse expenses for budget calculation:", error);
        setUserExpenses([]); 
      }
    } else {
      setUserExpenses([]); 
    }
  }, [isLoading]);


  // Load budgets from local storage or initialize
  useEffect(() => {
    if (isLoading) return;

    console.log(`[BudgetsPage] Attempting to load budgets from localStorage with key: ${BUDGETS_STORAGE_KEY}`);
    const storedBudgets = localStorage.getItem(BUDGETS_STORAGE_KEY);
    
    if (storedBudgets) {
      console.log("[BudgetsPage] Found stored budgets string:", storedBudgets);
      try {
        const parsedData = JSON.parse(storedBudgets);
        
        if (!Array.isArray(parsedData)) {
          console.error("[BudgetsPage] Stored budgets data is not an array. Clearing localStorage for this key. Data was:", parsedData);
          localStorage.removeItem(BUDGETS_STORAGE_KEY);
          setBudgets([]);
          return;
        }
        
        const parsedBudgets: Partial<Omit<Budget, 'icon' | 'name' | 'spentAmount' >>[] = parsedData;
        console.log("[BudgetsPage] Successfully parsed budgets from storage:", parsedBudgets);

        const fullBudgets = parsedBudgets.map(b => {
          if (!b || typeof b.categoryId !== 'string' || typeof b.amount !== 'number') { // Added amount type check
            console.warn("[BudgetsPage] Skipping invalid budget item during mapping:", b);
            return null; 
          }
          const category = CATEGORIES.find(c => c.id === b.categoryId);
          const budgetId = b.id || uuidv4(); 
          
          return {
            id: budgetId,
            categoryId: b.categoryId,
            name: category?.name || 'Unknown Category',
            icon: category?.icon || DollarSign,
            amount: b.amount, // amount is now guaranteed to be a number
            spentAmount: calculateSpentAmountForCurrentMonth(b.categoryId, userExpenses)
          };
        }).filter(Boolean) as Budget[]; 

        console.log("[BudgetsPage] Mapped to full budgets:", fullBudgets);
        setBudgets(fullBudgets);
      } catch (error) {
          console.error("[BudgetsPage] Failed to parse budgets from localStorage. Content was:", storedBudgets, "Error:", error);
          localStorage.removeItem(BUDGETS_STORAGE_KEY);
          setBudgets([]);
      }
    } else {
      console.log("[BudgetsPage] No stored budgets found under key:", BUDGETS_STORAGE_KEY, ". Initializing to empty array.");
      setBudgets([]);
    }
  }, [userExpenses, isLoading]);


  // Save budgets to local storage whenever they change
  useEffect(() => {
    if (isLoading) {
        initialSaveEffectRun.current = true; // Reset if loading becomes true again (e.g. navigating away and back)
        return;
    }

    // This is the first time this effect runs AFTER isLoading became false for the current page load.
    if (initialSaveEffectRun.current) {
        initialSaveEffectRun.current = false; // Mark that this initial run has happened.
        
        // If budgets is empty at this point, it means either:
        // 1. localStorage was empty and the loading effect set it to [].
        // 2. The loading effect hasn't run yet to populate budgets from localStorage.
        // In case 2, we don't want to save the current empty 'budgets' state and overwrite localStorage.
        // So, if budgets is empty, we just return and let the loading effect populate it.
        // The change in 'budgets' from the loading effect will then re-trigger this save effect.
        if (budgets.length === 0 && !localStorage.getItem(BUDGETS_STORAGE_KEY)) { 
            // Only skip if budgets are empty AND there was nothing in localStorage to begin with (or it was cleared)
            // This ensures that if user deletes all budgets, it *does* save an empty array.
            console.log("[BudgetsPage] Save to localStorage skipped on initial effect run post-loading because 'budgets' is currently empty and localStorage was also empty/null.");
            return;
        }
    }
    
    const storableBudgets = budgets.map(({ id, categoryId, amount }) => ({ id, categoryId, amount }));
    localStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(storableBudgets));
    console.log("[BudgetsPage] Saved budgets to localStorage:", storableBudgets);
}, [budgets, isLoading]);


  // Handle badge notifications when new badges are earned
  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeId => showBadge(badgeId));
    }
  }, [newBadges, showBadge]);

  // Refresh gamification when budgets or expenses change
  useEffect(() => {
    if (budgets.length > 0 || userExpenses.length > 0) {
      refreshGamification();
    }
  }, [budgets, userExpenses, refreshGamification]);

  const handleBudgetSubmit = (data: BudgetFormValues, editingBudgetId?: string) => {
    const category = CATEGORIES.find(cat => cat.id === data.categoryId);
    if (!category) return;

    if (editingBudgetId) { 
      setBudgets(prevBudgets =>
        prevBudgets.map(b =>
          b.id === editingBudgetId
            ? { ...b, categoryId: data.categoryId, name: category.name, icon: category.icon, amount: data.amount, spentAmount: calculateSpentAmountForCurrentMonth(data.categoryId, userExpenses) }
            : b
        )
      );
      toast({
        title: "Budget Updated",
        description: `Budget for ${category.name} updated to $${data.amount.toFixed(2)}.`,
      });
      setEditingBudget(null); 
    } else { 
      const newBudget: Budget = {
        id: uuidv4(),
        categoryId: data.categoryId,
        name: category.name,
        icon: category.icon,
        amount: data.amount,
        spentAmount: calculateSpentAmountForCurrentMonth(data.categoryId, userExpenses),
      };
      setBudgets(prevBudgets => [...prevBudgets, newBudget]);
      toast({
        title: "Budget Set",
        description: `Budget for ${category.name} set to $${data.amount.toFixed(2)}.`,
      });
    }
  };

  const handleDeleteBudget = (budgetId: string) => {
    const budgetToDelete = budgets.find(b => b.id === budgetId);
    setBudgets(prevBudgets => prevBudgets.filter(b => b.id !== budgetId));
    toast({
      title: "Budget Deleted",
      description: `Budget for ${budgetToDelete?.name || 'Category'} deleted.`,
      variant: "destructive"
    });
    if (editingBudget && editingBudget.id === budgetId) {
        setEditingBudget(null); 
    }
  };

  const handleEditBudget = (budgetToEdit: Budget) => {
    setEditingBudget(budgetToEdit);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  // Update spent amounts when expenses change
  useEffect(() => {
    if (budgets.length > 0 && !isLoading) { // Also check isLoading here
        setBudgets(prevBudgets =>
            prevBudgets.map(b => ({
                ...b,
                spentAmount: calculateSpentAmountForCurrentMonth(b.categoryId, userExpenses)
            }))
        );
    }
  }, [userExpenses, isLoading]); // Added isLoading to dependencies


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p>Loading budgets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      {/* Badge Notifications */}
      <BadgeNotification
        newBadges={newBadges}
        onDismiss={(badgeId) => {
          dismissBadge(badgeId);
          clearNewBadge(badgeId);
        }}
        onDismissAll={() => {
          dismissAllBadges();
          clearAllNewBadges();
        }}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Budget Management</h1>
        <p className="text-muted-foreground">
          Set budgets, track progress, and earn rewards for staying on track.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Progress & Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{editingBudget ? 'Edit Budget' : 'Set New Budget'}</CardTitle>
              <CardDescription>
                {editingBudget
                  ? `Update the budget amount for ${editingBudget.name}.`
                  : 'Define a monthly budget for a specific category.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetForm
                onBudgetSubmit={handleBudgetSubmit}
                existingBudgets={budgets.map(b => ({ categoryId: b.categoryId }))}
                editingBudget={editingBudget}
                onCancelEdit={handleCancelEdit}
              />
            </CardContent>
          </Card>

          <BudgetList
            budgets={budgets}
            onDeleteBudget={handleDeleteBudget}
            onEditBudget={handleEditBudget}
          />
        </TabsContent>

        <TabsContent value="gamification" className="space-y-6">
          {gamificationData && (
            <GamificationDashboard
              gamificationData={gamificationData}
              leaderboard={leaderboard}
              onRefresh={refreshGamification}
            />
          )}
          
          {!gamificationData && userId && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Welcome to Budget Gamification!</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your first budget to start earning points, badges, and building streaks.
                </p>
              </CardContent>
            </Card>
          )}
          
          {!userId && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                <p className="text-muted-foreground">
                  Please sign in to access gamification features and track your progress.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
