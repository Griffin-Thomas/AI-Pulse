import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/ProgressRing";
import { formatTimeUntil } from "@/lib/utils";
import type { UsageLimit } from "@/lib/types";
import { Clock } from "lucide-react";

interface UsageCardProps {
  limit: UsageLimit;
}

export function UsageCard({ limit }: UsageCardProps) {
  const resetTime = formatTimeUntil(limit.resetsAt);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{limit.label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <ProgressRing value={limit.utilization} size={100} strokeWidth={8} />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Resets in {resetTime}</span>
        </div>
      </CardContent>
    </Card>
  );
}
