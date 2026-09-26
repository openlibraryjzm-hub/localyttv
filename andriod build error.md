>>
        Info Using Android Studio's default Java installation: C:\Program Files\Android\Android Studio\jbr
        Info Using installed NDK: C:\Users\jodyn\AppData\Local\Android\Sdk\ndk\30.0.14904198
 (TB305FU) with target "aarch64-linux-android"U
        Info Using 192.168.1.103 to access the development server.
        Info Replacing devUrl host with 192.168.1.103. If your frontend is not listening on that address, try configuring your development server to use the `TAURI_DEV_HOST` environment variable or 0.0.0.0 as host.
     Running BeforeDevCommand (`npm run dev`)

> tauri-app@0.1.0 dev
> vite


  VITE v7.3.0  ready in 180 ms

  ➜  Network: http://192.168.1.103:1420/
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
warning: unused import: `AppHandle`
 --> src\commands.rs:6:13
  |
6 | use tauri::{AppHandle, Manager, State};
  |             ^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

warning: function `test_audio_command` is never used
   --> src\commands.rs:559:8
    |
559 | pub fn test_audio_command() -> String {
    |        ^^^^^^^^^^^^^^^^^^
    |
    = note: `#[warn(dead_code)]` (part of `#[warn(unused)]`) on by default

warning: function `start_audio_capture` is never used
   --> src\commands.rs:565:8
    |
565 | pub fn start_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^^

warning: function `stop_audio_capture` is never used
   --> src\commands.rs:571:8
    |
571 | pub fn stop_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^

warning: struct `CreatePlaylistRequest` is never constructed
  --> src\models.rs:39:12
   |
39 | pub struct CreatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `UpdatePlaylistRequest` is never constructed
  --> src\models.rs:45:12
   |
45 | pub struct UpdatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `AddVideoToPlaylistRequest` is never constructed
  --> src\models.rs:54:12
   |
54 | pub struct AddVideoToPlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `ReorderPlaylistItemRequest` is never constructed
  --> src\models.rs:66:12
   |
66 | pub struct ReorderPlaylistItemRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `VideoFolderAssignment` is never constructed
  --> src\models.rs:73:12
   |
73 | pub struct VideoFolderAssignment {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: method `get_file_registry` is never used
  --> src\streaming_server.rs:39:12
   |
31 | impl StreamingServer {
   | -------------------- method in this implementation
...
39 |     pub fn get_file_registry(&self) -> FileRegistry {
   |            ^^^^^^^^^^^^^^^^^

warning: `tauri-app` (lib) generated 10 warnings (run `cargo fix --lib -p tauri-app` to apply 1 suggestion)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.39s
        Info symlinking lib "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" in jniLibs dir "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a"   
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libandroid.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libdl.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "liblog.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libm.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libc.so"
        Info symlink at "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a\\libtauri_app_lib.so" points to "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so"

> tauri-app@0.1.0 tauri
> tauri android android-studio-script --target aarch64

<===========--> 85% EXECUTING [1s]
> :app:rustBuildArm64Debug                                            Info Using installed NDK: C:\Users\jodyn\AppData\Local\Android\Sdk\ndk\30.0.14904198
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
warning: unused import: `AppHandle`
 --> src\commands.rs:6:13
  |
6 | use tauri::{AppHandle, Manager, State};
  |             ^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

warning: function `test_audio_command` is never used
   --> src\commands.rs:559:8
    |
559 | pub fn test_audio_command() -> String {
    |        ^^^^^^^^^^^^^^^^^^
    |
    = note: `#[warn(dead_code)]` (part of `#[warn(unused)]`) on by default

warning: function `start_audio_capture` is never used
   --> src\commands.rs:565:8
    |
565 | pub fn start_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^^

warning: function `stop_audio_capture` is never used
   --> src\commands.rs:571:8
    |
571 | pub fn stop_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^

warning: struct `CreatePlaylistRequest` is never constructed
  --> src\models.rs:39:12
   |
39 | pub struct CreatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `UpdatePlaylistRequest` is never constructed
  --> src\models.rs:45:12
   |
45 | pub struct UpdatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `AddVideoToPlaylistRequest` is never constructed
  --> src\models.rs:54:12
   |
54 | pub struct AddVideoToPlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `ReorderPlaylistItemRequest` is never constructed
  --> src\models.rs:66:12
   |
66 | pub struct ReorderPlaylistItemRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `VideoFolderAssignment` is never constructed
  --> src\models.rs:73:12
   |
73 | pub struct VideoFolderAssignment {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: method `get_file_registry` is never used
  --> src\streaming_server.rs:39:12
   |
31 | impl StreamingServer {
   | -------------------- method in this implementation
...
39 |     pub fn get_file_registry(&self) -> FileRegistry {
   |            ^^^^^^^^^^^^^^^^^

warning: `tauri-app` (lib) generated 10 warnings (run `cargo fix --lib -p tauri-app` to apply 1 suggestion)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.34s
        Info symlinking lib "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" in jniLibs dir "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libandroid.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libdl.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "liblog.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libm.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libc.so"

[Incubating] Problems report is available at: file:///C:/Users/jodyn/Desktop/yttv%20april%20port/src-tauri/gen/android/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
Performing Streamed Install
Success
Starting: Intent { cmp=com.ggpc.tauri_app/.MainActivity }
        Info Watching C:\Users\jodyn\Desktop\yttv april port\src-tauri for changes...
--------- beginning of main
05-02 11:57:00.265 22912 22912 I .ggpc.tauri_app: Late-enabling -Xcheck:jni
05-02 11:57:00.323 22912 22912 I .ggpc.tauri_app: Using CollectorTypeCMC GC.
05-02 11:57:00.869 22912 22912 I LoadedApk: No resource references to update in package com.zuisdk
05-02 11:57:01.058 22912 22912 I PowerHalWrapper: PowerHalWrapper.getInstance 
05-02 11:57:01.059 22912 22912 I M-ProMotion: M-ProMotion is disabled
--------- beginning of system
05-02 11:57:01.323 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.323 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.325 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.325 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.325 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:57:01.326 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.327 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.327 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.333 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:57:01.333 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.334 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.337 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.337 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.337 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.338 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.379 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:57:01.379 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.379 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:57:01.379 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.379 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.395 22912 22912 I .ggpc.tauri_app: hiddenapi: Accessing hidden method Landroid/view/ViewGroup;->makeOptionalFitsSystemWindows()V (runtime_flags=0, domain=platform, api=unsupported) from Landroidx/appcompat/widget/ViewUtils; (domain=app, TargetSdkVersion=36) using reflection: allowed
05-02 11:57:01.403 22912 22973 I PowerHalWrapper: PowerHalWrapper.getInstance
05-02 11:57:01.406 22912 22912 I SurfaceFactory: [static] sSurfaceFactory = com.mediatek.view.impl.SurfaceFactoryImpl@b46dc19
05-02 11:57:01.409 22912 22912 E ZuiHandWritingManager: Constructor called
05-02 11:57:01.427 22912 22912 W HWUI    : Unknown dataspace 0
05-02 11:57:01.431 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:57:01.431 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:57:01.431 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:57:01.431 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:57:01.431 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:57:01.451 22912 22912 W WindowOnBackDispatcher: OnBackInvokedCallback is not enabled for the application.
05-02 11:57:01.451 22912 22912 W WindowOnBackDispatcher: Set 'android:enableOnBackInvokedCallback="true"' in the application manifest.
05-02 11:57:01.456 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.456 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:57:01.456 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.456 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.456 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.463 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.463 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:57:01.464 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.464 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.464 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.484 22912 22912 E FBI     : Can't load library: dlopen failed: library "libmagtsync.so" not found
05-02 11:57:01.504 22912 22974 I GrallocExtra: gralloc_extra_query:is_SW3D 0
05-02 11:57:01.525 22912 22974 I GrallocExtra: gralloc_extra_query:is_SW3D 0
05-02 11:57:01.552 22912 22912 I WebViewFactory: Loading com.google.android.webview version 147.0.7727.111 (code 772711103)
05-02 11:57:01.568 22912 22912 W .ggpc.tauri_app: Loading /data/app/~~8U45azXt3xzJ50AB8vUQlA==/com.google.android.webview-Xd4hXIdcgrIlOUD-WvfH8Q==/oat/arm64/base.odex non-executable as it requires an image which we failed to load
05-02 11:57:01.608 22912 22912 I cr_WVCFactoryProvider: version=147.0.7727.111 (772711103) minSdkVersion=29 multiprocess=true packageId=2 splits=<none>
05-02 11:57:01.634 22912 23003 I chromium: [0502/115701.633604:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:57:01.634 22912 22988 I RustStdoutStderr: [0502/115701.633604:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:57:01.635 22912 23003 I chromium: [0502/115701.635254:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:57:01.636 22912 22988 I RustStdoutStderr: [0502/115701.635254:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:57:01.646 22912 22912 I cr_LibraryLoader: Successfully loaded native library
05-02 11:57:01.648 22912 22912 I cr_CachingUmaRecorder: Flushed 22 samples from 21 histograms, 0 samples were dropped.
05-02 11:57:01.651 22912 22912 I cr_ChildProcLH: ScopedServiceBindingBatch.tryActivate: false
05-02 11:57:01.654 22912 22912 I cr_CombinedPProvider: #registerProvider() provider:WV.yk@84de333 isPolicyCacheEnabled:false policyProvidersSize:0
05-02 11:57:01.656 22912 22912 I cr_PolicyProvider: #setManagerAndSource() 0
05-02 11:57:01.666 22912 22912 I cr_DisplayManager: Is Display Topology available: false
05-02 11:57:01.709 22912 22912 I cr_CombinedPProvider: #linkNativeInternal() 1
05-02 11:57:01.710 22912 22912 I cr_AppResProvider: #getApplicationRestrictionsFromUserManager() Bundle[EMPTY_PARCEL]
05-02 11:57:01.711 22912 22912 I cr_PolicyProvider: #notifySettingsAvailable() 0       
05-02 11:57:01.711 22912 22912 I cr_CombinedPProvider: #onSettingsAvailable() 0        
05-02 11:57:01.711 22912 22912 I cr_CombinedPProvider: #flushPolicies()
05-02 11:57:01.736 22912 23019 W chromium: [WARNING:net/dns/dns_config_service_android.cc:69] Failed to read DnsConfig.
05-02 11:57:01.737 22912 22988 I RustStdoutStderr: [WARNING:net/dns/dns_config_service_android.cc:69] Failed to read DnsConfig.
05-02 11:57:01.747 22912 22912 W chromium: [WARNING:android_webview/browser/network_service/net_helpers.cc:137] HTTP Cache size is: 87352743
05-02 11:57:01.747 22912 22988 I RustStdoutStderr: [WARNING:android_webview/browser/network_service/net_helpers.cc:137] HTTP Cache size is: 87352743
05-02 11:57:01.884 22912 22988 I RustStdoutStderr: 
05-02 11:57:01.884 22912 22988 I RustStdoutStderr: thread '<unnamed>' (22989) panicked at src\lib.rs:41:56:
05-02 11:57:01.884 22912 22988 I RustStdoutStderr: Failed to initialize database: SqliteFailure(Error { code: Unknown, extended_code: 1 }, Some("duplicate column name: created_at"))
05-02 11:57:01.884 22912 22988 I RustStdoutStderr: note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
05-02 11:57:01.884 22912 22988 I RustStdoutStderr: attempt to unwind out of `rust` with err: Any { .. }
05-02 11:57:01.887 22912 23038 I CameraManagerGlobal: Connecting to camera service     
05-02 11:57:01.891 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.891 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:57:01.891 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.891 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.891 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.969 22912 23025 W cr_media: BLUETOOTH_CONNECT permission is missing.
05-02 11:57:01.971 22912 23025 W cr_media: getBluetoothAdapter() requires BLUETOOTH permission
05-02 11:57:01.971 22912 23025 W cr_media: registerBluetoothIntentsIfNeeded: Requires BLUETOOTH permission
05-02 11:57:01.992 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.992 22912 22912 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:57:01.993 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.993 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:01.993 22912 22912 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:57:02.209 22912 23034 W VideoCapabilities: Unrecognized profile/level 32768/256 for video/mp4v-es
05-02 11:57:02.211 22912 23034 W VideoCapabilities: Unrecognized profile/level 32768/256 for video/mp4v-es
05-02 11:57:02.339 22912 22988 I RustStdoutStderr: [0502/115702.338530:ERROR:third_party/crashpad/crashpad/snapshot/elf/elf_dynamic_array_reader.h:64] tag not found
--------- beginning of crash
05-02 11:57:02.457 22912 22989 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 22989 (.ggpc.tauri_app), pid 22912 (.ggpc.tauri_app)
05-02 11:57:02.882 22912 22923 I .ggpc.tauri_app: Compiler allocated 6896KB to compile void android.view.ViewRootImpl.performTraversals()
11:57:05 am [vite] (client) warning: Duplicate key "playlistTitle" in object literal
2338 |      videoCheckpoint,
2339 |      controllerCompactMode,
2340 |      playlistTitle,
     |      ^
2341 |      activePage
2342 |    };

  Plugin: vite:esbuild
  File: C:/Users/jodyn/Desktop/yttv april port/src/components/PlayerController.jsx     
Terminate batch job (Y/N)? 
PS C:\Users\jodyn\Desktop\yttv april port> ^C
PS C:\Users\jodyn\Desktop\yttv april port> npx tauri android dev
>>
        Info Using Android Studio's default Java installation: C:\Program Files\Android\Android Studio\jbr
        Info Using installed NDK: C:\Users\jodyn\AppData\Local\Android\Sdk\ndk\30.0.14904198
 (TB305FU) with target "aarch64-linux-android"U
        Info Using 192.168.1.103 to access the development server.
        Info Replacing devUrl host with 192.168.1.103. If your frontend is not listening on that address, try configuring your development server to use the `TAURI_DEV_HOST` environment variable or 0.0.0.0 as host.
     Running BeforeDevCommand (`npm run dev`)

> tauri-app@0.1.0 dev
> vite


  VITE v7.3.0  ready in 167 ms

  ➜  Network: http://192.168.1.103:1420/
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
warning: unused import: `AppHandle`
 --> src\commands.rs:6:13
  |
6 | use tauri::{AppHandle, Manager, State};
  |             ^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

warning: function `test_audio_command` is never used
   --> src\commands.rs:559:8
    |
559 | pub fn test_audio_command() -> String {
    |        ^^^^^^^^^^^^^^^^^^
    |
    = note: `#[warn(dead_code)]` (part of `#[warn(unused)]`) on by default

warning: function `start_audio_capture` is never used
   --> src\commands.rs:565:8
    |
565 | pub fn start_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^^

warning: function `stop_audio_capture` is never used
   --> src\commands.rs:571:8
    |
571 | pub fn stop_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^

warning: struct `CreatePlaylistRequest` is never constructed
  --> src\models.rs:39:12
   |
39 | pub struct CreatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `UpdatePlaylistRequest` is never constructed
  --> src\models.rs:45:12
   |
45 | pub struct UpdatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `AddVideoToPlaylistRequest` is never constructed
  --> src\models.rs:54:12
   |
54 | pub struct AddVideoToPlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `ReorderPlaylistItemRequest` is never constructed
  --> src\models.rs:66:12
   |
66 | pub struct ReorderPlaylistItemRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `VideoFolderAssignment` is never constructed
  --> src\models.rs:73:12
   |
73 | pub struct VideoFolderAssignment {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: method `get_file_registry` is never used
  --> src\streaming_server.rs:39:12
   |
31 | impl StreamingServer {
   | -------------------- method in this implementation
...
39 |     pub fn get_file_registry(&self) -> FileRegistry {
   |            ^^^^^^^^^^^^^^^^^

warning: `tauri-app` (lib) generated 10 warnings (run `cargo fix --lib -p tauri-app` to apply 1 suggestion)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.40s
        Info symlinking lib "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" in jniLibs dir "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a"   
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libandroid.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libdl.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "liblog.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libm.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libc.so"
        Info symlink at "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a\\libtauri_app_lib.so" points to "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so"

> tauri-app@0.1.0 tauri
> tauri android android-studio-script --target aarch64

<===========--> 85% EXECUTING [1s]
> :app:rustBuildArm64Debug                                            Info Using installed NDK: C:\Users\jodyn\AppData\Local\Android\Sdk\ndk\30.0.14904198
warning: tauri-app@0.1.0: Copied libmpv-2.dll to C:\Users\jodyn\Desktop\yttv april port\src-tauri\target\debug\libmpv-2.dll
warning: unused import: `AppHandle`
 --> src\commands.rs:6:13
  |
6 | use tauri::{AppHandle, Manager, State};
  |             ^^^^^^^^^
  |
  = note: `#[warn(unused_imports)]` (part of `#[warn(unused)]`) on by default

warning: function `test_audio_command` is never used
   --> src\commands.rs:559:8
    |
559 | pub fn test_audio_command() -> String {
    |        ^^^^^^^^^^^^^^^^^^
    |
    = note: `#[warn(dead_code)]` (part of `#[warn(unused)]`) on by default

warning: function `start_audio_capture` is never used
   --> src\commands.rs:565:8
    |
565 | pub fn start_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^^

warning: function `stop_audio_capture` is never used
   --> src\commands.rs:571:8
    |
571 | pub fn stop_audio_capture() -> Result<(), String> {
    |        ^^^^^^^^^^^^^^^^^^

warning: struct `CreatePlaylistRequest` is never constructed
  --> src\models.rs:39:12
   |
39 | pub struct CreatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `UpdatePlaylistRequest` is never constructed
  --> src\models.rs:45:12
   |
45 | pub struct UpdatePlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: struct `AddVideoToPlaylistRequest` is never constructed
  --> src\models.rs:54:12
   |
54 | pub struct AddVideoToPlaylistRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `ReorderPlaylistItemRequest` is never constructed
  --> src\models.rs:66:12
   |
66 | pub struct ReorderPlaylistItemRequest {
   |            ^^^^^^^^^^^^^^^^^^^^^^^^^^

warning: struct `VideoFolderAssignment` is never constructed
  --> src\models.rs:73:12
   |
73 | pub struct VideoFolderAssignment {
   |            ^^^^^^^^^^^^^^^^^^^^^

warning: method `get_file_registry` is never used
  --> src\streaming_server.rs:39:12
   |
31 | impl StreamingServer {
   | -------------------- method in this implementation
...
39 |     pub fn get_file_registry(&self) -> FileRegistry {
   |            ^^^^^^^^^^^^^^^^^

warning: `tauri-app` (lib) generated 10 warnings (run `cargo fix --lib -p tauri-app` to apply 1 suggestion)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.37s
        Info symlinking lib "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" in jniLibs dir "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\gen/android\\app/src/main/jniLibs/arm64-v8a"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libandroid.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libdl.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "liblog.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libm.so"
        Info "C:\\Users\\jodyn\\Desktop\\yttv april port\\src-tauri\\target\\aarch64-linux-android\\debug\\libtauri_app_lib.so" requires shared lib "libc.so"

[Incubating] Problems report is available at: file:///C:/Users/jodyn/Desktop/yttv%20april%20port/src-tauri/gen/android/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.14.3/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
Performing Streamed Install
Success
Starting: Intent { cmp=com.ggpc.tauri_app/.MainActivity }
        Info Watching C:\Users\jodyn\Desktop\yttv april port\src-tauri for changes...
--------- beginning of main
05-02 11:58:26.002 23514 23514 I .ggpc.tauri_app: Late-enabling -Xcheck:jni
05-02 11:58:26.055 23514 23514 I .ggpc.tauri_app: Using CollectorTypeCMC GC.
05-02 11:58:26.509 23514 23514 I LoadedApk: No resource references to update in package com.zuisdk
05-02 11:58:26.779 23514 23514 I PowerHalWrapper: PowerHalWrapper.getInstance 
05-02 11:58:26.779 23514 23514 I M-ProMotion: M-ProMotion is disabled
--------- beginning of system
05-02 11:58:27.090 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.091 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.092 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.092 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.092 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.093 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.093 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.093 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.093 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.093 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.094 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.094 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:58:27.095 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.095 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.095 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.107 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:58:27.107 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:58:27.107 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:58:27.107 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.107 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.108 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:58:27.108 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=ffffffff 
05-02 11:58:27.108 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 512 for com.ggpc.tauri_app
05-02 11:58:27.108 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.108 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.111 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.111 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.111 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.111 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 0 for com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.112 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.161 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:58:27.161 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.161 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:58:27.161 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.161 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.182 23514 23514 I .ggpc.tauri_app: hiddenapi: Accessing hidden method Landroid/view/ViewGroup;->makeOptionalFitsSystemWindows()V (runtime_flags=0, domain=platform, api=unsupported) from Landroidx/appcompat/widget/ViewUtils; (domain=app, TargetSdkVersion=36) using reflection: allowed
05-02 11:58:27.191 23514 23593 I PowerHalWrapper: PowerHalWrapper.getInstance
05-02 11:58:27.194 23514 23514 I SurfaceFactory: [static] sSurfaceFactory = com.mediatek.view.impl.SurfaceFactoryImpl@b46dc19
05-02 11:58:27.196 23514 23514 E ZuiHandWritingManager: Constructor called
05-02 11:58:27.212 23514 23514 W HWUI    : Unknown dataspace 0
05-02 11:58:27.217 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:58:27.217 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app,return window.mNavigationBarColor=0        
05-02 11:58:27.218 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app
05-02 11:58:27.218 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app
05-02 11:58:27.218 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app
05-02 11:58:27.241 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.241 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:58:27.241 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.241 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.241 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.248 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.249 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:58:27.249 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.249 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.249 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.267 23514 23514 E FBI     : Can't load library: dlopen failed: library "libmagtsync.so" not found
05-02 11:58:27.287 23514 23594 I GrallocExtra: gralloc_extra_query:is_SW3D 0
05-02 11:58:27.308 23514 23594 I GrallocExtra: gralloc_extra_query:is_SW3D 0
05-02 11:58:27.313 23514 23514 W WindowOnBackDispatcher: OnBackInvokedCallback is not enabled for the application.
05-02 11:58:27.313 23514 23514 W WindowOnBackDispatcher: Set 'android:enableOnBackInvokedCallback="true"' in the application manifest.
05-02 11:58:27.341 23514 23514 I WebViewFactory: Loading com.google.android.webview version 147.0.7727.111 (code 772711103)
05-02 11:58:27.358 23514 23514 W .ggpc.tauri_app: Loading /data/app/~~8U45azXt3xzJ50AB8vUQlA==/com.google.android.webview-Xd4hXIdcgrIlOUD-WvfH8Q==/oat/arm64/base.odex non-executable as it requires an image which we failed to load
05-02 11:58:27.393 23514 23514 I cr_WVCFactoryProvider: version=147.0.7727.111 (772711103) minSdkVersion=29 multiprocess=true packageId=2 splits=<none>
05-02 11:58:27.436 23514 23689 I chromium: [0502/115827.436256:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:58:27.437 23514 23651 I RustStdoutStderr: [0502/115827.436256:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:58:27.437 23514 23689 I chromium: [0502/115827.437286:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:58:27.437 23514 23651 I RustStdoutStderr: [0502/115827.437286:INFO:android_webview/browser/variations/variations_seed_loader.cc:67] Failed to open file for reading.: No such file or directory (2)
05-02 11:58:27.449 23514 23514 I cr_LibraryLoader: Successfully loaded native library
05-02 11:58:27.450 23514 23514 I cr_CachingUmaRecorder: Flushed 22 samples from 21 histograms, 0 samples were dropped.
05-02 11:58:27.453 23514 23514 I cr_ChildProcLH: ScopedServiceBindingBatch.tryActivate: false
05-02 11:58:27.456 23514 23514 I cr_CombinedPProvider: #registerProvider() provider:WV.yk@84de333 isPolicyCacheEnabled:false policyProvidersSize:0
05-02 11:58:27.457 23514 23514 I cr_PolicyProvider: #setManagerAndSource() 0
05-02 11:58:27.466 23514 23514 I cr_DisplayManager: Is Display Topology available: false
05-02 11:58:27.499 23514 23514 I cr_CombinedPProvider: #linkNativeInternal() 1
05-02 11:58:27.501 23514 23514 I cr_AppResProvider: #getApplicationRestrictionsFromUserManager() Bundle[EMPTY_PARCEL]
05-02 11:58:27.501 23514 23514 I cr_PolicyProvider: #notifySettingsAvailable() 0       
05-02 11:58:27.501 23514 23514 I cr_CombinedPProvider: #onSettingsAvailable() 0        
05-02 11:58:27.501 23514 23514 I cr_CombinedPProvider: #flushPolicies()
05-02 11:58:27.530 23514 23712 W chromium: [WARNING:net/dns/dns_config_service_android.cc:69] Failed to read DnsConfig.
05-02 11:58:27.531 23514 23651 I RustStdoutStderr: [WARNING:net/dns/dns_config_service_android.cc:69] Failed to read DnsConfig.
05-02 11:58:27.540 23514 23514 W chromium: [WARNING:android_webview/browser/network_service/net_helpers.cc:137] HTTP Cache size is: 87352743
05-02 11:58:27.540 23514 23651 I RustStdoutStderr: [WARNING:android_webview/browser/network_service/net_helpers.cc:137] HTTP Cache size is: 87352743
05-02 11:58:27.660 23514 23651 I RustStdoutStderr: 
05-02 11:58:27.660 23514 23651 I RustStdoutStderr: thread '<unnamed>' (23652) panicked at src\lib.rs:41:56:
05-02 11:58:27.660 23514 23651 I RustStdoutStderr: Failed to initialize database: SqliteFailure(Error { code: Unknown, extended_code: 1 }, Some("duplicate column name: created_at"))
05-02 11:58:27.660 23514 23651 I RustStdoutStderr: note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
05-02 11:58:27.662 23514 23651 I RustStdoutStderr: attempt to unwind out of `rust` with err: Any { .. }
05-02 11:58:27.678 23514 23726 I CameraManagerGlobal: Connecting to camera service     
05-02 11:58:27.679 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.679 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:58:27.680 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.680 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.680 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.748 23514 23711 W cr_media: BLUETOOTH_CONNECT permission is missing.
05-02 11:58:27.750 23514 23711 W cr_media: getBluetoothAdapter() requires BLUETOOTH permission
05-02 11:58:27.750 23514 23711 W cr_media: registerBluetoothIntentsIfNeeded: Requires BLUETOOTH permission
05-02 11:58:27.781 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.783 23514 23514 I DecorViewDelegate: getWindowNavigationBarColor: window has mEdgeToEdgeEnforced com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity,return window.mNavigationBarColor=0
05-02 11:58:27.783 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: appearance is 24 for com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.785 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: legacyPolicy is false, com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.786 23514 23514 I DecorViewDelegate: getWindowStatusBarColor: window has TRANSPARENT com.ggpc.tauri_app/com.ggpc.tauri_app.MainActivity
05-02 11:58:27.979 23514 23720 W VideoCapabilities: Unrecognized profile/level 32768/256 for video/mp4v-es
05-02 11:58:27.982 23514 23720 W VideoCapabilities: Unrecognized profile/level 32768/256 for video/mp4v-es
05-02 11:58:28.146 23514 23651 I RustStdoutStderr: [0502/115828.145345:ERROR:third_party/crashpad/crashpad/snapshot/elf/elf_dynamic_array_reader.h:64] tag not found
--------- beginning of crash
05-02 11:58:28.267 23514 23652 F libc    : Fatal signal 6 (SIGABRT), code -1 (SI_QUEUE) in tid 23652 (.ggpc.tauri_app), pid 23514 (.ggpc.tauri_app)
11:58:28 am [vite] (client) warning: Duplicate key "playlistTitle" in object literal
2338 |      videoCheckpoint,
2339 |      controllerCompactMode,
2340 |      playlistTitle,
     |      ^
2341 |      activePage
2342 |    };

  Plugin: vite:esbuild
  File: C:/Users/jodyn/Desktop/yttv april port/src/components/PlayerController.jsx     
05-02 11:58:28.625 23514 23524 I .ggpc.tauri_app: Compiler allocated 6896KB to compile void android.view.ViewRootImpl.performTraversals()
