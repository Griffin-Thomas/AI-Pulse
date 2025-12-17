import { useState, useEffect } from "react";
import { X, Save, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCredentials, saveCredentials, deleteCredentials, type Credentials } from "@/lib/tauri";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsSaved?: () => void;
}

export function Settings({ isOpen, onClose, onCredentialsSaved }: SettingsProps) {
  const [orgId, setOrgId] = useState("");
  const [sessionKey, setSessionKey] = useState("");
  const [showSessionKey, setShowSessionKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);

  // Load existing credentials
  useEffect(() => {
    if (isOpen) {
      loadCredentials();
    }
  }, [isOpen]);

  const loadCredentials = async () => {
    try {
      const creds = await getCredentials("claude");
      if (creds) {
        setOrgId(creds.org_id || "");
        setSessionKey(creds.session_key || "");
        setHasExisting(true);
      } else {
        setOrgId("");
        setSessionKey("");
        setHasExisting(false);
      }
    } catch (err) {
      console.error("Failed to load credentials:", err);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!orgId.trim() || !sessionKey.trim()) {
      setError("Both Organization ID and Session Key are required");
      return;
    }

    setIsSaving(true);
    try {
      const credentials: Credentials = {
        org_id: orgId.trim(),
        session_key: sessionKey.trim(),
      };
      await saveCredentials("claude", credentials);
      setSuccess("Credentials saved successfully");
      setHasExisting(true);
      onCredentialsSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setSuccess(null);
    setIsDeleting(true);

    try {
      await deleteCredentials("claude");
      setOrgId("");
      setSessionKey("");
      setHasExisting(false);
      setSuccess("Credentials deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-4 flex items-start justify-center overflow-auto">
        <Card className="w-full max-w-lg mt-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Configure your AI service credentials</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Claude Credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Claude Credentials</h3>

              <div className="space-y-2">
                <Label htmlFor="org-id">Organization ID</Label>
                <Input
                  id="org-id"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in your Claude.ai URL: claude.ai/settings/organization/[org-id]
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-key">Session Key</Label>
                <div className="relative">
                  <Input
                    id="session-key"
                    type={showSessionKey ? "text" : "password"}
                    placeholder="sk-ant-..."
                    value={sessionKey}
                    onChange={(e) => setSessionKey(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSessionKey(!showSessionKey)}
                  >
                    {showSessionKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find this in browser DevTools: Application → Cookies → sessionKey
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Credentials"}
                </Button>
                {hasExisting && (
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Help section */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">How to get your credentials</h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Log in to claude.ai in your browser</li>
                <li>Go to Settings → Organization to find your Org ID</li>
                <li>Open DevTools (F12) → Application → Cookies</li>
                <li>Copy the value of the "sessionKey" cookie</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
