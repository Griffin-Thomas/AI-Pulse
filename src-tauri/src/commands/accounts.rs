use crate::error::AppError;
use crate::models::Account;
use crate::providers::ProviderRegistry;
use crate::services::CredentialService;
use tauri::AppHandle;

use super::usage::{map_provider_error_to_result, TestConnectionResult};

/// List all accounts for a provider
#[tauri::command]
pub async fn list_accounts(app: AppHandle, provider: String) -> Result<Vec<Account>, AppError> {
    log::info!("Listing accounts for provider: {}", provider);
    CredentialService::list_accounts(&app, &provider)
}

/// Get a specific account by ID
#[tauri::command]
pub async fn get_account(app: AppHandle, account_id: String) -> Result<Option<Account>, AppError> {
    log::info!("Getting account: {}", account_id);
    CredentialService::get_account(&app, &account_id)
}

/// Save (create or update) an account
#[tauri::command]
pub async fn save_account(app: AppHandle, account: Account) -> Result<(), AppError> {
    log::info!("Saving account: {} ({})", account.name, account.id);
    CredentialService::save_account(&app, &account)
}

/// Delete an account by ID
#[tauri::command]
pub async fn delete_account(app: AppHandle, account_id: String) -> Result<(), AppError> {
    log::info!("Deleting account: {}", account_id);
    CredentialService::delete_account(&app, &account_id)
}

/// Test connection for an account
#[tauri::command]
pub async fn test_account_connection(account: Account) -> Result<TestConnectionResult, AppError> {
    log::info!("Testing connection for account: {} ({})", account.name, account.id);

    let registry = ProviderRegistry::new()?;

    let provider_impl = match registry.get(&account.provider) {
        Some(p) => p,
        None => {
            return Ok(TestConnectionResult {
                success: false,
                error_code: Some("PROVIDER_UNAVAILABLE".to_string()),
                error_message: Some(format!("Provider '{}' is not available", account.provider)),
                hint: Some("This provider is currently blocked or not supported.".to_string()),
            });
        }
    };

    // First validate format
    if !provider_impl.validate_credentials(&account.credentials) {
        return Ok(TestConnectionResult {
            success: false,
            error_code: Some("INVALID_FORMAT".to_string()),
            error_message: Some("Credentials format is invalid".to_string()),
            hint: Some("Please ensure both Organization ID and Session Key are provided.".to_string()),
        });
    }

    // Try to fetch usage
    match provider_impl.fetch_usage(&account.credentials).await {
        Ok(_) => Ok(TestConnectionResult {
            success: true,
            error_code: None,
            error_message: None,
            hint: None,
        }),
        Err(e) => Ok(map_provider_error_to_result(e)),
    }
}
