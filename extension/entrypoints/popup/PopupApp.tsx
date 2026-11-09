import React, { useEffect, useState } from 'react';
import {
  Settings,
  Sparkles,
  PenTool,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Activity,
  Globe,
  Sliders,
} from 'lucide-react';
import {
  GrammoraSettings,
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  getHostnameFromUrl,
  isDomainExcluded,
} from '../../lib/settings';
import { ToggleSwitch } from '../../components/ToggleSwitch';
import { ConsentBanner } from '../../components/ConsentBanner';
import { SettingsModal } from '../../components/SettingsModal';
import { sendToBackground, BackendHealthResponse } from '../../lib/messaging';

export const PopupApp: React.FC = () => {
  const [settings, setSettings] = useState<GrammoraSettings>(DEFAULT_SETTINGS);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [isSiteExcluded, setIsSiteExcluded] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [backendHealth, setBackendHealth] = useState<BackendHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial settings and active tab context
  useEffect(() => {
    async function init() {
      try {
        const loaded = await getSettings();
        setSettings(loaded);

        if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]?.url) {
              const url = tabs[0].url;
              setCurrentTabUrl(url);
              const domain = getHostnameFromUrl(url);
              setCurrentDomain(domain);
              setIsSiteExcluded(isDomainExcluded(domain, loaded.excludedDomains));
            }
          });
        }

        // Check backend health
        try {
          const health = await sendToBackground<BackendHealthResponse>({
            type: 'CHECK_BACKEND_HEALTH',
          });
          setBackendHealth(health);
        } catch {
          setBackendHealth({ ok: false, status: 'offline', provider: 'none' });
        }
      } catch (err) {
        console.error('Error initializing Grammora popup:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const handleUpdate = async (updates: Partial<GrammoraSettings>) => {
    const next = await saveSettings(updates);
    setSettings(next);
    if (currentDomain) {
      setIsSiteExcluded(isDomainExcluded(currentDomain, next.excludedDomains));
    }
  };

  const handleToggleCurrentSite = async () => {
    if (!currentDomain) return;
    let nextExcluded: string[];
    if (isSiteExcluded) {
      nextExcluded = settings.excludedDomains.filter((d) => d !== currentDomain);
    } else {
      nextExcluded = [...settings.excludedDomains, currentDomain];
    }
    await handleUpdate({ excludedDomains: nextExcluded });
  };

  const isGloballyActive = settings.enabled && !isSiteExcluded;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-content-secondary font-medium">Loading Grammora...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[440px] bg-white text-content-main select-none font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <img
            src="/icon/32.png"
            alt="Grammora Logo"
            className="w-7 h-7 rounded-lg shadow-xs"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[15px] font-bold tracking-tight text-content-main">
                Grammora
              </span>
              <span className="px-1.5 py-0.2 bg-brand-50 text-brand-700 font-semibold text-[10px] rounded border border-brand-200">
                MVP
              </span>
            </div>
            <p className="text-[11px] text-content-secondary leading-none mt-0.5">
              Your AI Writing Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg text-content-secondary hover:text-content-main hover:bg-surface-subtle transition-colors focus-ring"
            title="Settings & Exclusions"
            aria-label="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 space-y-4 flex-1">
        {/* Current Site Status Card */}
        {currentDomain && !currentDomain.startsWith('chrome') && (
          <div className={`p-3 rounded-xl border transition-all ${
            isGloballyActive
              ? 'bg-emerald-50/50 border-emerald-200'
              : 'bg-surface-subtle border-surface-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className={`w-4 h-4 ${isGloballyActive ? 'text-state-success' : 'text-content-muted'}`} />
                <span className="text-xs font-semibold text-content-main truncate max-w-[170px]" title={currentDomain}>
                  {currentDomain}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleCurrentSite}
                className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                  isSiteExcluded
                    ? 'bg-white border-surface-border text-brand-600 hover:bg-brand-50'
                    : 'bg-white border-emerald-300 text-state-success hover:bg-emerald-50'
                }`}
              >
                {isSiteExcluded ? 'Enable on Site' : 'Active on Site'}
              </button>
            </div>
          </div>
        )}

        {/* Master Switch & Feature Controls */}
        <section className="p-3.5 bg-surface-subtle/80 border border-surface-border rounded-xl space-y-3.5">
          {/* Master Enable */}
          <ToggleSwitch
            checked={settings.enabled}
            onChange={(checked) => handleUpdate({ enabled: checked })}
            label="Enable Grammora"
            description="Toggle writing assistant across all websites"
          />

          <div className="h-px bg-surface-border" />

          {/* Smart Autocomplete */}
          <ToggleSwitch
            checked={settings.autocompleteEnabled}
            onChange={(checked) => handleUpdate({ autocompleteEnabled: checked })}
            disabled={!settings.enabled}
            label="Smart Autocomplete"
            description="Predictive words and contextual sentence completions"
            size="sm"
          />

          {/* Grammar & Rephrase Toolbar */}
          <ToggleSwitch
            checked={settings.rewriteEnabled}
            onChange={(checked) => handleUpdate({ rewriteEnabled: checked })}
            disabled={!settings.enabled}
            label="Grammar & Rephrase Toolbar"
            description="Show floating pen toolbar when highlighting text"
            size="sm"
          />

          {/* Completion Length Segmented Selector */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] font-medium text-content-main">
                Completion Length
              </span>
              <span className="text-[11px] text-content-secondary capitalize">
                {settings.completionLength} (~{settings.completionLength === 'short' ? '3-6' : '10-18'} words)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-muted rounded-lg border border-surface-border">
              <button
                type="button"
                disabled={!settings.enabled || !settings.autocompleteEnabled}
                onClick={() => handleUpdate({ completionLength: 'short' })}
                className={`py-1 text-xs font-medium rounded-md transition-all ${
                  settings.completionLength === 'short'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-content-secondary hover:text-content-main'
                }`}
              >
                Short
              </button>
              <button
                type="button"
                disabled={!settings.enabled || !settings.autocompleteEnabled}
                onClick={() => handleUpdate({ completionLength: 'medium' })}
                className={`py-1 text-xs font-medium rounded-md transition-all ${
                  settings.completionLength === 'medium'
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-content-secondary hover:text-content-main'
                }`}
              >
                Medium
              </button>
            </div>
          </div>
        </section>

        {/* AI Privacy & Consent Card */}
        <ConsentBanner
          hasConsented={settings.hasConsented}
          onConsentChange={(consented) => handleUpdate({ hasConsented: consented })}
        />

        {/* Backend & AI Connection Status Pill */}
        <div className="flex items-center justify-between px-3 py-2 bg-white border border-surface-border rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-content-secondary" />
            <span className="text-content-secondary">AI Service:</span>
            {backendHealth?.ok ? (
              <span className="font-medium text-state-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-state-success" />
                {backendHealth.provider === 'mock' ? 'Mock Mode (Ready)' : 'Live AI Connected'}
              </span>
            ) : (
              <span className="font-medium text-content-muted flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Standalone / Offline
              </span>
            )}
          </div>
          <span className="text-[11px] text-content-muted">
            {backendHealth?.ok ? `${settings.debounceMs}ms pause` : 'Phase 1 Shell'}
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-2.5 border-t border-surface-border bg-surface-subtle flex items-center justify-between text-[11px] text-content-secondary">
        <div className="flex items-center gap-1.5">
          <span>v0.1.0</span>
          <span>•</span>
          <span className="text-brand-600 font-medium">Open-Source</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="hover:text-content-main transition-colors"
          >
            Preferences
          </button>
          <span>•</span>
          <a
            href="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-0.5 hover:text-brand-600 transition-colors"
          >
            Docs
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>

      {/* Advanced Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleUpdate}
      />
    </div>
  );
};

