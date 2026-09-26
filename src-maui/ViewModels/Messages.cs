using CommunityToolkit.Mvvm.Messaging.Messages;

namespace Yttv.ViewModels
{
    public class NavigationMessage : ValueChangedMessage<string>
    {
        public NavigationMessage(string value) : base(value)
        {
        }
    }

    public class RefreshPlaylistsMessage : ValueChangedMessage<bool>
    {
        public RefreshPlaylistsMessage(bool value) : base(value)
        {
        }
    }
}
