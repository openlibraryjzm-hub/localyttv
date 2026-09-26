using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Text.Json;
using System.Windows.Threading;
using System.Numerics;
using NAudio.Wave;

namespace YTTV
{
    public class AudioVisualizerService : IDisposable
    {
        private readonly Microsoft.Web.WebView2.Wpf.WebView2 _webView;
        private WasapiLoopbackCapture? _capture;
        private DispatcherTimer? _timer;
        private readonly List<float> _sampleBuffer = new();
        private readonly object _lock = new();
        private double _sampleRate = 48000.0; // default fallback

        public AudioVisualizerService(Microsoft.Web.WebView2.Wpf.WebView2 webView)
        {
            _webView = webView;
        }

        public void Start()
        {
            lock (_lock)
            {
                if (_capture != null) return; // Already running

                try
                {
                    // WasapiLoopbackCapture captures default playback device output (system-wide loopback)
                    _capture = new WasapiLoopbackCapture();
                    _sampleRate = _capture.WaveFormat.SampleRate;
                    _capture.DataAvailable += OnAudioDataAvailable;
                    _capture.StartRecording();

                    // 60Hz processing timer (16ms)
                    _timer = new DispatcherTimer(DispatcherPriority.Render);
                    _timer.Interval = TimeSpan.FromMilliseconds(16);
                    _timer.Tick += OnProcessTimerTick;
                    _timer.Start();

                    Console.WriteLine($"[WPF AudioVisualizer] WASAPI Loopback Capture started at {_sampleRate}Hz ({_capture.WaveFormat.Channels} channels)");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WPF AudioVisualizer] Failed to start audio capture: {ex.Message}");
                    Stop();
                }
            }
        }

        public void Stop()
        {
            lock (_lock)
            {
                if (_timer != null)
                {
                    _timer.Stop();
                    _timer.Tick -= OnProcessTimerTick;
                    _timer = null;
                }

                if (_capture != null)
                {
                    try
                    {
                        _capture.StopRecording();
                        _capture.DataAvailable -= OnAudioDataAvailable;
                        _capture.Dispose();
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine($"Error stopping audio recording: {ex.Message}");
                    }
                    _capture = null;
                }

                _sampleBuffer.Clear();
                Console.WriteLine("[WPF AudioVisualizer] WASAPI Loopback Capture stopped");
            }
        }

        private void OnAudioDataAvailable(object? sender, WaveInEventArgs e)
        {
            if (e.BytesRecorded == 0) return;

            // WASAPI Float PCM format is standard IEEE 32-bit floats
            int channels = _capture?.WaveFormat.Channels ?? 2;
            int floatCount = e.BytesRecorded / 4;
            float[] floatBuffer = new float[floatCount];
            Buffer.BlockCopy(e.Buffer, 0, floatBuffer, 0, e.BytesRecorded);

            // Convert to mono by averaging channels
            int monoLength = floatCount / channels;
            float[] monoSamples = new float[monoLength];

            for (int i = 0; i < monoLength; i++)
            {
                float sum = 0f;
                for (int c = 0; c < channels; c++)
                {
                    sum += floatBuffer[i * channels + c];
                }
                monoSamples[i] = sum / channels;
            }

            // Zero-latency buffer strategy: keep only the latest 1024 samples
            lock (_lock)
            {
                _sampleBuffer.AddRange(monoSamples);
                if (_sampleBuffer.Count > 1024)
                {
                    _sampleBuffer.RemoveRange(0, _sampleBuffer.Count - 1024);
                }
            }
        }

