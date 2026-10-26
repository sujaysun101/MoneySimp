// src/components/income/IncomeSourceForm.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  Plus, 
  Calendar, 
  TrendingUp,
  Building2,
  Briefcase,
  Banknote,
  Info
} from 'lucide-react';

// Make sure these types are exported from '@/lib/types'. If 'IncomeType' is missing, define and export it there.
// Example fallback if 'IncomeType' is not exported:
import type { IncomeSource as BaseIncomeSource } from '@/lib/types';

// Define IncomeFrequency type here if not exported from '@/lib/types'
type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time';

type IncomeType = 'salary' | 'freelance' | 'business' | 'investment' | 'other';

interface IncomeSourceFormProps {
  onSubmit: (income: Omit<BaseIncomeSource, 'id'>) => void;
  onCancel?: () => void;
  initialData?: Partial<BaseIncomeSource>;
  className?: string;
}

const INCOME_TYPES: { value: IncomeType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'salary',
    label: 'Salary',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Regular employment income'
  },
  {
    value: 'freelance',
    label: 'Freelance',
    icon: <Briefcase className="h-4 w-4" />,
    description: 'Project-based work income'
  },
  {
    value: 'business',
    label: 'Business',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Business revenue or profits'
  },
  {
    value: 'investment',
    label: 'Investment',
    icon: <Banknote className="h-4 w-4" />,
    description: 'Dividends, interest, capital gains'
  },
  {
    value: 'other',
    label: 'Other',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Other income sources (including rental)'
  }
];

const FREQUENCY_OPTIONS: { value: IncomeFrequency; label: string; multiplier: number }[] = [
  { value: 'weekly', label: 'Weekly', multiplier: 52 },
  { value: 'biweekly', label: 'Bi-weekly', multiplier: 26 },
  { value: 'monthly', label: 'Monthly', multiplier: 12 },
  { value: 'quarterly', label: 'Quarterly', multiplier: 4 },
  { value: 'yearly', label: 'Yearly', multiplier: 1 },
  { value: 'one-time', label: 'One-time', multiplier: 0 }
];

// Helper function to safely convert various date formats to ISO string for HTML date input
const safeDateToString = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  
  let d: Date;
  if (typeof date === 'string') {
    d = new Date(date);
  } else if (date instanceof Date) {
    d = date;
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    // Handle Firestore Timestamp
    d = (date as any).toDate();
  } else {
    return '';
  }
  
  // Check if the date is valid
  if (isNaN(d.getTime())) {
    return '';
  }
  
  return d.toISOString().split('T')[0];
};

export function IncomeSourceForm({ 
  onSubmit, 
  onCancel, 
  initialData,
  className 
}: IncomeSourceFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: (initialData?.category || 'salary') as IncomeType, // Map category to type for form UI
    amount: initialData?.amount?.toString() || '',
    frequency: initialData?.frequency || 'monthly' as IncomeFrequency,
    isActive: initialData?.isActive !== false,
    startDate: safeDateToString(initialData?.startDate) || new Date().toISOString().split('T')[0],
    endDate: safeDateToString(initialData?.endDate),
    description: '', // Not part of main type, but keep for form UI
    taxWithholding: '', // Not part of main type, but keep for form UI
    isGuaranteed: false // Not part of main type, but keep for form UI
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedIncomeType = INCOME_TYPES.find(type => type.value === formData.type);
  const selectedFrequency = FREQUENCY_OPTIONS.find(freq => freq.value === formData.frequency);

  // Calculate annualized amount for display
  const annualizedAmount = formData.amount && selectedFrequency 
    ? parseFloat(formData.amount) * selectedFrequency.multiplier
    : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Income source name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (formData.taxWithholding && parseFloat(formData.taxWithholding) < 0) {
      newErrors.taxWithholding = 'Tax withholding cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const incomeData: Omit<BaseIncomeSource, 'id'> = {
      name: formData.name.trim(),
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      isActive: formData.isActive,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      category: formData.type, // Map type to category for the main IncomeSource interface
      isRecurring: (initialData && 'isRecurring' in initialData && typeof initialData.isRecurring === 'boolean') ? initialData.isRecurring : true
    };

    onSubmit(incomeData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {initialData ? 'Edit Income Source' : 'Add Income Source'}
        </CardTitle>
        <CardDescription>
          Configure your income sources for accurate cash flow forecasting
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Income Source Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Acme Corp Salary, Freelance Design"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Income Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: IncomeType) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income type" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount and Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className={`pl-10 ${errors.amount ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <Select 
                value={formData.frequency} 
                onValueChange={(value: IncomeFrequency) => handleInputChange('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Annualized Amount Display */}
          {annualizedAmount > 0 && formData.frequency !== 'one-time' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Estimated annual income:</span>
                  <Badge variant="secondary" className="ml-2">
                    ${annualizedAmount.toLocaleString()}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`pl-10 ${errors.startDate ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`pl-10 ${errors.endDate ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxWithholding">Tax Withholding (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="taxWithholding"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.taxWithholding}
                  onChange={(e) => handleInputChange('taxWithholding', e.target.value)}
                  placeholder="0.00"
                  className={`pl-10 ${errors.taxWithholding ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.taxWithholding && (
                <p className="text-sm text-destructive">{errors.taxWithholding}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Amount withheld for taxes (per payment period)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Additional notes about this income source..."
                rows={3}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGuaranteed"
                checked={formData.isGuaranteed}
                onChange={(e) => handleInputChange('isGuaranteed', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                aria-label="This is guaranteed income (salary, contract)"
                title="This is guaranteed income (salary, contract)"
              />
              <Label htmlFor="isGuaranteed" className="text-sm font-normal">
                This is guaranteed income (salary, contract)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                aria-label="This income source is currently active"
                title="This income source is currently active"
              />
              <Label htmlFor="isActive" className="text-sm font-normal">
                This income source is currently active
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              {initialData ? 'Update Income Source' : 'Add Income Source'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default IncomeSourceForm;
