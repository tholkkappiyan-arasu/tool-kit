#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod api_helper; // Make the module public
pub mod commands;

use crate::commands::register_commands;

fn main() {
    let builder = tauri::Builder::default();
    let builder = register_commands(builder);

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
