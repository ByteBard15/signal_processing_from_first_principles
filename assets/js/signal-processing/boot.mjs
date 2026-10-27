const registry = {
  composer: ['./fourier/composer.mjs', 'default'], probe: ['./fourier/probe.mjs', 'default'],
  series: ['./fourier/reconstruction.mjs', 'default'], gibbs: ['./fourier/gibbs.mjs', 'default'],
  complex: ['./fourier/complex.mjs', 'default'], parseval: ['./fourier/parseval.mjs', 'default'],
  limit: ['./fourier/limit.mjs', 'default'], rectangle: ['./fourier/transform-pairs.mjs', 'RectangleTransformExplorer'],
  gaussian: ['./fourier/transform-pairs.mjs', 'GaussianTransformExplorer'],
  response: ['./fourier/response.mjs', 'default'],
  sampling: ['./digital/sampling.mjs', 'default'], aliasing: ['./digital/aliasing.mjs', 'default'],
  sinc: ['./digital/sinc.mjs', 'default'], dtft: ['./digital/dtft.mjs', 'default'],
  convolution: ['./digital/convolution.mjs', 'default'], filter: ['./digital/filter.mjs', 'default'],
  bins: ['./digital/bins.mjs', 'default'], periodic: ['./digital/periodic.mjs', 'default'],
  leakage: ['./digital/leakage.mjs', 'default'], butterfly: ['./digital/butterfly.mjs', 'default'],
  comparison: ['./digital/comparison.mjs', 'default'], analyzer: ['./digital/analyzer.mjs', 'default'],
  welch: ['./digital/welch.mjs', 'default'], stft: ['./digital/stft.mjs', 'default'],
  endToEnd: ['./digital/end-to-end.mjs', 'default'],
  eegTrace: ['./eeg/trace.mjs', 'default'], eegArtifacts: ['./eeg/artifacts.mjs', 'default'],
  eegPreprocess: ['./eeg/preprocessing.mjs', 'default'], eegEpochs: ['./eeg/epochs.mjs', 'default'],
  eegPsd: ['./eeg/psd.mjs', 'default'], eegWelch: ['./eeg/welch.mjs', 'default'], eegBands: ['./eeg/bands.mjs', 'default'],
  eegConditions: ['./eeg/conditions.mjs', 'default'], eegChannels: ['./eeg/channels.mjs', 'default'],
  eegStftBuild: ['./eeg/time-frequency.mjs', 'EEGSTFTConstruction'], eegSpectrogram: ['./eeg/time-frequency.mjs', 'EEGSpectrogramExplorer'],
  eegEvent: ['./eeg/time-frequency.mjs', 'EEGEventRelatedExplorer'], eegRobustness: ['./eeg/robustness.mjs', 'default'],
};
async function initialize(root) {
  if (root.dataset.loaded) return; root.dataset.loaded = 'true';
  try {
    const [path, name] = registry[root.dataset.experiment];
    const module = await import(path); await module[name](root);
  } catch (error) {
    const message = document.createElement('p'); message.className = 'experiment-error';
    message.textContent = 'This interactive experiment could not load. The equations and caption describe the intended result. Reload to retry.';
    root.querySelector('.experiment-ui').append(message); console.error(error);
  }
}
const figures = document.querySelectorAll('[data-experiment]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { observer.unobserve(entry.target); initialize(entry.target); }
  }), { rootMargin: '400px' });
  figures.forEach((root) => observer.observe(root));
} else figures.forEach(initialize);
// Redraw on theme changes so Canvas colors follow the existing dark-mode tokens.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  document.querySelectorAll('[data-loaded]').forEach((root) => root.dispatchEvent(new Event('figure-redraw')));
});
