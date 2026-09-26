using CommunityToolkit.Mvvm.ComponentModel;

namespace Yttv.ViewModels
{
    public partial class ConfigViewModel : ObservableObject
    {
        [ObservableProperty]
        private double _orbSize = 80;

        [ObservableProperty]
        private double _menuWidth = 300;

        [ObservableProperty]
        private double _menuHeight = 200;

        [ObservableProperty]
        private double _orbMenuGap = 20;

        [ObservableProperty]
        private string _youtubeApiKey = string.Empty;
    }
}
