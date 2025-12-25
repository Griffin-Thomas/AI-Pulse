import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, ExternalLink, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { open } from "@tauri-apps/plugin-shell";

interface SessionBannerProps {
  error: string | null;
  onSettingsClick: () => void;
  onRefresh: () => void;
}

type BannerType = "expired" | "blocked" | "rate_limited" | "no_credentials" | null;

function detectBannerType(error: string | null): BannerType {
  if (!error) return null;

  const lowerError = error.toLowerCase();

  if (
    lowerError.includes("session expired") ||
    lowerError.includes("sessionexpired") ||
    lowerError.includes("401") ||
    lowerError.includes("unauthorized")
  ) {
    return "expired";
  }

  if (
    lowerError.includes("cloudflare") ||
    lowerError.includes("blocked") ||
    lowerError.includes("403")
  ) {
    return "blocked";
  }

  if (lowerError.includes("rate limit") || lowerError.includes("429")) {
    return "rate_limited";
  }

  if (
    lowerError.includes("no credentials") ||
    lowerError.includes("missing credentials")
  ) {
    return "no_credentials";
  }

  return null;
}

const bannerConfig: Record<
  Exclude<BannerType, null>,
  {
    title: string;
    message: string;
    showOpenClaude: boolean;
    showRefresh: boolean;
    color: string;
  }
> = {
  expired: {
    title: "Session Expired",
    message:
      "Your Claude session has expired. Please get a fresh session key from Claude.ai.",
    showOpenClaude: true,
    showRefresh: false,
    color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  },
  blocked: {
    title: "Request Blocked",
    message:
      "Your request was blocked by Cloudflare. This is usually temporary - try again in a few minutes.",
    showOpenClaude: false,
    showRefresh: true,
    color: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  },
  rate_limited: {
    title: "Rate Limited",
    message: "Too many requests. Please wait a moment before trying again.",
    showOpenClaude: false,
    showRefresh: true,
    color: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  },
  no_credentials: {
    title: "Credentials Missing",
    message: "Please configure your Claude credentials in Settings.",
    showOpenClaude: false,
    showRefresh: false,
    color: "bg-destructive/10 border-destructive/30 text-destructive",
  },
};

export function SessionBanner({
  error,
  onSettingsClick,
  onRefresh,
}: SessionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Reset dismissed state when error changes
  useEffect(() => {
    if (error !== lastError) {
      setDismissed(false);
      setLastError(error);
    }
  }, [error, lastError]);

  const bannerType = detectBannerType(error);

  const handleOpenClaude = useCallback(async () => {
    try {
      await open("https://claude.ai");
    } catch (err) {
      console.error("Failed to open Claude.ai:", err);
    }
  }, []);

  // Don't show banner if dismissed, no error, or not a recognized error type
  if (dismissed || !bannerType) {
    return null;
  }

  const config = bannerConfig[bannerType];

  return (
    <div
      className={`mx-4 mt-4 p-3 rounded-lg border flex items-start gap-3 ${config.color}`}
    >
      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{config.title}</p>
        <p className="text-xs mt-0.5 opacity-80">{config.message}</p>
        <div className="flex gap-2 mt-2">
          {config.showOpenClaude && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleOpenClaude}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Open Claude.ai
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onSettingsClick}
          >
            Update Credentials
          </Button>
          {config.showRefresh && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
