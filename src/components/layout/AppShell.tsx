import React, { useEffect } from 'react';
import { TopNavigationBar } from './TopNavigationBar';

/**
 * AppShell — authenticated layout wrapper.
 *
 * Visual hierarchy:
 *
 *   bg (base color)
 *   ├── [pt-3] pill nav bar  ← floating, rounded, bordered
 *   └── [mx-3] workspace     ← surface panel, rounded top corners
 *                              clearly separated from pill bar
 *
 * Light mode: stronger border + subtle drop shadow on workspace top
 * Dark mode:  minimal border + deep inset shadow
 */
export const AppShell: React.FC<{ children: React.ReactNode; hideSidebar?: boolean }> = ({
  children,
}) => {
  // Prevent accidental navigation out of the app (e.g. hitting back too many times)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Most modern browsers ignore the custom string, but it is required for the dialog to show
      e.returnValue = '¿Seguro que quieres abandonar la página? Es posible que los cambios no se guarden.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-full app-text-primary overflow-hidden"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Floating pill navigation bar ── */}
      <TopNavigationBar />

      {/*
       * Workspace panel.
       * - Rounded top corners to frame it as a surface separate from the pill
       * - Horizontal inset (mx-3/5) gives breathing room on both sides
       * - In light mode: a more visible border-top + drop-shadow helps
       *   the workspace "lift" off the background
       * - In dark mode: subtler border, deeper ambient shadow
       */}
      <div
        className="flex flex-1 overflow-hidden mx-3 sm:mx-5 mb-0"
        style={{
          background: 'var(--color-bg-card)',
          // Rounded top corners — bottom stays flush with viewport edge
          borderRadius: '12px 12px 0 0',
          // Light: stronger, more visible border (uses border-strong token)
          // Dark: keep the subtle border
          border: '1px solid var(--color-border-strong)',
          borderBottom: 'none',
          // Light: a small drop shadow that lifts the workspace panel
          // Dark: essentially invisible since border-strong is already muted
          boxShadow: [
            '0 -1px 0 rgba(0,0,0,0.04)',          // very thin top edge line (light)
            '0 -4px 12px rgba(0,0,0,0.05)',        // soft outer shadow upward
          ].join(', '),
        }}
      >
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
