import { useState, useCallback, useEffect } from "react";
import { X, Coffee, RefreshCw, CheckCircle, Download, ExternalLink } from "lucide-react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";
import appIcon from "../../src-tauri/icons/icon.png";

interface AboutProps {
  isOpen: boolean;
  onClose: () => void;
}

type UpdateState = "idle" | "checking" | "available" | "downloading" | "ready" | "up-to-date" | "error";

export function About({ isOpen, onClose }: AboutProps) {
  const [version, setVersion] = useState<string>("");
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [updateVersion, setUpdateVersion] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [updateRef, setUpdateRef] = useState<Update | null>(null);

  // Get app version on mount
  useEffect(() => {
    getVersion().then(setVersion).catch(console.error);
  }, []);

  const checkForUpdates = useCallback(async () => {
    setUpdateState("checking");
    setError(null);

    try {
      const update = await check();
      if (update) {
        setUpdateVersion(update.version);
        setUpdateRef(update);
        setUpdateState("available");
      } else {
        setUpdateState("up-to-date");
      }
    } catch (err) {
      console.error("Failed to check for updates:", err);
      setError(err instanceof Error ? err.message : "Failed to check for updates");
      setUpdateState("error");
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!updateRef) return;

    setUpdateState("downloading");
    setDownloadProgress(0);

    try {
      let totalSize = 0;
      let downloaded = 0;

      await updateRef.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (totalSize > 0) {
              setDownloadProgress(Math.round((downloaded / totalSize) * 100));
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      setUpdateState("ready");
    } catch (err) {
      console.error("Failed to download update:", err);
      setError(err instanceof Error ? err.message : "Failed to download update");
      setUpdateState("error");
    }
  }, [updateRef]);

  const handleRelaunch = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      console.error("Failed to relaunch:", err);
      setError("Failed to restart the application");
    }
  }, []);

  const openBuyMeACoffee = useCallback(async () => {
    try {
      await openUrl("https://buymeacoffee.com/griffinthomas");
    } catch (err) {
      console.error("Failed to open link:", err);
    }
  }, []);

  const openGitHub = useCallback(async () => {
    try {
      await openUrl("https://github.com/Griffin-Thomas/AI-Pulse");
    } catch (err) {
      console.error("Failed to open link:", err);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-xl border max-w-sm w-full mx-4 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* App Icon */}
          <button
            onClick={openGitHub}
            className="mx-auto w-20 h-20 flex items-center justify-center mb-4 rounded-full hover:scale-105 transition-transform cursor-pointer"
            title="View on GitHub"
          >
            <img
              src={appIcon}
              alt="AI Pulse"
              className="w-20 h-20"
            />
          </button>

          {/* App name and version */}
          <h2 className="text-xl font-semibold mb-1">AI Pulse</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Version {version || "..."}
          </p>

          {/* Author */}
          <p className="text-sm text-muted-foreground mb-6">
            Created by <span className="font-medium text-foreground">Griffin Thomas</span>
          </p>

          {/* Update section */}
          <div className="mb-6 p-3 rounded-lg bg-muted/50">
            {updateState === "idle" && (
              <Button
                variant="outline"
                size="sm"
                onClick={checkForUpdates}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Updates
              </Button>
            )}

            {updateState === "checking" && (
              <div className="flex items-center justify-center gap-2 py-1">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Checking for updates...</span>
              </div>
            )}

            {updateState === "up-to-date" && (
              <div className="flex items-center justify-center gap-2 py-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">You're up to date!</span>
              </div>
            )}

            {updateState === "available" && (
              <div className="space-y-2">
                <p className="text-sm">
                  Update available: <span className="font-medium">v{updateVersion}</span>
                </p>
                <Button
                  size="sm"
                  onClick={downloadAndInstall}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download & Install
                </Button>
              </div>
            )}

            {updateState === "downloading" && (
              <div className="space-y-2">
                <p className="text-sm">Downloading update...</p>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{downloadProgress}%</p>
              </div>
            )}

            {updateState === "ready" && (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Update ready!</span>
                </div>
                <Button size="sm" onClick={handleRelaunch} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart to Apply
                </Button>
              </div>
            )}

            {updateState === "error" && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkForUpdates}
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={openBuyMeACoffee}
              className="w-full bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black"
            >
              <Coffee className="h-4 w-4 mr-2" />
              Buy Me a Coffee
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openGitHub}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on GitHub
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-muted/30 border-t text-center">
          <p className="text-xs text-muted-foreground">
            MIT License
          </p>
        </div>
      </div>
    </div>
  );
}
