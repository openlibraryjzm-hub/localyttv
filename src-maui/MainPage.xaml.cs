using Yttv.ViewModels;

namespace Yttv;

public partial class MainPage : ContentPage
{
	private readonly MainViewModel _viewModel;

	public MainPage(MainViewModel viewModel)
	{
		InitializeComponent();
		_viewModel = viewModel;
		BindingContext = viewModel;
	}

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // Disabling for minimal boot
    }
}

