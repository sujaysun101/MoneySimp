// src/lib/currencyUtils.ts
"use client";

import type { 
  Currency, 
  ExchangeRate, 
  CurrencyConversion, 
  UserCurrencySettings 
} from './types';

// Comprehensive currency database
export const CURRENCIES: Currency[] = [
  // Major Currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', decimals: 2, countries: ['US', 'EC', 'SV', 'PA', 'TL'] },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', decimals: 2, countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'FI', 'IE', 'PT', 'GR', 'LU', 'SI', 'CY', 'MT', 'SK', 'EE', 'LV', 'LT'] },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', decimals: 2, countries: ['GB', 'GG', 'IM', 'JE'] },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', decimals: 0, countries: ['JP'] },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', decimals: 2, countries: ['CA'] },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', decimals: 2, countries: ['AU', 'CX', 'CC', 'HM', 'KI', 'NR', 'NF', 'TV'] },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭', decimals: 2, countries: ['CH', 'LI'] },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳', decimals: 2, countries: ['CN'] },
  
  // Popular Digital Nomad Destinations
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭', decimals: 2, countries: ['TH'] },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', flag: '🇻🇳', decimals: 0, countries: ['VN'] },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩', decimals: 0, countries: ['ID'] },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾', decimals: 2, countries: ['MY'] },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬', decimals: 2, countries: ['SG'] },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭', decimals: 2, countries: ['PH'] },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳', decimals: 2, countries: ['IN', 'BT'] },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷', decimals: 0, countries: ['KR'] },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', flag: '🇹🇼', decimals: 0, countries: ['TW'] },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰', decimals: 2, countries: ['HK'] },
  
  // Latin America
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', flag: '🇲🇽', decimals: 2, countries: ['MX'] },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷', decimals: 2, countries: ['BR'] },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', flag: '🇦🇷', decimals: 2, countries: ['AR'] },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', flag: '🇨🇴', decimals: 0, countries: ['CO'] },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', flag: '🇵🇪', decimals: 2, countries: ['PE'] },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', flag: '🇨🇱', decimals: 0, countries: ['CL'] },
  
  // Middle East & Africa
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪', decimals: 2, countries: ['AE'] },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦', decimals: 2, countries: ['SA'] },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', decimals: 2, countries: ['ZA'] },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', flag: '🇪🇬', decimals: 2, countries: ['EG'] },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', flag: '🇲🇦', decimals: 2, countries: ['MA'] },
  
  // Eastern Europe
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', flag: '🇵🇱', decimals: 2, countries: ['PL'] },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', flag: '🇨🇿', decimals: 2, countries: ['CZ'] },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', flag: '🇭🇺', decimals: 0, countries: ['HU'] },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', flag: '🇷🇴', decimals: 2, countries: ['RO'] },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', flag: '🇧🇬', decimals: 2, countries: ['BG'] },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', flag: '🇭🇷', decimals: 2, countries: ['HR'] },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', flag: '🇷🇸', decimals: 2, countries: ['RS'] },
  
  // Nordic Countries
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪', decimals: 2, countries: ['SE'] },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴', decimals: 2, countries: ['NO'] },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', flag: '🇩🇰', decimals: 2, countries: ['DK'] },
  
  // Others
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿', decimals: 2, countries: ['NZ'] },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺', decimals: 2, countries: ['RU'] },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷', decimals: 2, countries: ['TR'] },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', flag: '🇮🇱', decimals: 2, countries: ['IL'] },
];

// Country to currency mapping for auto-detection
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR',
  'NL': 'EUR', 'BE': 'EUR', 'AT': 'EUR', 'FI': 'EUR', 'IE': 'EUR', 'PT': 'EUR', 'GR': 'EUR',
  'JP': 'JPY', 'AU': 'AUD', 'CH': 'CHF', 'CN': 'CNY', 'TH': 'THB', 'VN': 'VND', 'ID': 'IDR',
  'MY': 'MYR', 'SG': 'SGD', 'PH': 'PHP', 'IN': 'INR', 'KR': 'KRW', 'TW': 'TWD', 'HK': 'HKD',
  'MX': 'MXN', 'BR': 'BRL', 'AR': 'ARS', 'CO': 'COP', 'PE': 'PEN', 'CL': 'CLP', 'AE': 'AED',
  'SA': 'SAR', 'ZA': 'ZAR', 'EG': 'EGP', 'MA': 'MAD', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF',
  'RO': 'RON', 'BG': 'BGN', 'HR': 'HRK', 'RS': 'RSD', 'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK',
  'NZ': 'NZD', 'RU': 'RUB', 'TR': 'TRY', 'IL': 'ILS'
};

