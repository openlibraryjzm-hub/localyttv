using System.Text.Json;
using System.Net;
using Yttv.ViewModels;

namespace Yttv.Components;

public partial class YouTubePlayerView : ContentView
{
    public static readonly BindableProperty VideoIdProperty =
        BindableProperty.Create(nameof(VideoId), typeof(string), typeof(YouTubePlayerView), string.Empty, propertyChanged: OnVideoIdChanged);

    public string VideoId
    {
        get => (string)GetValue(VideoIdProperty);
        set => SetValue(VideoIdProperty, value);
    }

    private static void OnVideoIdChanged(BindableObject bindable, object oldValue, object newValue)
    {
        var view = (YouTubePlayerView)bindable;
        var newId = (string)newValue;
        if (!string.IsNullOrEmpty(newId))
        {
            view.LoadVideo(newId);
        }
    }

	public YouTubePlayerView()
	{
		InitializeComponent();
	}

	private void OnWebViewNavigating(object sender, WebNavigatingEventArgs e)
	{
		if (e.Url.StartsWith("maui-bridge://"))
		{
			e.Cancel = true; // Don't actually navigate
			var json = WebUtility.UrlDecode(e.Url.Substring("maui-bridge://".Length));
			HandleBridgeMessage(json);
		}
	}

	private void HandleBridgeMessage(string json)
	{
		try
		{
			using var doc = JsonDocument.Parse(json);
			var type = doc.RootElement.GetProperty("type").GetString();
			var payload = doc.RootElement.GetProperty("payload");

			var viewModel = BindingContext as MainViewModel;
			if (viewModel == null) return;

			switch (type)
			{
				case "READY":
					// Initialized
					break;
				case "STATE_CHANGE":
					int state = payload.GetProperty("state").GetInt32();
					if (state == 0) // Ended
					{
						viewModel.Playlist.NextVideoCommand.Execute(null);
					}
					break;
				case "TIME_UPDATE":
					double currentTime = payload.GetProperty("currentTime").GetDouble();
					double duration = payload.GetProperty("duration").GetDouble();
					// Could update progress here
					break;
				case "ERROR":
					int code = payload.GetProperty("code").GetInt32();
					// Handle error
					break;
			}
		}
		catch (Exception ex)
		{
			System.Diagnostics.Debug.WriteLine($"Bridge Error: {ex.Message}");
		}
	}

	public void LoadVideo(string videoId)
	{
        if (string.IsNullOrEmpty(videoId) || PlayerWebView == null) return;
		PlayerWebView.Eval($"loadVideo('{videoId}')");
	}

	public void SeekTo(double seconds)
	{
		PlayerWebView.Eval($"seekTo({seconds})");
	}
}
