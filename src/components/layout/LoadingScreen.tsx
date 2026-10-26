"use client";
import React from 'react';

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="space-y-4 text-center animate-pulse">
        <div className="h-10 w-10 mx-auto rounded-full bg-primary/20" />
        <div className="h-4 w-48 mx-auto rounded bg-muted" />
        <div className="h-4 w-32 mx-auto rounded bg-muted/70" />
      </div>
    </div>
  );
}
