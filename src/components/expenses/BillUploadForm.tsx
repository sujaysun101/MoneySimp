
// src/components/expenses/BillUploadForm.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { UploadCloud, Image as ImageIcon, Camera, RefreshCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import Image from "next/legacy/image";
import { extractAndRecordBill } from '@/app/actions';
import type { Expense } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from '../ui/skeleton';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const billUploadSchema = z.object({
  billImageFile: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ).optional(),
});

type BillUploadFormValues = z.infer<typeof billUploadSchema>;

interface BillUploadFormProps {
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'billUrl'>) => void;
}

export function BillUploadForm({ onAddExpense }: BillUploadFormProps) {
  const { toast } = useToast();
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'capture'>('upload');

  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);


  const form = useForm<BillUploadFormValues>({
    resolver: zodResolver(billUploadSchema),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("billImageFile", event.target.files);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        setCapturedImagePreview(null); // Clear captured image if file is selected
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
      form.setValue("billImageFile", null);
    }
  };

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setHasCameraPermission(true);
        setIsCameraActive(true);
        setFilePreview(null); // Clear file preview if camera is started
        form.reset({ billImageFile: undefined }); // Reset file input
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsCameraActive(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    } else {
      setHasCameraPermission(false);
      toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access.',
        });
    }
  }, [toast, form]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
    setStream(null);
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    // Cleanup camera stream when component unmounts or tab changes
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleCaptureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImagePreview(dataUri);
        setFilePreview(null); // Clear file preview
        form.reset({ billImageFile: undefined }); // Reset file input
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImagePreview(null);
    startCamera();
  };
  
  const currentPreview = activeTab === 'upload' ? filePreview : capturedImagePreview;


  async function onSubmit() {
    let imageDataUri: string | null = null;

    if (activeTab === 'upload' && form.getValues("billImageFile")?.[0]) {
      const file = form.getValues("billImageFile")[0];
      imageDataUri = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } else if (activeTab === 'capture' && capturedImagePreview) {
      imageDataUri = capturedImagePreview;
    }

    if (!imageDataUri) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please upload or capture an image of the bill.",
      });
      return;
    }

    setIsProcessing(true);
    toast({
      title: "Processing Bill...",
      description: "The AI is analyzing your bill. This may take a moment.",
    });

    try {
      const result = await extractAndRecordBill(imageDataUri);
      if (result.success && result.expenses) {
        result.expenses.forEach(expData => {
          // Ensure date is a Date object before passing to onAddExpense
          const expenseToAdd = {
            ...expData,
            date: expData.date ? new Date(expData.date) : new Date(),
          } as Omit<Expense, 'id' | 'billUrl'>; // Cast to ensure type compatibility
           onAddExpense(expenseToAdd);
        });
        toast({
          title: "Bill Processed",
          description: `${result.expenses.length} expense(s) extracted and added.`,
          action: <CheckCircle className="text-green-500" />,
        });
        form.reset({ billImageFile: undefined });
        setFilePreview(null);
        setCapturedImagePreview(null);
      } else {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: result.message || "Could not extract expenses from the bill.",
          action: <AlertTriangle className="text-red-500" />,
        });
      }
    } catch (error) {
      console.error("Error processing bill:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "An unexpected error occurred while processing the bill.",
        action: <AlertTriangle className="text-red-500" />,
      });
    } finally {
      setIsProcessing(false);
    }
  }
  
  const handleTabChange = (value: string) => {
    const newTab = value as 'upload' | 'capture';
    setActiveTab(newTab);
    if (newTab === 'capture' && !isCameraActive && hasCameraPermission !== false) {
      startCamera();
    } else if (newTab === 'upload' && isCameraActive) {
      stopCamera();
    }
    // Reset previews and form when switching tabs
    setFilePreview(null);
    setCapturedImagePreview(null);
    form.reset({ billImageFile: undefined });
  };


  return (
    <Tabs defaultValue="upload" onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="upload">
          <UploadCloud className="mr-2 h-4 w-4" /> Upload File
        </TabsTrigger>
        <TabsTrigger value="capture">
          <Camera className="mr-2 h-4 w-4" /> Take Photo
        </TabsTrigger>
      </TabsList>
      <TabsContent value="upload">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="billImageFile"
              render={({ field }) => ( // field is not directly used for input due to custom handler
                (<FormItem>
                  <FormLabel>Upload Bill Image</FormLabel>
                  <FormControl>
                    <div className="flex flex-col items-center justify-center w-full">
                        <label
                            htmlFor="bill-upload-input"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
                        >
                            {filePreview ? (
                                <Image src={filePreview} alt="Bill preview" width={200} height={200} className="max-h-56 object-contain rounded-md" data-ai-hint="bill document" />
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
                                id="bill-upload-input" 
                                type="file" 
                                className="hidden" 
                                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                                onChange={handleFileChange}
                             />
                        </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>)
              )}
            />
             <Button type="submit" className="w-full md:w-auto" disabled={!filePreview || isProcessing}>
              {isProcessing ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" /> Scan Uploaded Bill
                </>
              )}
            </Button>
          </form>
        </Form>
      </TabsContent>
      <TabsContent value="capture">
        <div className="space-y-4">
          {hasCameraPermission === null && !isCameraActive && (
            <Button onClick={startCamera} className="w-full">Enable Camera</Button>
          )}
          
          {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use this feature.
              </AlertDescription>
            </Alert>
          )}

          {isCameraActive && !capturedImagePreview && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-md aspect-video bg-muted rounded-md overflow-hidden shadow-inner">
                 <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              </div>
              <Button onClick={handleCaptureImage} className="w-full md:w-auto">
                <Camera className="mr-2 h-4 w-4" /> Capture
              </Button>
            </div>
          )}

          {capturedImagePreview && (
            <div className="flex flex-col items-center space-y-4">
              <Image src={capturedImagePreview} alt="Captured bill" width={300} height={400} className="max-h-80 object-contain rounded-md border" data-ai-hint="bill photo" />
              <div className="flex gap-4">
                <Button onClick={handleRetake} variant="outline" disabled={isProcessing}>
                  <RefreshCcw className="mr-2 h-4 w-4" /> Retake
                </Button>
                <Button onClick={onSubmit} disabled={isProcessing}>
                  {isProcessing ? (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                     <ImageIcon className="mr-2 h-4 w-4" /> Scan Captured Bill
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          {hasCameraPermission && !isCameraActive && !capturedImagePreview && (
             <Button onClick={startCamera} className="w-full" variant="outline">
                <Camera className="mr-2 h-4 w-4" /> Start Camera
            </Button>
          )}
           <video ref={videoRef} className="hidden" autoPlay playsInline muted />
        </div>
      </TabsContent>
      {isProcessing && (
       <div className="mt-4 space-y-2">
           <Skeleton className="h-8 w-full" />
           <Skeleton className="h-4 w-3/4" />
           <Skeleton className="h-4 w-1/2" />
       </div>
       )}
    </Tabs>
  );
}
