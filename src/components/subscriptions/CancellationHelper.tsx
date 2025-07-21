// src/components/subscriptions/CancellationHelper.tsx
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, Phone, Mail, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Subscription } from '@/lib/types';

interface CancellationHelperProps {
  subscription: Subscription;
}

interface CancellationResult {
  success: boolean;
  message: string;
  cancellationId?: string;
  estimatedCancellationDate?: string;
}

export function CancellationHelper({ subscription }: CancellationHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CancellationResult | null>(null);

  const cancellationMethods = [
    { value: 'website', label: 'Website/Manual', icon: Globe, description: 'Get direct link to cancellation page' },
    { value: 'email', label: 'Email Request', icon: Mail, description: 'Send cancellation email (requires email)' },
    { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Schedule cancellation call (requires phone)' },
    { value: 'api', label: 'Automatic', icon: CheckCircle, description: 'Attempt automatic cancellation via API' },
  ];

  const handleCancellation = async () => {
    if (!selectedMethod) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          provider: subscription.provider || subscription.name,
          cancellationMethod: selectedMethod,
          userEmail: selectedMethod === 'email' ? userEmail : undefined,
          userPhone: selectedMethod === 'phone' ? userPhone : undefined,
        }),
      });

      const data: CancellationResult = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process cancellation request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isMethodValid = () => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'email' && !userEmail.trim()) return false;
    if (selectedMethod === 'phone' && !userPhone.trim()) return false;
    return true;
  };

  const resetForm = () => {
    setSelectedMethod('');
    setUserEmail('');
    setUserPhone('');
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Cancel Subscription
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel {subscription.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Cancelling this subscription will stop future payments of ${subscription.amount.toFixed(2)} {subscription.frequency}.
            </AlertDescription>
          </Alert>

          {!result && (
            <>
              <div className="space-y-2">
                <Label>Cancellation Method</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose cancellation method" />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        <div className="flex items-center gap-2">
                          <method.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{method.label}</div>
                            <div className="text-xs text-muted-foreground">{method.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMethod === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="email">Your Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              )}

              {selectedMethod === 'phone' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Your Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              )}

              {selectedMethod === 'website' && subscription.cancellationUrl && (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    You will be redirected to {subscription.provider || subscription.name}'s cancellation page.
                  </AlertDescription>
                </Alert>
              )}

              {selectedMethod === 'api' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    We'll attempt to cancel your subscription automatically. This may take a few moments.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {result.message}
                {result.cancellationId && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Cancellation ID: {result.cancellationId}
                    </Badge>
                  </div>
                )}
                {result.estimatedCancellationDate && (
                  <div className="mt-1 text-sm">
                    Estimated cancellation: {new Date(result.estimatedCancellationDate).toLocaleDateString()}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!result ? (
              <>
                <Button
                  onClick={handleCancellation}
                  disabled={!isMethodValid() || isLoading}
                  className="flex-1"
                  variant={selectedMethod === 'website' ? 'outline' : 'default'}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : selectedMethod === 'website' ? (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  ) : null}
                  {selectedMethod === 'website' ? 'Open Cancellation Page' : 'Start Cancellation'}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsOpen(false)} className="flex-1">
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
