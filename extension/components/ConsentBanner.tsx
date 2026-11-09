import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface ConsentBannerProps {
  hasConsented: boolean;
  onConsentChange: (consented: boolean) => void;
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  hasConsented,
  onConsentChange,
}) => {
  if (hasConsented) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-xs">
        <div className="flex items-center gap-2 text-brand-800">
          <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span className="font-medium">AI Cloud Processing Authorized</span>
        </div>
        <button
          type="button"
          onClick={() => onConsentChange(false)}
          className="text-[11px] text-content-secondary hover:text-content-main underline transition-colors"
        >
          Revoke
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-2">
      <div className="flex items-start gap-2 text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold text-[13px]">AI Data & Privacy Notice</div>
          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
            Grammora sends only the text you explicitly select or limited typing context (up to 250 characters) to the AI backend for grammar analysis and continuations. No passwords, credit cards, or whole pages are collected.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => onConsentChange(true)}
          className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs rounded-md shadow-sm transition-colors focus-ring"
        >
          Enable AI Processing
        </button>
      </div>
    </div>
  );
};
