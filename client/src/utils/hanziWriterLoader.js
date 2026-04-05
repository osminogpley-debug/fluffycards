let hanziWriterPromise = null;

export function loadHanziWriter() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('window is not available'));
  }

  if (window.HanziWriter) {
    return Promise.resolve(window.HanziWriter);
  }

  if (hanziWriterPromise) {
    return hanziWriterPromise;
  }

  hanziWriterPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-hanzi-writer="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.HanziWriter));
      existingScript.addEventListener('error', () => reject(new Error('Failed to load HanziWriter')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/hanzi-writer@3.7.0/dist/hanzi-writer.min.js';
    script.async = true;
    script.dataset.hanziWriter = 'true';
    script.onload = () => resolve(window.HanziWriter);
    script.onerror = () => reject(new Error('Failed to load HanziWriter'));
    document.head.appendChild(script);
  });

  return hanziWriterPromise;
}
