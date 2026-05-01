import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus-ring interactive disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-app-accent text-app-accent-foreground hover:bg-app-accent-hover hover:scale-[1.01]',
      secondary: 'bg-app-surface text-app-text-primary hover:bg-app-border-strong',
      ghost: 'bg-transparent text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary',
      destructive: 'bg-app-danger text-white hover:bg-red-600',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-[13px]',
      lg: 'h-10 px-6 text-[15px]',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
