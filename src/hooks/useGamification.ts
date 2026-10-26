'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  GamificationData, 
  GamificationEngine, 
  LeaderboardEngine,
  LeaderboardEntry,
  GAMIFICATION_STORAGE_KEY,
  LEADERBOARD_STORAGE_KEY
} from '@/lib/gamification';
import { Budget, Expense } from '@/lib/types';
import { EXPENSES_STORAGE_KEY, BUDGETS_STORAGE_KEY } from '@/lib/constants';

export function useGamification(userId?: string) {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  // Initialize gamification data
  const initializeGamificationData = useCallback((userId: string): GamificationData => {
    return {
      userId,
      totalPoints: 0,
      level: 0,
      streaks: [],
      badges: [],
      achievements: [],
      lastCalculated: new Date()
    };
  }, []);

  // Load gamification data from storage
  const loadGamificationData = useCallback(() => {
    if (!userId) return;

    try {
      const stored = localStorage.getItem(`${GAMIFICATION_STORAGE_KEY}-${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const data: GamificationData = {
          ...parsed,
          lastCalculated: new Date(parsed.lastCalculated),
          badges: parsed.badges.map((badge: any) => ({
            ...badge,
            earnedAt: new Date(badge.earnedAt)
          })),
          achievements: parsed.achievements.map((achievement: any) => ({
            ...achievement,
            unlockedAt: new Date(achievement.unlockedAt)
          })),
          streaks: parsed.streaks.map((streak: any) => ({
            ...streak,
            lastUpdated: new Date(streak.lastUpdated)
          }))
        };
        setGamificationData(data);
      } else {
        const newData = initializeGamificationData(userId);
        setGamificationData(newData);
        saveGamificationData(newData);
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
      const newData = initializeGamificationData(userId);
      setGamificationData(newData);
    }
  }, [userId, initializeGamificationData]);

  // Save gamification data to storage
  const saveGamificationData = useCallback((data: GamificationData) => {
    if (!userId) return;
    
    try {
      localStorage.setItem(`${GAMIFICATION_STORAGE_KEY}-${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }, [userId]);

  // Load budget and expense data
  const loadBudgetAndExpenseData = useCallback((): { budgets: Budget[], expenses: Expense[] } => {
    try {
      // Load budgets
      const budgetsData = localStorage.getItem(BUDGETS_STORAGE_KEY);
      const budgets: Budget[] = budgetsData ? JSON.parse(budgetsData) : [];

      // Load expenses
      const expensesData = localStorage.getItem(EXPENSES_STORAGE_KEY);
      const rawExpenses = expensesData ? JSON.parse(expensesData) : [];
      const expenses: Expense[] = rawExpenses.map((exp: any) => ({
        ...exp,
        date: new Date(exp.date)
      }));

      return { budgets, expenses };
    } catch (error) {
      console.error('Error loading budget/expense data:', error);
      return { budgets: [], expenses: [] };
    }
  }, []);

  // Calculate and update gamification data
  const updateGamificationData = useCallback(() => {
    if (!gamificationData || !userId) return;

    const { budgets, expenses } = loadBudgetAndExpenseData();
    
    // Calculate streaks
    const newStreaks = GamificationEngine.calculateStreaks(budgets, expenses);
    
    // Calculate badges (check for new ones)
    const previousBadgeIds = gamificationData.badges.map(b => b.badgeId);
    const newBadges = GamificationEngine.calculateEarnedBadges(
      budgets, 
      expenses, 
      newStreaks, 
      gamificationData.badges
    );
    
    // Find newly earned badges
    const newlyEarnedBadges = newBadges
      .filter(badge => !previousBadgeIds.includes(badge.badgeId))
      .map(badge => badge.badgeId);
    
    if (newlyEarnedBadges.length > 0) {
      setNewBadges(prev => [...prev, ...newlyEarnedBadges]);
    }
    
    // Calculate achievements
    const newAchievements = GamificationEngine.generateAchievements(newStreaks, newBadges);
    
    // Calculate points and level
    const totalPoints = GamificationEngine.calculatePoints(newStreaks, newBadges);
    const level = GamificationEngine.calculateLevel(totalPoints);
    
    const updatedData: GamificationData = {
      ...gamificationData,
      totalPoints,
      level,
      streaks: newStreaks,
      badges: newBadges,
      achievements: [...gamificationData.achievements, ...newAchievements],
      lastCalculated: new Date()
    };
    
    setGamificationData(updatedData);
    saveGamificationData(updatedData);
    updateLeaderboard(updatedData);
  }, [gamificationData, userId, loadBudgetAndExpenseData, saveGamificationData]);

  // Update leaderboard
  const updateLeaderboard = useCallback((currentUserData: GamificationData) => {
    try {
      const newLeaderboard = LeaderboardEngine.generateMockLeaderboard(currentUserData);
      setLeaderboard(newLeaderboard);
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(newLeaderboard));
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  }, []);

  // Load leaderboard from storage
  const loadLeaderboard = useCallback(() => {
    try {
      const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
      if (stored) {
        setLeaderboard(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (gamificationData) {
      updateGamificationData();
    }
  }, [gamificationData, updateGamificationData]);

  // Clear new badge notifications
  const clearNewBadge = useCallback((badgeId: string) => {
    setNewBadges(prev => prev.filter(id => id !== badgeId));
  }, []);

  const clearAllNewBadges = useCallback(() => {
    setNewBadges([]);
  }, []);

  // Reset all gamification data (for testing or user request)
  const resetGamificationData = useCallback(() => {
    if (!userId) return;
    
    const newData = initializeGamificationData(userId);
    setGamificationData(newData);
    saveGamificationData(newData);
    setNewBadges([]);
    localStorage.removeItem(`${GAMIFICATION_STORAGE_KEY}-${userId}`);
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
    setLeaderboard([]);
  }, [userId, initializeGamificationData, saveGamificationData]);

  // Initialize on mount
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      loadGamificationData();
      loadLeaderboard();
      setIsLoading(false);
    }
  }, [userId, loadGamificationData, loadLeaderboard]);

  // Auto-update when budget or expense data changes
  useEffect(() => {
    if (!gamificationData || isLoading) return;

    // Check if we need to update (daily or when data changes)
    const lastUpdate = gamificationData.lastCalculated;
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    // Update if it's been more than 1 hour or if it's a new day
    if (hoursSinceUpdate >= 1 || now.toDateString() !== lastUpdate.toDateString()) {
      updateGamificationData();
    }
  }, [gamificationData, isLoading, updateGamificationData]);

  return {
    // Data
    gamificationData,
    leaderboard,
    newBadges,
    isLoading,
    
    // Actions
    refresh,
    clearNewBadge,
    clearAllNewBadges,
    resetGamificationData,
    
    // Computed values
    currentStreak: gamificationData ? Math.max(...gamificationData.streaks.map(s => s.currentStreak), 0) : 0,
    totalBadges: gamificationData ? gamificationData.badges.length : 0,
    userRank: leaderboard.find(entry => entry.userId === userId)?.rank || 0,
    activeStreaks: gamificationData ? gamificationData.streaks.filter(s => s.isActive) : []
  };
}

// Hook for gamification stats summary (for dashboard widgets)
export function useGamificationStats(userId?: string) {
  const { gamificationData, leaderboard, currentStreak, totalBadges, userRank } = useGamification(userId);
  
  const stats = {
    level: gamificationData?.level || 0,
    totalPoints: gamificationData?.totalPoints || 0,
    currentStreak,
    totalBadges,
    userRank,
    recentBadges: gamificationData?.badges.slice(-3) || [],
    activeStreakCount: gamificationData?.streaks.filter(s => s.isActive).length || 0
  };
  
  return stats;
}
