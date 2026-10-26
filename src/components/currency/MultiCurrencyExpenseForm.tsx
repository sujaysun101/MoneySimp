// src/components/currency/MultiCurrencyExpenseForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  DollarSign, 
  MapPin, 
  RefreshCw,
  Calculator,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe
} from 'lucide-react';

import { CurrencyUtils } from '@/lib/currencyUtils';
import type { Currency, CurrencyConversion, Expense } from '@/lib/types';

interface MultiCurrencyExpenseFormProps {
  primaryCurrency: string;
  autoConvert?: boolean;
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  onCancel?: () => void;
  initialData?: Partial<Expense>;
  className?: string;
}

export function MultiCurrencyExpenseForm({
  primaryCurrency,
  autoConvert = true,
  onSubmit,
  onCancel,
  initialData,
  className
}: MultiCurrencyExpenseFormProps) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount?.toString() || '',
    originalAmount: initialData?.originalAmount?.toString() || '',
    currency: initialData?.currency || primaryCurrency,
    originalCurrency: initialData?.originalCurrency || '',
    description: initialData?.description || '',
    categoryId: initialData?.categoryId || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    vendor: initialData?.vendor || '',
    notes: initialData?.notes || '',
    taxDeductible: initialData?.taxDeductible || false,
    taxCategory: initialData?.taxCategory || ''
  });

  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [useOriginalCurrency, setUseOriginalCurrency] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);

  const popularCurrencies = CurrencyUtils.getPopularCurrencies();
  const selectedCurrency = CurrencyUtils.getCurrency(formData.currency);
  const originalCurrency = formData.originalCurrency ? CurrencyUtils.getCurrency(formData.originalCurrency) : null;

  // Auto-detect currency based on location
  useEffect(() => {
    if (autoConvert && !initialData) {
      detectLocationCurrency();
    }
  }, []);

  // Auto-convert when amount or currency changes
  useEffect(() => {
    if (useOriginalCurrency && formData.originalAmount && formData.originalCurrency && formData.originalCurrency !== primaryCurrency) {
      handleCurrencyConversion();
    }
  }, [formData.originalAmount, formData.originalCurrency, useOriginalCurrency]);

  const detectLocationCurrency = async () => {
    try {
      const detected = await CurrencyUtils.detectUserCurrency();
      if (detected !== primaryCurrency) {
        setDetectedCurrency(detected);
      }
    } catch (error) {
      console.log('Currency detection failed:', error);
    }
  };

  const handleCurrencyConversion = async () => {
    const amount = parseFloat(formData.originalAmount);
    if (!amount || !formData.originalCurrency || formData.originalCurrency === primaryCurrency) {
      return;
    }

    setIsConverting(true);
    setConversionError(null);

    try {
      const result = await CurrencyUtils.convertCurrency(
        amount,
        formData.originalCurrency,
        primaryCurrency
      );

      if (result) {
        setConversion(result);
        setFormData(prev => ({
          ...prev,
          amount: result.toAmount.toFixed(2),
          currency: primaryCurrency
        }));
      } else {
        setConversionError('Unable to convert currency. Please try again.');
      }
    } catch (error) {
      setConversionError('Currency conversion failed. Please check your connection.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseDetectedCurrency = () => {
    if (detectedCurrency) {
      setFormData(prev => ({
        ...prev,
        originalCurrency: detectedCurrency,
        originalAmount: prev.amount
      }));
      setUseOriginalCurrency(true);
      setDetectedCurrency(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expense: Omit<Expense, 'id'> = {
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      categoryId: formData.categoryId,
      date: new Date(formData.date),
      description: formData.description.trim(),
      vendor: formData.vendor.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      taxDeductible: formData.taxDeductible,
      taxCategory: formData.taxCategory || undefined,
      originalAmount: useOriginalCurrency ? parseFloat(formData.originalAmount) : undefined,
      originalCurrency: useOriginalCurrency ? formData.originalCurrency : undefined,
      exchangeRate: conversion?.rate
    };

    onSubmit(expense);
  };

  const CurrencySelect = ({ 
    value, 
    onChange, 
    placeholder 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue>
          {value && (
            <div className="flex items-center gap-2">
              <span className="text-lg">{CurrencyUtils.getCurrency(value)?.flag}</span>
              <span>{value}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <div className="text-sm font-semibold text-muted-foreground mb-2">Popular</div>
          {popularCurrencies.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{currency.flag}</span>
                <span>{currency.code} - {currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Add Multi-Currency Expense
        </CardTitle>
        <CardDescription>
          Add expenses in any currency with automatic conversion
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Currency Detection Alert */}
          {detectedCurrency && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Detected location currency: {CurrencyUtils.getCurrencyDisplayName(detectedCurrency)}
                  </span>
                  <Button size="sm" onClick={handleUseDetectedCurrency}>
                    Use This Currency
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Multi-Currency Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="multi-currency">Multi-Currency Expense</Label>
              <p className="text-sm text-muted-foreground">
                Enable if this expense was in a different currency
              </p>
            </div>
            <Switch
              id="multi-currency"
              checked={useOriginalCurrency}
              onCheckedChange={setUseOriginalCurrency}
            />
          </div>

          {/* Original Currency Amount (if multi-currency is enabled) */}
          {useOriginalCurrency && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4" />
                Original Transaction
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">Original Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="originalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.originalAmount}
                      onChange={(e) => handleInputChange('originalAmount', e.target.value)}
                      placeholder="0.00"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Original Currency *</Label>
                  <CurrencySelect
                    value={formData.originalCurrency}
                    onChange={(value) => handleInputChange('originalCurrency', value)}
                    placeholder="Select currency"
                  />
                </div>
              </div>

              {/* Conversion Status */}
              {isConverting && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Converting to {primaryCurrency}...
                </div>
              )}

              {conversionError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{conversionError}</AlertDescription>
                </Alert>
              )}

              {conversion && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>
                        Converted: {CurrencyUtils.formatCurrency(conversion.fromAmount, conversion.fromCurrency)} → {' '}
                        {CurrencyUtils.formatCurrency(conversion.toAmount, conversion.toCurrency)}
                      </p>
                      <p className="text-xs">
                        Exchange rate: 1 {conversion.fromCurrency} = {conversion.rate.toFixed(4)} {conversion.toCurrency}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Primary Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {useOriginalCurrency ? `Amount in ${primaryCurrency}` : 'Amount'} *
              </Label>
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
                  className="pl-10"
                  required
                  disabled={useOriginalCurrency && isConverting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <div className="flex items-center gap-2">
                {selectedCurrency && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <span>{selectedCurrency.flag}</span>
                    <span>{selectedCurrency.code}</span>
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {useOriginalCurrency ? 'Converted to' : 'Primary'} currency
                </span>
              </div>
            </div>
          </div>

          {/* Basic Expense Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What was this expense for?"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor/Merchant</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => handleInputChange('vendor', e.target.value)}
                  placeholder="Where did you spend this?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6">
            <Button type="submit" className="flex-1" disabled={isConverting}>
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Add Expense
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>

          {/* Conversion Summary */}
          {useOriginalCurrency && conversion && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium mb-2">Transaction Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span>{CurrencyUtils.formatCurrency(conversion.fromAmount, conversion.fromCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Converted Amount:</span>
                  <span>{CurrencyUtils.formatCurrency(conversion.toAmount, conversion.toCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span>1 {conversion.fromCurrency} = {conversion.rate.toFixed(4)} {conversion.toCurrency}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conversion Time:</span>
                  <span>{new Date(conversion.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default MultiCurrencyExpenseForm;
