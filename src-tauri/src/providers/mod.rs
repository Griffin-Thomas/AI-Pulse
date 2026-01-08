mod claude;

pub use claude::ClaudeProvider;

use crate::error::ProviderError;
use crate::models::{Credentials, UsageData};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

/// Trait for usage data providers
#[async_trait]
pub trait UsageProvider: Send + Sync {
    /// Provider identifier (e.g., "claude", "chatgpt", "gemini")
    fn id(&self) -> &'static str;

    /// Human-readable provider name (e.g., "Claude", "ChatGPT", "Gemini")
    fn name(&self) -> &'static str;

    /// Fetch current usage data
    async fn fetch_usage(&self, credentials: &Credentials) -> Result<UsageData, ProviderError>;

    /// Validate that credentials have required fields
    fn validate_credentials(&self, credentials: &Credentials) -> bool;

    /// Get metadata about this provider
    fn metadata(&self) -> ProviderMetadata {
        ProviderMetadata {
            id: self.id().to_string(),
            name: self.name().to_string(),
            status: ProviderStatus::Available,
            required_credentials: vec![],
            description: None,
        }
    }
}

/// Provider availability status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ProviderStatus {
    /// Provider is fully functional
    Available,
    /// Provider is implemented but blocked (e.g., no usage API)
    Blocked,
    /// Provider is planned but not yet implemented
    Planned,
}

/// Metadata about a provider for the UI
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderMetadata {
    pub id: String,
    pub name: String,
    pub status: ProviderStatus,
    pub required_credentials: Vec<CredentialField>,
    pub description: Option<String>,
}

/// Describes a credential field for the UI
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CredentialField {
    pub key: String,
    pub label: String,
    pub placeholder: String,
    pub is_secret: bool,
}

/// Registry of all available providers
pub struct ProviderRegistry {
    providers: HashMap<String, Arc<dyn UsageProvider>>,
}

impl ProviderRegistry {
    /// Create a new registry with all available providers
    pub fn new() -> Result<Self, ProviderError> {
        let mut providers: HashMap<String, Arc<dyn UsageProvider>> = HashMap::new();

        // Register Claude provider
        let claude = ClaudeProvider::new()?;
        providers.insert(claude.id().to_string(), Arc::new(claude));

        Ok(Self { providers })
    }

    /// Get a provider by ID
    pub fn get(&self, id: &str) -> Option<Arc<dyn UsageProvider>> {
        self.providers.get(id).cloned()
    }

    /// Get IDs of all registered providers
    pub fn provider_ids(&self) -> impl Iterator<Item = &str> {
        self.providers.keys().map(|s| s.as_str())
    }

    /// Get metadata for all available providers
    pub fn all_metadata(&self) -> Vec<ProviderMetadata> {
        self.providers
            .values()
            .map(|p| {
                let mut meta = p.metadata();
                // Add required credentials for Claude
                if meta.id == "claude" {
                    meta.required_credentials = vec![
                        CredentialField {
                            key: "org_id".to_string(),
                            label: "Organization ID".to_string(),
                            placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".to_string(),
                            is_secret: false,
                        },
                        CredentialField {
                            key: "session_key".to_string(),
                            label: "Session Key".to_string(),
                            placeholder: "sk-ant-sid01-...".to_string(),
                            is_secret: true,
                        },
                    ];
                    meta.description = Some(
                        "Monitor your Claude Pro/Max usage limits. \
                         Get credentials from claude.ai DevTools."
                            .to_string(),
                    );
                }
                meta
            })
            .collect()
    }
}

impl Default for ProviderRegistry {
    fn default() -> Self {
        Self::new().expect("Failed to create provider registry")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_registry_creation() {
        let registry = ProviderRegistry::new().unwrap();
        assert!(registry.get("claude").is_some());
        assert!(registry.get("unknown").is_none());
    }

    #[test]
    fn test_all_metadata() {
        let registry = ProviderRegistry::new().unwrap();
        let metadata = registry.all_metadata();

        // Should have Claude
        assert_eq!(metadata.len(), 1);
        assert_eq!(metadata[0].id, "claude");
        assert_eq!(metadata[0].status, ProviderStatus::Available);
    }
}
