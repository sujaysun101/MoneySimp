'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FEATURE_FLAGS, getBankIntegrationStatus, getAvailableBankProviders } from '@/lib/feature-flags';
import { CreditCard, Plus, Zap, Shield, Globe, Clock } from 'lucide-react';

export function BankConnectionBanner() {
  const integrationStatus = getBankIntegrationStatus();
  const availableProviders = getAvailableBankProviders();

  if (integrationStatus === 'manual-only') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900">Privacy-First Manual Tracking</h3>
              <p className="text-sm text-blue-700">
                Take complete control of your financial data with manual expense tracking. 
                No bank connections, maximum privacy.
              </p>
            </div>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              Privacy First
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (integrationStatus === 'manual-fallback') {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Bank Integration Coming Soon</h3>
              <p className="text-sm text-amber-700">
                Automatic transaction import will be available in a future update. 
                For now, enjoy secure manual tracking with full privacy.
              </p>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              Manual Mode
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show available integrations
  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">Connect Your Bank Account</h3>
              <p className="text-sm text-green-700">
                Automatically import transactions and get smart insights from your spending patterns.
              </p>
            </div>
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              Connect Bank
            </Button>
          </div>

          {/* Available Providers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableProviders.map((provider) => (
              <div key={provider.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-green-900">{provider.name}</h4>
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      {provider.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-green-700 mb-2">{provider.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.slice(0, 2).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {provider.features.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{provider.features.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Globe className="h-4 w-4 text-green-600 mb-1" />
                  <p className="text-xs text-green-700">{provider.countries.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Alternative */}
      <Card className="border-gray-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Plus className="h-4 w-4 text-gray-600" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Or continue with manual entry</h4>
              <p className="text-xs text-gray-600">
                Keep your data completely private with manual expense tracking
              </p>
            </div>
            <Button variant="outline" size="sm">
              Manual Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function IntegrationStatusCard() {
  const integrationStatus = getBankIntegrationStatus();
  const availableProviders = getAvailableBankProviders();

  const getStatusConfig = () => {
    switch (integrationStatus) {
      case 'manual-only':
        return {
          color: 'blue',
          icon: Shield,
          title: 'Privacy Mode',
          description: 'Manual tracking with maximum privacy'
        };
      case 'plaid-enabled':
        return {
          color: 'green',
          icon: Zap,
          title: 'Plaid Connected',
          description: 'Ready for bank integration'
        };
      case 'yodlee-enabled':
        return {
          color: 'green',
          icon: Globe,
          title: 'Yodlee Connected',
          description: 'Global bank integration available'
        };
      case 'both-enabled':
        return {
          color: 'purple',
          icon: CreditCard,
          title: 'Multiple Providers',
          description: 'Choose your preferred bank integration'
        };
      default:
        return {
          color: 'gray',
          icon: Clock,
          title: 'Manual Mode',
          description: 'Bank integration coming soon'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 text-${config.color}-600`} />
          <div className="flex-1">
            <h3 className="font-semibold">{config.title}</h3>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Badge variant={integrationStatus === 'manual-only' ? 'secondary' : 'default'}>
            {availableProviders.length} provider{availableProviders.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
