use std::env;
use std::fs;
use std::path::Path;

fn main() {
    tauri_build::build();

    // Copy mpv DLLs to target directory for Windows
    #[cfg(target_os = "windows")]
    {
        let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
        let profile = env::var("PROFILE").unwrap();

        // Construct target directory path more reliably
        // Try CARGO_TARGET_DIR first, then fall back to manifest_dir/target
        let target_base = env::var("CARGO_TARGET_DIR")
            .map(|p| Path::new(&p).to_path_buf())
            .unwrap_or_else(|_| Path::new(&manifest_dir).join("target"));

        let target_profile_dir = target_base.join(&profile);

        // Try multiple possible locations for DLLs
        // Check standard location first, then nested structures
        let possible_lib_dirs = vec![
            Path::new(&manifest_dir).join("lib"),
            Path::new(&manifest_dir).join("src-tauri").join("lib"),
            Path::new(&manifest_dir)
                .join("src-tauri")
                .join("src-tauri")
                .join("lib"),
            Path::new(&manifest_dir)
                .join("src-tauri")
                .join("src-tauri")
                .join("src-tauri")
                .join("lib"),
            Path::new(&manifest_dir).parent().unwrap().join("lib"),
            // Handle nested src-tauri structure (if it exists)
            Path::new(&manifest_dir)
                .parent()
                .unwrap()
                .join("src-tauri")
                .join("lib"),
            Path::new(&manifest_dir)
                .parent()
                .unwrap()
                .join("src-tauri")
                .join("src-tauri")
                .join("lib"),
            // Also check if DLLs are already in target (from previous builds)
            target_profile_dir.clone(),
        ];

        // DLLs to copy
        // tauri-plugin-mpv only needs libmpv-2.dll
        let dlls = ["libmpv-2.dll"];

        for dll in &dlls {
            let mut copied = false;

            // Try each possible location
            for lib_dir in &possible_lib_dirs {
                let src = lib_dir.join(dll);
                if src.exists() {
                    let dst = target_profile_dir.join(dll);
                    // Only copy if source and destination are different
                    if src != dst {
                        if let Err(e) = fs::copy(&src, &dst) {
                            eprintln!("cargo:warning=Failed to copy {}: {}", dll, e);
                        } else {
                            println!("cargo:warning=Copied {} to {}", dll, dst.display());
                            copied = true;
                            break;
                        }
                    } else {
                        // Already in the right place
                        println!("cargo:warning={} already in target directory", dll);
                        copied = true;
                        break;
                    }
                }
            }

            if !copied {
                eprintln!(
                    "cargo:warning=ERROR: {} not found in any expected location!",
                    dll
                );
                eprintln!(
                    "cargo:warning=Please place {} in src-tauri/lib/ directory",
                    dll
                );
                eprintln!("cargo:warning=See src-tauri/MPV_DLL_SETUP.md for instructions");
                eprintln!("cargo:warning=Locations checked:");
                for lib_dir in &possible_lib_dirs {
                    let check_path = lib_dir.join(dll);
                    eprintln!(
                        "cargo:warning=  - {} ({})",
                        check_path.display(),
                        if check_path.exists() {
                            "EXISTS"
                        } else {
                            "NOT FOUND"
                        }
                    );
                }
            }
        }
    }
}
