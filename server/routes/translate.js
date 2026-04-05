import express from 'express';
import axios from 'axios';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const translateWithGoogle = async (text, source, target, apiKey) => {
  const response = await axios.post(
    'https://translation.googleapis.com/language/translate/v2',
    {
      q: text,
      source: source === 'auto' ? undefined : source,
      target,
      format: 'text'
    },
    {
      params: { key: apiKey }
    }
  );

  const translated = response.data?.data?.translations?.[0]?.translatedText;
  if (!translated) {
    throw new Error('Google translate failed');
  }
  return translated;
};

const translateWithYandex = async (text, source, target, apiKey, folderId) => {
  const response = await axios.post(
    'https://translate.api.cloud.yandex.net/translate/v2/translate',
    {
      folderId,
      texts: [text],
      sourceLanguageCode: source === 'auto' ? undefined : source,
      targetLanguageCode: target
    },
    {
      headers: { Authorization: `Api-Key ${apiKey}` }
    }
  );

  const translated = response.data?.translations?.[0]?.text;
  if (!translated) {
    throw new Error('Yandex translate failed');
  }
  return translated;
};

const detectSourceLang = (text) => {
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(text)) return 'zh';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return null;
};

const countChineseChars = (text = '') => (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;

const isPoorZhToRuTranslation = (source, translated) => {
  if (!translated) return true;
  const src = source.trim().toLowerCase();
  const out = translated.trim().toLowerCase();
  if (!out) return true;

  // Unchanged output means translation likely failed
  if (src === out) return true;

  // Chinese characters in ru output usually means provider returned source text
  const chineseInOut = countChineseChars(translated);
  if (chineseInOut > 0) return true;

  // Garbage guard: extremely short result for longer source
  if (source.length >= 3 && translated.length <= 1) return true;

  return false;
};

const translateWithMyMemory = async (text, source, target) => {
  // MyMemory requires explicit language codes, 'auto' is not supported
  const srcLang = (source === 'auto' || !source) ? (detectSourceLang(text) || 'en') : source;
  const langpair = `${srcLang}|${target}`;
  const response = await axios.get('https://api.mymemory.translated.net/get', {
    params: {
      q: text,
      langpair,
      de: 'fluffycards@mail.ru'
    }
  });

  const translated = response.data?.responseData?.translatedText;
  const match = response.data?.responseData?.match;
  
  // MyMemory returns the original text when translation fails
  if (!translated || (match !== undefined && match < 0.3 && translated.toLowerCase() === text.toLowerCase())) {
    throw new Error('MyMemory translate failed');
  }
  return translated;
};

// Libre Translate (free fallback option 2)
const translateWithLibre = async (text, source, target) => {
  const srcLang = (source === 'auto' || !source) ? (detectSourceLang(text) || 'en') : source;
  const response = await axios.post('https://libretranslate.de/translate', {
    q: text,
    source: srcLang,
    target,
    format: 'text'
  }, { timeout: 8000 });
  
  const translated = response.data?.translatedText;
  if (!translated) throw new Error('LibreTranslate failed');
  return translated;
};

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text, source = 'auto', target = 'ru' } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const trimmed = text.trim();
    const googleKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    const yandexKey = process.env.YANDEX_TRANSLATE_API_KEY;
    const yandexFolderId = process.env.YANDEX_FOLDER_ID;

    // Detect source language for better routing
    const detectedSource = (source === 'auto' || !source) ? detectSourceLang(trimmed) : source;
    const effectiveSource = detectedSource || source;

    let translated = '';
    let provider = '';

    // Try providers in order: Google > Yandex > MyMemory > LibreTranslate
    const providers = [];
    if (googleKey) providers.push({ name: 'google', fn: () => translateWithGoogle(trimmed, effectiveSource, target, googleKey) });
    if (yandexKey && yandexFolderId) providers.push({ name: 'yandex', fn: () => translateWithYandex(trimmed, effectiveSource, target, yandexKey, yandexFolderId) });
    providers.push({ name: 'mymemory', fn: () => translateWithMyMemory(trimmed, effectiveSource, target) });
    providers.push({ name: 'libre', fn: () => translateWithLibre(trimmed, effectiveSource, target) });

    // For Chinese→Russian, also try two-step: zh→en then en→ru as fallback
    if (detectedSource === 'zh' && target === 'ru') {
      providers.push({
        name: 'mymemory-2step',
        fn: async () => {
          const enText = await translateWithMyMemory(trimmed, 'zh', 'en');
          if (!enText || enText === trimmed) throw new Error('Step 1 failed');
          const ruText = await translateWithMyMemory(enText, 'en', 'ru');
          if (!ruText) throw new Error('Step 2 failed');
          return ruText;
        }
      });
    }

    for (const p of providers) {
      try {
        const candidate = await p.fn();

        if (detectedSource === 'zh' && target === 'ru' && isPoorZhToRuTranslation(trimmed, candidate)) {
          throw new Error('Low-quality zh->ru translation');
        }

        translated = candidate;
        provider = p.name;
        break;
      } catch (e) {
        console.warn(`[Translate] ${p.name} failed:`, e.message);
      }
    }

    if (!translated) {
      return res.status(500).json({ success: false, message: 'All translation providers failed' });
    }

    res.json({
      success: true,
      data: {
        translatedText: translated,
        provider
      }
    });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to translate'
    });
  }
});

export default router;