// src/components/currency/CurrencyDashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  TrendingUp, 
  Calculator,
  Settings,
  MapPin,
  Banknote,
  RefreshCw,
  AlertCircle,
  Activity
} from 'lucide-react';

import { CurrencyConverter } from './CurrencyConverter';
import { CurrencySettings } from './CurrencySettings';
import { MultiCurrencyExpenseForm } from './MultiCurrencyExpenseForm';
import { CurrencyUtils } from '@/lib/currencyUtils';
import type { UserCurrencySettings, Expense, ExchangeRate } from '@/lib/types';

interface CurrencyDashboardProps {
  expenses?: Expense[];
  onExpenseAdd?: (expense: Omit<Expense, 'id'>) => void;
  className?: string;
}

export function CurrencyDashboard({ expenses = [], onExpenseAdd, className }: CurrencyDashboardProps) {
  const [currencySettings, setCurrencySettings] = useState<UserCurrencySettings>(
    CurrencyUtils.getDefaultSettings()
  );
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // Auto-detect user location and currency on component mount
  useEffect(() => {
    detectUserCurrency();
    loadExchangeRates();
  }, []);

  const detectUserCurrency = async () => {
    if (currencySettings.autoDetectLocation) {
      try {
        const detected = await CurrencyUtils.detectUserCurrency();
        setDetectedLocation(detected);
        
        if (detected !== currencySettings.primaryCurrency) {
          setCurrencySettings(prev => ({
            ...prev,
            primaryCurrency: detected
          }));
        }
      } catch (error) {
        console.log('Currency detection failed:', error);
      }
    }
  };

  const loadExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const rates: ExchangeRate[] = [];
      
      // Load rates for display currencies
      for (const currency of currencySettings.displayCurrencies) {
        if (currency !== currencySettings.primaryCurrency) {
          const rate = await CurrencyUtils.getExchangeRate(
            currencySettings.primaryCurrency,
            currency
          );
          if (rate) {
            rates.push(rate);
          }
        }
      }
      
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleSettingsChange = (newSettings: UserCurrencySettings) => {
    setCurrencySettings(newSettings);
    // In a real app, you'd save these settings to the user's profile
    localStorage.setItem('currencySettings', JSON.stringify(newSettings));
  };

  const getExpensesByCurrenty = () => {
    const currencyBreakdown: Record<string, { count: number; total: number; expenses: Expense[] }> = {};
    
    expenses.forEach(expense => {
      const currency = expense.originalCurrency || expense.currency || currencySettings.primaryCurrency;
      const amount = expense.originalAmount || expense.amount;
      
      if (!currencyBreakdown[currency]) {
        currencyBreakdown[currency] = { count: 0, total: 0, expenses: [] };
      }
      
      currencyBreakdown[currency].count++;
      currencyBreakdown[currency].total += amount;
      currencyBreakdown[currency].expenses.push(expense);
    });
    
    return currencyBreakdown;
  };

  const currencyBreakdown = getExpensesByCurrenty();
  const primaryCurrency = CurrencyUtils.getCurrency(currencySettings.primaryCurrency);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="h-8 w-8" />
            Multi-Currency Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Perfect for digital nomads and international users
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {primaryCurrency && (
            <Badge variant="outline" className="text-lg px-3 py-1">
              <span className="mr-2">{primaryCurrency.flag}</span>
              Primary: {primaryCurrency.code}
            </Badge>
          )}
          {detectedLocation && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {detectedLocation}
            </Badge>
          )}
        </div>
      </div>

      {/* Currency Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Currencies Used</p>
                <p className="text-2xl font-bold">
                  {Object.keys(currencyBreakdown).length || 1}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  {expenses.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Exchange Rates</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{exchangeRates.length}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={loadExchangeRates}
                    disabled={isLoadingRates}
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingRates ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Breakdown */}
      {Object.keys(currencyBreakdown).length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Expenses by Currency
            </CardTitle>
            <CardDescription>
              Your spending across different currencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(currencyBreakdown).map(([currencyCode, data]) => {
                const currency = CurrencyUtils.getCurrency(currencyCode);
                return (
                  <div key={currencyCode} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {currency && (
                        <>
                          <span className="text-lg">{currency.flag}</span>
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-sm text-muted-foreground">{currency.name}</span>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Total:</span>
                        <span className="font-medium">
                          {CurrencyUtils.formatCurrency(data.total, currencyCode)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Transactions:</span>
                        <span className="text-sm">{data.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exchange Rates */}
      {exchangeRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Exchange Rates
            </CardTitle>
            <CardDescription>
              Live rates from {currencySettings.primaryCurrency} to your display currencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exchangeRates.map((rate) => {
                const fromCurrency = CurrencyUtils.getCurrency(rate.baseCurrency);
                const toCurrency = CurrencyUtils.getCurrency(rate.targetCurrency);
                
                return (
                  <div key={`${rate.baseCurrency}-${rate.targetCurrency}`} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {fromCurrency && toCurrency && (
                        <>
                          <span>{fromCurrency.flag}</span>
                          <span className="font-medium">{rate.baseCurrency}</span>
                          <span>→</span>
                          <span>{toCurrency.flag}</span>
                          <span className="font-medium">{rate.targetCurrency}</span>
                        </>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-bold">
                        {rate.rate.toFixed(4)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{rate.source.toUpperCase()}</span>
                        <span>{new Date(rate.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="converter" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="converter">Currency Converter</TabsTrigger>
          <TabsTrigger value="expense">Add Expense</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="converter" className="space-y-6">
          <CurrencyConverter
            initialFromCurrency={currencySettings.primaryCurrency}
            initialToCurrency={currencySettings.displayCurrencies[0] || 'EUR'}
          />
        </TabsContent>

        <TabsContent value="expense" className="space-y-6">
          {onExpenseAdd ? (
            <MultiCurrencyExpenseForm
              primaryCurrency={currencySettings.primaryCurrency}
              autoConvert={currencySettings.autoConvert}
              onSubmit={onExpenseAdd}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Expense tracking is not available in this context.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <CurrencySettings
            settings={currencySettings}
            onSettingsChange={handleSettingsChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CurrencyDashboard;
