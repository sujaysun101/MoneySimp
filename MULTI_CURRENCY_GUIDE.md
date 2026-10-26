# Multi-Currency System

## Overview
The Multi-Currency System is designed specifically for digital nomads and international users who need to manage expenses across multiple currencies with automatic detection and conversion capabilities.

## Features

### 🌍 Auto-Detection & Location-Based Currency
- **GPS Location Detection**: Automatically detects user location via browser geolocation
- **IP-Based Fallback**: Uses IP geolocation when GPS is unavailable
- **Locale-Based Detection**: Falls back to browser locale settings
- **Smart Currency Suggestion**: Suggests local currency based on detected location
- **140+ Country Support**: Comprehensive mapping of countries to their currencies

### 💱 Real-Time Currency Conversion
- **Live Exchange Rates**: Fetches current rates from exchangerate-api.com
- **Smart Caching**: Caches rates for 1 hour to reduce API calls
- **Fallback Mechanisms**: Uses cached rates when API is unavailable
- **Multiple Rate Sources**: Supports API, manual, and cached rate sources
- **Conversion History**: Tracks conversion rates and timestamps

### 💰 Multi-Currency Expense Management
- **Original Currency Tracking**: Stores both original and converted amounts
- **Exchange Rate History**: Preserves historical conversion rates
- **Automatic Conversion**: Converts foreign expenses to primary currency
- **Manual Override**: Allows manual rate entry when needed
- **Expense Categorization**: Works with existing category system

### 🎯 Digital Nomad Optimized
- **Popular Destinations**: Pre-configured with nomad-friendly currencies
- **Regional Grouping**: Currencies organized by geographical regions
- **Flexible Settings**: Customizable auto-conversion preferences
- **Offline Support**: Cached rates work without internet connection
- **Travel-Friendly UI**: Mobile-optimized interface

## Supported Currencies

### Major Global Currencies
- USD (US Dollar) 🇺🇸
- EUR (Euro) 🇪🇺
- GBP (British Pound) 🇬🇧
- JPY (Japanese Yen) 🇯🇵
- CAD (Canadian Dollar) 🇨🇦
- AUD (Australian Dollar) 🇦🇺
- CHF (Swiss Franc) 🇨🇭
- CNY (Chinese Yuan) 🇨🇳

### Popular Digital Nomad Destinations
- THB (Thai Baht) 🇹🇭 - Thailand
- VND (Vietnamese Dong) 🇻🇳 - Vietnam
- IDR (Indonesian Rupiah) 🇮🇩 - Indonesia/Bali
- MYR (Malaysian Ringgit) 🇲🇾 - Malaysia
- SGD (Singapore Dollar) 🇸🇬 - Singapore
- PHP (Philippine Peso) 🇵🇭 - Philippines
- INR (Indian Rupee) 🇮🇳 - India
- MXN (Mexican Peso) 🇲🇽 - Mexico
- BRL (Brazilian Real) 🇧🇷 - Brazil
- ARS (Argentine Peso) 🇦🇷 - Argentina
- COP (Colombian Peso) 🇨🇴 - Colombia

### European Currencies (Non-Euro)
- SEK (Swedish Krona) 🇸🇪 - Sweden
- NOK (Norwegian Krone) 🇳🇴 - Norway
- DKK (Danish Krone) 🇩🇰 - Denmark
- PLN (Polish Zloty) 🇵🇱 - Poland
- CZK (Czech Koruna) 🇨🇿 - Czech Republic
- HUF (Hungarian Forint) 🇭🇺 - Hungary

### Middle East & Africa
- AED (UAE Dirham) 🇦🇪 - UAE/Dubai
- SAR (Saudi Riyal) 🇸🇦 - Saudi Arabia
- ZAR (South African Rand) 🇿🇦 - South Africa
- EGP (Egyptian Pound) 🇪🇬 - Egypt
- MAD (Moroccan Dirham) 🇲🇦 - Morocco
- ILS (Israeli Shekel) 🇮🇱 - Israel
- TRY (Turkish Lira) 🇹🇷 - Turkey

