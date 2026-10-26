// src/components/currency/CurrencySettings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  MapPin, 
  RefreshCw, 
  Settings,
  Banknote,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { CurrencyUtils } from '@/lib/currencyUtils';
import type { UserCurrencySettings, Currency } from '@/lib/types';

interface CurrencySettingsProps {
  settings: UserCurrencySettings;
  onSettingsChange: (settings: UserCurrencySettings) => void;
  className?: string;
}

export function CurrencySettings({ settings, onSettingsChange, className }: CurrencySettingsProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCurrency, setDetectedCurrency] = useState<string | null>(null);
  const [allCurrencies] = useState(CurrencyUtils.getAllCurrencies());
  const [currenciesByRegion] = useState(CurrencyUtils.getCurrenciesByRegion());

  const handleAutoDetect = async () => {
    setIsDetecting(true);
    try {
      const detected = await CurrencyUtils.detectUserCurrency();
      setDetectedCurrency(detected);
      
      // Auto-apply if user agrees
      if (detected !== settings.primaryCurrency) {
        onSettingsChange({
          ...settings,
          primaryCurrency: detected
        });
      }
    } catch (error) {
      console.error('Auto-detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePrimaryCurrencyChange = (currencyCode: string) => {
    onSettingsChange({
      ...settings,
      primaryCurrency: currencyCode
    });
  };

  const handleDisplayCurrencyToggle = (currencyCode: string) => {
    const isSelected = settings.displayCurrencies.includes(currencyCode);
    const newDisplayCurrencies = isSelected
      ? settings.displayCurrencies.filter(code => code !== currencyCode)
      : [...settings.displayCurrencies, currencyCode];

    onSettingsChange({
      ...settings,
      displayCurrencies: newDisplayCurrencies
    });
  };

  const handleSettingChange = (key: keyof UserCurrencySettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const primaryCurrency = CurrencyUtils.getCurrency(settings.primaryCurrency);
  const popularCurrencies = CurrencyUtils.getPopularCurrencies();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Primary Currency Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Primary Currency
          </CardTitle>
          <CardDescription>
            Your main currency for budgets, reports, and calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Select 
                value={settings.primaryCurrency} 
                onValueChange={handlePrimaryCurrencyChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {primaryCurrency && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{primaryCurrency.flag}</span>
                        <span>{primaryCurrency.code} - {primaryCurrency.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(currenciesByRegion).map(([region, currencies]) => (
                    <div key={region}>
                      <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">
                        {region}
                      </div>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{currency.flag}</span>
                            <span>{currency.code} - {currency.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      <Separator className="my-1" />
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleAutoDetect}
              disabled={isDetecting}
              className="flex items-center gap-2"
            >
              {isDetecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              Auto-detect
            </Button>
          </div>

          {detectedCurrency && detectedCurrency !== settings.primaryCurrency && (
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Detected currency: {CurrencyUtils.getCurrencyDisplayName(detectedCurrency)}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => handlePrimaryCurrencyChange(detectedCurrency)}
                  >
                    Use This Currency
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Display Currencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Display Currencies
          </CardTitle>
          <CardDescription>
            Additional currencies to show alongside your primary currency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Popular for Digital Nomads</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {popularCurrencies.map((currency) => (
                  <div
                    key={currency.code}
                    className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                      settings.displayCurrencies.includes(currency.code)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleDisplayCurrencyToggle(currency.code)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currency.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{currency.code}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {currency.name}
                        </div>
                      </div>
                      {settings.displayCurrencies.includes(currency.code) && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {settings.displayCurrencies.map((code) => {
                const currency = CurrencyUtils.getCurrency(code);
                return currency ? (
                  <Badge key={code} variant="secondary" className="flex items-center gap-1">
                    <span>{currency.flag}</span>
                    <span>{currency.code}</span>
                  </Badge>
                ) : null;
              })}
              {settings.displayCurrencies.length === 0 && (
                <Badge variant="outline">None selected</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto-conversion Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Auto-conversion Settings
          </CardTitle>
          <CardDescription>
            Configure automatic currency detection and conversion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-detect">Auto-detect Location</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect your location to suggest local currency
              </p>
            </div>
            <Switch
              id="auto-detect"
              checked={settings.autoDetectLocation}
              onCheckedChange={(checked) => handleSettingChange('autoDetectLocation', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-convert">Auto-convert Expenses</Label>
              <p className="text-sm text-muted-foreground">
                Automatically convert foreign expenses to your primary currency
              </p>
            </div>
            <Switch
              id="auto-convert"
              checked={settings.autoConvert}
              onCheckedChange={(checked) => handleSettingChange('autoConvert', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Exchange Rate Updates</Label>
            <Select 
              value={settings.rateUpdateFrequency} 
              onValueChange={(value: 'realtime' | 'hourly' | 'daily' | 'manual') => 
                handleSettingChange('rateUpdateFrequency', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">Real-time (when possible)</SelectItem>
                <SelectItem value="hourly">Every hour</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often to fetch updated exchange rates
            </p>
          </div>

          <div className="space-y-2">
            <Label>Fallback Currency</Label>
            <Select 
              value={settings.fallbackCurrency} 
              onValueChange={(value) => handleSettingChange('fallbackCurrency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['USD', 'EUR', 'GBP', 'JPY'].map((code) => {
                  const currency = CurrencyUtils.getCurrency(code);
                  return currency ? (
                    <SelectItem key={code} value={code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code} - {currency.name}</span>
                      </div>
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Currency to use when conversion fails
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Fine-tune currency display and calculation behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Rounding Mode</Label>
            <Select 
              value={settings.roundingMode} 
              onValueChange={(value: 'round' | 'floor' | 'ceil') => 
                handleSettingChange('roundingMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="round">Round to nearest</SelectItem>
                <SelectItem value="floor">Round down</SelectItem>
                <SelectItem value="ceil">Round up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Decimal Places</Label>
            <Select 
              value={settings.decimalPlaces.toString()} 
              onValueChange={(value) => handleSettingChange('decimalPlaces', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 decimals</SelectItem>
                <SelectItem value="2">2 decimals</SelectItem>
                <SelectItem value="4">4 decimals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Exchange Rate Information</p>
                <ul className="text-sm space-y-1">
                  <li>• Rates are fetched from exchangerate-api.com</li>
                  <li>• Cached for 1 hour to reduce API calls</li>
                  <li>• Fallback to cached rates if API is unavailable</li>
                  <li>• Free tier allows 1,500 requests per month</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default CurrencySettings;
