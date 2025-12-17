import { useState, useCallback } from "react";
import { Dashboard } from "@/components/Dashboard";
import { Settings } from "@/components/Settings";
import { useUsageStore } from "@/lib/store";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { setUsage, setError } = useUsageStore();

  const handleSettingsClose = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const handleCredentialsSaved = useCallback(() => {
    // Clear any existing error and usage data to trigger a fresh fetch
    setError("claude", null);
    setUsage("claude", null);
  }, [setError, setUsage]);

  return (
    <div className="h-screen w-full bg-background text-foreground">
      <Dashboard
        provider="claude"
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <Settings
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        onCredentialsSaved={handleCredentialsSaved}
      />
    </div>
  );
}

export default App;
