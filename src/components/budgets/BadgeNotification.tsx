'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Star, Sparkles } from 'lucide-react';
import { Badge as BadgeType, AVAILABLE_BADGES } from '@/lib/gamification';

interface BadgeNotificationProps {
  newBadges: string[]; // Array of badge IDs
  onDismiss: (badgeId: string) => void;
  onDismissAll: () => void;
}

export function BadgeNotification({ 
  newBadges, 
  onDismiss, 
  onDismissAll 
}: BadgeNotificationProps) {
  const [visibleBadges, setVisibleBadges] = useState<string[]>(newBadges);
  const [animatingOut, setAnimatingOut] = useState<string[]>([]);

  useEffect(() => {
    setVisibleBadges(newBadges);
  }, [newBadges]);

  const handleDismiss = (badgeId: string) => {
    setAnimatingOut(prev => [...prev, badgeId]);
    setTimeout(() => {
      setVisibleBadges(prev => prev.filter(id => id !== badgeId));
      setAnimatingOut(prev => prev.filter(id => id !== badgeId));
      onDismiss(badgeId);
    }, 300);
  };

  const handleDismissAll = () => {
    setAnimatingOut(visibleBadges);
    setTimeout(() => {
      setVisibleBadges([]);
      setAnimatingOut([]);
      onDismissAll();
    }, 300);
  };

  if (visibleBadges.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleBadges.map((badgeId) => {
        const badge = AVAILABLE_BADGES.find(b => b.id === badgeId);
        if (!badge) return null;

        const isAnimatingOut = animatingOut.includes(badgeId);

        return (
          <BadgeNotificationCard
            key={badgeId}
            badge={badge}
            isAnimatingOut={isAnimatingOut}
            onDismiss={() => handleDismiss(badgeId)}
          />
        );
      })}

      {visibleBadges.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismissAll}
            className="bg-white/90 backdrop-blur-sm border-gray-300"
          >
            Dismiss All
          </Button>
        </div>
      )}
    </div>
  );
}

interface BadgeNotificationCardProps {
  badge: BadgeType;
  isAnimatingOut: boolean;
  onDismiss: () => void;
}

function BadgeNotificationCard({ 
  badge, 
  isAnimatingOut, 
  onDismiss 
}: BadgeNotificationCardProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-50 to-gray-100 border-gray-300';
      case 'rare': return 'from-blue-50 to-blue-100 border-blue-300';
      case 'epic': return 'from-purple-50 to-purple-100 border-purple-300';
      case 'legendary': return 'from-yellow-50 to-yellow-100 border-yellow-300';
      default: return 'from-gray-50 to-gray-100 border-gray-300';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-200 text-gray-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      case 'epic': return 'bg-purple-200 text-purple-800';
      case 'legendary': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <Card 
      className={`
        w-80 bg-gradient-to-r ${getRarityColor(badge.rarity)} 
        shadow-lg border-2 transform transition-all duration-300 
        ${isAnimatingOut ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100 animate-pulse'}
      `}
      style={{
        animation: isAnimatingOut ? 'slideOut 0.3s ease-in-out' : 'slideIn 0.5s ease-out, pulse 2s infinite'
      }}
    >
      <CardContent className="p-4 relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-70 hover:opacity-100"
          onClick={onDismiss}
        >
          <X className="h-3 w-3" />
        </Button>

        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="text-4xl animate-bounce">{badge.icon}</div>
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-yellow-500 animate-spin" />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-sm text-gray-900">
                Badge Earned!
              </span>
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {badge.name}
            </h3>
            
            <p className="text-sm text-gray-700 mb-2">
              {badge.description}
            </p>

            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRarityBadgeColor(badge.rarity)}`}
              >
                {badge.rarity.toUpperCase()}
              </Badge>
              
              <div className="text-xs text-gray-600">
                +{getBadgePoints(badge.rarity)} points
              </div>
            </div>
          </div>
        </div>

        {/* Celebratory particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </CardContent>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </Card>
  );
}

function getBadgePoints(rarity: string): number {
  switch (rarity) {
    case 'common': return 25;
    case 'rare': return 50;
    case 'epic': return 100;
    case 'legendary': return 250;
    default: return 25;
  }
}

// Hook for managing badge notifications
export function useBadgeNotifications() {
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [dismissedBadges, setDismissedBadges] = useState<Set<string>>(new Set());

  const showBadge = (badgeId: string) => {
    if (!dismissedBadges.has(badgeId)) {
      setNewBadges(prev => [...prev, badgeId]);
      
      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        dismissBadge(badgeId);
      }, 8000);
    }
  };

  const dismissBadge = (badgeId: string) => {
    setNewBadges(prev => prev.filter(id => id !== badgeId));
    setDismissedBadges(prev => new Set(prev).add(badgeId));
  };

  const dismissAllBadges = () => {
    newBadges.forEach(badgeId => {
      setDismissedBadges(prev => new Set(prev).add(badgeId));
    });
    setNewBadges([]);
  };

  const resetDismissed = () => {
    setDismissedBadges(new Set());
  };

  return {
    newBadges,
    showBadge,
    dismissBadge,
    dismissAllBadges,
    resetDismissed
  };
}
