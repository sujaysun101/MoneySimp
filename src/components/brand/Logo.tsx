import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  inverse = false,
  wordClassName,
}: {
  className?: string;
  inverse?: boolean;
  wordClassName?: string;
}) {
  const tile = inverse ? '#ffffff' : 'hsl(var(--primary))';
  const ink = inverse ? 'hsl(174 44% 14%)' : '#ffffff';
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8">
        <rect width="32" height="32" rx="8" fill={tile} />
        <path d="M8 18.5c0-3.2 2.4-5.5 6.2-5.5h.4c.7-1.6 2.2-2.5 4-2.5 2.4 0 4.2 1.6 4.4 3.8h.5c1.6 0 2.5 1 2.5 2.3 0 1.4-1 2.4-2.6 2.4H10.2c-1.3 0-2.2-.9-2.2-2.1Z" fill={ink} />
        <circle cx="13.2" cy="14.2" r="1" fill={tile} />
        <path d="M9 21.5h10.5" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={cn('text-lg font-semibold tracking-tight', wordClassName)}>{APP_NAME}</span>
    </span>
  );
}