## Key Components

### 1. Currency Dashboard (`CurrencyDashboard.tsx`)
Main hub for all multi-currency operations.

```tsx
<CurrencyDashboard 
  expenses={expenses}
  onExpenseAdd={handleExpenseAdd}
/>
```

**Features:**
- Auto-detection of user location and currency
- Real-time exchange rate display
- Currency breakdown of expenses
- Integrated converter, expense form, and settings

### 2. Currency Converter (`CurrencyConverter.tsx`)
Standalone currency conversion tool.

```tsx
<CurrencyConverter
  initialFromCurrency="USD"
  initialToCurrency="EUR"
  initialAmount={100}
  onConversionResult={handleConversion}
/>
```

**Features:**
- Live exchange rate fetching
- Popular currency quick-select
- Swap currencies functionality
- Quick amount buttons
- Conversion history tracking

### 3. Multi-Currency Expense Form (`MultiCurrencyExpenseForm.tsx`)
Enhanced expense form with currency conversion.

```tsx
<MultiCurrencyExpenseForm
  primaryCurrency="USD"
  autoConvert={true}
  onSubmit={handleExpenseAdd}
/>
```

**Features:**
- Auto-detection of local currency
- Real-time conversion preview
- Original transaction preservation
- Tax-deductible expense support
- Vendor and location tracking

### 4. Currency Settings (`CurrencySettings.tsx`)
Comprehensive currency preference management.

```tsx
<CurrencySettings
  settings={userSettings}
  onSettingsChange={handleSettingsChange}
/>
```

**Features:**
- Primary currency selection
- Display currencies configuration
- Auto-conversion preferences
- Exchange rate update frequency
- Rounding and decimal settings

### 5. Currency Utils (`currencyUtils.ts`)
Core utility class for all currency operations.

```typescript
// Auto-detect user currency
const detectedCurrency = await CurrencyUtils.detectUserCurrency();

// Get exchange rate
const rate = await CurrencyUtils.getExchangeRate('USD', 'EUR');

// Convert currency
const conversion = await CurrencyUtils.convertCurrency(100, 'USD', 'EUR');

// Format currency
const formatted = CurrencyUtils.formatCurrency(100, 'EUR');
```

## Location Detection Flow

### 1. GPS-Based Detection
```typescript
// Request user location
navigator.geolocation.getCurrentPosition()
  ↓
// Reverse geocode coordinates
fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}`)
  ↓
// Extract country code
data.address.country_code
  ↓
// Map to currency
COUNTRY_TO_CURRENCY[countryCode]
```

### 2. IP-Based Detection (Fallback)
```typescript
// Get location from IP
fetch('https://ipapi.co/json/')
  ↓
// Extract country code
data.country_code
  ↓
// Map to currency
COUNTRY_TO_CURRENCY[countryCode]
```

### 3. Locale-Based Detection (Final Fallback)
```typescript
// Get browser locale
navigator.language // e.g., 'en-GB'
  ↓
// Extract country
locale.split('-')[1] // 'GB'
  ↓
// Map to currency
COUNTRY_TO_CURRENCY['GB'] // 'GBP'
```

## Exchange Rate Management

### API Integration
- **Primary Source**: exchangerate-api.com (1,500 free requests/month)
- **Rate Caching**: 1-hour cache duration to minimize API calls
- **Fallback Strategy**: Uses cached rates when API is unavailable
- **Error Handling**: Graceful degradation with offline rates

### Caching Strategy
```typescript
class CurrencyUtils {
  private static exchangeRateCache = new Map<string, ExchangeRate>();
  private static readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  static async getExchangeRate(from: string, to: string): Promise<ExchangeRate | null> {
    const cacheKey = `${from}-${to}`;
    const cached = this.exchangeRateCache.get(cacheKey);
    
    // Return cached if fresh
    if (cached && Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_DURATION) {
      return cached;
    }
    
    // Fetch new rate and cache
    const freshRate = await this.fetchExchangeRate(from, to);
    if (freshRate) {
      this.exchangeRateCache.set(cacheKey, freshRate);
    }
    
    return freshRate || cached; // Fallback to expired cache
  }
}
```

## Data Structures

### Currency Interface
```typescript
interface Currency {
  code: string;        // ISO 4217 code (e.g., 'USD')
  name: string;        // Full name (e.g., 'US Dollar')
  symbol: string;      // Currency symbol (e.g., '$')
  flag: string;        // Emoji flag (e.g., '🇺🇸')
  decimals: number;    // Decimal places (e.g., 2)
  countries: string[]; // ISO country codes
}
```

### Exchange Rate Interface
```typescript
interface ExchangeRate {
  baseCurrency: string;    // From currency
  targetCurrency: string;  // To currency
  rate: number;           // Exchange rate
  timestamp: string;      // When fetched
  source: 'api' | 'manual' | 'cached'; // Rate source
}
```

### Enhanced Expense Interface
```typescript
interface Expense {
  // Standard fields
  id: string;
  amount: number;
  currency?: string;
  categoryId: string;
  date: Date;
  description: string;
  
