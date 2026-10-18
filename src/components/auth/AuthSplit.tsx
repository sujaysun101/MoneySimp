'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  signInWithEmailAndPassword,
  signInWithPopup,
  type AuthProvider,
} from 'firebase/auth';
import { Logo } from '@/components/brand/Logo';
import { DemoButton } from '@/components/auth/DemoButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { establishFirebaseSession } from '@/lib/client-auth';
import { APP_NAME } from '@/lib/constants';
import { auth, googleProvider, microsoftProvider, twitterProvider } from '@/lib/firebase';
import { clearDemoClientState, isDemoMode } from '@/lib/demo-client';

const loginSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string()
    .min(8, { message: 'Use at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Include an uppercase letter.' })
    .regex(/[a-z]/, { message: 'Include a lowercase letter.' })
    .regex(/[0-9]/, { message: 'Include a number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Include a symbol.' }),
  confirmPassword: z.string().min(1, { message: 'Confirm your password.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match.',
  path: ['confirmPassword'],
});
type SignupFormValues = z.infer<typeof signupSchema>;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
      <path fill="currentColor" d="M21.35 11.1H12v2.73h5.35c-.25 1.5-1.6 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.96S8.78 6.3 12 6.3c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.7 3.7 14.55 2.7 12 2.7 6.98 2.7 2.9 6.78 2.9 11.8S6.98 20.9 12 20.9c5.5 0 9.14-3.86 9.14-9.3 0-.63-.07-1.1-.16-1.5Z" />
    </svg>
  );
}

export function AuthSplit({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const { toast } = useToast();
  const [socialPending, setSocialPending] = useState<string | null>(null);
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (isDemoMode() || auth?.currentUser) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function finishAuth(isNewUser: boolean) {
    if (isNewUser) {
      await fetch('/api/demo/end', { method: 'POST' });
      clearDemoClientState();
    }
    await establishFirebaseSession();
    localStorage.setItem('moneySimpLoggedIn', 'true');
    localStorage.setItem('moneySimpUserEmail', auth?.currentUser?.email || '');
    localStorage.setItem('moneySimpUserId', auth?.currentUser?.uid || '');
    router.push('/dashboard');
  }

  async function onLogin(values: LoginFormValues) {
    if (!auth) {
      toast({ title: 'Sign-in unavailable', description: 'Firebase did not start.', variant: 'destructive' });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Signed in', description: 'Welcome back.' });
      await finishAuth(false);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      const description = code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
        ? 'That email and password did not match an account.'
        : 'Sign-in failed. Try again.';
      toast({ title: 'Sign-in failed', description, variant: 'destructive' });
    }
  }

  async function onSignup(values: SignupFormValues) {
    if (!auth) {
      toast({ title: 'Sign-up unavailable', description: 'Firebase did not start.', variant: 'destructive' });
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: 'Account created', description: `Welcome to ${APP_NAME}.` });
      await finishAuth(true);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      const description = code === 'auth/email-already-in-use'
        ? 'That email already has an account. Sign in instead.'
        : 'Could not create the account. Try again.';
      toast({ title: 'Sign-up failed', description, variant: 'destructive' });
    }
  }

  async function onSocial(providerName: string, provider: AuthProvider) {
    if (!auth) {
      toast({ title: 'Sign-in unavailable', description: 'Firebase did not start.', variant: 'destructive' });
      return;
    }
    setSocialPending(providerName);
    try {
      const result = await signInWithPopup(auth, provider);
      const isNewUser = Boolean(getAdditionalUserInfo(result)?.isNewUser);
      toast({ title: isNewUser ? `Joined with ${providerName}` : `Signed in with ${providerName}` });
      await finishAuth(isNewUser);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      const description = code === 'auth/popup-closed-by-user'
        ? 'The sign-in window was closed before it finished.'
        : `Could not sign in with ${providerName}.`;
      toast({ title: `${providerName} failed`, description, variant: 'destructive' });
    } finally {
      setSocialPending(null);
    }
  }

  const title = mode === 'sign-in' ? 'Sign in' : 'Create your account';
  const subtitle = mode === 'sign-in'
    ? 'Pick up your expenses, budgets, and goals.'
    : 'Track spending without linking a bank on day one.';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[hsl(174,44%,14%)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo inverse wordClassName="text-white" />
        <div className="max-w-md space-y-6">
          <p className="text-sm uppercase tracking-[0.18em] text-white/70">Sample household</p>
          <h2 className="text-4xl font-semibold leading-tight">A clear picture of the month, before you connect a bank.</h2>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-xs text-white/70">Cash</p>
              <p className="mt-1 text-2xl font-semibold">$15,077</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4">
              <p className="text-xs text-white/70">Spent this month</p>
              <p className="mt-1 text-2xl font-semibold">$2,470</p>
            </div>
            <div className="col-span-2 rounded-xl bg-white/10 p-4">
              <p className="text-xs text-white/70">Budgets in range</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-4/5 rounded-full bg-[hsl(36,100%,65%)]" />
              </div>
            </div>
          </div>
          <p className="text-sm text-white/75">Figures above are the demo household, not a live customer or a linked account.</p>
        </div>
        <p className="text-sm text-white/60">Expenses, budgets, subscriptions, and goals in one workspace.</p>
      </aside>

      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link href="/" className="lg:invisible" aria-label={`${APP_NAME} home`}>
            <Logo />
          </Link>
          <Link href={mode === 'sign-in' ? '/sign-up' : '/sign-in'} className="text-sm font-medium text-primary hover:underline">
            {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-6 sm:px-8">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Open Maya Chen’s sample household. No account and no bank connection.</p>
              <DemoButton className="w-full" />
            </div>

            {mode === 'sign-in' ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4" noValidate>
                  <FormField control={loginForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={loginForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full min-h-11" disabled={loginForm.formState.isSubmitting}>
                    {loginForm.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4" noValidate>
                  <FormField control={signupForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={signupForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full min-h-11" disabled={signupForm.formState.isSubmitting}>
                    {signupForm.formState.isSubmitting ? 'Creating account…' : 'Create account'}
                  </Button>
                </form>
              </Form>
            )}

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full min-h-11" disabled={!!socialPending} onClick={() => onSocial('Google', googleProvider)}>
                <GoogleIcon /> <span className="ml-2">{socialPending === 'Google' ? 'Waiting for Google…' : 'Continue with Google'}</span>
              </Button>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" className="min-h-11" disabled={!!socialPending} onClick={() => onSocial('Microsoft', microsoftProvider)}>
                  Microsoft
                </Button>
                <Button type="button" variant="outline" className="min-h-11" disabled={!!socialPending} onClick={() => onSocial('X', twitterProvider)}>
                  X
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
