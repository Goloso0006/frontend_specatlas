import React from 'react';
import { useTheme } from '../../hooks/useTheme';

export const AnimatedThemeToggler: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      onClick={toggleTheme}
      className="flex items-center w-full h-8 px-3 rounded-md text-[13px] font-medium text-app-text-secondary hover:bg-app-surface hover:text-app-text-primary transition-colors text-left gap-2 overflow-hidden"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <svg
          className={`absolute inset-0 transition-all duration-200 ${
            theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg
          className={`absolute inset-0 transition-all duration-200 ${
            theme === 'light' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
      <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
    </button>
  );
};
