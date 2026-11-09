import React from 'react';
import {
  Sparkles,
  RefreshCw,
  Briefcase,
  Smile,
  Zap,
  X,
} from 'lucide-react';
import { WritingActionType } from '../lib/mock-ai';

interface WritingToolbarProps {
  onSelectAction: (action: WritingActionType) => void;
  onClose: () => void;
}

interface ActionItem {
  id: WritingActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
}

const ACTIONS: ActionItem[] = [
  { id: 'grammar', label: 'Fix Grammar', icon: Sparkles },
  { id: 'rephrase', label: 'Rephrase', icon: RefreshCw },
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'friendly', label: 'Friendly', icon: Smile },
  { id: 'concise', label: 'Concise', icon: Zap },
];

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  onSelectAction,
  onClose,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Grammora AI Writing Tools"
      // Prevent mousedown from clearing the selection
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="flex items-center gap-1 p-1 bg-white border border-surface-border rounded-xl shadow-toolbar animate-scale-in select-none text-content-main"
      style={{
        boxShadow: '0 8px 20px -4px rgba(17, 24, 39, 0.12), 0 4px 8px -2px rgba(17, 24, 39, 0.06)',
      }}
    >
      {/* Brand Monogram Badge */}
      <div className="flex items-center justify-center pl-1.5 pr-1 py-1">
        <span className="w-5 h-5 rounded-md bg-brand-500 text-white font-bold text-[11px] flex items-center justify-center tracking-tighter">
          G
        </span>
      </div>

      <div className="w-px h-4 bg-surface-border my-auto" />

      {/* Action Buttons */}
      {ACTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelectAction(id);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-content-main hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon className="w-3.5 h-3.5 flex-shrink-0 text-brand-500" />
          <span>{label}</span>
        </button>
      ))}

      <div className="w-px h-4 bg-surface-border my-auto" />

      {/* Close Action */}
      <button
        type="button"
        aria-label="Close toolbar"
        title="Dismiss (Esc)"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="p-1.5 text-content-secondary hover:text-content-main hover:bg-surface-muted rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

