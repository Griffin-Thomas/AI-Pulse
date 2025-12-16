import { RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsageCard } from "@/components/UsageCard";
import { useUsageStore } from "@/lib/store";
import type { ProviderId } from "@/lib/types";

interface DashboardProps {
  provider?: ProviderId;
  onSettingsClick?: () => void;
}

export function Dashboard({ provider = "claude", onSettingsClick }: DashboardProps) {
  const { usage, isLoading, error, lastRefresh } = useUsageStore();

  const currentUsage = usage[provider];
  const currentLoading = isLoading[provider];
  const currentError = error[provider];
  const currentLastRefresh = lastRefresh[provider];

  const handleRefresh = () => {
    // TODO: Implement refresh via Tauri command
    console.log("Refresh clicked");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-lg font-semibold">AI Usage Monitor</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={currentLoading}
            className={currentLoading ? "animate-spin" : ""}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSettingsClick}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        {currentError && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {currentError}
          </div>
        )}

        {currentUsage ? (
          <div className="grid gap-4">
            {currentUsage.limits.map((limit) => (
              <UsageCard key={limit.id} limit={limit} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p>No usage data available</p>
            <p className="text-sm">Configure your credentials in Settings</p>
          </div>
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
    </div>
  );
}
