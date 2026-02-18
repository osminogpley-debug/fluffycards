const TextToSpeech = {
  voices: [],
  isInitialized: false,
  initPromise: null,

  init: () => {
    if (TextToSpeech.initPromise) {
      return TextToSpeech.initPromise;
    }

    TextToSpeech.initPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        TextToSpeech.isInitialized = true;
        resolve();
        return;
      }

      const synth = window.speechSynthesis;
      let intervalId = null;
      let timeoutId = null;

      const cleanupListeners = () => {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (typeof synth.removeEventListener === 'function') {
          synth.removeEventListener('voiceschanged', handleVoicesChanged);
        } else if (synth.onvoiceschanged === handleVoicesChanged) {
          synth.onvoiceschanged = null;
        }
      };

      const finalizeInitialization = (voices = []) => {
        if (TextToSpeech.isInitialized) return;
        TextToSpeech.voices = voices;
        TextToSpeech.isInitialized = true;
        console.log('TextToSpeech: Voices loaded:', voices.length);
        cleanupListeners();
        resolve();
      };

      const tryLoadVoices = () => {
        const voices = synth.getVoices();
        if (voices && voices.length > 0) {
          finalizeInitialization(voices);
          return true;
        }
        return false;
      };

      function handleVoicesChanged() {
        if (tryLoadVoices()) {
          cleanupListeners();
        }
      }

      if (!tryLoadVoices()) {
        if (typeof synth.addEventListener === 'function') {
          synth.addEventListener('voiceschanged', handleVoicesChanged);
        } else {
          synth.onvoiceschanged = handleVoicesChanged;
        }

        intervalId = setInterval(() => {
          if (tryLoadVoices()) {
            cleanupListeners();
          }
        }, 200);

        timeoutId = setTimeout(() => {
          if (!TextToSpeech.isInitialized) {
            finalizeInitialization(synth.getVoices());
          }
        }, 3000);
      }
    });

    return TextToSpeech.initPromise;
  },

  // Detect if text contains Chinese characters
  isChineseText: (text) => {
    if (!text) return false;
    // Check for Chinese characters (CJK Unified Ideographs, etc.)
    const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}]/u;
    return chineseRegex.test(text);
  },

  detectLanguageHints: (text) => {
    if (!text) return [];
    if (TextToSpeech.isChineseText(text)) return ['zh-CN', 'zh'];
    if (/[\u3040-\u30ff]/.test(text)) return ['ja-JP', 'ja'];
    if (/[\uac00-\ud7af]/.test(text)) return ['ko-KR', 'ko'];
    if (/[\u0400-\u04ff]/.test(text)) return ['ru-RU', 'ru'];
    if (/[\u0600-\u06ff]/.test(text)) return ['ar-SA', 'ar'];
    if (/[\u0590-\u05ff]/.test(text)) return ['he-IL', 'he'];
    if (/[\u0900-\u097f]/.test(text)) return ['hi-IN', 'hi'];
    if (/[\u0e00-\u0e7f]/.test(text)) return ['th-TH', 'th'];
    return [];
  },

  pickBestVoice: (preferredLangs) => {
    if (!TextToSpeech.voices.length) return null;
    const uniqueLangs = Array.from(new Set(preferredLangs.filter(Boolean)));
    for (const lang of uniqueLangs) {
      const exact = TextToSpeech.voices.find(voice => voice.lang === lang);
      if (exact) return exact;
      const partial = TextToSpeech.voices.find(voice => voice.lang.startsWith(lang));
      if (partial) return partial;
    }
    return TextToSpeech.voices.find(voice => voice.default) || TextToSpeech.voices[0] || null;
  },

  speak: async (text) => {
    if (!text) {
      console.warn('TextToSpeech: No text provided to speak');
      return Promise.resolve();
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser');
      return Promise.resolve();
    }

    try {
      // Auto-initialize on first speak if not already initialized
      if (!TextToSpeech.isInitialized) {
        await TextToSpeech.init();
      }

      const synth = window.speechSynthesis;
      
      // Cancel any ongoing speech
      if (synth.paused) {
        try {
          synth.resume();
        } catch (resumeError) {
          console.warn('TextToSpeech: Unable to resume speech synthesis:', resumeError);
        }
      }
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const preferredLangs = [
        ...TextToSpeech.detectLanguageHints(text),
        typeof navigator !== 'undefined' ? navigator.language : null,
        typeof navigator !== 'undefined' ? navigator.language?.split('-')[0] : null,
        'en-US',
        'en'
      ].filter(Boolean);

      const selectedVoice = TextToSpeech.pickBestVoice(preferredLangs);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else if (preferredLangs.length > 0) {
        utterance.lang = preferredLangs[0];
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;

      return new Promise((resolve) => {
        utterance.onerror = (event) => {
          console.error('TextToSpeech: Speech synthesis error:', event.error);
          resolve();
        };

        utterance.onend = () => {
          resolve();
        };

        synth.speak(utterance);
      });
    } catch (error) {
      console.error('TextToSpeech: Error during speak:', error);
      return Promise.resolve();
    }
  },

  // Stop any ongoing speech
  cancel: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  // Get available voices
  getVoices: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  },

  // Check if TTS is supported
  isSupported: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }
};

export default TextToSpeech;
