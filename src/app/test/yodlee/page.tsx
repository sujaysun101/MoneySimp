'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

interface YodleeConfig {
  environment: string;
  clientId?: string;
  baseURL: string;
  features: string[];
}

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

interface YodleeProvider {
  id: number;
  name: string;
  loginUrl: string;
  baseUrl: string;
  favicon: string;
  logo: string;
  status: string;
  countryISOCode: string;
}

export default function YodleeTestPage() {
  const [yodleeConfig, setYodleeConfig] = useState<YodleeConfig | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<YodleeProvider[]>([]);
  const [fastLinkUrl, setFastLinkUrl] = useState<string | null>(null);
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
      status: process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID ? 'pass' : 'fail',
      message: process.env.NEXT_PUBLIC_YODLEE_CLIENT_ID 
        ? 'Yodlee Client ID found' 
        : 'NEXT_PUBLIC_YODLEE_CLIENT_ID not set'
    });

    results.push({
      test: 'Yodlee Environment',
      status: process.env.NEXT_PUBLIC_YODLEE_ENV ? 'pass' : 'fail',
      message: process.env.NEXT_PUBLIC_YODLEE_ENV 
        ? `Environment: ${process.env.NEXT_PUBLIC_YODLEE_ENV}` 
        : 'NEXT_PUBLIC_YODLEE_ENV not set (defaulting to sandbox)'
    });

    // Test 2: Fetch Yodlee configuration
    try {
      const configResponse = await fetch('/api/yodlee/config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        setYodleeConfig(config);
        results.push({
          test: 'Yodlee Configuration API',
          status: 'pass',
          message: 'Configuration endpoint accessible'
        });
      } else {
        results.push({
          test: 'Yodlee Configuration API',
          status: 'fail',
          message: `API returned ${configResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        test: 'Yodlee Configuration API',
        status: 'fail',
        message: 'Failed to fetch configuration'
      });
    }

    // Test 3: Fetch available providers
    try {
      const providersResponse = await fetch('/api/yodlee/providers');
      if (providersResponse.ok) {
        const providersData = await providersResponse.json();
        setProviders(providersData.slice(0, 10)); // Show first 10 for demo
        results.push({
          test: 'Financial Institutions',
          status: 'pass',
          message: `Found ${providersData.length} available institutions`
        });
      } else {
        results.push({
          test: 'Financial Institutions',
          status: 'fail',
          message: `Failed to fetch providers: ${providersResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        test: 'Financial Institutions',
        status: 'fail',
        message: 'Error fetching financial institutions'
      });
    }

    // Test 4: Generate FastLink URL
    try {
      const fastLinkResponse = await fetch('/api/yodlee/fastlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'test-user-123',
          callbackUrl: `${window.location.origin}/api/yodlee/callback`
        })
      });

      if (fastLinkResponse.ok) {
        const { fastLinkUrl: url } = await fastLinkResponse.json();
        setFastLinkUrl(url);
        results.push({
          test: 'FastLink URL Generation',
          status: 'pass',
          message: 'FastLink URL generated successfully'
        });
      } else {
        results.push({
          test: 'FastLink URL Generation',
          status: 'fail',
          message: `Failed to generate FastLink URL: ${fastLinkResponse.status}`
        });
      }
    } catch (error) {
      results.push({
        test: 'FastLink URL Generation',
        status: 'fail',
        message: 'Error generating FastLink URL'
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  const testAccountConnection = async () => {
    try {
      const accountsResponse = await fetch('/api/yodlee/accounts');
      if (accountsResponse.ok) {
        const accounts = await accountsResponse.json();
        setConnectedAccounts(accounts);
        
        setTestResults(prev => [...prev, {
          test: 'Account Connection Test',
          status: 'pass',
          message: `Successfully fetched ${accounts.length} account(s)`
        }]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Account Connection Test',
        status: 'fail',
        message: 'Failed to fetch accounts'
      }]);
    }
  };

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Yodlee Integration Test</h1>
        <p className="text-muted-foreground mt-2">
          Test your Yodlee configuration and bank connection setup
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
            Verify that Yodlee is properly configured
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
            
            <Button onClick={testAccountConnection} variant="outline">
              Test Account Fetch
            </Button>
            
            {fastLinkUrl && (
              <Button 
                onClick={() => window.open(fastLinkUrl, '_blank')} 
                variant="outline"
                className="flex items-center gap-2"
              >
                Open FastLink <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Yodlee Configuration Display */}
      {yodleeConfig && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Configuration</CardTitle>
            <CardDescription>
              Your current Yodlee setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Environment</label>
                <p className="text-sm text-muted-foreground">{yodleeConfig.environment}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Client ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {yodleeConfig.clientId ? `${yodleeConfig.clientId.substring(0, 8)}...` : 'Not set'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Base URL</label>
                <p className="text-sm text-muted-foreground">{yodleeConfig.baseURL}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Features</label>
                <p className="text-sm text-muted-foreground">{yodleeConfig.features.join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Financial Institutions */}
      {providers.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Available Financial Institutions</CardTitle>
            <CardDescription>
              Sample of supported banks and credit unions (showing first 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {provider.favicon && (
                    <img 
                      src={provider.favicon} 
                      alt={provider.name}
                      className="w-6 h-6 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{provider.name}</p>
                    <p className="text-xs text-muted-foreground">{provider.countryISOCode}</p>
                  </div>
                  <Badge 
                    variant={provider.status === 'Supported' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {provider.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Test Accounts */}
      {connectedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Test Accounts</CardTitle>
            <CardDescription>
              Accounts successfully fetched during testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedAccounts.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {account.subtype} • {account.type} • {account.institutionName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${account.balance?.current?.toFixed(2) || '0.00'}
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
            Some tests failed. Please check your environment variables and Yodlee configuration.
            Make sure you have set NEXT_PUBLIC_YODLEE_CLIENT_ID, NEXT_PUBLIC_YODLEE_ENV, and YODLEE_SECRET in your .env file.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
