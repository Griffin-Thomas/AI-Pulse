use crate::error::AppError;
use crate::models::AppSettings;
use crate::services::SettingsService;
use tauri::AppHandle;

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
