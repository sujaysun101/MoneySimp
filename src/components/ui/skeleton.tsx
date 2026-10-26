import { cn } from "@/lib/utils"


function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        className
      )}
      {...props}
    >
      <span className="absolute inset-0 block h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-60" />
    </div>
  )
}

export { Skeleton }
