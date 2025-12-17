use crate::error::AppError;
use crate::models::Credentials;
use crate::services::CredentialService;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_credentials(
    app: AppHandle,
    provider: String,
) -> Result<Option<Credentials>, AppError> {
    log::info!("Getting credentials for provider: {}", provider);
    CredentialService::get(&app, &provider)
}

#[tauri::command]
pub async fn save_credentials(
    app: AppHandle,
    provider: String,
    credentials: Credentials,
) -> Result<(), AppError> {
    log::info!("Saving credentials for provider: {}", provider);

    // Validate credentials based on provider
    let valid = match provider.as_str() {
        "claude" => CredentialService::validate_claude(&credentials),
        _ => true, // Allow other providers for now
    };

    if !valid {
        return Err(AppError::Store("Invalid credentials format".to_string()));
    }

    CredentialService::save(&app, &provider, &credentials)
}

#[tauri::command]
pub async fn delete_credentials(app: AppHandle, provider: String) -> Result<(), AppError> {
    log::info!("Deleting credentials for provider: {}", provider);
    CredentialService::delete(&app, &provider)
}

#[tauri::command]
pub async fn has_credentials(app: AppHandle, provider: String) -> Result<bool, AppError> {
    CredentialService::exists(&app, &provider)
}
