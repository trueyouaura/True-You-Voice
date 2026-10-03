/** YIN difference estimator. Pure function shared by worker and deterministic tests. */
export function inputFloor(mode = 'desk') {
  return mode === 'nearby' ? 0.008 : mode === 'quiet' ? 0.0003 : 0.001;
}
// Logarithmic display makes quiet speech visible without amplifying captured audio.
export function inputLevel(rms) {
  return Number.isFinite(rms) && rms > 0 ? Math.max(0, Math.min(1, (20 * Math.log10(rms) + 72) / 72)) : 0;
}
export function estimatePitch(samples, sampleRate, mode = 'desk') {
  let mean = 0, energy = 0, peak = 0;
  for (const x of samples) { mean += x; peak = Math.max(peak, Math.abs(x)); }
  mean /= samples.length;
  for (const x of samples) energy += (x - mean) ** 2;
  const rms = Math.sqrt(energy / samples.length);
  const empty = { hz: null, confidence: 0, rms, peak };
  if (rms < inputFloor(mode) || !Number.isFinite(sampleRate) || sampleRate <= 0) return empty;
  const size = Math.floor(samples.length / 2);
  const maxLag = Math.min(size - 2, Math.ceil(sampleRate / 65));
  const minLag = Math.max(2, Math.floor(sampleRate / 650));
  const difference = new Float32Array(maxLag + 1);
  let sum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let value = 0;
    for (let i = 0; i < size; i++) value += (samples[i] - samples[i + lag]) ** 2;
    sum += value;
    difference[lag] = sum ? value * lag / sum : 1;
  }
  let lag = minLag;
  for (; lag < maxLag; lag++) {
    if (difference[lag] < 0.15) {
      while (lag + 1 <= maxLag && difference[lag + 1] < difference[lag]) lag++;
      break;
    }
  }
  if (lag >= maxLag || difference[lag] > 0.15) return empty;
  const left = difference[lag - 1], center = difference[lag], right = difference[lag + 1];
  const denominator = 2 * (2 * center - right - left);
  const adjusted = lag + (denominator ? (right - left) / denominator : 0);
  const hz = sampleRate / adjusted;
  return hz >= 65 && hz <= 650 ? { hz, confidence: 1 - center, rms, peak } : empty;
}
export function summarize(values) {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return { median: sorted.length % 2 ? sorted[middle] : (sorted[middle-1]+sorted[middle])/2,
    low: sorted[Math.floor((sorted.length-1)*.1)], high: sorted[Math.floor((sorted.length-1)*.9)], count: sorted.length };
}
