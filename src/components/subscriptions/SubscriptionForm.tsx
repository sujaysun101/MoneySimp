// src/components/subscriptions/SubscriptionForm.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES } from '@/lib/constants';
import type { Subscription } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SubscriptionFormValues {
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly' | 'daily';
  nextPaymentDate: Date;
  categoryId: string;
  reminderEnabled: boolean;
  reminderDays: number;
  notes?: string;
  provider?: string;
  cancellationUrl?: string;
}

interface SubscriptionFormProps {
  onSubscriptionSubmit: (data: SubscriptionFormValues, editingSubscriptionId?: string) => void;
  editingSubscription?: Subscription | null;
  onCancelEdit?: () => void;
}

export function SubscriptionForm({ onSubscriptionSubmit, editingSubscription, onCancelEdit }: SubscriptionFormProps) {
  const [formData, setFormData] = useState<SubscriptionFormValues>({
    name: '',
    amount: 0,
    frequency: 'monthly',
    nextPaymentDate: new Date(),
    categoryId: '',
    reminderEnabled: true,
    reminderDays: 3,
    notes: '',
    provider: '',
    cancellationUrl: '',
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (editingSubscription) {
      setFormData({
        name: editingSubscription.name,
        amount: editingSubscription.amount,
        frequency: editingSubscription.frequency,
        nextPaymentDate: editingSubscription.nextPaymentDate,
        categoryId: editingSubscription.categoryId,
        reminderEnabled: editingSubscription.reminderEnabled,
        reminderDays: editingSubscription.reminderDays,
        notes: editingSubscription.notes || '',
        provider: editingSubscription.provider || '',
        cancellationUrl: editingSubscription.cancellationUrl || '',
      });
    } else {
      setFormData({
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextPaymentDate: new Date(),
        categoryId: '',
        reminderEnabled: true,
        reminderDays: 3,
        notes: '',
        provider: '',
        cancellationUrl: '',
      });
    }
  }, [editingSubscription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.amount <= 0 || !formData.categoryId) {
      return;
    }

    onSubscriptionSubmit(formData, editingSubscription?.id);
    
    if (!editingSubscription) {
      setFormData({
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextPaymentDate: new Date(),
        categoryId: '',
        reminderEnabled: true,
        reminderDays: 3,
        notes: '',
        provider: '',
        cancellationUrl: '',
      });
    }
  };

  const handleInputChange = (field: keyof SubscriptionFormValues, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Subscription Name *</Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Netflix, Spotify"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="provider">Provider (Optional)</Label>
          <Input
            id="provider"
            type="text"
            value={formData.provider}
            onChange={(e) => handleInputChange('provider', e.target.value)}
            placeholder="e.g., Netflix Inc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Billing Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value: 'monthly' | 'yearly' | 'weekly' | 'daily') => handleInputChange('frequency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => handleInputChange('categoryId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Next Payment Date *</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.nextPaymentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.nextPaymentDate ? format(formData.nextPaymentDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.nextPaymentDate}
                onSelect={(date) => {
                  if (date) {
                    handleInputChange('nextPaymentDate', date);
                    setIsDatePickerOpen(false);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reminder Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-enabled">Enable Reminders</Label>
              <Switch
                id="reminder-enabled"
                checked={formData.reminderEnabled}
                onCheckedChange={(checked) => handleInputChange('reminderEnabled', checked)}
              />
            </div>
            
            {formData.reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminder-days">Remind me (days before due date)</Label>
                <Select
                  value={formData.reminderDays.toString()}
                  onValueChange={(value) => handleInputChange('reminderDays', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day before</SelectItem>
                    <SelectItem value="3">3 days before</SelectItem>
                    <SelectItem value="5">5 days before</SelectItem>
                    <SelectItem value="7">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label htmlFor="cancellation-url">Cancellation URL (Optional)</Label>
          <Input
            id="cancellation-url"
            type="url"
            value={formData.cancellationUrl}
            onChange={(e) => handleInputChange('cancellationUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this subscription..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
        </Button>
        {editingSubscription && onCancelEdit && (
          <Button type="button" variant="outline" onClick={onCancelEdit}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
