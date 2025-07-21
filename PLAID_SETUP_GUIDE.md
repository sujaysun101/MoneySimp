# Plaid Environment Setup Guide

This guide will help you set up Plaid credentials for MoneySimp bank integration.

## Prerequisites

1. **Plaid Developer Account**: Sign up at [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. **Node.js and npm**: Ensure you have Node.js 16+ installed

## Step-by-Step Setup

### Step 1: Create Plaid Developer Account

1. Go to [Plaid Dashboard](https://dashboard.plaid.com/signup)
2. Sign up for a free developer account
3. Verify your email address
4. Complete the onboarding process

### Step 2: Create a New Application

1. In the Plaid Dashboard, click "Create Application"
2. Fill in the application details:
   - **Application Name**: MoneySimp
   - **Products**: Select "Transactions" (required for subscription detection)
   - **Environments**: Start with "Sandbox" for testing
   - **Webhook URL**: `http://localhost:3000/api/plaid/webhook` (for local development)

3. Click "Create Application"

### Step 3: Get Your Credentials

After creating the application, you'll see your credentials:

- **Client ID**: A public identifier for your application
- **Sandbox Secret**: Used for sandbox environment testing
- **Development Secret**: Used for development environment (if enabled)
- **Production Secret**: Used for production environment (if enabled)

### Step 4: Configure Environment Variables

1. In your MoneySimp project root, create or update your `.env.local` file:

```bash
# Plaid Configuration
NEXT_PUBLIC_PLAID_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_PLAID_ENV=sandbox
PLAID_SECRET=your_sandbox_secret_here

# App Configuration (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important Notes:**
- Replace `your_client_id_here` with your actual Plaid Client ID
- Replace `your_sandbox_secret_here` with your actual Plaid Sandbox Secret
- Keep the `PLAID_SECRET` private and never commit it to version control
- The `NEXT_PUBLIC_` prefix makes variables available to the client-side code

### Step 5: Environment-Specific Configuration

#### Sandbox Environment (Testing)
```bash
NEXT_PUBLIC_PLAID_ENV=sandbox
PLAID_SECRET=your_sandbox_secret_here
```
- Use this for initial testing and development
- Provides fake bank data for testing
- No real bank accounts are connected

#### Development Environment (Real Banks, Test Mode)
```bash
NEXT_PUBLIC_PLAID_ENV=development
PLAID_SECRET=your_development_secret_here
```
- Use this to test with real bank connections
- Limited to 100 Items (bank connections)
- Requires additional verification from Plaid

#### Production Environment (Live)
```bash
NEXT_PUBLIC_PLAID_ENV=production
PLAID_SECRET=your_production_secret_here
```
- Use this for your live application
- Requires full Plaid compliance review
- Real money and data involved

### Step 6: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the Plaid test page:
```
http://localhost:3000/test/plaid
```

3. Run the configuration tests to verify your setup
4. If all tests pass, try connecting a test bank account

### Step 7: Install Required Dependencies

Make sure you have the required Plaid dependencies installed:

```bash
npm install plaid react-plaid-link
npm install --save-dev @types/react
```

## Sandbox Test Credentials

When using the sandbox environment, you can use these test credentials:

**Test Bank**: First Platypus Bank
- **Username**: `user_good`
- **Password**: `pass_good`

**Test Credit Union**: Tattersall Federal Credit Union
- **Username**: `user_good`
- **Password**: `pass_good`

## Common Issues and Solutions

### Issue 1: "Invalid client_id"
- **Solution**: Double-check your `NEXT_PUBLIC_PLAID_CLIENT_ID` in `.env.local`
- Make sure there are no extra spaces or quotes

### Issue 2: "Invalid secret"
- **Solution**: Verify your `PLAID_SECRET` matches your environment
- Sandbox secret for sandbox environment, etc.

### Issue 3: "Environment variables not loading"
- **Solution**: Restart your development server after changing `.env.local`
- Make sure the file is named exactly `.env.local` (not `.env`)

### Issue 4: "Webhook URL invalid"
- **Solution**: For local development, use a service like ngrok to create a public URL
- Or use the provided test webhook endpoint

## Security Best Practices

1. **Never commit secrets to version control**
   - Add `.env.local` to your `.gitignore` file
   - Use different secrets for different environments

2. **Use environment-specific secrets**
   - Sandbox secrets for development
   - Production secrets only for production

3. **Rotate secrets regularly**
   - Plaid allows you to regenerate secrets if compromised

4. **Limit access tokens**
   - Store access tokens securely
   - Implement token encryption in production

## Next Steps

Once your Plaid setup is complete:

1. ✅ Test the connection with sandbox accounts
2. ✅ Verify transaction fetching works
3. ✅ Test subscription detection
4. 🔄 Set up webhooks for real-time updates
5. 🔄 Implement production-ready error handling
6. 🔄 Add user account management

## Support

- **Plaid Documentation**: [https://plaid.com/docs/](https://plaid.com/docs/)
- **Plaid Discord**: [https://discord.gg/plaid](https://discord.gg/plaid)
- **MoneySimp Issues**: Create an issue in the project repository

## Environment File Template

Create a `.env.local` file in your project root with this template:

```bash
# Copy this template and fill in your actual Plaid credentials

# Plaid Configuration
NEXT_PUBLIC_PLAID_CLIENT_ID=
NEXT_PUBLIC_PLAID_ENV=sandbox
PLAID_SECRET=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Firebase Configuration (if using Firebase)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Encryption (generate a random 32-character string)
ENCRYPTION_KEY=
```

Remember to never commit this file to version control!
