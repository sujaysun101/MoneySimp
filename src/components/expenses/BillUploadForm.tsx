// src/components/expenses/BillUploadForm.tsx
"use client";

import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const billUploadSchema = z.object({
  billImage: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type BillUploadFormValues = z.infer<typeof billUploadSchema>;

export function BillUploadForm() {
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<BillUploadFormValues>({
    resolver: zodResolver(billUploadSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("billImage", event.target.files); // Set for validation
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
      form.setValue("billImage", null); // Clear for validation
    }
  };

  function onSubmit(data: BillUploadFormValues) {
    console.log('Bill image data:', data.billImage[0]); // Replace with actual upload and OCR logic
    // For now, just show a toast. In a real app, you'd upload the file.
    toast({
      title: "Bill Uploaded",
      description: "Your bill image has been uploaded for processing.",
    });
    form.reset();
    setPreview(null);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="billImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Upload Bill Image</FormLabel>
              <FormControl>
                <div className="flex flex-col items-center justify-center w-full">
                    <label
                        htmlFor="bill-upload"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                    >
                        {preview ? (
                            <Image src={preview} alt="Bill preview" width={200} height={200} className="max-h-56 object-contain rounded-md" data-ai-hint="bill document" />
                        ) : (
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP (MAX. 5MB)</p>
                            </div>
                        )}
                        <Input 
                            id="bill-upload" 
                            type="file" 
                            className="hidden" 
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            onChange={handleFileChange} // Use custom handler
                            // {...field} but onChange is handled separately
                         />
                    </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full md:w-auto" disabled={!preview}>
          <ImageIcon className="mr-2 h-4 w-4" /> Scan Bill
        </Button>
      </form>
    </Form>
  );
}
