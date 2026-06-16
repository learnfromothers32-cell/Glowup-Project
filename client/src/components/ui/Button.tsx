import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

const variants = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm hover:shadow',
  secondary:
    'bg-white text-text-primary border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-brand-500 dark:bg-surface-dark-secondary dark:text-text-dark-primary dark:border-gray-600 dark:hover:bg-surface-dark-tertiary',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-gray-100 dark:text-text-dark-secondary dark:hover:text-text-dark-primary dark:hover:bg-surface-dark-tertiary',
  danger:
    'bg-error text-white hover:bg-red-600 focus:ring-error shadow-sm',
  outline:
    'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 focus:ring-brand-500 dark:text-brand-400 dark:hover:bg-brand-950/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-6 py-3 text-base gap-2.5 rounded-xl',
  xl: 'px-8 py-4 text-lg gap-3 rounded-xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-surface-dark',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
        variants[variant],
        sizes[size],
        icon && 'p-0 aspect-square',
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';
