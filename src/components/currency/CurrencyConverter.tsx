// src/components/currency/CurrencyConverter.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUpDown, 
  Calculator, 
  TrendingUp,
  Loader2,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';

import { CurrencyUtils } from '@/lib/currencyUtils';
import type { Currency, CurrencyConversion, ExchangeRate } from '@/lib/types';

interface CurrencyConverterProps {
  initialFromCurrency?: string;
  initialToCurrency?: string;
  initialAmount?: number;
  onConversionResult?: (conversion: CurrencyConversion) => void;
  className?: string;
}

export function CurrencyConverter({ 
  initialFromCurrency = 'USD',
  initialToCurrency = 'EUR',
  initialAmount = 100,
  onConversionResult,
  className 
}: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [amount, setAmount] = useState(initialAmount.toString());
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularCurrencies = CurrencyUtils.getPopularCurrencies();
  const allCurrencies = CurrencyUtils.getAllCurrencies();
  
  // Auto-convert when inputs change
  useEffect(() => {
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0 && fromCurrency && toCurrency) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency]);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await CurrencyUtils.convertCurrency(numAmount, fromCurrency, toCurrency);
      
      if (result) {
        setConversion(result);
        
        // Get the exchange rate details
        const rate = await CurrencyUtils.getExchangeRate(fromCurrency, toCurrency);
        setExchangeRate(rate);
        
        // Notify parent component
        if (onConversionResult) {
          onConversionResult(result);
        }
      } else {
        setError('Unable to fetch exchange rate. Please try again.');
      }
    } catch (err) {
      setError('Conversion failed. Please check your internet connection.');
      console.error('Currency conversion error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatRate = (rate: number) => {
    return rate < 0.01 ? rate.toExponential(4) : rate.toFixed(4);
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
      <SelectContent className="max-h-80">
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
          
          <div className="text-sm font-semibold text-muted-foreground mt-4 mb-2">All Currencies</div>
          {allCurrencies.map((currency) => (
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
          <Calculator className="h-5 w-5" />
          Currency Converter
        </CardTitle>
        <CardDescription>
          Convert between any supported currencies with live exchange rates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="text-lg"
          />
        </div>

        {/* Currency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label>From</Label>
            <CurrencySelect
              value={fromCurrency}
              onChange={setFromCurrency}
              placeholder="Select currency"
            />
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwapCurrencies}
              className="h-10 w-10 rounded-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <CurrencySelect
              value={toCurrency}
              onChange={setToCurrency}
              placeholder="Select currency"
            />
          </div>
        </div>

        {/* Conversion Result */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Converting...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {conversion && !isLoading && (
            <div className="space-y-4">
              {/* Main Result */}
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {CurrencyUtils.formatCurrency(conversion.toAmount, conversion.toCurrency)}
                </div>
                <div className="text-muted-foreground">
                  {CurrencyUtils.formatCurrency(conversion.fromAmount, conversion.fromCurrency)} = {' '}
                  {CurrencyUtils.formatCurrency(conversion.toAmount, conversion.toCurrency)}
                </div>
              </div>

              {/* Exchange Rate Details */}
              {exchangeRate && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        1 {fromCurrency} = {formatRate(exchangeRate.rate)} {toCurrency}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {exchangeRate.source.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(exchangeRate.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reverse Rate</span>
                    <Badge variant="outline">
                      1 {toCurrency} = {formatRate(1 / exchangeRate.rate)} {fromCurrency}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Amount Buttons */}
        <div className="space-y-2">
          <Label>Quick Amounts</Label>
          <div className="flex flex-wrap gap-2">
            {[1, 10, 100, 500, 1000, 5000].map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                className="text-xs"
              >
                {quickAmount.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={handleConvert}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Rates
          </Button>
        </div>

        {/* Disclaimer */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <div className="space-y-1">
              <p><strong>Disclaimer:</strong> Exchange rates are for informational purposes only.</p>
              <p>Actual rates may vary. Always verify with your bank or financial institution before making transactions.</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default CurrencyConverter;
