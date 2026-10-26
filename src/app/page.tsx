"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Bot,
  Zap,
  Globe,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  PieChart,
  Calendar,
  Layers,
  ChevronRight,
  Receipt,
  HelpCircle
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistSubmitted(true);
    setTimeout(() => {
      setWaitlistEmail('');
    }, 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background radial glows using exact brand palette */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute top-[800px] -right-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px]" />
        <div className="absolute top-[1600px] -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px]" />
      </div>

      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/85 border-b border-border/60 transition-all">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 15.5V14a2 2 0 1 0-4 0v1.5" />
                <path d="M8 15.5v4.5H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l2.1 2.9c.3.4.9.6 1.4.6H16a2 2 0 0 0 2-2V9a2 2 0 1 0-4 0v1.5a2 2 0 1 1-4 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.5c0 .8.4 1.5.9 1.9L5 15" />
                <path d="M2 9v1c0 1.1.9 2 2 2h1" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-foreground">{APP_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#ai-insights" className="hover:text-primary transition-colors">AI Advisor</a>
            <a href="#cash-flow" className="hover:text-primary transition-colors">Cash Flow</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                  Open Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="font-medium hover:text-primary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl text-center">
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-medium mb-8 hover:bg-primary/15 transition-all cursor-default">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Genkit-Powered AI Financial Intelligence</span>
            <span className="hidden sm:inline text-primary/60">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-accent uppercase tracking-wider">v0.1.1 Live</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            Master Your Money.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Simplify Your Life.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Autonomous expense tracking, forward-looking cash flow simulations, and personalized AI tips — engineered to put you in complete control.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25">
                Launch App (Instant Admin Test)
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a
              href="https://calendly.com/sujay9sundar/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-13 px-7 text-base font-semibold border-border hover:bg-card">
                Schedule a Demo
              </Button>
            </a>
          </div>

          {/* Admin Test Callout */}
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-card border border-border shadow-sm text-xs text-muted-foreground mb-16 font-mono">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Tester Credentials: username: <strong>admin</strong> | password: <strong>123</strong></span>
          </div>

          {/* LIVE INTERACTIVE UI MOCKUP */}
          <div className="relative mx-auto max-w-4xl rounded-2xl border border-border bg-card/80 p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-left">
            {/* Window bar */}
            <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-accent/70" />
                <div className="w-3 h-3 rounded-full bg-primary/70" />
                <span className="text-xs text-muted-foreground font-mono ml-2">moneysimp.app/dashboard</span>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs bg-primary/5">
                ● Live Sync Active
              </Badge>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Total Balance</span>
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">$14,820.50</div>
                <span className="text-[11px] font-medium text-primary mt-1 inline-block">↑ +14.2% vs last month</span>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Monthly Spending</span>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className="text-2xl font-bold text-foreground">$2,340.00</div>
                <span className="text-[11px] font-medium text-muted-foreground mt-1 inline-block">68% of monthly budget</span>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Cash Flow Forecast</span>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">+$3,120.00</div>
                <span className="text-[11px] font-medium text-primary mt-1 inline-block">Projected EOM Surplus</span>
              </div>
            </div>

            {/* AI Advisor Preview Card */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    Genkit AI Insight
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent">Optimization</span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have 2 redundant digital subscriptions ($38/mo). Canceling them adds $456 to your year-end investment target.
                  </p>
                </div>
              </div>
              <Button size="sm" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium">
                Apply Action
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS BANNER */}
      <section className="relative z-10 py-12 border-y border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-primary">$4.8M+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Expenses Analyzed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-accent">99.4%</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Forecast Precision</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-primary">15,000+</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Budgets Managed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-foreground">0ms</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">Data Lock-in</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section id="features" className="relative z-10 py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-bold tracking-widest text-primary mb-3">Engineered For Clarity</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Everything You Need to Scale Your Net Worth
            </h3>
            <p className="text-base sm:text-lg text-muted-foreground">
              Built with precision tools that convert raw financial transactions into actionable wealth strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Bot className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Genkit AI Advisor</CardTitle>
                <CardDescription>
                  Deep learning models analyze month-over-month habits to deliver proactive, tailor-made saving opportunities.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Predictive Cash Flow</CardTitle>
                <CardDescription>
                  Simulate future balances based on recurring subscriptions, historical bills, and upcoming income streams.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Receipt className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Tax Deductions & Reports</CardTitle>
                <CardDescription>
                  Tag business expenses and generate compliant deduction logs with intelligent tax category suggestions.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-2">
                  <Globe className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Multi-Currency Engine</CardTitle>
                <CardDescription>
                  Automatic exchange rate conversion across USD, EUR, GBP, CAD, and 30+ currencies with real-time updates.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Award className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Gamified Milestones</CardTitle>
                <CardDescription>
                  Stay motivated by unlocking achievement badges, saving streaks, and level-ups as you crush budget goals.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border bg-card/70 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Bank-Grade Privacy</CardTitle>
                <CardDescription>
                  Zero external data tracking. Client-side encryption and strict credential protection for your assets.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* DETAILED SECTION: AI INSIGHTS */}
      <section id="ai-insights" className="relative z-10 py-20 px-4 sm:px-6 bg-card/30 border-y border-border/60">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                <Bot className="w-3.5 h-3.5" /> Next-Gen AI Insights
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6 leading-tight">
                An AI accountant that works 24/7 in your pocket.
              </h3>
              <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                Traditional spreadsheets only tell you where your money went. {APP_NAME} leverages Google Genkit to tell you where your money should go.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground text-sm font-semibold">Automatic Bill OCR:</strong>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload a receipt image and extract merchant, category, and total in seconds.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground text-sm font-semibold">Anomaly & Price-Hike Alerts:</strong>
                    <p className="text-xs text-muted-foreground mt-0.5">Get warned when utility rates spike or silent subscription renewals hit.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground text-sm font-semibold">Automated Goal Tracking:</strong>
                    <p className="text-xs text-muted-foreground mt-0.5">Dynamically recalculates how much you can spend per day to hit vacation or house savings goals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Callout */}
            <div className="p-6 rounded-2xl border border-border bg-card shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                    AI
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Monthly Smart Audit</div>
                    <div className="text-[11px] text-muted-foreground">Generated 10 minutes ago</div>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">98% Accuracy</Badge>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background border border-border text-xs">
                  <div className="flex items-center justify-between font-medium text-foreground mb-1">
                    <span>Dining & Delivery</span>
                    <span className="text-accent font-semibold">$540 / $400 budget</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-accent h-1.5 rounded-full w-[135%]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    ⚠️ You are 35% over average pace. Switching 2 meals/week to home dining saves $120.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-background border border-border text-xs">
                  <div className="flex items-center justify-between font-medium text-foreground mb-1">
                    <span>Investment & Savings</span>
                    <span className="text-primary font-semibold">$1,200 deposited</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full w-[100%]" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    🎉 Monthly emergency fund goal fully achieved!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="relative z-10 py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Common Questions</h2>
            <h3 className="text-3xl font-extrabold text-foreground">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  How do I test the app right now?
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm pt-2">
                  Click <strong>&quot;Launch App&quot;</strong> or go to <Link href="/login" className="text-primary underline">/login</Link>. You can click the <strong>Quick Login</strong> button or use username: <code>admin</code> and password: <code>123</code>.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  Does {APP_NAME} support bank integrations?
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm pt-2">
                  Yes! {APP_NAME} features banking feeds via Yodlee FastLink, letting you sync accounts, import transactions, and automatically detect recurring subscriptions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="py-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  How is my financial data secured?
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm pt-2">
                  All sensitive fields are stored with cryptographic hashing and salt verification, with strict session token isolation and route protection.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="relative z-10 py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-teal-600 p-8 sm:p-14 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

            <h3 className="text-3xl sm:text-5xl font-black mb-4 relative z-10">
              Take Charge of Your Finances Today
            </h3>
            <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto mb-8 relative z-10">
              Join thousands of users simplifying their cash flow, crushing debt, and accelerating their wealth.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 bg-card text-foreground hover:bg-card/90 font-bold shadow-lg">
                  Get Started Free
                </Button>
              </Link>
              <a
                href="https://calendly.com/sujay9sundar/30min"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="h-12 px-8 bg-transparent border-white/40 text-white hover:bg-white/10 font-bold">
                  Book A Demo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border/70 py-10 bg-card/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">{APP_NAME}</span>
            <span>• © {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-primary transition-colors">Sign In</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <a href="https://github.com/sujaysun101/MoneySimp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
