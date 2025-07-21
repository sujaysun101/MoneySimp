'use client';

import React, { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PlaidConfig {
  clientId?: string;
  environment: string;
  products: string[];
  countryCodes: string[];
}

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

export default function PlaidTestPage() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [plaidConfig, setPlaidConfig] = useState<PlaidConfig | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);

  // Initialize tests
  useEffect(() => {
    runConfigurationTests();
  }, []);

  const runConfigurationTests = async () => {
    setIsLoading(true);
    const results: TestResult[] = [];

    // Test 1: Check environment variables
    results.push({
      test: 'Environment Variables',
      status: process.env.NEXT_PUBLIC_PLAID_CLIENT_ID ? 'pass' : 'fail',
      message: process.env.NEXT_PUBLIC_PLAID_CLIENT_ID 
        ? 'Plaid Client ID found' 
        : 'NEXT_PUBLIC_PLAID_CLIENT_ID not set'
    });

    results.push({
      test: 'Plaid Environment',
      status: process.env.NEXT_PUBLIC_PLAID_ENV ? 'pass' : 'fail',
      message: process.env.NEXT_PUBLIC_PLAID_ENV 
        ? `Environment: ${process.env.NEXT_PUBLIC_PLAID_ENV}` 
        : 'NEXT_PUBLIC_PLAID_ENV not set'
    });

    // Test 2: Fetch Plaid configuration
    try {
      const configResponse = await fetch('/api/plaid/config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        setPlaidConfig(config);
        results.push({
          test: 'Plaid Configuration API',
          status: 'pass',
          message: 'Configuration endpoint accessible'
        });
      } else {
        results.push({
          test: 'Plaid Configuration API',
          status: 'fail',
          message: `API returned ${configResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        test: 'Plaid Configuration API',
        status: 'fail',
        message: 'Failed to fetch configuration'
      });
    }

    // Test 3: Create link token
    try {
      const linkTokenResponse = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-123' })
      });

      if (linkTokenResponse.ok) {
        const { linkToken: token } = await linkTokenResponse.json();
        setLinkToken(token);
        results.push({
          test: 'Link Token Creation',
          status: 'pass',
          message: 'Link token created successfully'
        });
      } else {
        results.push({
          test: 'Link Token Creation',
          status: 'fail',
          message: `Failed to create link token: ${linkTokenResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        test: 'Link Token Creation',
        status: 'fail',
        message: 'Error creating link token'
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const { open, ready, error } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            public_token,
            userId: 'test-user-123',
            metadata 
          })
        });

        if (response.ok) {
          const { accessToken } = await response.json();
          
          // Fetch accounts to verify connection
          const accountsResponse = await fetch('/api/plaid/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken })
          });

          if (accountsResponse.ok) {
            const accounts = await accountsResponse.json();
            setConnectedAccounts(accounts);
            
            // Update test results
            setTestResults(prev => [...prev, {
              test: 'Bank Connection Test',
              status: 'pass',
              message: `Successfully connected ${accounts.length} account(s)`
            }]);
          }
        }
      } catch (error) {
        setTestResults(prev => [...prev, {
          test: 'Bank Connection Test',
          status: 'fail',
          message: 'Failed to complete bank connection'
        }]);
      }
    },
    onExit: (err, metadata) => {
      if (err) {
        setTestResults(prev => [...prev, {
          test: 'Bank Connection Test',
          status: 'fail',
          message: `Connection cancelled: ${err.error_message || 'User cancelled'}`
        }]);
      }
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Plaid Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test your Plaid configuration and bank connection setup
        </p>
      </div>

      {/* Configuration Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Configuration Tests
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            Verify that Plaid is properly configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{result.message}</span>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={runConfigurationTests} disabled={isLoading}>
              {isLoading ? 'Running Tests...' : 'Rerun Tests'}
            </Button>
            
            {linkToken && ready && (
              <Button onClick={() => open()} variant="outline">
                Test Bank Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plaid Configuration Display */}
      {plaidConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>
              Your current Plaid setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Environment</label>
                <p className="text-sm text-muted-foreground">{plaidConfig.environment}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Client ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {plaidConfig.clientId ? `${plaidConfig.clientId.substring(0, 8)}...` : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Products</label>
                <p className="text-sm text-muted-foreground">{plaidConfig.products.join(', ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Country Codes</label>
                <p className="text-sm text-muted-foreground">{plaidConfig.countryCodes.join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Test Accounts</CardTitle>
            <CardDescription>
              Accounts successfully connected during testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.subtype} • {account.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${account.balances?.current?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Instructions */}
      {testResults.some(r => r.status === 'fail') && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some tests failed. Please check your environment variables and Plaid configuration.
            Make sure you have set NEXT_PUBLIC_PLAID_CLIENT_ID, NEXT_PUBLIC_PLAID_ENV, and PLAID_SECRET in your .env file.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
