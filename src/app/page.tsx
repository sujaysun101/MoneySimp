// src/app/page.tsx - Smart homepage with auth-based routing
"use client"; // Ensure this is the very first line

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";
import { Mail, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import Image from "next/legacy/image";
import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Redirect authenticated users to dashboard
      if (user) {
        console.log('User authenticated, redirecting to dashboard:', user.email);
        router.push('/dashboard');
      } else {
        console.log('No authenticated user, showing landing page');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, they'll be redirected to dashboard
  // This renders the landing page for unauthenticated users
  return <LandingPage />;
}

function LandingPage() {
  const handleWaitlistSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Here you would typically send the email to your backend or a service
    alert('Waitlist form submitted!');
    // Optionally reset the form: (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/" passHref className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-piggy-bank"><path d="M10 15.5V14a2 2 0 1 0-4 0v1.5"/><path d="M8 15.5v4.5H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l2.1 2.9c.3.4.9.6 1.4.6H16a2 2 0 0 0 2-2V9a2 2 0 1 0-4 0v1.5a2 2 0 1 1-4 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.5c0 .8.4 1.5.9 1.9L5 15"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/></svg>
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
        </Link>
        <nav className="space-x-4">
          <Link href="/login" passHref>
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/dashboard" passHref>
            <Button variant="secondary">Go to App</Button>
          </Link>
          <a
            href="https://calendly.com/sujay9sundar/30min"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Book A Demo
          </a>
        </nav>
      </header>

      <main className="flex-grow container mx-auto py-12 md:py-20 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
          Welcome to {APP_NAME}
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10">
          Your personified finance tracker!
        </p>

        <div className="mb-12 w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Join the Waitlist</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleWaitlistSubmit}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-grow text-base"
                  aria-label="Email for waitlist"
                  required
                />
                <Button type="submit" className="w-full sm:w-auto">
                  <Mail className="mr-2 h-5 w-5" /> Join Waitlist
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <div className="relative w-full max-w-3xl aspect-video rounded-lg shadow-2xl overflow-hidden">
            <Image
                src="https://placehold.co/1200x675.png"
                alt="App Screenshot Placeholder"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                data-ai-hint="app interface finance"
            />
        </div>

        <section className="mt-20 w-full max-w-5xl">
            <h3 className="text-3xl font-bold text-foreground mb-8">Features</h3>
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center"><TrendingUp className="mr-2 text-primary"/>Track Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Easily log and categorize your spending.</p>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center"><DollarSign className="mr-2 text-primary"/>Set Budgets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Create and manage budgets to stay on track.</p>
                    </CardContent>
                </Card>
                 <Card className="shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center"><BarChart3 className="mr-2 text-primary"/>Gain Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Visualize your financial habits with charts.</p>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>

      <footer className="container mx-auto py-6 text-center text-muted-foreground border-t">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </footer>
    </div>
  );
}
