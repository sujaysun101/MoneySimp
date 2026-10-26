import { Budget, Expense } from './types';
import { CATEGORIES } from './constants';

// Types for gamification
export interface BudgetStreak {
  categoryId: string;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'budget' | 'saving' | 'streak' | 'achievement';
  criteria: {
    type: 'streak' | 'under_budget' | 'no_spend' | 'savings_rate' | 'goal_completion';
    value: number;
    period?: 'day' | 'week' | 'month';
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: Date;
}

export interface UserBadge {
  badgeId: string;
  earnedAt: Date;
  progress?: number; // For badges with multiple levels
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  streak: number;
  badgeCount: number;
  avatar?: string;
}

export interface GamificationData {
  userId: string;
  totalPoints: number;
  level: number;
  streaks: BudgetStreak[];
  badges: UserBadge[];
  achievements: Achievement[];
  lastCalculated: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  points: number;
  unlockedAt: Date;
  icon: string;
  color: string;
}

// Predefined badges
export const AVAILABLE_BADGES: Badge[] = [
  // Streak badges
  {
    id: 'streak_3_days',
    name: 'Budget Keeper',
    description: 'Stay under budget for 3 consecutive days',
    icon: '🔥',
    color: '#FF6B35',
    category: 'streak',
    criteria: { type: 'streak', value: 3, period: 'day' },
    rarity: 'common'
  },
  {
    id: 'streak_1_week',
    name: 'Week Warrior',
    description: 'Stay under budget for 1 full week',
    icon: '⚡',
    color: '#4ECDC4',
    category: 'streak',
    criteria: { type: 'streak', value: 7, period: 'day' },
    rarity: 'rare'
  },
  {
    id: 'streak_1_month',
    name: 'Monthly Master',
    description: 'Stay under budget for an entire month',
    icon: '👑',
    color: '#FFD93D',
    category: 'streak',
    criteria: { type: 'streak', value: 30, period: 'day' },
    rarity: 'epic'
  },
  {
    id: 'streak_3_months',
    name: 'Budget Legend',
    description: 'Stay under budget for 3 consecutive months',
    icon: '🏆',
    color: '#9B59B6',
    category: 'streak',
    criteria: { type: 'streak', value: 90, period: 'day' },
    rarity: 'legendary'
  },
  
  // No-spend badges
  {
    id: 'no_spend_day',
    name: 'Zero Hero',
    description: 'Complete a day without any discretionary spending',
    icon: '🛡️',
    color: '#27AE60',
    category: 'saving',
    criteria: { type: 'no_spend', value: 1, period: 'day' },
    rarity: 'common'
  },
  {
    id: 'no_spend_week',
    name: 'No-Spend Week',
    description: 'Complete a full week without discretionary spending',
    icon: '💎',
    color: '#3498DB',
    category: 'saving',
    criteria: { type: 'no_spend', value: 7, period: 'day' },
    rarity: 'rare'
  },
  
  // Budget achievement badges
  {
    id: 'under_budget_20',
    name: 'Smart Saver',
    description: 'Come in 20% under budget for the month',
    icon: '💰',
    color: '#2ECC71',
    category: 'budget',
    criteria: { type: 'under_budget', value: 20 },
    rarity: 'common'
  },
  {
    id: 'under_budget_50',
    name: 'Super Saver',
    description: 'Come in 50% under budget for the month',
    icon: '🌟',
    color: '#F39C12',
    category: 'budget',
    criteria: { type: 'under_budget', value: 50 },
    rarity: 'rare'
  },
  
  // Category-specific badges
  {
    id: 'dining_discipline',
    name: 'Dining Discipline',
    description: 'Stay under dining budget for 2 weeks straight',
    icon: '🍽️',
    color: '#E74C3C',
    category: 'budget',
    criteria: { type: 'streak', value: 14, period: 'day' },
    rarity: 'common'
  },
  {
    id: 'entertainment_expert',
    name: 'Entertainment Expert',
    description: 'Stay under entertainment budget for a month',
    icon: '🎭',
    color: '#9B59B6',
    category: 'budget',
    criteria: { type: 'streak', value: 30, period: 'day' },
    rarity: 'rare'
  }
];

// Gamification calculation functions
export class GamificationEngine {
  static calculateStreaks(budgets: Budget[], expenses: Expense[]): BudgetStreak[] {
    const streaks: BudgetStreak[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (const budget of budgets) {
      // Get expenses for this category in the current month
      const categoryExpenses = expenses.filter(expense => 
        expense.categoryId === budget.categoryId &&
        expense.date >= startOfMonth &&
        expense.date <= now
      );
      
      // Calculate daily spending
      const dailySpending = this.calculateDailySpending(categoryExpenses, startOfMonth, now);
      const dailyBudget = budget.amount / this.getDaysInMonth(now);
      
      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      for (let i = dailySpending.length - 1; i >= 0; i--) {
        if (dailySpending[i] <= dailyBudget) {
          tempStreak++;
          if (i === dailySpending.length - 1) {
            currentStreak = tempStreak;
          }
        } else {
          if (i === dailySpending.length - 1) {
            currentStreak = 0;
          }
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      streaks.push({
        categoryId: budget.categoryId,
        currentStreak,
        longestStreak,
        lastUpdated: now,
        isActive: currentStreak > 0
      });
    }
    
    return streaks;
  }
  
  static calculateEarnedBadges(
    budgets: Budget[], 
    expenses: Expense[], 
    streaks: BudgetStreak[],
    existingBadges: UserBadge[] = []
  ): UserBadge[] {
    const earnedBadges: UserBadge[] = [...existingBadges];
    const now = new Date();
    
    for (const badge of AVAILABLE_BADGES) {
      // Skip if already earned
      if (earnedBadges.some(ub => ub.badgeId === badge.id)) {
        continue;
      }
      
      let earned = false;
      
      switch (badge.criteria.type) {
        case 'streak':
          const maxStreak = Math.max(...streaks.map(s => s.currentStreak));
          earned = maxStreak >= badge.criteria.value;
          break;
          
        case 'under_budget':
          const underBudgetPercentage = this.calculateUnderBudgetPercentage(budgets, expenses);
          earned = underBudgetPercentage >= badge.criteria.value;
          break;
          
        case 'no_spend':
          earned = this.checkNoSpendPeriod(expenses, badge.criteria.value, badge.criteria.period!);
          break;
      }
      
      if (earned) {
        earnedBadges.push({
          badgeId: badge.id,
          earnedAt: now,
          progress: 100
        });
      }
    }
    
    return earnedBadges;
  }
  
  static calculateLevel(totalPoints: number): number {
    // Level progression: 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000...
    const levels = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
    
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i]) {
        return i;
      }
    }
    
    // For higher levels, use exponential progression
    let level = levels.length;
    let required = 20000;
    while (totalPoints >= required) {
      level++;
      required += Math.floor(required * 0.4); // 40% increase each level
    }
    
    return level;
  }
  
