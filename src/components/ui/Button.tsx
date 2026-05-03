import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  cursor?: React.CSSProperties['cursor'];
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, cursor, style, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md focus-ring interactive disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-app-accent text-app-accent-foreground hover:bg-app-accent-hover',
      secondary: 'bg-app-card text-app-text-primary border border-app-border-strong hover:bg-app-surface',
      ghost: 'bg-transparent text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary',
      destructive: 'bg-app-danger text-white hover:opacity-90',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-9 px-4 text-[13px]',
      lg: 'h-10 px-6 text-[15px]',
    };

    const finalStyle = { ...(style || {}), ...(cursor ? { cursor } : {}) };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={isLoading || props.disabled}
        style={finalStyle}
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
