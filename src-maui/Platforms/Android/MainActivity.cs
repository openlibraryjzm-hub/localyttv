using Android.App;
using Android.Content.PM;
using Android.OS;
using AndroidX.Core.View;
using System;

namespace Yttv
{
    [Activity(Theme = "@style/Maui.SplashTheme", MainLauncher = true, ConfigurationChanges = ConfigChanges.ScreenSize | ConfigChanges.Orientation | ConfigChanges.UiMode | ConfigChanges.ScreenLayout | ConfigChanges.SmallestScreenSize | ConfigChanges.Density, ScreenOrientation = ScreenOrientation.Landscape)]
    public class MainActivity : MauiAppCompatActivity
    {
        protected override void OnCreate(Bundle? savedInstanceState)
        {
            try 
            {
                System.Console.WriteLine("YTTV_LOG: MainActivity OnCreate BEFORE base.OnCreate");
                base.OnCreate(savedInstanceState);
                System.Console.WriteLine("YTTV_LOG: MainActivity OnCreate AFTER base.OnCreate");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"YTTV_LOG: Startup Crash: {ex}");
            }
        }
    }
}
