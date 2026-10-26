'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Flame, 
  Target, 
  Crown, 
  Star, 
  Award,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { 
  GamificationData, 
  LeaderboardEntry, 
  AVAILABLE_BADGES,
  BudgetStreak,
  UserBadge
} from '@/lib/gamification';

interface GamificationDashboardProps {
  gamificationData: GamificationData;
  leaderboard: LeaderboardEntry[];
  onRefresh?: () => void;
}

export function GamificationDashboard({ 
  gamificationData, 
  leaderboard, 
  onRefresh 
}: GamificationDashboardProps) {
  const userRank = leaderboard.find(entry => entry.userId === gamificationData.userId)?.rank || 0;
  const activeStreaks = gamificationData.streaks.filter(s => s.isActive);
  const longestCurrentStreak = Math.max(...gamificationData.streaks.map(s => s.currentStreak), 0);
  
  // Calculate level progress
  const currentLevel = gamificationData.level;
  const levelBoundaries = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
  const currentLevelMin = levelBoundaries[currentLevel] || 0;
  const nextLevelMin = levelBoundaries[currentLevel + 1] || (currentLevelMin + Math.floor(currentLevelMin * 0.4));
  const levelProgress = ((gamificationData.totalPoints - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;

  return (
    <div className="space-y-6">
      {/* Level and Points Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Your Level</p>
                <p className="text-3xl font-bold text-blue-900">{currentLevel}</p>
              </div>
              <Crown className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-blue-600">
                <span>{gamificationData.totalPoints} points</span>
                <span>{nextLevelMin} points</span>
              </div>
              <Progress 
                value={Math.min(levelProgress, 100)} 
                className="h-2 bg-blue-200"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Current Streak</p>
                <p className="text-3xl font-bold text-orange-900">{longestCurrentStreak}</p>
                <p className="text-xs text-orange-600">days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Leaderboard Rank</p>
                <p className="text-3xl font-bold text-green-900">#{userRank}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Streaks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Active Streaks
            </CardTitle>
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <TrendingUp className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {activeStreaks.length > 0 ? (
              activeStreaks.map((streak) => (
                <StreakCard key={streak.categoryId} streak={streak} />
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active streaks</p>
                <p className="text-sm">Stay under budget to start building streaks!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Badges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              Recent Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gamificationData.badges.slice(-5).map((userBadge) => (
                <BadgeCard key={userBadge.badgeId} userBadge={userBadge} />
              ))}
              {gamificationData.badges.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No badges earned yet</p>
                  <p className="text-sm">Complete challenges to earn your first badge!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Community Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry) => (
              <LeaderboardRow 
                key={entry.userId} 
                entry={entry} 
                isCurrentUser={entry.userId === gamificationData.userId}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Available Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Badge Collection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVAILABLE_BADGES.map((badge) => {
              const earned = gamificationData.badges.some(ub => ub.badgeId === badge.id);
              return (
                <BadgeDisplay 
                  key={badge.id} 
                  badge={badge} 
                  earned={earned}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function StreakCard({ streak }: { streak: BudgetStreak }) {
  const category = AVAILABLE_BADGES.find(b => b.id.includes(streak.categoryId));
  
  return (
    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🔥</div>
        <div>
          <p className="font-medium text-orange-900">
            {streak.categoryId.charAt(0).toUpperCase() + streak.categoryId.slice(1)}
          </p>
          <p className="text-sm text-orange-700">
            {streak.currentStreak} days • Best: {streak.longestStreak} days
          </p>
        </div>
      </div>
      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
        Active
      </Badge>
    </div>
  );
}

function BadgeCard({ userBadge }: { userBadge: UserBadge }) {
  const badge = AVAILABLE_BADGES.find(b => b.id === userBadge.badgeId);
  if (!badge) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <div className="text-2xl">{badge.icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{badge.name}</p>
          <Badge 
            variant="outline" 
            className={`text-xs ${getRarityColor(badge.rarity)}`}
          >
            {badge.rarity}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{badge.description}</p>
        <p className="text-xs text-muted-foreground">
          Earned {userBadge.earnedAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, isCurrentUser }: { 
  entry: LeaderboardEntry; 
  isCurrentUser: boolean;
}) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
    }`}>
      <div className="flex items-center gap-3">
        <div className="w-8 text-center font-bold">
          {getRankIcon(entry.rank)}
        </div>
        <div className="text-lg">{entry.avatar}</div>
        <div>
          <p className={`font-medium ${isCurrentUser ? 'text-blue-900' : ''}`}>
            {entry.username}
          </p>
          <p className="text-sm text-muted-foreground">
            {entry.streak} day streak • {entry.badgeCount} badges
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-lg">{entry.score.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">points</p>
      </div>
    </div>
  );
}

function BadgeDisplay({ badge, earned }: { 
  badge: any; 
  earned: boolean;
}) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-2 ${getRarityColor(badge.rarity)} ${
      earned ? 'bg-white' : 'bg-gray-50 opacity-60'
    }`}>
      <div className="text-center">
        <div className="text-3xl mb-2">{badge.icon}</div>
        <p className={`font-medium text-sm ${earned ? '' : 'text-gray-500'}`}>
          {badge.name}
        </p>
        <p className={`text-xs ${earned ? 'text-muted-foreground' : 'text-gray-400'}`}>
          {badge.description}
        </p>
        <Badge 
          variant="outline" 
          className={`mt-2 text-xs ${
            earned ? getRarityColor(badge.rarity).replace('border', 'border text') : 'text-gray-400'
          }`}
        >
          {badge.rarity}
        </Badge>
      </div>
    </div>
  );
}
