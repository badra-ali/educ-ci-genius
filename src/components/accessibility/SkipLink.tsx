import { cn } from "@/lib/utils";

interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ targetId, children, className }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999]",
        "focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground",
        "focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring",
        "transition-all duration-200",
        className
      )}
    >
      {children}
    </a>
  );
}
