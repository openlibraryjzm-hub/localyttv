using System.Net.Http.Json;
using System.Text.Json;
using Yttv.Models;

namespace Yttv.Services
{
    public class YouTubeApiService
    {
        private readonly HttpClient _httpClient;
        private string? _apiKey;

        public YouTubeApiService()
        {
            _httpClient = new HttpClient();
        }

        public void SetApiKey(string apiKey)
        {
            _apiKey = apiKey;
        }

        public async Task<List<PlaylistItem>> FetchPlaylistItemsAsync(string playlistId)
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new InvalidOperationException("YouTube API Key not set.");

            var items = new List<PlaylistItem>();
            string? nextPageToken = null;

            do
            {
                var url = $"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId={playlistId}&key={_apiKey}";
                if (nextPageToken != null)
                    url += $"&pageToken={nextPageToken}";

                var response = await _httpClient.GetFromJsonAsync<JsonElement>(url);
                
                if (response.TryGetProperty("items", out var jsonItems))
                {
                    foreach (var jsonItem in jsonItems.EnumerateArray())
                    {
                        var snippet = jsonItem.GetProperty("snippet");
                        var contentDetails = jsonItem.GetProperty("contentDetails");
                        var videoId = contentDetails.GetProperty("videoId").GetString() ?? "";

                        items.Add(new PlaylistItem
                        {
                            VideoId = videoId,
                            VideoUrl = $"https://www.youtube.com/watch?v={videoId}",
                            Title = snippet.GetProperty("title").GetString(),
                            ThumbnailUrl = snippet.GetProperty("thumbnails").TryGetProperty("high", out var high) 
                                ? high.GetProperty("url").GetString() 
                                : snippet.GetProperty("thumbnails").GetProperty("default").GetProperty("url").GetString(),
                            Author = snippet.GetProperty("videoOwnerChannelTitle").GetString() ?? snippet.GetProperty("channelTitle").GetString(),
                            Position = items.Count,
                            AddedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                        });
                    }
                }

                nextPageToken = response.TryGetProperty("nextPageToken", out var token) ? token.GetString() : null;

            } while (nextPageToken != null);

            return items;
        }

        public async Task<PlaylistItem?> FetchVideoMetadataAsync(string videoId)
        {
            if (string.IsNullOrEmpty(_apiKey))
                throw new InvalidOperationException("YouTube API Key not set.");

            var url = $"https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id={videoId}&key={_apiKey}";
            var response = await _httpClient.GetFromJsonAsync<JsonElement>(url);

            if (response.TryGetProperty("items", out var jsonItems) && jsonItems.GetArrayLength() > 0)
            {
                var jsonItem = jsonItems[0];
                var snippet = jsonItem.GetProperty("snippet");
                var statistics = jsonItem.GetProperty("statistics");

                return new PlaylistItem
                {
                    VideoId = videoId,
                    VideoUrl = $"https://www.youtube.com/watch?v={videoId}",
                    Title = snippet.GetProperty("title").GetString(),
                    ThumbnailUrl = snippet.GetProperty("thumbnails").TryGetProperty("high", out var high)
                        ? high.GetProperty("url").GetString()
                        : snippet.GetProperty("thumbnails").GetProperty("default").GetProperty("url").GetString(),
                    Author = snippet.GetProperty("channelTitle").GetString(),
                    ViewCount = statistics.TryGetProperty("viewCount", out var views) ? views.GetString() : "0",
                    Description = snippet.GetProperty("description").GetString(),
                    AddedAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                };
            }

            return null;
        }
    }
}
