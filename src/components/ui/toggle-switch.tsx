import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ToggleSwitch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  loading = false,
  className,
}: ToggleSwitchProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled || loading}
      onClick={onCheckedChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0",
          "transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </span>
    </button>
  );
}
