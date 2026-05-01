import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight app-text-primary">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] app-text-secondary mt-1 max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};
