use crate::error::{AppError, ProviderError};
use crate::models::{Credentials, UsageData};
use crate::providers::{ClaudeProvider, UsageProvider};
use crate::services::CredentialService;
use tauri::AppHandle;

#[tauri::command]
pub async fn fetch_usage(app: AppHandle, provider: String) -> Result<UsageData, AppError> {
    log::info!("Fetching usage for provider: {}", provider);

    // Get credentials
    let credentials = CredentialService::get(&app, &provider)?
        .ok_or_else(|| ProviderError::MissingCredentials(provider.clone()))?;

    // Get the appropriate provider
    match provider.as_str() {
        "claude" => {
            let claude = ClaudeProvider::new()?;

            if !claude.validate_credentials(&credentials) {
                return Err(ProviderError::InvalidCredentials(
                    "Missing org_id or session_key".to_string(),
                )
                .into());
            }

            let usage = claude.fetch_usage(&credentials).await?;
            Ok(usage)
        }
        "codex" => {
            // Codex not yet implemented
            Err(ProviderError::HttpError("Codex provider not yet implemented".to_string()).into())
        }
        _ => Err(ProviderError::HttpError(format!("Unknown provider: {}", provider)).into()),
    }
}

#[tauri::command]
pub async fn validate_credentials(
    provider: String,
    credentials: Credentials,
) -> Result<bool, AppError> {
    log::info!("Validating credentials for provider: {}", provider);

    match provider.as_str() {
        "claude" => {
            let claude = ClaudeProvider::new()?;
            Ok(claude.validate_credentials(&credentials))
        }
        "codex" => Ok(true), // TODO: Implement Codex validation
        _ => Ok(false),
    }
}
