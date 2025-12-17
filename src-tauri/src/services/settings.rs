use crate::error::AppError;
use crate::models::AppSettings;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

const STORE_FILE: &str = "settings.json";
const SETTINGS_KEY: &str = "app_settings";

pub struct SettingsService;

impl SettingsService {
    /// Get app settings
    pub fn get(app: &AppHandle) -> Result<AppSettings, AppError> {
        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let value = store.get(SETTINGS_KEY);

        match value {
            Some(v) => {
                let settings: AppSettings = serde_json::from_value(v.clone())?;
                Ok(settings)
            }
            None => Ok(AppSettings::default()),
        }
    }

    /// Save app settings
    pub fn save(app: &AppHandle, settings: &AppSettings) -> Result<(), AppError> {
        let store = app
            .store(STORE_FILE)
            .map_err(|e| AppError::Store(e.to_string()))?;

        let value = serde_json::to_value(settings)?;
        store.set(SETTINGS_KEY.to_string(), value);
        store.save().map_err(|e| AppError::Store(e.to_string()))?;

        log::info!("Saved app settings");
        Ok(())
    }
}
