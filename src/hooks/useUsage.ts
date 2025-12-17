import { useCallback, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { useUsageStore } from "@/lib/store";
import { fetchUsage, hasCredentials } from "@/lib/tauri";
import type { ProviderId } from "@/lib/types";

export function useUsage(provider: ProviderId) {
  const { usage, setUsage, setLoading, setError, setLastRefresh } = useUsageStore();
  const hasFetched = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(provider, true);
    setError(provider, null);

    try {
      // Check if credentials exist first
      const hasCreds = await hasCredentials(provider);
      if (!hasCreds) {
        setError(provider, "No credentials configured. Please set up your credentials in Settings.");
        setLoading(provider, false);
        return;
      }

      const data = await fetchUsage(provider);
      setUsage(provider, data);
      setLastRefresh(provider, new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(provider, message);
    } finally {
      setLoading(provider, false);
    }
  }, [provider, setUsage, setLoading, setError, setLastRefresh]);

  // Listen for tray refresh events
  useEffect(() => {
    const unlisten = listen("tray-refresh", () => {
      refresh();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refresh]);

  // Initial fetch on mount
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      refresh();
    }
  }, [refresh]);

  // Refetch when usage is cleared (credentials updated)
  const currentUsage = usage[provider];
  useEffect(() => {
    if (currentUsage === null && hasFetched.current) {
      refresh();
    }
  }, [currentUsage, refresh]);

  return { refresh };
}
