import React from 'react';
import { Sparkles, CornerDownLeft, X } from 'lucide-react';
import { AutocompleteSuggestion } from '../adapters/autocomplete';

interface AutocompleteCardProps {
  suggestion: AutocompleteSuggestion | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export const AutocompleteCard: React.FC<AutocompleteCardProps> = ({
  suggestion,
  onAccept,
  onDismiss,
}) => {
  if (!suggestion) return null;

  const { coords, completion } = suggestion;

  return (
    <div
      role="tooltip"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 2147483647,
        pointerEvents: 'auto',
      }}
      // Prevent mousedown from blurring the editor or moving the caret
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onAccept();
      }}
      className="group flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-xs border border-brand-200 rounded-xl shadow-toolbar hover:border-brand-500 cursor-pointer animate-scale-in text-content-main select-none transition-all duration-150 max-w-[360px]"
      title="Click or press Tab to accept suggestion"
    >
      {/* Sparkle Icon Monogram */}
      <div className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-50 text-brand-600 flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
      </div>

      {/* Suggested Continuation Text */}
      <div className="flex-1 min-w-0 pr-1">
        <span className="text-xs font-medium text-brand-700 tracking-tight line-clamp-2">
          {completion.trim()}
        </span>
      </div>

      {/* Keyboard Shortcuts Pill */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-surface-subtle border border-surface-border rounded text-[10px] font-semibold text-content-secondary">
          <span>Tab</span>
          <CornerDownLeft className="w-2.5 h-2.5 opacity-60" />
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-muted transition-colors"
          title="Dismiss (Esc)"
          aria-label="Dismiss suggestion"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