  static calculatePoints(streaks: BudgetStreak[], badges: UserBadge[]): number {
    let points = 0;
    
    // Points from streaks
    streaks.forEach(streak => {
      points += streak.currentStreak * 10; // 10 points per day of streak
      if (streak.longestStreak >= 7) points += 50; // Bonus for week+ streaks
      if (streak.longestStreak >= 30) points += 200; // Bonus for month+ streaks
    });
    
    // Points from badges
    badges.forEach(userBadge => {
      const badge = AVAILABLE_BADGES.find(b => b.id === userBadge.badgeId);
      if (badge) {
        switch (badge.rarity) {
          case 'common': points += 25; break;
          case 'rare': points += 50; break;
          case 'epic': points += 100; break;
          case 'legendary': points += 250; break;
        }
      }
    });
    
    return points;
  }
  
  static generateAchievements(streaks: BudgetStreak[], badges: UserBadge[]): Achievement[] {
    const achievements: Achievement[] = [];
    const now = new Date();
    
    // Streak achievements
    const maxStreak = Math.max(...streaks.map(s => s.currentStreak));
    if (maxStreak >= 7) {
      achievements.push({
        id: 'first_week_streak',
        name: 'Week Champion',
        description: 'Maintained budget discipline for 7 days',
        points: 100,
        unlockedAt: now,
        icon: '🏅',
        color: '#FF6B35'
      });
    }
    
    // Badge collection achievements
    const rareCount = badges.filter(ub => {
      const badge = AVAILABLE_BADGES.find(b => b.id === ub.badgeId);
      return badge?.rarity === 'rare';
    }).length;
    
    if (rareCount >= 3) {
      achievements.push({
        id: 'rare_collector',
        name: 'Rare Collector',
        description: 'Earned 3 rare badges',
        points: 150,
        unlockedAt: now,
        icon: '💎',
        color: '#3498DB'
      });
    }
    
    return achievements;
  }
  
