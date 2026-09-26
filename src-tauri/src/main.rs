// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // FORCE PATH: Prepend the directory of the running executable and resource folders to PATH
    // This ensures that 'libmpv-2.dll' (packaged in the resources/lib folder) is found.
    #[cfg(target_os = "windows")]
    {
        if let Ok(current_exe) = std::env::current_exe() {
            if let Some(exe_dir) = current_exe.parent() {
                let path_key = "PATH";
                if let Ok(current_path) = std::env::var(path_key) {
                    let lib_dir = exe_dir.join("lib");
                    let resources_lib_dir = exe_dir.join("resources").join("lib");
                    let new_path = format!(
                        "{};{};{};{}",
                        exe_dir.display(),
                        lib_dir.display(),
                        resources_lib_dir.display(),
                        current_path
                    );
                    std::env::set_var(path_key, new_path);
                    println!("Debug: Set PATH to include executable and resource directories.");
                }
            }
        }
    }

    // Quick verification: Can we spawn mpv?
    match std::process::Command::new("mpv").arg("--version").output() {
        Ok(output) => println!(
            "Debug: Found mpv version: {}",
            String::from_utf8_lossy(&output.stdout)
        ),
        Err(e) => println!("Debug: Failed to find mpv in PATH: {}", e),
    }

    tauri_app_lib::run()
}
