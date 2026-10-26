"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/lib/constants';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from') || '/dashboard';
  const { login, signup } = useAuth();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDisplayName, setSignupDisplayName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier || !loginPassword) {
      setLoginError('Please enter both username/email and password.');
      return;
    }

    setLoginLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoginIdentifier('admin');
    setLoginPassword('123');
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login('admin', '123');
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login as admin.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupUsername || !signupEmail || !signupPassword) {
      setSignupError('All required fields must be filled.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 3) {
      setSignupError('Password must be at least 3 characters.');
      return;
    }

    setSignupLoading(true);
    try {
      await signup(signupUsername, signupEmail, signupPassword, signupDisplayName || signupUsername);
      router.push(from);
      router.refresh();
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
      {/* Quick Testing & Admin Card */}
      <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Admin & Tester Access</p>
            <p className="text-[11px] text-muted-foreground font-mono">user: <strong>admin</strong> | pass: <strong>123</strong></p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleQuickAdminLogin}
          disabled={loginLoading}
          className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-medium"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Quick Login
        </Button>
      </div>

      <Card className="shadow-2xl border-border/60 backdrop-blur-md bg-card/95">
        <Tabs defaultValue="login" className="w-full">
          <CardHeader className="pb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
          </CardHeader>

          {/* TAB: LOGIN */}
          <TabsContent value="login">
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Username or Email</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      type="text"
                      placeholder="admin or user@example.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="pl-9 text-sm"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">Password</label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-9 pr-10 text-sm"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 font-medium"
                  disabled={loginLoading}
                >
                  {loginLoading ? 'Signing in...' : 'Sign In'}
                  {!loginLoading && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          {/* TAB: SIGNUP */}
          <TabsContent value="signup">
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-3.5">
                {signupError && (
                  <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                    {signupError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Username</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      type="text"
                      placeholder="johndoe"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Display Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe (Optional)"
                    value={signupDisplayName}
                    onChange={(e) => setSignupDisplayName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Choose a password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-9 pr-10 text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="text-sm"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 font-medium"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Creating account...' : 'Create Account'}
                  {!signupLoading && <ArrowRight className="w-4 h-4 ml-1.5" />}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Want to explore first?{' '}
        <Link href="/" className="font-semibold text-primary underline underline-offset-2 hover:opacity-80">
          Back to Homepage
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blurs using brand colors */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
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
          <span className="text-3xl font-extrabold tracking-tight text-foreground">{APP_NAME}</span>
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Smart personal finance, AI forecasting, and budget intelligence
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
