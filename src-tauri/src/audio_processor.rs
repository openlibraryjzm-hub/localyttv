use realfft::{RealFftPlanner, RealToComplex};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub struct AudioProcessor {
    fft_size: usize,
    bar_count: usize,
    sample_rate: f32,
    freq_min: f32,
    freq_max: f32,
    buffer: Vec<f32>,
    plan: Arc<dyn RealToComplex<f32>>,
    last_emit: Instant,
}

impl AudioProcessor {
    pub fn new(fft_size: usize, bar_count: usize, sample_rate: f32, freq_min: f32, freq_max: f32) -> Self {
        let mut planner = RealFftPlanner::<f32>::new();
        let plan = planner.plan_fft_forward(fft_size);
        Self {
            fft_size,
            bar_count,
            sample_rate,
            freq_min,
            freq_max,
            buffer: Vec::with_capacity(fft_size * 2),
            plan,
            last_emit: Instant::now(),
        }
    }

    pub fn process_samples(&mut self, samples: &[f32], app: &AppHandle) {
        // Add new samples to buffer
        self.buffer.extend_from_slice(samples);

        // ZERO LATENCY: Always trim the buffer to keep only the LATEST fft_size samples.
        // This prevents any "conveyor belt" backlog from forming.
        if self.buffer.len() > self.fft_size {
            let drain_amount = self.buffer.len() - self.fft_size;
            self.buffer.drain(0..drain_amount);
        }

        // Only process and emit if it's time for an update (60Hz = 16ms)
        if self.buffer.len() >= self.fft_size && self.last_emit.elapsed() >= Duration::from_millis(16) {
            self.last_emit = Instant::now();
            
            // Take the latest fft_size samples (which is the entire buffer now)
            let input_slice = &self.buffer[..self.fft_size];

            // Apply Hanning window
            let mut windowed = vec![0.0f32; self.fft_size];
            for i in 0..self.fft_size {
                let window = 0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / (self.fft_size - 1) as f32).cos());
                windowed[i] = input_slice[i] * window;
            }

            // Compute FFT
            let mut output = self.plan.make_output_vec();
            if let Ok(_) = self.plan.process(&mut windowed, &mut output) {
                // Get magnitudes
                let mut magnitudes = Vec::with_capacity(self.fft_size / 2);
                for complex in output.iter().take(self.fft_size / 2) {
                    let mag = (complex.re * complex.re + complex.im * complex.im).sqrt();
                    magnitudes.push(mag);
                }

                // Map to bars (Logarithmic)
                let bins = self.map_to_bars(&magnitudes);

                // Emit processed bins
                let _ = app.emit("audio-bins", bins);
            }
        }
    }

    fn map_to_bars(&self, magnitudes: &[f32]) -> Vec<u8> {
        let mut bars = Vec::with_capacity(self.bar_count);
        let nyquist = self.sample_rate / 2.0;
        let bin_count = magnitudes.len();
        let freq_per_bin = nyquist / bin_count as f32;

        for i in 0..self.bar_count {
            let log_min = (self.freq_max / self.freq_min).powf(i as f32 / self.bar_count as f32);
            let log_max = (self.freq_max / self.freq_min).powf((i + 1) as f32 / self.bar_count as f32);

            let bar_freq_min = self.freq_min * log_min;
            let bar_freq_max = self.freq_min * log_max;

            let start_bin = (bar_freq_min / freq_per_bin).floor() as usize;
            let end_bin = (bar_freq_max / freq_per_bin).ceil() as usize;

            let mut sum = 0.0;
            let mut count = 0;

            let safe_end = end_bin.min(bin_count);
            let safe_start = start_bin.min(safe_end.saturating_sub(1));

            for bin in safe_start..safe_end {
                sum += magnitudes[bin];
                count += 1;
            }

            let val = if count > 0 {
                // Apply scaling with a frequency-dependent equalization curve to balance low/high frequencies.
                // This reduces bass bloat (x=0) and boosts higher frequency visibility (x=1).
                let x = i as f32 / self.bar_count as f32;
                let eq_factor = 0.35 + 2.15 * x.powf(1.5);
                ((sum / count as f32) * 100.0 * eq_factor).min(255.0) as u8
            } else {
                0
            };
            bars.push(val);
        }
        bars
    }
}
