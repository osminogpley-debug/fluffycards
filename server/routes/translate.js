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

const translateWithMyMemory = async (text, source, target) => {
  const langpair = `${source || 'auto'}|${target}`;
  const response = await axios.get('https://api.mymemory.translated.net/get', {
    params: {
      q: text,
      langpair
    }
  });

  const translated = response.data?.responseData?.translatedText;
  if (!translated) {
    throw new Error('MyMemory translate failed');
  }
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

    let translated = '';
    let provider = 'mymemory';

    if (googleKey) {
      translated = await translateWithGoogle(trimmed, source, target, googleKey);
      provider = 'google';
    } else if (yandexKey && yandexFolderId) {
      translated = await translateWithYandex(trimmed, source, target, yandexKey, yandexFolderId);
      provider = 'yandex';
    } else {
      translated = await translateWithMyMemory(trimmed, source, target);
      provider = 'mymemory';
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