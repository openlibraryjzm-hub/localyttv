/**
 * Audio processing utilities for converting PCM audio data to frequency analysis
 */

/**
 * Convert PCM f32 samples to AudioBuffer and create AnalyserNode
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {Float32Array} samples - PCM audio samples (-1.0 to 1.0)
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {AudioBuffer} AudioBuffer ready for analysis
 */
export function createAudioBufferFromSamples(audioContext, samples, sampleRate) {
  const buffer = audioContext.createBuffer(1, samples.length, sampleRate);
  buffer.getChannelData(0).set(samples);
  return buffer;
}

/**
 * Create an AnalyserNode with FFT configuration
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {number} fftSize - FFT size (2048 for high resolution)
 * @param {number} smoothingTimeConstant - Smoothing (0-1, 0 = no smoothing)
 * @returns {AnalyserNode} Configured analyser node
 */
export function createAnalyser(audioContext, fftSize = 2048, smoothingTimeConstant = 0) {
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothingTimeConstant;
  return analyser;
}

/**
 * Process audio buffer through analyser and get frequency data
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {AnalyserNode} analyser - Analyser node
 * @param {AudioBuffer} buffer - Audio buffer to analyze
 * @returns {Uint8Array} Frequency data (0-255)
 */
export function getFrequencyData(audioContext, analyser, buffer) {
  // Create a source from the buffer
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  // Connect to analyser
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Get frequency data
  const frequencyBinCount = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Clean up
  source.disconnect();
  analyser.disconnect();

  return dataArray;
}

// Cache for frequency mapping to avoid redundant calculations
const mappingCache = new Map();

/**
 * Get or create frequency-to-bin mapping for a specific configuration
 */
export function getFrequencyMapping(barCount, freqMin, freqMax, sampleRate, frequencyBinCount) {
  const cacheKey = `${barCount}-${freqMin}-${freqMax}-${sampleRate}-${frequencyBinCount}`;
  if (mappingCache.has(cacheKey)) {
    return mappingCache.get(cacheKey);
  }

  const nyquist = sampleRate / 2;
  const freqPerBin = nyquist / frequencyBinCount;
  const mapping = new Int32Array(barCount * 2); // [startBin, endBin, startBin, endBin, ...]

  for (let i = 0; i < barCount; i++) {
    // Map bar index to frequency range (Logarithmic Scale)
    // Formula: f = min * (max/min)^(i/N)
    const logMin = Math.pow(freqMax / freqMin, i / barCount);
    const logMax = Math.pow(freqMax / freqMin, (i + 1) / barCount);

    const barFreqMin = freqMin * logMin;
    const barFreqMax = freqMin * logMax;

    let startBin = Math.floor(barFreqMin / freqPerBin);
    let endBin = Math.ceil(barFreqMax / freqPerBin);

    // Ensure we at least check one bin and stay in bounds
    endBin = Math.min(Math.max(startBin + 1, endBin), frequencyBinCount);
    startBin = Math.min(Math.max(0, startBin), endBin - 1);

    mapping[i * 2] = startBin;
    mapping[i * 2 + 1] = endBin;
  }

  mappingCache.set(cacheKey, mapping);
  return mapping;
}

/**
 * Map frequency data to bar values (for 113 bars) - OPTIMIZED
 */
export function mapFrequencyToBars(frequencyData, barCount, freqMin, freqMax, sampleRate) {
  const frequencyBinCount = frequencyData.length;
  const mapping = getFrequencyMapping(barCount, freqMin, freqMax, sampleRate, frequencyBinCount);
  const barValues = new Uint8Array(barCount);

  for (let i = 0; i < barCount; i++) {
    const startBin = mapping[i * 2];
    const endBin = mapping[i * 2 + 1];

    let sum = 0;
    let count = 0;

    for (let bin = startBin; bin < endBin; bin++) {
      sum += frequencyData[bin];
      count++;
    }

    barValues[i] = count > 0 ? Math.round(sum / count) : 0;
  }

  return barValues;
}

/**
 * Apply smoothing to bar values (neighbor averaging)
 * @param {Uint8Array} barValues - Current bar values
 * @param {Uint8Array} previousValues - Previous frame values (for smoothing)
 * @param {number} smoothing - Smoothing factor (0-1)
 * @returns {Uint8Array} Smoothed bar values
 */
export function smoothBarValues(barValues, previousValues, smoothing) {
  if (smoothing === 0 || !previousValues) {
    return barValues;
  }

  const smoothed = new Uint8Array(barValues.length);
  for (let i = 0; i < barValues.length; i++) {
    const prev = previousValues[i] || 0;
    smoothed[i] = Math.round(barValues[i] * (1 - smoothing) + prev * smoothing);
  }

  return smoothed;
}
