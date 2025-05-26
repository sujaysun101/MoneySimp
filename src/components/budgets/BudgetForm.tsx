// src/components/budgets/BudgetForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Save, XCircle } from 'lucide-react'; // Added Save and XCircle
import type { Budget } from '@/lib/types';

const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Category is required."),
  amount: z.coerce.number().positive("Budget amount must be positive."),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  onBudgetSubmit: (data: BudgetFormValues, editingBudgetId?: string) => void;
  existingBudgets: { categoryId: string }[]; // To disable already budgeted categories in add mode
  editingBudget: Budget | null;
  onCancelEdit: () => void;
}

export function BudgetForm({ onBudgetSubmit, existingBudgets, editingBudget, onCancelEdit }: BudgetFormProps) {
  const { toast } = useToast();
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      categoryId: '',
      amount: 0,
    },
  });

  useEffect(() => {
    if (editingBudget) {
      form.reset({
        categoryId: editingBudget.categoryId,
        amount: editingBudget.amount,
      });
    } else {
      form.reset({
        categoryId: '',
        amount: 0,
      });
    }
  }, [editingBudget, form]);

  function onSubmit(data: BudgetFormValues) {
    if (editingBudget) {
      onBudgetSubmit(data, editingBudget.id);
    } else {
      onBudgetSubmit(data);
    }
    // Toast is handled by parent
  }

  const isEditMode = !!editingBudget;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  disabled={isEditMode}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                       <SelectItem 
                        key={category.id} 
                        value={category.id}
                        // Disable if editing OR if adding and category already has a budget
                        disabled={isEditMode ? category.id !== editingBudget?.categoryId : existingBudgets.some(b => b.categoryId === category.id)}
                      >
                        <div className="flex items-center">
                          <category.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex space-x-3">
          <Button type="submit" className="w-full md:w-auto">
            {isEditMode ? (
              <> <Save className="mr-2 h-4 w-4" /> Update Budget </>
            ) : (
              <> <PlusCircle className="mr-2 h-4 w-4" /> Set Budget </>
            )}
          </Button>
          {isEditMode && (
            <Button type="button" variant="outline" onClick={onCancelEdit} className="w-full md:w-auto">
              <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
