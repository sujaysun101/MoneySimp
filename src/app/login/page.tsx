// src/app/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // For signup

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem('moneySimpLoggedIn')) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    console.log("Login attempt:", { email, password });
    // In a real app, you would call your auth API here
    // For demo purposes, we'll assume login is successful if email and password are not empty
    if (email && password) {
      localStorage.setItem('moneySimpLoggedIn', 'true');
      localStorage.setItem('moneySimpUserEmail', email); // Store email for display, etc.
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/dashboard'); // Redirect to dashboard
    } else {
      toast({ title: "Login Failed", description: "Please enter email and password.", variant: "destructive" });
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate signup
    console.log("Signup attempt:", { email, password });
    if (password !== confirmPassword) {
      toast({ title: "Signup Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (email && password) {
      // In a real app, you'd check if user exists, then create user
      localStorage.setItem('moneySimpLoggedIn', 'true');
      localStorage.setItem('moneySimpUserEmail', email);
      // Clear any existing app data for the "new" user
      localStorage.removeItem('pennywise-budgets'); // Note: pennywise key used from previous app state
      localStorage.removeItem('pennywise-expenses'); // Note: pennywise key used from previous app state
      
      toast({ title: "Signup Successful", description: `Welcome to ${APP_NAME}!` });
      router.push('/dashboard'); // Redirect to dashboard
    } else {
      toast({ title: "Signup Failed", description: "Please fill in all fields.", variant: "destructive" });
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-piggy-bank"><path d="M10 15.5V14a2 2 0 1 0-4 0v1.5"/><path d="M8 15.5v4.5H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l2.1 2.9c.3.4.9.6 1.4.6H16a2 2 0 0 0 2-2V9a2 2 0 1 0-4 0v1.5a2 2 0 1 1-4 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.5c0 .8.4 1.5.9 1.9L5 15"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/></svg>
            <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
        </div>
        <p className="text-muted-foreground">Access your personalized finance tracker.</p>
      </div>
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Login to Your Account</CardTitle>
              <CardDescription>Enter your credentials to continue.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Create New Account</CardTitle>
              <CardDescription>Join {APP_NAME} today!</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" placeholder="Choose a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input id="signup-confirm-password" type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Sign Up</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
       <p className="mt-8 text-center text-sm text-muted-foreground">
        Go back to <Link href="/" className="underline hover:text-primary">Homepage</Link>.
      </p>
    </div>
  );
}
