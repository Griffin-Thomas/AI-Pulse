import { invoke } from "@tauri-apps/api/core";
import type { UsageData } from "./types";

export async function fetchUsage(provider: string): Promise<UsageData> {
  return invoke<UsageData>("fetch_usage", { provider });
}

export async function getSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("get_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}

export async function getCredentials(provider: string): Promise<Record<string, string> | null> {
  return invoke("get_credentials", { provider });
}

export async function saveCredentials(
  provider: string,
  credentials: Record<string, string>
): Promise<void> {
  return invoke("save_credentials", { provider, credentials });
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  language: "en" | "ja" | "zh-cn" | "zh-tw";
  launchAtStartup: boolean;
  refreshMode: "adaptive" | "fixed";
  refreshInterval: 60 | 180 | 300 | 600;
  displayMode: "icon" | "percentage" | "both";
  notifications: NotificationSettings;
  providers: ProviderConfig[];
}

export interface NotificationSettings {
  enabled: boolean;
  thresholds: number[];
  notifyOnReset: boolean;
  notifyOnExpiry: boolean;
}

export interface ProviderConfig {
  id: "claude" | "codex";
  enabled: boolean;
  credentials: Record<string, string>;
}
