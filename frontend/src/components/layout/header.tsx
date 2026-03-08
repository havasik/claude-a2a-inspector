import React from 'react';
import {useTheme} from '../../providers/theme-provider';

export function Header() {
  const {isDark, toggleTheme} = useTheme();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
        A2A Inspector
      </h1>
      <button
        onClick={toggleTheme}
        className="px-3 py-1.5 rounded-md text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Toggle dark mode"
      >
        {isDark ? '☀ Light' : '☾ Dark'}
      </button>
    </header>
  );
}