export class CurrencyUtils {
  private static exchangeRateCache = new Map<string, ExchangeRate>();
  private static locationCache: string | null = null;
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Get currency by code
   */
  static getCurrency(code: string): Currency | undefined {
    return CURRENCIES.find(currency => currency.code === code);
  }

  /**
   * Get all supported currencies
   */
  static getAllCurrencies(): Currency[] {
    return CURRENCIES;
  }

  /**
   * Get popular currencies for digital nomads
   */
  static getPopularCurrencies(): Currency[] {
    const popularCodes = ['USD', 'EUR', 'GBP', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'JPY', 'AUD', 'CAD', 'MXN'];
    return CURRENCIES.filter(currency => popularCodes.includes(currency.code));
  }

  /**
   * Auto-detect user's currency based on location
   */
  static async detectUserCurrency(): Promise<string> {
    try {
      // Try to get user's location from browser
      const position = await this.getCurrentPosition();
      if (position) {
        const countryCode = await this.getCountryFromCoordinates(
          position.coords.latitude, 
          position.coords.longitude
        );
        
        if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
          this.locationCache = countryCode;
          return COUNTRY_TO_CURRENCY[countryCode];
        }
      }
    } catch (error) {
      console.log('Location detection failed, trying IP-based detection:', error);
    }

