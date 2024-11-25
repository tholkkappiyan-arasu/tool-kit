use crate::api_helper::ApiState;
use tauri::Builder;
use tauri::Wry;

#[tauri::command]
pub async fn echo(msg: String) -> Result<String, String> {
    Ok(msg)
}

pub fn register_commands(builder: Builder<Wry>) -> Builder<Wry> {
    builder
        .manage(ApiState::new().expect("Failed to create API state"))
        .invoke_handler(tauri::generate_handler![
            echo,                                      // Add a test command
            crate::api_helper::handlers::send_request  // Reference the handler directly
        ])
}
