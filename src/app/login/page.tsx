
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
import Link from "next/link";
import { auth, googleProvider, microsoftProvider, twitterProvider } from '@/lib/firebase';
import { 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  type AuthProvider,
  getAdditionalUserInfo
} from 'firebase/auth';

// Placeholder SVG icons
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.19,4.73C14.76,4.73 16.04,5.87 17.01,6.74L19.27,4.49C17.22,2.62 14.92,1.5 12.19,1.5C7.22,1.5 3.31,5.36 3.31,12C3.31,18.64 7.22,22.5 12.19,22.5C17.14,22.5 21.09,18.96 21.09,12.33C21.09,11.76 21.35,11.1 21.35,11.1V11.1Z" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.4,11.4H0V0H11.4Zm0,12.6H0V12.6H11.4ZM24,11.4H12.6V0H24Zm0,12.6H12.6V12.6H24Z"/>
  </svg>
);


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 

  useEffect(() => {
    if (auth.currentUser) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Login Successful", description: "Welcome back!" });
        router.push('/dashboard'); // Redirect handled by RootLayout's onAuthStateChanged too
      } catch (error: any) {
        console.error("Login failed:", error);
        let description = "Please check your credentials and try again.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
          description = "No account found with this email. Please sign up or check your email address.";
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = "Incorrect password. Please try again.";
        } else if (error.message) {
          description = error.message;
        }
        toast({ title: "Login Failed", description, variant: "destructive" });
      }
    } else {
      toast({ title: "Login Failed", description: "Please enter email and password.", variant: "destructive" });
    }
  };

  const handleEmailPasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Signup Failed", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (email && password) {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        // Clear any potentially existing local storage data for new user
        localStorage.removeItem('pennywise-budgets'); 
        localStorage.removeItem('pennywise-expenses'); 
        
        toast({ title: "Signup Successful", description: `Welcome to ${APP_NAME}!` });
        router.push('/dashboard'); // Redirect handled by RootLayout's onAuthStateChanged too
      } catch (error: any) {
        console.error("Signup failed:", error);
        let description = "Could not create account. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
          description = "This email is already registered. Please log in instead.";
        } else if (error.code === 'auth/weak-password') {
          description = "The password is too weak. Please choose a stronger password.";
        } else if (error.message) {
          description = error.message;
        }
        toast({ title: "Signup Failed", description, variant: "destructive" });
      }
    } else {
      toast({ title: "Signup Failed", description: "Please fill in all fields.", variant: "destructive" });
    }
  };

  const handleSocialLogin = async (providerName: string, authProvider: AuthProvider) => {
    if (providerName === "X") {
        toast({
          title: "X/Twitter Login",
          description: "X/Twitter login setup can be complex and may require additional configuration in your Firebase project and X Developer Portal for full functionality.",
          duration: 7000,
        });
        // Proceed with attempt for X, but with the warning
    }
    try {
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      // RootLayout's onAuthStateChanged will set 'moneySimpLoggedIn' and 'moneySimpUserEmail'

      if (additionalInfo?.isNewUser) {
        localStorage.removeItem('pennywise-budgets'); 
        localStorage.removeItem('pennywise-expenses');
        toast({ title: `Signed up with ${providerName}`, description: `Welcome to ${APP_NAME}!` });
      } else {
        toast({ title: `Logged in with ${providerName}`, description: "Welcome back!" });
      }
      router.push('/dashboard'); // Redirect handled by RootLayout's onAuthStateChanged too
    } catch (error: any) {
      console.error(`Error with ${providerName} login:`, error);
      let errorMessage = error.message || `Could not sign in with ${providerName}.`;
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials. Try signing in using a provider associated with this email.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = `Sign-in popup closed before completion.`;
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = `Sign-in cancelled. Multiple popups might be open.`;
      }
      toast({
        title: `${providerName} Login Failed`,
        description: errorMessage,
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  const SocialLoginButtons = () => (
    <div className="space-y-4">
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('Google', googleProvider)}>
        <GoogleIcon /> <span className="ml-2">Continue with Google</span>
      </Button>
      <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('X', twitterProvider)}>
        <XIcon /> <span className="ml-2">Continue with X</span>
      </Button>
      <Button variant="outline" className="w-full" onClick={() => handleSocialLogin('Microsoft', microsoftProvider)}>
        <MicrosoftIcon /> <span className="ml-2">Continue with Microsoft</span>
      </Button>
    </div>
  );

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
              <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
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
              <SocialLoginButtons />
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
              <form onSubmit={handleEmailPasswordSignup} className="space-y-6">
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
              <SocialLoginButtons />
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

    