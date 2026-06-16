import { type ReactNode } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  success: 'bg-success/10 text-success-dark dark:text-success border-success/20',
  warning: 'bg-warning/10 text-warning-dark dark:text-warning border-warning/20',
  error: 'bg-error/10 text-error-dark dark:text-error border-error/20',
  info: 'bg-info/10 text-info-dark dark:text-info border-info/20',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 border-brand-200/30',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

interface BadgeProps {
  variant?: keyof typeof variants;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
