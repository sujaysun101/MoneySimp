// src/components/income/IncomeSourceList.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2,
  Briefcase,
  TrendingUp,
  Banknote,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { IncomeSource } from '@/lib/types';

interface IncomeSourceListProps {
  incomeSources: IncomeSource[];
  onEdit: (income: IncomeSource) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onAdd: () => void;
  className?: string;
}

type IncomeCategory = 'salary' | 'freelance' | 'investment' | 'business' | 'other';

const INCOME_TYPE_CONFIG: Record<IncomeCategory, { 
  icon: React.ReactNode; 
  label: string; 
  color: string;
}> = {
  salary: { 
    icon: <Building2 className="h-4 w-4" />, 
    label: 'Salary', 
    color: 'bg-blue-100 text-blue-800' 
  },
  freelance: { 
    icon: <Briefcase className="h-4 w-4" />, 
    label: 'Freelance', 
    color: 'bg-purple-100 text-purple-800' 
  },
  business: { 
    icon: <TrendingUp className="h-4 w-4" />, 
    label: 'Business', 
    color: 'bg-green-100 text-green-800' 
  },
  investment: { 
    icon: <Banknote className="h-4 w-4" />, 
    label: 'Investment', 
    color: 'bg-yellow-100 text-yellow-800' 
  },
  other: { 
    icon: <DollarSign className="h-4 w-4" />, 
    label: 'Other', 
    color: 'bg-gray-100 text-gray-800' 
  }
};

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  'one-time': 'One-time'
};

export function IncomeSourceList({
  incomeSources,
  onEdit,
  onDelete,
  onToggleActive,
  onAdd,
  className
}: IncomeSourceListProps) {
  const [selectedIncome, setSelectedIncome] = useState<string | null>(null);

  const activeSources = incomeSources.filter(source => source.isActive);
  const inactiveSources = incomeSources.filter(source => !source.isActive);

  const totalMonthlyIncome = activeSources.reduce((total, source) => {
    let monthlyAmount = source.amount;
    
    // Convert to monthly amount based on frequency
    switch (source.frequency) {
      case 'weekly':
        monthlyAmount = source.amount * 4.33; // Average weeks per month
        break;
      case 'biweekly':
        monthlyAmount = source.amount * 2.17; // Average bi-weeks per month
        break;
      case 'monthly':
        monthlyAmount = source.amount;
        break;
      case 'quarterly':
        monthlyAmount = source.amount / 3;
        break;
      case 'yearly':
        monthlyAmount = source.amount / 12;
        break;
      case 'one-time':
        monthlyAmount = 0; // Don't count one-time in monthly total
        break;
    }
    
    return total + monthlyAmount;
  }, 0);

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    
    let d: Date;
    if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else if (date && typeof date === 'object' && 'toDate' in date) {
      // Handle Firestore Timestamp
      d = (date as any).toDate();
    } else {
      return 'Invalid Date';
    }
    
    // Check if the date is valid
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const isExpired = (source: IncomeSource) => {
    if (!source.endDate) return false;
    
    let endDate: Date;
    if (typeof source.endDate === 'string') {
      endDate = new Date(source.endDate);
    } else if (source.endDate instanceof Date) {
      endDate = source.endDate;
    } else if (source.endDate && typeof source.endDate === 'object' && 'toDate' in source.endDate) {
      // Handle Firestore Timestamp
      endDate = (source.endDate as any).toDate();
    } else {
      return false; // If we can't parse the date, assume it's not expired
    }
    
    // Check if the date is valid
    if (isNaN(endDate.getTime())) {
      return false;
    }
    
    return endDate < new Date();
  };

  const IncomeSourceCard = ({ source }: { source: IncomeSource }) => {
    const config = INCOME_TYPE_CONFIG[source.category];
    const expired = isExpired(source);
    
    return (
      <Card 
        key={source.id}
        className={`transition-all duration-200 ${
          selectedIncome === source.id ? 'ring-2 ring-primary' : ''
        } ${!source.isActive ? 'opacity-60' : ''}`}
        onClick={() => setSelectedIncome(selectedIncome === source.id ? null : source.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={config.color}>
                  {config.icon}
                  <span className="ml-1">{config.label}</span>
                </Badge>
                
                {expired && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
                
                {!source.isActive && (
                  <Badge variant="secondary">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-1">{source.name}</h3>
              
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">
                    ${source.amount.toLocaleString()} {FREQUENCY_LABELS[source.frequency]}
                  </span>
                  {/* Tax withholding property removed or not present in IncomeSource */}
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(source.startDate)}
                    {source.endDate && ` - ${formatDate(source.endDate)}`}
                  </span>
                </div>
                
                {/* Description property removed because it does not exist on IncomeSource */}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(source)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggleActive(source.id, !source.isActive)}
                >
                  {source.isActive ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(source.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Income Sources
            </div>
            <Button onClick={onAdd} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
          </CardTitle>
          <CardDescription>
            Manage your income sources for accurate cash flow forecasting
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Sources</p>
              <p className="text-2xl font-bold">{incomeSources.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Active Sources</p>
              <p className="text-2xl font-bold text-green-600">{activeSources.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-2xl font-bold text-primary">
                ${totalMonthlyIncome.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Sources List */}
      {incomeSources.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>No income sources configured yet.</p>
              <Button onClick={onAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Income Source
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {/* Active Income Sources */}
          {activeSources.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Active Income Sources ({activeSources.length})
              </h3>
              <div className="grid gap-3">
                {activeSources.map(source => (
                  <IncomeSourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Income Sources */}
          {inactiveSources.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
                Inactive Income Sources ({inactiveSources.length})
              </h3>
              <div className="grid gap-3">
                {inactiveSources.map(source => (
                  <IncomeSourceCard key={source.id} source={source} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default IncomeSourceList;
