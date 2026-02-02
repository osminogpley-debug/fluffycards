const TextToSpeech = {
  voices: [],
  isInitialized: false,
  initPromise: null,

  init: () => {
    // Return existing promise if already initializing
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

      const loadVoices = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
          TextToSpeech.voices = voices;
          TextToSpeech.isInitialized = true;
          console.log('TextToSpeech: Voices loaded:', voices.length);
          resolve();
        }
      };

      // Handle voices loaded event
      synth.onvoiceschanged = () => {
        loadVoices();
      };

      // Try to load voices immediately (some browsers already have them)
      loadVoices();

      // Fallback: resolve after timeout even if voices aren't loaded
      setTimeout(() => {
        if (!TextToSpeech.isInitialized) {
          TextToSpeech.voices = synth.getVoices();
          TextToSpeech.isInitialized = true;
          console.log('TextToSpeech: Initialization timeout, voices found:', TextToSpeech.voices.length);
          resolve();
        }
      }, 1000);
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

  speak: async (text) => {
    if (!text) {
      console.warn('TextToSpeech: No text provided to speak');
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Text-to-speech not supported in this browser');
      return;
    }

    try {
      // Auto-initialize on first speak if not already initialized
      if (!TextToSpeech.isInitialized) {
        await TextToSpeech.init();
      }

      const synth = window.speechSynthesis;
      
      // Cancel any ongoing speech
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Detect language of text
      const isChinese = TextToSpeech.isChineseText(text);
      
      let selectedVoice = null;
      
      if (isChinese) {
        // Try to find a Chinese voice (prioritize zh-CN)
        selectedVoice = TextToSpeech.voices.find(
          voice => voice.lang === 'zh-CN' || voice.lang === 'zh-CN'
        ) || TextToSpeech.voices.find(
          voice => voice.lang.startsWith('zh')
        );
        
        if (selectedVoice) {
          console.log('TextToSpeech: Using Chinese voice:', selectedVoice.name, selectedVoice.lang);
        } else {
          console.log('TextToSpeech: Chinese voice not found, using default');
        }
      } else {
        // Try to find a Russian voice for non-Chinese text
        selectedVoice = TextToSpeech.voices.find(
          voice => voice.lang.startsWith('ru')
        );
        
        if (selectedVoice) {
          console.log('TextToSpeech: Using Russian voice:', selectedVoice.name, selectedVoice.lang);
        } else {
          console.log('TextToSpeech: Russian voice not found, using default');
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }
      
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onerror = (event) => {
        console.error('TextToSpeech: Speech synthesis error:', event.error);
      };
      
      utterance.onend = () => {
        console.log('TextToSpeech: Speech finished');
      };
      
      synth.speak(utterance);
    } catch (error) {
      console.error('TextToSpeech: Error during speak:', error);
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
