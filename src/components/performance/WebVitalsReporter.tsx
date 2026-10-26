"use client";
import { useEffect } from 'react';
import { onCLS, onFID, onLCP, onINP, onTTFB, onFCP, Metric } from 'web-vitals';
import { logWebVital } from '@/lib/performanceMetrics';

export function WebVitalsReporter() {
  useEffect(() => {
    const handler = (metric: Metric) => {
      const anyMetric: any = metric as any;
      logWebVital({ id: metric.id, name: metric.name, label: 'web-vital', value: metric.value, startTime: anyMetric.startTime, delta: anyMetric.delta });
    };
    onCLS(handler);
    onFID(handler);
    onLCP(handler);
    onINP(handler);
    onTTFB(handler);
    onFCP(handler);
  }, []);
  return null;
}
