import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-medium text-app-text-primary mb-1.5">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] text-app-text-primary placeholder-app-text-muted focus-ring interactive ${
            error ? 'border-app-danger focus-visible:outline-app-danger' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-app-danger">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
