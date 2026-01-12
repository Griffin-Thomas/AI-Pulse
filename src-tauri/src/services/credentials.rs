use crate::error::AppError;
use crate::models::{Account, Credentials};
use crate::services::crypto;
use chrono::Utc;
use std::collections::HashMap;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "credentials.json";
const ACCOUNTS_KEY: &str = "accounts";
const VERSION_KEY: &str = "version";
const CURRENT_VERSION: u32 = 3; // v3: encrypted credentials

/// Prefix to identify encrypted values
const ENCRYPTED_PREFIX: &str = "enc:v1:";

pub struct CredentialService;

impl CredentialService {
    /// Encrypt a single credential field
    fn encrypt_field(value: Option<&String>) -> Option<String> {
        value.map(|key| {
            if key.starts_with(ENCRYPTED_PREFIX) {
                key.clone()
            } else {
                match crypto::encrypt(key) {
                    Ok(encrypted) => format!("{}{}", ENCRYPTED_PREFIX, encrypted),
                    Err(e) => {
                        log::error!("Failed to encrypt field: {}", e);
                        key.clone()
                    }
                }
            }
        })
    }

    /// Decrypt a single credential field
    fn decrypt_field(value: Option<&String>) -> Option<String> {
        value.map(|key| {
            if let Some(encrypted) = key.strip_prefix(ENCRYPTED_PREFIX) {
                match crypto::decrypt(encrypted) {
                    Ok(decrypted) => decrypted,
                    Err(e) => {
                        log::error!("Failed to decrypt field: {}", e);
                        key.clone()
                    }
                }
            } else {
                key.clone()
            }
        })
    }

    /// Encrypt sensitive credential fields
    fn encrypt_credentials(credentials: &Credentials) -> Credentials {
        Credentials {
            org_id: credentials.org_id.clone(),
            session_key: Self::encrypt_field(credentials.session_key.as_ref()),
        }
    }

    /// Decrypt sensitive credential fields
    fn decrypt_credentials(credentials: &Credentials) -> Credentials {
        Credentials {
            org_id: credentials.org_id.clone(),
            session_key: Self::decrypt_field(credentials.session_key.as_ref()),
        }
    }

    // =========================================================================
    // Account-based API (v2)
    // =========================================================================

