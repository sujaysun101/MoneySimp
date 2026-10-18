'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { startDemoSession } from '@/lib/demo-client';
import { cn } from '@/lib/utils';

export function DemoButton({ className, variant = 'default' }: { className?: string; variant?: 'default' | 'secondary' | 'outline' }) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function openDemo() {
    setPending(true);
    try {
      await startDemoSession();
      window.location.assign('/dashboard');
    } catch (error) {
      console.error(error);
      toast({
        title: 'Demo unavailable',
        description: 'The sample household could not be opened. Refresh and try again.',
        variant: 'destructive',
      });
      setPending(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={cn('min-h-11', className)} onClick={openDemo} disabled={pending}>
      {pending ? 'Opening sample household…' : 'Try the demo'}
    </Button>
  );
}