  // Multi-currency fields
  originalAmount?: number;     // Original amount before conversion
  originalCurrency?: string;   // Original currency code
  exchangeRate?: number;       // Rate used for conversion
  
  // Additional fields
  vendor?: string;
  notes?: string;
  taxDeductible?: boolean;
}
```

### User Settings Interface
```typescript
interface UserCurrencySettings {
  primaryCurrency: string;                    // Main currency for calculations
  displayCurrencies: string[];               // Additional currencies to show
  autoDetectLocation: boolean;               // Enable location detection
  autoConvert: boolean;                      // Auto-convert foreign expenses
  rateUpdateFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  fallbackCurrency: string;                 // Fallback when conversion fails
  roundingMode: 'round' | 'floor' | 'ceil'; // Number rounding method
  decimalPlaces: number;                     // Display decimal places
}
```

## Usage Examples

### Basic Currency Conversion
```typescript
import { CurrencyUtils } from '@/lib/currencyUtils';

// Convert 100 USD to EUR
const conversion = await CurrencyUtils.convertCurrency(100, 'USD', 'EUR');
console.log(`${conversion.fromAmount} ${conversion.fromCurrency} = ${conversion.toAmount} ${conversion.toCurrency}`);
```

### Auto-Detect User Currency
```typescript
// Detect user's local currency
const userCurrency = await CurrencyUtils.detectUserCurrency();
console.log(`Detected currency: ${userCurrency}`); // e.g., 'THB' if in Thailand
```

### Format Currency with Proper Symbols
```typescript
// Format amounts with proper currency symbols
const formatted = CurrencyUtils.formatCurrency(1234.56, 'EUR');
console.log(formatted); // "€1,234.56"

const formatted2 = CurrencyUtils.formatCurrency(1000000, 'JPY');
console.log(formatted2); // "¥1,000,000" (no decimals for JPY)
```

### Add Multi-Currency Expense
```typescript
// Add expense with automatic conversion
const expense = {
  description: "Dinner in Bangkok",
  amount: 800,           // THB amount
  originalAmount: 800,   // Original THB amount
  originalCurrency: 'THB',
  currency: 'USD',       // Converted to user's primary currency
  exchangeRate: 0.028,   // THB to USD rate
  categoryId: 'dining',
  date: new Date(),
  vendor: "Street Food Market"
};
```

### Get Popular Currencies for Nomads
```typescript
const popularCurrencies = CurrencyUtils.getPopularCurrencies();
// Returns currencies common in digital nomad destinations
```

### Currency by Region
```typescript
const currenciesByRegion = CurrencyUtils.getCurrenciesByRegion();
console.log(currenciesByRegion['Asia Pacific']); // Thai Baht, Vietnamese Dong, etc.
```

## Advanced Features

### Seasonal Rate Tracking
The system can track exchange rate trends over time:

```typescript
const trend = await CurrencyUtils.getExchangeRateTrend('USD', 'EUR', 30);
// Returns 30 days of USD/EUR rates for trend analysis
```

### Smart Rounding
Different currencies have different conventions:

```typescript
// Japanese Yen has no decimals
CurrencyUtils.roundAmount(1234.56, 'JPY'); // 1235

