import { ReactNode } from 'react';
import { DataTicker } from './DataTicker';

interface TerminalLayoutProps {
  children: ReactNode;
  title?: string;
}

export function TerminalLayout({ children, title }: TerminalLayoutProps) {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text font-mono bg-grid-pattern relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-ripple-layer-1"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-ripple-layer-2"></div>
      </div>
      <DataTicker />
      <div className="container mx-auto px-4 py-8 pt-16 relative z-10">
        {title && (
          <div className="mb-8 border-b border-terminal-border pb-4">
            <h1 className="text-3xl font-bold text-terminal-text mb-2 tracking-tight">
              {title}
            </h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

