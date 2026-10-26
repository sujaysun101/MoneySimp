"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Metric { id?: string; name: string; value: number; ts?: number; uid?: string; }

export default function MetricsViewerClient() {
  const [localMetrics, setLocalMetrics] = useState<Metric[]>([]);
  const [firestoreMetrics, setFirestoreMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setLocalMetrics(data.metrics || []);
      setFirestoreMetrics(data.firestore || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function clearAll() {
    if (!confirm('Clear metrics (local + recent Firestore batch)?')) return;
    await fetch('/api/metrics?clear=1');
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Metrics Admin</h1>
        <div className="space-x-2">
          <button className="px-3 py-2 rounded bg-secondary" onClick={load}>Refresh</button>
          <button className="px-3 py-2 rounded bg-destructive text-destructive-foreground" onClick={clearAll}>Clear</button>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {loading && <div>Loading...</div>}
      {!loading && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>In-Memory (Recent {localMetrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm max-h-80 overflow-auto">
                {localMetrics.map((m, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b py-1">
                    <span>{m.name}</span>
                    <span className="tabular-nums">{Math.round(m.value * 100) / 100}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Firestore (Recent {firestoreMetrics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm max-h-80 overflow-auto">
                {firestoreMetrics.map((m, i) => (
                  <li key={m.id || i} className="flex justify-between gap-2 border-b py-1">
                    <span>{m.name}</span>
                    <span className="tabular-nums">{Math.round(m.value * 100) / 100}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Data auto-refreshes only on manual action. Consider WebSocket or SSE for live view.</p>
    </div>
  );
}
