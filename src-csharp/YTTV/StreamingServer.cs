using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace YTTV
{
    public class StreamingServer : IDisposable
    {
        private readonly HttpListener _listener;
        private readonly int _port;
        private readonly ConcurrentDictionary<string, string> _fileRegistry;
        private bool _isRunning;

        public StreamingServer(int port)
        {
            _port = port;
            _fileRegistry = new ConcurrentDictionary<string, string>();
            _listener = new HttpListener();
            _listener.Prefixes.Add($"http://127.0.0.1:{_port}/");
        }

        public void Start()
        {
            if (_isRunning) return;
            _isRunning = true;
            _listener.Start();
            Console.WriteLine($"[StreamingServer] Started listening on http://127.0.0.1:{_port}/");
            
            Task.Run(ListenLoop);
        }

        public string RegisterFile(string filePath)
        {
            using (var md5 = MD5.Create())
            {
                byte[] hashBytes = md5.ComputeHash(Encoding.UTF8.GetBytes(filePath));
                string fileId = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
                _fileRegistry[fileId] = filePath;
                return fileId;
            }
        }

        public string GetStreamUrl(string filePath)
        {
            string fileId = RegisterFile(filePath);
            return $"http://127.0.0.1:{_port}/stream/{fileId}";
        }

        private async Task ListenLoop()
        {
            while (_isRunning && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = await _listener.GetContextAsync();
                    _ = Task.Run(() => HandleRequestAsync(context));
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[StreamingServer] Error in listen loop: {ex.Message}");
                }
            }
        }

        private async Task HandleRequestAsync(HttpListenerContext context)
        {
            HttpListenerRequest request = context.Request;
            HttpListenerResponse response = context.Response;

            try
            {
                string path = request.Url?.AbsolutePath ?? "";
                if (!path.StartsWith("/stream/"))
                {
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Close();
                    return;
                }

                string fileId = path.Substring("/stream/".Length);
                if (!_fileRegistry.TryGetValue(fileId, out string? filePath) || !File.Exists(filePath))
                {
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Close();
                    return;
                }

                response.Headers.Add("Access-Control-Allow-Origin", "*");
                response.Headers.Add("Access-Control-Allow-Headers", "*");
                response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");

                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = (int)HttpStatusCode.OK;
                    response.Close();
                    return;
                }

                if (request.HttpMethod != "GET")
                {
                    response.StatusCode = (int)HttpStatusCode.MethodNotAllowed;
                    response.Close();
                    return;
                }

                await StreamFileAsync(filePath, request, response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[StreamingServer] Error handling request: {ex.Message}");
                try
                {
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Close();
                }
                catch { }
            }
        }

        private async Task StreamFileAsync(string filePath, HttpListenerRequest request, HttpListenerResponse response)
        {
            FileInfo fileInfo = new FileInfo(filePath);
            long totalLength = fileInfo.Length;
            string mimeType = GetMimeType(filePath);

            response.ContentType = mimeType;
            response.Headers.Add("Accept-Ranges", "bytes");

            string? rangeHeader = request.Headers["Range"];
            if (string.IsNullOrEmpty(rangeHeader))
            {
                response.StatusCode = (int)HttpStatusCode.OK;
                response.ContentLength64 = totalLength;

                using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true))
                {
                    await fs.CopyToAsync(response.OutputStream);
                }
            }
            else
            {
                long start = 0;
                long end = totalLength - 1;

                string rangeSpec = rangeHeader.Replace("bytes=", "").Trim();
                string[] parts = rangeSpec.Split('-');

                if (parts.Length > 0 && long.TryParse(parts[0], out long parsedStart))
                {
                    start = parsedStart;
                }
                if (parts.Length > 1 && !string.IsNullOrEmpty(parts[1]) && long.TryParse(parts[1], out long parsedEnd))
                {
                    end = parsedEnd;
                }

                if (start >= totalLength || end >= totalLength || start > end)
                {
                    response.StatusCode = (int)HttpStatusCode.RequestedRangeNotSatisfiable;
                    response.Headers.Add("Content-Range", $"bytes */{totalLength}");
                    response.Close();
                    return;
                }

                long count = (end - start) + 1;
                response.StatusCode = (int)HttpStatusCode.PartialContent;
                response.Headers.Add("Content-Range", $"bytes {start}-{end}/{totalLength}");
                response.ContentLength64 = count;

                using (FileStream fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, true))
                {
                    fs.Seek(start, SeekOrigin.Begin);
                    byte[] buffer = new byte[8192];
                    long remaining = count;
                    while (remaining > 0)
                    {
                        int bytesToRead = (int)Math.Min(buffer.Length, remaining);
                        int read = await fs.ReadAsync(buffer, 0, bytesToRead);
                        if (read <= 0) break;
                        await response.OutputStream.WriteAsync(buffer, 0, read);
                        remaining -= read;
                    }
                }
            }

            response.OutputStream.Close();
        }

        private string GetMimeType(string filePath)
        {
            string ext = Path.GetExtension(filePath).ToLower();
            switch (ext)
            {
                case ".mp4": return "video/mp4";
                case ".mkv": return "video/x-matroska";
                case ".webm": return "video/webm";
                case ".ogg": return "video/ogg";
                case ".mov": return "video/quicktime";
                case ".avi": return "video/x-msvideo";
                case ".wmv": return "video/x-ms-wmv";
                
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".webp": return "image/webp";
                case ".svg": return "image/svg+xml";
                case ".bmp": return "image/bmp";
                
                default: return "application/octet-stream";
            }
        }

        public void Dispose()
        {
            _isRunning = false;
            if (_listener.IsListening)
            {
                _listener.Stop();
            }
            _listener.Close();
        }
    }
}
