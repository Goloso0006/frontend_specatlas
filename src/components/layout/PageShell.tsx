import React from 'react';

export const PageShell: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`max-w-[1200px] mx-auto p-6 md:py-8 md:px-10 space-y-6 ${className}`}>
      {children}
    </div>
  );
};
