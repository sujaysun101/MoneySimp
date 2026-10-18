'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { BarChart3, PiggyBank, WalletCards } from 'lucide-react';
import { DemoButton } from '@/components/auth/DemoButton';
import { Logo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { APP_NAME } from '@/lib/constants';
import { isDemoMode } from '@/lib/demo-client';
import { auth } from '@/lib/firebase';

export default function HomePage() {
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isDemoMode()) {
      router.replace('/dashboard');
      return;
    }
    if (!auth) {
      setReady(true);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        router.replace('/dashboard');
        return;
      }
      setReady(true);
    });
    return () => unsubscribe();
  }, [router]);

  if (!ready) return <PageSkeleton />;
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={`${APP_NAME} home`}><Logo /></Link>
        <nav className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" asChild><Link href="/sign-in">Sign in</Link></Button>
          <Button variant="outline" asChild><Link href="/sign-up">Create account</Link></Button>
          <DemoButton />
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-12 sm:px-6 md:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Personal finance</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">See where the month went.</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {APP_NAME} keeps expenses, budgets, subscriptions, and goals in one workspace. Open a sample household, or sign in and add your own numbers. A bank link is optional.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <DemoButton className="sm:w-auto" />
              <Button variant="outline" className="min-h-11" asChild>
                <Link href="/sign-up">Create account</Link>
              </Button>
            </div>
          </div>
          <img
            src="/portfolio-screenshot.png"
            alt="MoneySimp dashboard for a sample household, with cash, monthly spending, and a category chart"
            width={1440}
            height={900}
            className="w-full rounded-xl border bg-card shadow-xl"
          />
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-xl border bg-card p-6 shadow-sm">
            <WalletCards className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Expenses</h2>
            <p className="mt-2 text-sm text-muted-foreground">Log a purchase or scan a receipt. Categories stay consistent across the charts.</p>
          </article>
          <article className="rounded-xl border bg-card p-6 shadow-sm">
            <PiggyBank className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Budgets and goals</h2>
            <p className="mt-2 text-sm text-muted-foreground">Set a monthly limit per category and watch a savings target move as you add to it.</p>
          </article>
          <article className="rounded-xl border bg-card p-6 shadow-sm">
            <BarChart3 className="mb-4 h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Insights</h2>
            <p className="mt-2 text-sm text-muted-foreground">Spending by category, a six-month trend, and reminders before subscriptions renew.</p>
          </article>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {APP_NAME}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
            <a href="https://calendly.com/sujay9sundar/30min" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Book a walkthrough</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
