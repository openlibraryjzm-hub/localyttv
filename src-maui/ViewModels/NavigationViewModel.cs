using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.Generic;

namespace Yttv.ViewModels
{
    public partial class NavigationViewModel : ObservableObject
    {
        [ObservableProperty]
        private string _currentPage = "playlists"; // "playlists", "videos"

        private Stack<string> _history = new Stack<string>();

        [RelayCommand]
        public void SetCurrentPage(string page)
        {
            if (CurrentPage != page)
            {
                _history.Push(CurrentPage);
                CurrentPage = page;
            }
        }

        [RelayCommand]
        public void GoBack()
        {
            if (_history.Count > 0)
            {
                CurrentPage = _history.Pop();
            }
        }
    }
}