        private void OnProcessTimerTick(object? sender, EventArgs e)
        {
            float[] latestSamples;
            lock (_lock)
            {
                if (_sampleBuffer.Count < 1024) return;
                latestSamples = _sampleBuffer.ToArray(); // Exactly 1024 elements
            }

            // Apply Hanning Window to reduce spectral leakage
            double[] windowed = new double[1024];
            for (int i = 0; i < 1024; i++)
            {
                double window = 0.5 * (1.0 - Math.Cos(2.0 * Math.PI * i / (1024 - 1)));
                windowed[i] = latestSamples[i] * window;
            }

            // Perform FFT (Mono output represents half of FFT size = 512 magnitudes)
            double[] magnitudes = SimpleFft.Compute(windowed);

            // Map magnitudes to 113 logarithmic visualizer bins
            int[] bins = MapToBars(magnitudes, _sampleRate);

            // Emit to React Frontend
            EmitAudioBins(bins);
        }

        private int[] MapToBars(double[] magnitudes, double sampleRate)
        {
            int barCount = 113;
            double freqMin = 60.0;
            double freqMax = 11000.0;
            int[] bars = new int[barCount];
            double nyquist = sampleRate / 2.0;
            int binCount = magnitudes.Length;
            double freqPerBin = nyquist / binCount;

            for (int i = 0; i < barCount; i++)
            {
                double logMin = Math.Pow(freqMax / freqMin, (double)i / barCount);
                double logMax = Math.Pow(freqMax / freqMin, (double)(i + 1) / barCount);

                double barFreqMin = freqMin * logMin;
                double barFreqMax = freqMin * logMax;

                int startBin = (int)Math.Floor(barFreqMin / freqPerBin);
                int endBin = (int)Math.Ceiling(barFreqMax / freqPerBin);

                double sum = 0.0;
                int count = 0;

                int safeEnd = Math.Min(endBin, binCount);
                int safeStart = Math.Min(startBin, Math.Max(0, safeEnd - 1));

                for (int bin = safeStart; bin < safeEnd; bin++)
                {
                    sum += magnitudes[bin];
                    count++;
                }

                if (count > 0)
                {
                    double x = (double)i / barCount;
                    double eqFactor = 0.35 + 2.15 * Math.Pow(x, 1.5);
                    // Match Rust scaling logic: Magnitudes * 100 * Equalization curve factor, clamped to 0..255
                    bars[i] = (int)Math.Min(255.0, (sum / count) * 100.0 * eqFactor);
                }
                else
                {
                    bars[i] = 0;
                }
            }

            return bars;
        }

        private void EmitAudioBins(int[] bins)
        {
            try
            {
                var response = new
                {
                    type = "audio-bins",
                    payload = bins
                };
                string json = JsonSerializer.Serialize(response);
                _webView.CoreWebView2.PostWebMessageAsJson(json);
            }
            catch
            {
                // Silence exception if webview is closed/disposed rapidly
            }
        }

        public void Dispose()
        {
            Stop();
        }
    }

    /// <summary>
    /// Cooley-Tukey Radix-2 FFT Helper
    /// </summary>
    public static class SimpleFft
    {
        public static double[] Compute(double[] input)
        {
            int n = input.Length; // Expect 1024
            Complex[] cInput = new Complex[n];
            for (int i = 0; i < n; i++)
            {
                cInput[i] = new Complex(input[i], 0);
            }

            FftRecursive(cInput);

            // Return first half (magnitudes)
            double[] magnitudes = new double[n / 2];
            for (int i = 0; i < n / 2; i++)
            {
                magnitudes[i] = cInput[i].Magnitude;
            }
            return magnitudes;
        }

        private static void FftRecursive(Complex[] buffer)
        {
            int n = buffer.Length;
            if (n <= 1) return;

            // Divide even and odd indices
            Complex[] even = new Complex[n / 2];
            Complex[] odd = new Complex[n / 2];
            for (int i = 0; i < n / 2; i++)
            {
                even[i] = buffer[2 * i];
                odd[i] = buffer[2 * i + 1];
            }

            // Conquer
            FftRecursive(even);
            FftRecursive(odd);

            // Combine
            for (int k = 0; k < n / 2; k++)
            {
                double angle = -2 * Math.PI * k / n;
                Complex t = Complex.FromPolarCoordinates(1, angle) * odd[k];
                buffer[k] = even[k] + t;
                buffer[k + n / 2] = even[k] - t;
            }
        }
    }
}
