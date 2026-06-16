import { type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ className, hover, elevated, padding = 'md', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white transition-all duration-200',
        elevated
          ? 'shadow-card border-gray-50 dark:bg-surface-dark-secondary dark:border-gray-700/30'
          : 'shadow-soft border-gray-100 dark:bg-surface-dark-secondary dark:border-gray-700/50 dark:shadow-none',
        hover && 'hover:shadow-card hover:border-gray-200 dark:hover:border-gray-600/50 dark:hover:bg-surface-dark-tertiary cursor-pointer',
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-h3 text-text-primary dark:text-text-dark-primary', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}
