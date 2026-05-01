import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', clickable, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`app-card border border-app-border rounded-xl shadow-sm ${clickable ? 'cursor-pointer card-hover' : ''} ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';
