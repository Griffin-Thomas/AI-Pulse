use crate::error::AppError;
use crate::models::AppSettings;
use crate::services::SettingsService;
use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[tauri::command]
pub async fn get_settings(app: AppHandle) -> Result<AppSettings, AppError> {
    log::info!("Getting app settings");
    SettingsService::get(&app)
}

#[tauri::command]
pub async fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), AppError> {
    log::info!("Saving app settings");
    SettingsService::save(&app, &settings)
}

#[tauri::command]
pub async fn send_test_notification(app: AppHandle) -> Result<(), AppError> {
    log::info!("Sending test notification");
    app.notification()
        .builder()
        .title("AI Pulse Test")
        .body("This is a preview of how notifications will appear.")
        .show()
        .map_err(|e| AppError::Notification(e.to_string()))?;
    Ok(())
}