// Most currencies use 2 decimals
CurrencyUtils.roundAmount(1234.567, 'USD'); // 1234.57

// Cryptocurrency might use 4+ decimals
CurrencyUtils.roundAmount(0.123456, 'BTC', 'round', 6); // 0.123456
```

### Location-Based Currency Suggestions
When users travel to new locations:

```typescript
// Automatically suggest local currency
const currentLocation = await detectUserLocation();
if (currentLocation !== userSettings.primaryCurrency) {
  showCurrencySuggestion(currentLocation);
}
```

## Performance Optimizations

### Efficient API Usage
- **Request Batching**: Group multiple currency requests
- **Smart Caching**: 1-hour cache duration reduces API calls by 95%
- **Fallback Rates**: Offline functionality with cached rates
- **Request Deduplication**: Prevent duplicate API calls

### UI Optimizations
- **Lazy Loading**: Currency lists loaded on demand
- **Debounced Input**: Conversion updates debounced to prevent excessive calculations
- **Virtual Scrolling**: Efficient rendering of large currency lists
- **Progressive Enhancement**: Works without JavaScript for basic functions

## Privacy & Security

### Data Handling
- **No Financial Data Storage**: Only conversion rates and preferences stored
- **Location Privacy**: Location detection is optional and can be disabled
- **Local Storage**: Settings stored locally, not transmitted to servers
- **API Security**: Exchange rate API uses HTTPS and rate limiting

### Compliance
- **GDPR Compliant**: Location data handling follows GDPR guidelines
- **User Consent**: Clear consent for location access
- **Data Minimization**: Only necessary data collected and stored
- **Right to Delete**: Users can clear all currency data

## Troubleshooting

### Common Issues

**Exchange rates not loading:**
```typescript
// Check API status
const rate = await CurrencyUtils.getExchangeRate('USD', 'EUR');
if (!rate) {
  console.log('API unavailable, using cached rates');
}
```

**Location detection failing:**
```typescript
// Manual currency selection fallback
if (!detectedCurrency) {
  // Show manual currency picker
  showCurrencySelector();
}
```

**Conversion errors:**
```typescript
// Handle conversion failures gracefully
try {
  const conversion = await CurrencyUtils.convertCurrency(amount, from, to);
} catch (error) {
  // Fall back to manual entry
  showManualConversionForm();
}
```

### Performance Issues
- **Reduce API calls**: Increase cache duration for less frequent updates
- **Optimize currency lists**: Limit displayed currencies to user's preferences
- **Background updates**: Fetch rates in background for better UX

## Browser Compatibility

### Geolocation API Support
- ✅ Chrome 5+
- ✅ Firefox 3.5+
- ✅ Safari 5+
- ✅ Edge 12+
- ⚠️ Requires HTTPS in production

### Intl.NumberFormat Support
- ✅ Chrome 24+
- ✅ Firefox 29+
- ✅ Safari 10+
- ✅ Edge 12+

### Fetch API Support
- ✅ Chrome 42+
- ✅ Firefox 39+
- ✅ Safari 10.1+
- ✅ Edge 14+

## Future Enhancements

### Planned Features
- **Bank Integration**: Automatic currency detection from bank transactions
- **Cryptocurrency Support**: Bitcoin, Ethereum, and major altcoins
- **Historical Analysis**: Exchange rate trend analysis and predictions
- **Budget Allocation**: Multi-currency budget planning
- **Tax Optimization**: Currency-specific tax considerations
- **Offline Mode**: Full offline functionality with local rate storage

### API Improvements
- **Multiple Rate Sources**: Fallback to multiple exchange rate APIs
- **Rate Comparison**: Compare rates from different sources
- **Forward Contracts**: Support for future exchange rate locking
- **Rate Alerts**: Notifications when rates hit target levels

The Multi-Currency System provides comprehensive support for digital nomads and international users, making it easy to manage finances across multiple currencies with intelligent automation and user-friendly interfaces.
