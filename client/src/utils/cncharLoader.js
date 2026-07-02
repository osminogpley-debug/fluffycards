let cncharPromise = null;

const CNCHAR_SCRIPTS = [
  {
    marker: 'cncharCore',
    sources: [
      'https://fastly.jsdelivr.net/npm/cnchar@3.2.6/cnchar.min.js',
      'https://unpkg.com/cnchar@3.2.6/cnchar.min.js'
    ]
  },
  {
    marker: 'cncharRadical',
    sources: [
      'https://fastly.jsdelivr.net/npm/cnchar-radical@3.2.6/cnchar.radical.min.js',
      'https://unpkg.com/cnchar-radical@3.2.6/cnchar.radical.min.js'
    ]
  }
];

const loadScript = ({ marker, sources }) => new Promise((resolve, reject) => {
  const existingScript = document.querySelector(`script[data-${marker}="true"]`);
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true') {
      resolve();
      return;
    }

    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', () => reject(new Error(`Failed to load ${marker}`)), { once: true });
    return;
  }

  const script = document.createElement('script');
  let sourceIndex = 0;

  const tryNextSource = () => {
    if (sourceIndex >= sources.length) {
      reject(new Error(`Failed to load ${marker}`));
      return;
    }

    script.src = sources[sourceIndex];
    sourceIndex += 1;
  };

  script.async = true;
  script.dataset[marker] = 'true';
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = () => {
    tryNextSource();
  };

  tryNextSource();
  document.body.appendChild(script);
});

export function loadCnchar() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.cnchar?.stroke && window.cnchar?.radical) {
    return Promise.resolve(window.cnchar);
  }

  if (cncharPromise) {
    return cncharPromise;
  }

  cncharPromise = (async () => {
    for (const scriptConfig of CNCHAR_SCRIPTS) {
      await loadScript(scriptConfig);
    }

    if (!window.cnchar) {
      throw new Error('cnchar is unavailable after loading scripts');
    }

    return window.cnchar;
  })();

  return cncharPromise;
}