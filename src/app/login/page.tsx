// src/app/login/page.tsx
"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_NAME } from "@/lib/constants";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react"; 
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from "@/lib/utils";

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

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }).min(1, { message: "Email is required." }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain an uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain a number." })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain a special character.\nRequirements:\n- At least 8 characters\n- One uppercase letter\n- One lowercase letter\n- One number\n- One special character" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"], 
});
type SignupFormValues = z.infer<typeof signupSchema>;


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    // Check if already logged in via Firebase on component mount
    if (auth.currentUser) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleBookDemoClick = () => {
    // Logic for booking a demo, e.g., opening Calendly
    // For now, it's an external link handled by <a> tag
  };

  const handleEmailPasswordLogin = async (values: LoginFormValues) => {
    if (!values.email && !values.password) {
      toast({ title: "Login Failed", description: "Email and password are required.", variant: "destructive" });
      return;
    }
    if (!values.email) {
      toast({ title: "Login Failed", description: "Email is required.", variant: "destructive" });
      return;
    }
    if (!values.password) {
      toast({ title: "Login Failed", description: "Password is required.", variant: "destructive" });
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Login failed:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email' || error.code === 'auth/invalid-credential') {
        description = "Invalid credentials. Please check your email and password, or sign up if you don't have an account.";
      } else if (error.code === 'auth/wrong-password') {
         description = "Incorrect password. Please try again.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: "Login Failed", description, variant: "destructive" });
    }
  };

  const handleEmailPasswordSignup = async (values: SignupFormValues) => {
     if (!values.email || !values.password || !values.confirmPassword) {
      let missingFields = [];
      if (!values.email) missingFields.push("Email");
      if (!values.password) missingFields.push("Password");
      if (!values.confirmPassword) missingFields.push("Confirm Password");
      toast({ title: "Signup Failed", description: `${missingFields.join(", ")} is required.`, variant: "destructive" });
      return;
    }
    // Password match is handled by Zod schema resolver now.
    
    try {
      await createUserWithEmailAndPassword(auth, values.email, values.password);
      // Clear any potential guest data on new user signup
      localStorage.removeItem('moneySimp-budgets'); 
      localStorage.removeItem('moneySimp-expenses'); 
      
      toast({ title: "Signup Successful", description: `Welcome to ${APP_NAME}!` });
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Signup failed:", error);
      let description = "Could not create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already registered. Please log in instead.";
      } else if (error.code === 'auth/weak-password') {
        // This is generally caught by Zod, but as a Firebase fallback
        description = "Password is too weak according to Firebase. Ensure it meets requirements.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: "Signup Failed", description, variant: "destructive" });
    }
  };

  const handleSocialLogin = async (providerName: string, authProvider: AuthProvider) => {
    if (providerName === "X") {
        toast({
          title: "X/Twitter Login",
          description: "X/Twitter login setup can be complex and may require additional configuration in your Firebase project and X Developer Portal for full functionality.",
          duration: 7000,
        });
        // Optionally, you might choose to not proceed further for X if it's known to be problematic without setup.
        // return; 
    }
    try {
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        // Clear any potential guest data on new user signup via social
        localStorage.removeItem('moneySimp-budgets'); 
        localStorage.removeItem('moneySimp-expenses');
        toast({ title: `Signed up with ${providerName}`, description: `Welcome to ${APP_NAME}!` });
      } else {
        toast({ title: `Logged in with ${providerName}`, description: "Welcome back!" });
      }
      router.push('/dashboard');
    } catch (error: any) {
      console.error(`Error with ${providerName} login:`, error);
      let errorMessage = `Could not sign in with ${providerName}. Please try again.`;
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials. Try signing in using a provider associated with this email.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = `The sign-in popup was closed before completing the process. Please try again if you wish to sign in with ${providerName}.`;
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = `Sign-in cancelled. Multiple popups might be open. Please try again.`;
      } else if (error.message) {
        errorMessage = error.message;
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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/" passHref className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-piggy-bank"><path d="M10 15.5V14a2 2 0 1 0-4 0v1.5"/><path d="M8 15.5v4.5H6a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h2.4a2 2 0 0 1 1.6.8l2.1 2.9c.3.4.9.6 1.4.6H16a2 2 0 0 0 2-2V9a2 2 0 1 0-4 0v1.5a2 2 0 1 1-4 0V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2.5c0 .8.4 1.5.9 1.9L5 15"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/></svg>
          <h1 className="text-2xl font-bold text-primary">{APP_NAME}</h1>
        </Link>
        <nav className="space-x-4">
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

      <main className="flex flex-col items-center justify-center flex-grow p-4">
        <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Welcome Back!</h2>
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
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleEmailPasswordLogin)} className="space-y-6">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                      {loginForm.formState.isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
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
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(handleEmailPasswordSignup)} className="space-y-6">
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="you@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a strong password" {...field} />
                          </FormControl>
                          <FormMessage /> 
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Re-enter your password" {...field} />
                          </FormControl>
                          <FormMessage /> 
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                      {signupForm.formState.isSubmitting ? "Signing up..." : "Sign Up"}
                    </Button>
                  </form>
                </Form>
                <SocialLoginButtons />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Go back to <Link href="/" className="underline hover:text-primary">Homepage</Link>.
        </p>
      </main>
    </div>
  );
}
