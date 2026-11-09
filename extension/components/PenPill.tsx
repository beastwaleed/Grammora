import React from 'react';
import { PenTool, Sparkles } from 'lucide-react';

interface PenPillProps {
  onClick: () => void;
  title?: string;
}

export const PenPill: React.FC<PenPillProps> = ({
  onClick,
  title = 'Open Grammora Writing Assistant',
}) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={title}
      title={title}
      // CRITICAL: Prevent mousedown from clearing the browser's active selection
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-white text-brand-600 border border-brand-200 shadow-toolbar hover:scale-105 hover:border-brand-500 hover:text-brand-700 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 animate-scale-in select-none"
      style={{
        boxShadow: '0 4px 12px -2px rgba(98, 88, 232, 0.25), 0 2px 6px -1px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div className="relative flex items-center justify-center">
        <PenTool className="w-4 h-4 stroke-[2.2]" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
        </span>
      </div>
    </div>
  );
};