  // Helper methods
  private static calculateDailySpending(expenses: Expense[], startDate: Date, endDate: Date): number[] {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailySpending = new Array(days).fill(0);
    
    expenses.forEach(expense => {
      const dayIndex = Math.floor((expense.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < days) {
        dailySpending[dayIndex] += expense.amount;
      }
    });
    
    return dailySpending;
  }
  
  private static getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
  
  private static calculateUnderBudgetPercentage(budgets: Budget[], expenses: Expense[]): number {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    
    if (totalBudget === 0) return 0;
    
    const savingsPercentage = ((totalBudget - totalSpent) / totalBudget) * 100;
    return Math.max(0, savingsPercentage);
  }
  
  private static checkNoSpendPeriod(expenses: Expense[], days: number, period: string): boolean {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - days);
    
    // Check for discretionary spending (entertainment, dining, shopping)
    const discretionaryCategories = ['entertainment', 'dining', 'clothing', 'other'];
    const discretionaryExpenses = expenses.filter(expense => 
      discretionaryCategories.includes(expense.categoryId) &&
      expense.date >= periodStart &&
      expense.date <= now
    );
    
    return discretionaryExpenses.length === 0;
  }
}

// Leaderboard functions
export class LeaderboardEngine {
  static generateMockLeaderboard(currentUser: GamificationData): LeaderboardEntry[] {
    // In a real app, this would fetch from a database
    const mockUsers: Omit<LeaderboardEntry, 'rank'>[] = [
      {
        userId: currentUser.userId,
        username: 'You',
        score: currentUser.totalPoints,
        streak: Math.max(...currentUser.streaks.map(s => s.currentStreak), 0),
        badgeCount: currentUser.badges.length,
        avatar: '👤'
      },
      {
        userId: 'user1',
        username: 'BudgetMaster',
        score: 1250,
        streak: 15,
        badgeCount: 8,
        avatar: '🌟'
      },
      {
        userId: 'user2',
        username: 'SavingsGuru',
        score: 980,
        streak: 12,
        badgeCount: 6,
        avatar: '💰'
      },
      {
        userId: 'user3',
        username: 'FrugalFriend',
        score: 875,
        streak: 8,
        badgeCount: 5,
        avatar: '🎯'
      },
      {
        userId: 'user4',
        username: 'MoneyWise',
        score: 720,
        streak: 6,
        badgeCount: 4,
        avatar: '🏆'
      }
    ];
    
    // Sort by score and add ranks
    return mockUsers
      .sort((a, b) => b.score - a.score)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
  }
}

// Storage keys for gamification data
export const GAMIFICATION_STORAGE_KEY = 'moneySimp-gamification';
export const LEADERBOARD_STORAGE_KEY = 'moneySimp-leaderboard';
