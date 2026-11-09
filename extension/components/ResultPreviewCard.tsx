import React, { useEffect } from 'react';
import {
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Briefcase,
  Smile,
  Zap,
} from 'lucide-react';
import { WritingActionType } from '../lib/mock-ai';

interface ResultPreviewCardProps {
  action: WritingActionType;
  originalText: string;
  suggestedText: string | null;
  loading: boolean;
  error: string | null;
  onApply: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

const ACTION_TITLES: Record<WritingActionType, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  grammar: { title: 'Grammar Correction', icon: Sparkles },
  rephrase: { title: 'Rephrase Suggestion', icon: RefreshCw },
  professional: { title: 'Professional Tone', icon: Briefcase },
  friendly: { title: 'Friendly Tone', icon: Smile },
  concise: { title: 'Concise Rewrite', icon: Zap },
};

export const ResultPreviewCard: React.FC<ResultPreviewCardProps> = ({
  action,
  originalText,
  suggestedText,
  loading,
  error,
  onApply,
  onDismiss,
  onRetry,
}) => {
  const { title, icon: Icon } = ACTION_TITLES[action] || ACTION_TITLES.grammar;

  // Keyboard navigation support: Enter to apply, Esc to dismiss, R to retry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      } else if (e.key === 'Enter' && !loading && !error && suggestedText) {
        e.preventDefault();
        onApply();
      } else if (e.key.toLowerCase() === 'r' && !loading) {
        e.preventDefault();
        onRetry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, error, suggestedText, onApply, onDismiss, onRetry]);

  return (
    <div
      role="dialog"
      aria-label={title}
      // CRITICAL: Prevent mousedown from clearing the selection in the host editor
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="w-[320px] bg-white border border-surface-border rounded-xl shadow-popover overflow-hidden flex flex-col animate-scale-in text-content-main select-none text-xs"
      style={{
        boxShadow: '0 12px 28px -6px rgba(17, 24, 39, 0.16), 0 6px 12px -3px rgba(17, 24, 39, 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-subtle border-b border-surface-border">
        <div className="flex items-center gap-1.5 text-brand-700 font-semibold text-[12px]">
          <Icon className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-content-secondary hover:text-content-main rounded hover:bg-surface-muted transition-colors"
          title="Dismiss (Esc)"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="p-3 space-y-2.5">
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] font-medium text-content-secondary">
              Generating suggestion...
            </span>
          </div>
        ) : error ? (
          <div className="p-2.5 bg-state-error-soft/60 border border-red-200 rounded-lg text-state-error space-y-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">{error}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onRetry}
                className="px-2 py-1 bg-white border border-red-300 text-state-error font-medium text-[11px] rounded hover:bg-red-50 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Original Text Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold tracking-wide text-content-secondary uppercase">
                Original
              </span>
              <div className="p-2 bg-surface-subtle rounded-md border border-surface-border text-content-secondary text-[12px] leading-relaxed line-through decoration-slate-400">
                {originalText}
              </div>
            </div>

            {/* AI Suggestion Box */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold tracking-wide text-brand-600 uppercase flex items-center justify-between">
                <span>Suggestion</span>
                <span className="text-[9px] font-normal text-content-muted">Ready to apply</span>
              </span>
              <div className="p-2 bg-brand-50/70 border border-brand-200 rounded-md text-content-main font-medium text-[12px] leading-relaxed">
                {suggestedText}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      {!loading && !error && suggestedText && (
        <div className="flex items-center justify-between px-3 py-2 bg-surface-subtle border-t border-surface-border">
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 text-[11px] text-content-secondary hover:text-content-main px-1.5 py-1 rounded transition-colors"
            title="Regenerate (R)"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Regenerate</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className="px-2.5 py-1 text-[11px] font-medium text-content-secondary hover:text-content-main rounded-md transition-colors"
            >
              Dismiss <span className="text-[9px] text-content-muted">Esc</span>
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex items-center gap-1 px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white font-medium text-[11px] rounded-md shadow-sm transition-colors focus-ring"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
              <span className="text-[9px] opacity-75">↵</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

