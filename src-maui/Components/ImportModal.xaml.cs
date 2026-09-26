using Yttv.ViewModels;

namespace Yttv.Components;

public partial class ImportModal : ContentView
{
	public ImportModal()
	{
		InitializeComponent();
	}

	private void OnCancelClicked(object sender, EventArgs e)
	{
		var viewModel = BindingContext as MainViewModel;
		if (viewModel != null)
		{
			viewModel.IsImportModalVisible = false;
		}
	}

	private void OnImportClicked(object sender, EventArgs e)
	{
		var viewModel = BindingContext as MainViewModel;
		if (viewModel != null)
		{
			var name = PlaylistNameEntry.Text;
			var url = PlaylistUrlEntry.Text;
			
			viewModel.Playlist.ImportPlaylistCommand.Execute(new object[] { name, url });
            
            // Clear entries
            PlaylistNameEntry.Text = string.Empty;
            PlaylistUrlEntry.Text = string.Empty;
		}
	}
}