    try {
      // Fallback to IP-based detection
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code && COUNTRY_TO_CURRENCY[data.country_code]) {
        this.locationCache = data.country_code;
        return COUNTRY_TO_CURRENCY[data.country_code];
      }
    } catch (error) {
      console.log('IP-based detection failed:', error);
    }

    // Final fallback based on browser locale
    try {
      const locale = navigator.language || 'en-US';
      const countryCode = locale.split('-')[1]?.toUpperCase();
      
      if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
        return COUNTRY_TO_CURRENCY[countryCode];
      }
    } catch (error) {
      console.log('Locale-based detection failed:', error);
    }

    // Ultimate fallback
    return 'USD';
  }

  /**
   * Get current position using browser geolocation
   */
  private static getCurrentPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  /**
   * Get country from coordinates using reverse geocoding
   */
  private static async getCountryFromCoordinates(lat: number, lon: number): Promise<string | null> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      return data.address?.country_code?.toUpperCase() || null;
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  static async getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
    if (from === to) {
      return {
        baseCurrency: from,
        targetCurrency: to,
        rate: 1,
        timestamp: new Date().toISOString(),
        source: 'manual'
      };
    }

    const cacheKey = `${from}-${to}`;
    const cached = this.exchangeRateCache.get(cacheKey);
    
    // Return cached rate if it's still fresh
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Using exchangerate-api.com (free tier: 1500 requests/month)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      
      if (data.rates && data.rates[to]) {
        const exchangeRate: ExchangeRate = {
          baseCurrency: from,
          targetCurrency: to,
          rate: data.rates[to],
          timestamp: new Date().toISOString(),
          source: 'api'
        };
        
        // Cache the result
        this.exchangeRateCache.set(cacheKey, exchangeRate);
        return exchangeRate;
      }
    } catch (error) {
      console.log('API exchange rate fetch failed, trying fallback:', error);
    }

    // Fallback to stored rates or return cached even if expired
    if (cached) {
      return { ...cached, source: 'cached' };
    }

    return null;
  }

  /**
   * Convert amount from one currency to another
   */
  static async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<CurrencyConversion | null> {
    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    
    if (!exchangeRate) {
      return null;
    }

    const convertedAmount = amount * exchangeRate.rate;
    
    return {
      fromAmount: amount,
      fromCurrency,
      toAmount: convertedAmount,
      toCurrency,
      rate: exchangeRate.rate,
      timestamp: exchangeRate.timestamp
    };
  }

  /**
   * Format currency amount with proper symbol and decimals
   */
  static formatCurrency(
    amount: number, 
    currencyCode: string, 
    locale: string = 'en-US'
  ): string {
    const currency = this.getCurrency(currencyCode);
    
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    try {
      // Use Intl.NumberFormat for proper formatting
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimals,
        maximumFractionDigits: currency.decimals
      });
      
      return formatter.format(amount);
    } catch (error) {
      // Fallback formatting
      const formattedAmount = currency.decimals > 0 
        ? amount.toFixed(currency.decimals)
        : Math.round(amount).toString();
      
      return `${currency.symbol}${formattedAmount}`;
    }
  }

  /**
   * Get display name with flag emoji
   */
  static getCurrencyDisplayName(currencyCode: string): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) return currencyCode;
    
    return `${currency.flag} ${currency.code} - ${currency.name}`;
  }

  /**
   * Round amount according to currency rules
   */
  static roundAmount(amount: number, currencyCode: string, mode: 'round' | 'floor' | 'ceil' = 'round'): number {
    const currency = this.getCurrency(currencyCode);
    const decimals = currency?.decimals ?? 2;
    const multiplier = Math.pow(10, decimals);
    
    switch (mode) {
      case 'floor':
        return Math.floor(amount * multiplier) / multiplier;
      case 'ceil':
        return Math.ceil(amount * multiplier) / multiplier;
      default:
        return Math.round(amount * multiplier) / multiplier;
    }
  }

  /**
   * Get currencies by region for better UX
   */
  static getCurrenciesByRegion(): Record<string, Currency[]> {
    return {
      'North America': CURRENCIES.filter(c => ['USD', 'CAD', 'MXN'].includes(c.code)),
      'Europe': CURRENCIES.filter(c => ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'].includes(c.code)),
      'Asia Pacific': CURRENCIES.filter(c => ['JPY', 'CNY', 'KRW', 'SGD', 'HKD', 'TWD', 'AUD', 'NZD', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'PHP'].includes(c.code)),
      'Latin America': CURRENCIES.filter(c => ['BRL', 'ARS', 'COP', 'PEN', 'CLP'].includes(c.code)),
      'Middle East & Africa': CURRENCIES.filter(c => ['AED', 'SAR', 'ZAR', 'EGP', 'MAD', 'ILS', 'TRY'].includes(c.code)),
      'Eastern Europe': CURRENCIES.filter(c => ['RUB', 'RON', 'BGN', 'HRK', 'RSD'].includes(c.code))
    };
  }

  /**
   * Clear exchange rate cache
   */
  static clearCache(): void {
    this.exchangeRateCache.clear();
    this.locationCache = null;
  }

  /**
   * Get default currency settings
   */
  static getDefaultSettings(): UserCurrencySettings {
    return {
      primaryCurrency: 'USD',
      displayCurrencies: ['USD', 'EUR', 'GBP'],
      autoDetectLocation: true,
      autoConvert: true,
      rateUpdateFrequency: 'daily',
      fallbackCurrency: 'USD',
      roundingMode: 'round',
      decimalPlaces: 2
    };
  }

  /**
   * Validate currency code
   */
  static isValidCurrency(code: string): boolean {
    return CURRENCIES.some(currency => currency.code === code);
  }

  /**
   * Get exchange rate trend (mock implementation - would need historical data API)
   */
  static async getExchangeRateTrend(from: string, to: string, days: number = 30): Promise<{ date: string; rate: number }[]> {
    // This is a mock implementation
    // In a real app, you'd fetch historical data from an API
    const currentRate = await this.getExchangeRate(from, to);
    if (!currentRate) return [];

    const trend: { date: string; rate: number }[] = [];
    const baseRate = currentRate.rate;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate mock fluctuation (±5%)
      const fluctuation = (Math.random() - 0.5) * 0.1;
      const rate = baseRate * (1 + fluctuation);
      
      trend.push({
        date: date.toISOString().split('T')[0],
        rate: this.roundAmount(rate, to)
      });
    }
    
    return trend;
  }
}

export default CurrencyUtils;
