import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
import { RefreshCw, Settings, BarChart3, Activity, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsageCard, UsageCardSkeleton } from "@/components/UsageCard";
import { Analytics } from "@/components/Analytics";
import { SessionBanner } from "@/components/SessionBanner";
import { Confetti } from "@/components/Confetti";
import { useUsageStore, useSettingsStore } from "@/lib/store";
import { useUsage } from "@/hooks/useUsage";
import { formatUsageForClipboard, copyToClipboard } from "@/lib/utils";
import type { ProviderId } from "@/lib/types";

const PROVIDER_URLS: Record<ProviderId, string> = {
  claude: "https://claude.ai",
  chatgpt: "https://chat.openai.com",
  gemini: "https://gemini.google.com",
};

const PROVIDER_NAMES: Record<ProviderId, string> = {
  claude: "Claude.ai",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
};

type TabType = "usage" | "analytics";

interface DashboardProps {
  provider?: ProviderId;
  onSettingsClick?: () => void;
}

export function Dashboard({ provider = "claude", onSettingsClick }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("usage");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { usage, isLoading, error, lastRefresh } = useUsageStore();
  const { settings } = useSettingsStore();
  const { refresh } = useUsage(provider);
  const compactView = settings?.compactView ?? false;

  const handleCopyUsage = async () => {
    const currentUsage = usage[provider];
    if (!currentUsage) return;

    const text = formatUsageForClipboard(currentUsage);
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenProvider = useCallback(async () => {
    try {
      await open(PROVIDER_URLS[provider]);
    } catch (err) {
      console.error(`Failed to open ${PROVIDER_NAMES[provider]}:`, err);
    }
  }, [provider]);

  // Listen for menu events from native app menu (macOS)
  useEffect(() => {
    const unlistenUsage = listen("menu-usage", () => {
      setActiveTab("usage");
    });
    const unlistenAnalytics = listen("menu-analytics", () => {
      setActiveTab("analytics");
    });
    return () => {
      unlistenUsage.then((fn) => fn());
      unlistenAnalytics.then((fn) => fn());
    };
  }, []);

  // Listen for usage reset events to show confetti
  useEffect(() => {
    const unlisten = listen("usage-reset", () => {
      setShowConfetti(true);
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const currentUsage = usage[provider];
  const currentLoading = isLoading[provider];
  const currentError = error[provider];
  const currentLastRefresh = lastRefresh[provider];

  return (
    <div className="flex flex-col h-full">
      {/* Confetti animation on usage reset */}
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">AI Pulse</h1>
        <div className="flex items-center gap-2">
          {activeTab === "usage" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyUsage}
                disabled={!currentUsage}
                title="Copy usage to clipboard"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                disabled={currentLoading}
                title="Refresh usage"
              >
                <RefreshCw className={`h-4 w-4 ${currentLoading ? "animate-spin" : ""}`} />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onSettingsClick} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b">
        <button
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "usage"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("usage")}
        >
          <Activity className="h-4 w-4" />
          Current Usage
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "analytics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {/* Session Banner (shows when there are credential/session issues) */}
      <SessionBanner
        error={currentError}
        onSettingsClick={onSettingsClick ?? (() => {})}
        onRefresh={refresh}
      />

      {/* Content */}
      {activeTab === "usage" ? (
        <>
          <main className="flex-1 overflow-auto p-4">

            {currentLoading && !currentUsage && (
              <div className="grid gap-4">
                <UsageCardSkeleton compact={compactView} />
                <UsageCardSkeleton compact={compactView} />
              </div>
            )}

            {currentUsage ? (
              <div className="grid gap-4">
                {currentUsage.limits.map((limit) => (
                  <UsageCard
                    key={limit.id}
                    limit={limit}
                    compact={compactView}
                    onRefresh={refresh}
                    onOpenProvider={handleOpenProvider}
                    providerName={PROVIDER_NAMES[provider]}
                  />
                ))}
              </div>
            ) : (
              !currentLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p>No usage data available</p>
                  <p className="text-sm">Configure your credentials in Settings</p>
                </div>
              )
            )}
          </main>

          {/* Footer */}
          <footer className="p-2 border-t text-xs text-center text-muted-foreground">
            {currentLastRefresh ? (
              <span>Last updated: {currentLastRefresh.toLocaleTimeString()}</span>
            ) : (
              <span>Not yet refreshed</span>
            )}
          </footer>
        </>
      ) : (
        <div className="flex-1 overflow-hidden">
          <Analytics provider={provider} />
        </div>
      )}
    </div>
  );
}
