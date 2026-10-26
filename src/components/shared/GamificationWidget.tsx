'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Flame, 
  Crown, 
  Star,
  ChevronRight,
  Target
} from 'lucide-react';
import { useGamificationStats } from '@/hooks/useGamification';
import Link from 'next/link';

interface GamificationWidgetProps {
  userId?: string;
  showFullStats?: boolean;
}

export function GamificationWidget({ userId, showFullStats = true }: GamificationWidgetProps) {
  const stats = useGamificationStats(userId);

  if (!userId) {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600">Sign in to track your progress!</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate level progress
  const levelBoundaries = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
  const currentLevelMin = levelBoundaries[stats.level] || 0;
  const nextLevelMin = levelBoundaries[stats.level + 1] || (currentLevelMin + Math.floor(currentLevelMin * 0.4));
  const levelProgress = ((stats.totalPoints - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;

  if (!showFullStats) {
    return <GamificationSummary stats={stats} />;
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Your Progress
          </CardTitle>
          <Link href="/budgets?tab=gamification">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Level {stats.level}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {stats.totalPoints.toLocaleString()} pts
            </span>
          </div>
          <Progress 
            value={Math.min(levelProgress, 100)} 
            className="h-2 bg-purple-100"
          />
          <div className="text-xs text-muted-foreground text-right">
            {nextLevelMin - stats.totalPoints} points to next level
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            label="Streak"
            value={`${stats.currentStreak}`}
            subtitle="days"
          />
          <StatCard
            icon={<Star className="h-4 w-4 text-yellow-500" />}
            label="Badges"
            value={`${stats.totalBadges}`}
            subtitle="earned"
          />
          <StatCard
            icon={<Trophy className="h-4 w-4 text-blue-500" />}
            label="Rank"
            value={stats.userRank > 0 ? `#${stats.userRank}` : '-'}
            subtitle="position"
          />
        </div>

        {/* Recent Badges */}
        {stats.recentBadges.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Recent Achievements</p>
            <div className="flex gap-2">
              {stats.recentBadges.map((badge, index) => {
                // Note: In a real implementation, you'd fetch the badge details
                return (
                  <div 
                    key={index}
                    className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-sm"
                    title={`Badge earned ${badge.earnedAt.toLocaleDateString()}`}
                  >
                    🏆
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Streaks Summary */}
        {stats.activeStreakCount > 0 && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {stats.activeStreakCount} active streak{stats.activeStreakCount > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              Keep it up! Stay under budget to maintain your streaks.
            </p>
          </div>
        )}

        {/* No activity state */}
        {stats.level === 0 && stats.totalBadges === 0 && stats.currentStreak === 0 && (
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">Start your gamification journey!</p>
            <p className="text-xs text-gray-500">
              Set budgets and track expenses to earn points, badges, and maintain streaks.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact summary version
function GamificationSummary({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-3 text-center">
          <Crown className="h-5 w-5 mx-auto mb-1 text-blue-600" />
          <p className="text-lg font-bold text-blue-900">{stats.level}</p>
          <p className="text-xs text-blue-700">Level</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-3 text-center">
          <Flame className="h-5 w-5 mx-auto mb-1 text-orange-600" />
          <p className="text-lg font-bold text-orange-900">{stats.currentStreak}</p>
          <p className="text-xs text-orange-700">Streak</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
        <CardContent className="p-3 text-center">
          <Star className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
          <p className="text-lg font-bold text-yellow-900">{stats.totalBadges}</p>
          <p className="text-xs text-yellow-700">Badges</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual stat card component
function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtitle: string; 
}) {
  return (
    <div className="bg-white/60 rounded-lg p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </div>
  );
}
