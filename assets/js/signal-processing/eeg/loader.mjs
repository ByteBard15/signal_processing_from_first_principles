let cached;
export async function loadEEGExample() {
  if (!cached) {
    const url = new URL('../../../../data/signal-processing/eeg-example.json', import.meta.url);
    cached = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`EEG example failed to load: ${response.status}`);
      return response.json();
    });
  }
  return cached;
}
export const epochsFor = (data, condition) => data.epochs.filter((epoch) => epoch.condition === condition);

