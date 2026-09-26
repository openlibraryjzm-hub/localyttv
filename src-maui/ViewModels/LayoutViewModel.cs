using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Yttv.ViewModels
{
    public partial class LayoutViewModel : ObservableObject
    {
        [ObservableProperty]
        private string _viewMode = "half"; // "full" or "half"

        [ObservableProperty]
        private double _splitScreenRatio = 0.5;

        [RelayCommand]
        private void ToggleViewMode()
        {
            ViewMode = ViewMode == "full" ? "half" : "full";
        }

        public void SetViewMode(string mode)
        {
            ViewMode = mode;
        }
    }
}
