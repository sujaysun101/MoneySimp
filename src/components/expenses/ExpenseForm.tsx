// src/components/expenses/ExpenseForm.tsx
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORIES, TAX_CATEGORIES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Expense } from '@/lib/types';

const expenseFormSchema = z.object({
  description: z.string().min(1, "Description is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  categoryId: z.string().min(1, "Category is required."),
  date: z.date({ required_error: "Date is required." }),
  taxDeductible: z.boolean().optional(),
  taxCategory: z.string().optional(),
  vendor: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'billUrl'>) => void;
  onSubmitSuccess?: () => void; // Callback for successful submission
}

export function ExpenseForm({ onAddExpense, onSubmitSuccess }: ExpenseFormProps) {
  const { toast } = useToast();
  const [showTaxFields, setShowTaxFields] = useState(false);
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      description: '',
      amount: 0,
      categoryId: '',
      date: new Date(),
      taxDeductible: false,
      taxCategory: '',
      vendor: '',
      receiptNumber: '',
      notes: '',
    },
  });

  function onSubmit(data: ExpenseFormValues) {
    onAddExpense(data);
    toast({
      title: "Expense Added",
      description: `${data.description} for $${data.amount.toFixed(2)} added successfully.`,
    });
    form.reset({ // Reset form to default values, including date
      description: '',
      amount: 0,
      categoryId: '',
      date: new Date(),
      taxDeductible: false,
      taxCategory: '',
      vendor: '',
      receiptNumber: '',
      notes: '',
    });
    setShowTaxFields(false);
    if (onSubmitSuccess) onSubmitSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee with friends" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
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
        </div>
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Tax Deductible Checkbox */}
        <FormField
          control={form.control}
          name="taxDeductible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setShowTaxFields(!!checked);
                    if (!checked) {
                      form.setValue('taxCategory', '');
                      form.setValue('vendor', '');
                      form.setValue('receiptNumber', '');
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Tax Deductible
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Mark this expense as tax deductible for reporting
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Tax Fields - Show only when tax deductible is checked */}
        {showTaxFields && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-4 w-4" />
              <span className="font-medium text-sm">Tax Information</span>
            </div>
            
            <FormField
              control={form.control}
              name="taxCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue="">
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TAX_CATEGORIES.map((taxCategory) => (
                        <SelectItem key={taxCategory.id} value={taxCategory.id}>
                          <div className="flex items-center">
                            <taxCategory.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {taxCategory.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor/Business</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Corporation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt/Invoice #</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., INV-001234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Purpose/Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the business purpose of this expense..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Required for tax documentation - explain why this expense is business-related
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </form>
    </Form>
  );
}
