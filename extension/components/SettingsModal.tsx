import React, { useState } from 'react';
import { X, Trash2, Plus, Server, Clock, Globe } from 'lucide-react';
import { GrammoraSettings } from '../lib/settings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GrammoraSettings;
  onSave: (updated: Partial<GrammoraSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  if (!isOpen) return null;

  const [backendUrl, setBackendUrl] = useState(settings.backendUrl);
  const [debounceMs, setDebounceMs] = useState(settings.debounceMs);
  const [newDomain, setNewDomain] = useState('');
  const [excludedDomains, setExcludedDomains] = useState<string[]>(settings.excludedDomains);

  const handleAddDomain = () => {
    const trimmed = newDomain.trim().toLowerCase();
    if (trimmed && !excludedDomains.includes(trimmed)) {
      const updated = [...excludedDomains, trimmed];
      setExcludedDomains(updated);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = excludedDomains.filter((d) => d !== domain);
    setExcludedDomains(updated);
  };

  const handleSaveAll = () => {
    onSave({
      backendUrl: backendUrl.trim(),
      debounceMs: Number(debounceMs) || 350,
      excludedDomains,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="bg-white w-full max-w-[350px] rounded-xl shadow-popover border border-surface-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-subtle">
          <h2 className="text-sm font-semibold text-content-main">Advanced Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-content-secondary hover:text-content-main hover:bg-surface-muted transition-colors focus-ring"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Backend URL */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-content-main">
              <Server className="w-3.5 h-3.5 text-brand-500" />
              API Gateway Endpoint
            </label>
            <input
              type="url"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="https://grammora-omega.vercel.app"
              className="w-full px-2.5 py-1.5 border border-surface-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <p className="text-[11px] text-content-muted">
              Grammora Express backend proxy for AI inference.
            </p>
          </div>

          {/* Debounce */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 font-medium text-content-main">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                Autocomplete Debounce
              </label>
              <span className="font-semibold text-brand-600">{debounceMs} ms</span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="50"
              value={debounceMs}
              onChange={(e) => setDebounceMs(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-[11px] text-content-muted">
              Delay after typing pause before requesting suggestions.
            </p>
          </div>

          {/* Excluded Domains */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 font-medium text-content-main">
              <Globe className="w-3.5 h-3.5 text-brand-500" />
              Excluded Websites
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                placeholder="e.g. banking.com"
                className="flex-1 px-2.5 py-1.5 border border-surface-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="px-2.5 py-1.5 bg-surface-muted hover:bg-surface-border text-content-main font-medium rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-28 overflow-y-auto border border-surface-border rounded-md divide-y divide-surface-border bg-surface-subtle">
              {excludedDomains.length === 0 ? (
                <div className="p-2.5 text-center text-[11px] text-content-muted">
                  No websites excluded yet
                </div>
              ) : (
                excludedDomains.map((dom) => (
                  <div key={dom} className="flex items-center justify-between px-2.5 py-1.5">
                    <span className="text-[11px] text-content-main truncate">{dom}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(dom)}
                      className="text-state-error hover:opacity-80 p-0.5"
                      title="Remove from exclusion list"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-surface-border bg-surface-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-content-secondary hover:text-content-main rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors focus-ring"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

