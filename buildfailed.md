
> tauri-app@0.1.0 tauri
> tauri android dev

        Info Using Android Studio's default Java installation: C:\Program Files\Android\Android Studio\jbr
        Info Using installed NDK: C:\Users\jodyn\AppData\Local\Android\Sdk\ndk\30.0.14904198 
 (TB305FU) with target "aarch64-linux-android" Tab One
        Info Using 192.168.1.103 to access the development server.
        Info Replacing devUrl host with 192.168.1.103. If your frontend is not listening on that address, try configuring your development server to use the `TAURI_DEV_HOST` environment variable or 0.0.0.0 as host.
     Running BeforeDevCommand (`npm run dev`)

> tauri-app@0.1.0 dev
> vite


  VITE v7.3.0  ready in 273 ms

  ➜  Network: http://192.168.1.103:1420/
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
   Compiling tauri-app v0.1.0 (C:\Users\jodyn\Desktop\yttv april port\src-tauri)
warning: unused import: `AppHandle`
 --> src\commands.rs:6:13
  |
6 | use tauri::{AppHandle, Manager, State};
  |             ^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

error[E0599]: no method named `convert_float_array` found for struct `jni::JNIEnv<'local>` in the current scope
   --> src\lib.rs:139:42
    |
139 |             if let Ok(samples_vec) = env.convert_float_array(samples) {
    |                                          ^^^^^^^^^^^^^^^^^^^
    |
help: there is a method `new_float_array` with a similar name
    |
139 -             if let Ok(samples_vec) = env.convert_float_array(samples) {
139 +             if let Ok(samples_vec) = env.new_float_array(samples) {
    |

For more information about this error, try `rustc --explain E0599`.
warning: `tauri-app` (lib) generated 1 warning
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
error: could not compile `tauri-app` (lib) due to 1 previous error; 1 warning emitted        
failed to build Android app: `Failed to run `cargo build`: command ["cargo", "build", "--package", "tauri-app", "--manifest-path", "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\Cargo.toml", "--target", "aarch64-linux-android", "--lib"] exited with code 101
       Error failed to build Android app: `Failed to run `cargo build`: command ["cargo", "build", "--package", "tauri-app", "--manifest-path", "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\Cargo.toml", "--target", "aarch64-linux-android", "--lib"] exited with code 101