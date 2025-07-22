# Yodlee Integration Setup Guide

Yodlee (Envestnet) provides comprehensive financial data aggregation with a free developer tier. This guide will help you set up Yodlee integration for MoneySimp.

## 🆓 Free Tier Benefits

- **100 users** in sandbox environment
- **Unlimited API calls** during development
- **Global bank coverage** (US, CA, UK, AU, IN, and more)
- **No credit card required** for sandbox
- **Production access** available with approval

## Prerequisites

1. **Yodlee Developer Account**: Sign up at [https://developer.yodlee.com](https://developer.yodlee.com)
2. **Node.js 16+**: Ensure you have Node.js installed
3. **Valid Email**: For account verification

## Step-by-Step Setup

### Step 1: Create Yodlee Developer Account

1. Visit [Yodlee Developer Portal](https://developer.yodlee.com)
2. Click "Sign Up" and create your account
3. Verify your email address
4. Complete the developer profile

### Step 2: Create a New Application

1. Log into the Yodlee Developer Console
2. Navigate to "My Apps" section
3. Click "Create New App"
4. Fill in application details:
   - **App Name**: MoneySimp
   - **Description**: Personal finance management application
   - **Category**: Personal Finance
   - **Environment**: Sandbox (for testing)

### Step 3: Get Your API Credentials

After creating the app, you'll receive:

- **Client ID**: Public identifier for your application
- **Secret**: Private key for authentication (keep secure!)
- **Base URL**: API endpoint for your environment

### Step 4: Configure Environment Variables

Create or update your `.env.local` file:

```bash
# Yodlee Configuration
NEXT_PUBLIC_YODLEE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_YODLEE_ENV=sandbox
YODLEE_SECRET=your_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_BANK_INTEGRATION=true

# Yodlee configuration only
NEXT_PUBLIC_YODLEE_CLIENT_ID=your_yodlee_client_id
YODLEE_SECRET=your_yodlee_secret
NEXT_PUBLIC_YODLEE_ENV=sandbox
```

### Step 5: Environment Options

#### Sandbox Environment (Free - Recommended for Start)
```bash
NEXT_PUBLIC_YODLEE_ENV=sandbox
```
- ✅ **Free forever**
- ✅ **100 user limit**
- ✅ **All features available**
- ✅ **Test bank data**
- ✅ **No real bank connections**

#### Development Environment
```bash
NEXT_PUBLIC_YODLEE_ENV=development
```
- ✅ **Real bank connections**
- ✅ **Limited users (contact Yodlee)**
- ⚠️ **May require approval**
- ⚠️ **Real financial data**

#### Production Environment
```bash
NEXT_PUBLIC_YODLEE_ENV=production
```
- ✅ **Full production access**
- ✅ **Unlimited users**
- ❌ **Requires business verification**
- ❌ **May have costs at scale**

### Step 6: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the Yodlee test page:
```
http://localhost:3000/test/yodlee
```

3. Run the configuration tests to verify setup
4. Browse available financial institutions
5. Test the FastLink integration flow

### Step 7: Install Dependencies

The required dependencies should already be installed, but verify:

```bash
npm install axios
```

## Sandbox Test Instructions

### Using FastLink (Yodlee's Bank Connection UI)

1. **Open FastLink URL** from the test page
2. **Search for a bank** (try "Wells Fargo" or "Chase")
3. **Use test credentials**:
   - Username: `yodleeuser1`
   - Password: `yodleeuser1#123`
   - Security Questions: Any answers work

### Test Bank Credentials

For sandbox testing, you can use these institutions:

**Wells Fargo**
- Username: `yodleeuser1`
- Password: `yodleeuser1#123`

**Chase Bank**
- Username: `yodleeuser2` 
- Password: `yodleeuser2#123`

**Bank of America**
- Username: `yodleeuser3`
- Password: `yodleeuser3#123`

## API Features Available

### 🏦 Account Management
- Fetch all user accounts
- Real-time balance updates
- Account type classification
- Multi-currency support

### 💳 Transaction Data
- Historical transactions
- Real-time transaction updates
- Smart categorization
- Merchant information

### 🔄 Recurring Payments
- Automatic subscription detection
- Payment frequency analysis
- Next payment predictions
- Cancellation tracking

### 🏛️ Institution Coverage
- **17,000+ global institutions**
- **US**: All major banks and credit unions
- **Canada**: Big 6 banks + regional
- **UK**: Open Banking support
- **Australia**: Big 4 banks
- **India**: Major banks and fintech

## Configuration Options

### Basic Configuration
```bash
# Minimal setup for testing
NEXT_PUBLIC_YODLEE_CLIENT_ID=your_client_id
YODLEE_SECRET=your_secret
NEXT_PUBLIC_YODLEE_ENV=sandbox
```

### Advanced Configuration
```bash
# Full feature set
NEXT_PUBLIC_YODLEE_CLIENT_ID=your_client_id
YODLEE_SECRET=your_secret
NEXT_PUBLIC_YODLEE_ENV=sandbox

# Feature flags
NEXT_PUBLIC_ENABLE_BANK_INTEGRATION=true
NEXT_PUBLIC_SUBSCRIPTION_DETECTION=true
NEXT_PUBLIC_AUTO_SYNC=true

# Backup/fallback settings
NEXT_PUBLIC_MANUAL_MODE_ONLY=false
```

## Common Issues & Solutions

### Issue 1: "Invalid Client ID"
**Solution:**
- Verify `NEXT_PUBLIC_YODLEE_CLIENT_ID` in `.env.local`
- Ensure no extra spaces or quotes
- Check the Yodlee developer console for correct ID

### Issue 2: "Authentication Failed"
**Solution:**
- Verify `YODLEE_SECRET` matches your environment
- Restart dev server after changing environment variables
- Check that secret hasn't been regenerated

### Issue 3: "FastLink Not Loading"
**Solution:**
- Ensure popup blockers are disabled
- Check browser console for CORS errors
- Verify callback URL is correctly configured

### Issue 4: "No Institutions Found"
**Solution:**
- Check your environment (sandbox vs production)
- Verify network connectivity
- Try searching for major banks like "Chase" or "Wells Fargo"

## Security Best Practices

### 🔒 Credential Management
1. **Never commit secrets** to version control
2. **Use different credentials** for different environments
3. **Rotate secrets regularly** if compromised
4. **Limit API access** to necessary features only

### 🛡️ Data Protection
1. **Encrypt sensitive data** at rest
2. **Use HTTPS** for all communications
3. **Implement rate limiting** to prevent abuse
4. **Log access patterns** for security monitoring

### 🔐 User Privacy
1. **Obtain explicit consent** before connecting accounts
2. **Provide clear data usage policies**
3. **Offer easy disconnection** options
4. **Regular security audits**

## Production Deployment

### Checklist for Going Live

- [ ] **Business verification** completed with Yodlee
- [ ] **Production credentials** obtained
- [ ] **Privacy policy** updated with Yodlee integration
- [ ] **User consent flows** implemented
- [ ] **Error handling** and monitoring setup
- [ ] **Data encryption** enabled
- [ ] **Backup strategies** in place

### Cost Considerations

**Sandbox**: Free forever (100 users)
**Production**: Contact Yodlee for pricing
- Typically based on connected accounts
- Volume discounts available
- Free tier options for startups

## Yodlee Benefits

**Key Advantages:**
- ✅ 100 users forever on free tier
- ✅ 17,000+ institutions globally
- ✅ Competitive production pricing
- ✅ Comprehensive transaction data
- ✅ Strong enterprise support

## Next Steps

1. ✅ **Complete setup** following this guide
2. ✅ **Test integration** with sandbox
3. ✅ **Build user flows** for account connection
4. 🔄 **Apply for production** when ready to scale
5. 🔄 **Implement monitoring** and error handling
6. 🔄 **Add user consent** and privacy controls

## Support & Resources

- **Documentation**: [https://developer.yodlee.com/docs](https://developer.yodlee.com/docs)
- **API Reference**: [https://developer.yodlee.com/api-reference](https://developer.yodlee.com/api-reference)
- **Support Portal**: Available in developer console
- **Community**: Developer forums and Stack Overflow

## Environment Template

Create a `.env.local` file with this template:

```bash
# Yodlee Configuration
NEXT_PUBLIC_YODLEE_CLIENT_ID=
YODLEE_SECRET=

# Environment (sandbox/development/production)
NEXT_PUBLIC_YODLEE_ENV=sandbox

# Feature Flags
NEXT_PUBLIC_ENABLE_BANK_INTEGRATION=true
NEXT_PUBLIC_SUBSCRIPTION_DETECTION=true
NEXT_PUBLIC_AUTO_SYNC=true
NEXT_PUBLIC_MANUAL_MODE_ONLY=false

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security
ENCRYPTION_KEY=generate_a_32_character_random_string_here

# Firebase (if using)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Why Choose Yodlee?

**🎉 You're all set!** Yodlee integration gives you a powerful bank integration solution with global coverage and no upfront costs.
