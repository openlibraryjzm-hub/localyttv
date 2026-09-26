using Microsoft.Extensions.Logging;
using Yttv.Services;
using Yttv.ViewModels;

namespace Yttv;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

        // ViewModels (Minimal)
        builder.Services.AddSingleton<MainViewModel>(sp => 
            new MainViewModel(null!, null!));

        // Pages
        builder.Services.AddSingleton<MainPage>();

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}
}
