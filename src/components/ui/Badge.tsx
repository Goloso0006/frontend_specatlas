import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = '', 
  variant = 'neutral', 
  children, 
  ...props 
}) => {
  const variants = {
    neutral: 'bg-app-surface text-app-text-secondary',
    accent: 'bg-app-accent-subtle text-app-accent',
    success: 'bg-app-success-subtle text-app-success',
    warning: 'bg-app-warning-subtle text-app-warning',
    danger: 'bg-app-danger-subtle text-app-danger',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