    /// Ensure the store is migrated to the latest version
    pub fn ensure_migrated(app: &AppHandle) -> Result<(), AppError> {
        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        // Check current version
        let version: u32 = store
            .get(VERSION_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or(1);

        if version < 2 {
            log::info!("Migrating credentials from v{} to v2", version);
            Self::migrate_v1_to_v2(app)?;
        }

        if version < 3 {
            log::info!("Migrating credentials from v2 to v3 (encrypting)");
            Self::migrate_v2_to_v3(app)?;
        }

        Ok(())
    }

    /// Migrate from v2 (plaintext) to v3 (encrypted credentials)
    fn migrate_v2_to_v3(app: &AppHandle) -> Result<(), AppError> {
        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let mut accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        // Encrypt all existing credentials
        for (_, account) in accounts.iter_mut() {
            account.credentials = Self::encrypt_credentials(&account.credentials);
        }

        // Save encrypted accounts
        store.set(ACCOUNTS_KEY.to_string(), serde_json::to_value(&accounts)?);
        store.set(VERSION_KEY.to_string(), serde_json::to_value(CURRENT_VERSION)?);

        // Clean up any leftover legacy keys (may exist from incomplete v1->v2 migration)
        store.delete("claude");
        store.delete("codex");
        store.delete("gemini");

        store.save().map_err(|e| AppError::Store(e.to_string()))?;

        log::info!("Migration to v3 complete. {} accounts encrypted.", accounts.len());
        Ok(())
    }

    /// Migrate from v1 (flat provider credentials) to v2 (account-based)
    fn migrate_v1_to_v2(app: &AppHandle) -> Result<(), AppError> {
        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let mut accounts: HashMap<String, Account> = HashMap::new();

        // Check for existing Claude credentials in v1 format
        if let Some(v) = store.get("claude") {
            if let Ok(creds) = serde_json::from_value::<Credentials>(v.clone()) {
                // Only migrate if credentials have values
                if Self::validate_claude(&creds) {
                    let account = Account {
                        id: uuid::Uuid::new_v4().to_string(),
                        name: "Default".to_string(),
                        provider: "claude".to_string(),
                        credentials: creds,
                        created_at: Utc::now(),
                    };
                    log::info!("Migrating Claude credentials to account: {}", account.id);
                    accounts.insert(account.id.clone(), account);
                }
            }
        }

        // Save new format
        store.set(ACCOUNTS_KEY.to_string(), serde_json::to_value(&accounts)?);
        store.set(VERSION_KEY.to_string(), serde_json::to_value(CURRENT_VERSION)?);

        // Clean up old format keys
        store.delete("claude");
        store.delete("codex");
        store.delete("gemini");

        store.save().map_err(|e| AppError::Store(e.to_string()))?;
        log::info!("Migration complete. {} accounts migrated.", accounts.len());

        Ok(())
    }

    /// List all accounts for a provider (decrypts credentials)
    pub fn list_accounts(app: &AppHandle, provider: &str) -> Result<Vec<Account>, AppError> {
        Self::ensure_migrated(app)?;

        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        let filtered: Vec<Account> = accounts
            .into_values()
            .filter(|a| a.provider == provider)
            .map(|mut a| {
                a.credentials = Self::decrypt_credentials(&a.credentials);
                a
            })
            .collect();

        Ok(filtered)
    }

    /// Get a specific account by ID (decrypts credentials)
    pub fn get_account(app: &AppHandle, account_id: &str) -> Result<Option<Account>, AppError> {
        Self::ensure_migrated(app)?;

        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        Ok(accounts.get(account_id).cloned().map(|mut a| {
            a.credentials = Self::decrypt_credentials(&a.credentials);
            a
        }))
    }

    /// Save (create or update) an account (encrypts credentials)
    pub fn save_account(app: &AppHandle, account: &Account) -> Result<(), AppError> {
        Self::ensure_migrated(app)?;

        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let mut accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        // Encrypt credentials before storing
        let mut encrypted_account = account.clone();
        encrypted_account.credentials = Self::encrypt_credentials(&account.credentials);
        accounts.insert(account.id.clone(), encrypted_account);

        store.set(ACCOUNTS_KEY.to_string(), serde_json::to_value(&accounts)?);
        store.save().map_err(|e| AppError::Store(e.to_string()))?;

        log::info!("Saved account: {} ({})", account.name, account.id);
        Ok(())
    }

    /// Check if any accounts exist for a provider (without decrypting credentials)
    pub fn has_accounts(app: &AppHandle, provider: &str) -> Result<bool, AppError> {
        Self::ensure_migrated(app)?;

        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        Ok(accounts.values().any(|a| a.provider == provider))
    }

    /// Delete an account by ID
    pub fn delete_account(app: &AppHandle, account_id: &str) -> Result<(), AppError> {
        Self::ensure_migrated(app)?;

        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let mut accounts: HashMap<String, Account> = store
            .get(ACCOUNTS_KEY)
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        if accounts.remove(account_id).is_some() {
            store.set(ACCOUNTS_KEY.to_string(), serde_json::to_value(&accounts)?);
            store.save().map_err(|e| AppError::Store(e.to_string()))?;
            log::info!("Deleted account: {}", account_id);
        }

        Ok(())
    }

    /// Validate Claude credentials format
    pub fn validate_claude(credentials: &Credentials) -> bool {
        // Claude requires org_id and session_key
        let has_org_id = credentials
            .org_id
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

        let has_session_key = credentials
            .session_key
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);

        has_org_id && has_session_key
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_claude_with_valid_credentials() {
        let creds = Credentials {
            org_id: Some("org-123".to_string()),
            session_key: Some("sk-ant-xxx".to_string()),
        };
        assert!(CredentialService::validate_claude(&creds));
    }

    #[test]
    fn validate_claude_missing_org_id() {
        let creds = Credentials {
            org_id: None,
            session_key: Some("sk-ant-xxx".to_string()),
        };
        assert!(!CredentialService::validate_claude(&creds));
    }

    #[test]
    fn validate_claude_missing_session_key() {
        let creds = Credentials {
            org_id: Some("org-123".to_string()),
            session_key: None,
        };
        assert!(!CredentialService::validate_claude(&creds));
    }

    #[test]
    fn validate_claude_empty_org_id() {
        let creds = Credentials {
            org_id: Some("".to_string()),
            session_key: Some("sk-ant-xxx".to_string()),
        };
        assert!(!CredentialService::validate_claude(&creds));
    }

    #[test]
    fn validate_claude_whitespace_only() {
        let creds = Credentials {
            org_id: Some("   ".to_string()),
            session_key: Some("sk-ant-xxx".to_string()),
        };
        assert!(!CredentialService::validate_claude(&creds));
    }

    #[test]
    fn validate_claude_both_missing() {
        let creds = Credentials::default();
        assert!(!CredentialService::validate_claude(&creds));
    }
}
