export type ProviderId = "claude" | "codex";

export interface UsageData {
  provider: ProviderId;
  timestamp: string;
  limits: UsageLimit[];
  raw?: unknown;
}

export interface UsageLimit {
  id: string;
  label: string;
  utilization: number;
  resetsAt: string;
  category?: string;
}

export interface ClaudeUsageResponse {
  five_hour: LimitUsage;
  seven_day?: LimitUsage;
  seven_day_oauth_apps?: LimitUsage;
  seven_day_opus?: LimitUsage;
  seven_day_sonnet?: LimitUsage;
}

export interface LimitUsage {
  utilization: number;
  resets_at: string;
}

export interface UsageHistoryEntry {
  id: string;
  provider: ProviderId;
  timestamp: string;
  limits: UsageLimit[];
}
