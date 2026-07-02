import { pinyin } from 'pinyin-pro';

const CHINESE_REGEX = /[\u3400-\u4dbf\u4e00-\u9fff]/u;

const TONE_CHAR_TO_BASE = {
  a: ['ā', 'á', 'ǎ', 'à'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ']
};

const TONE_MARK_TO_BASE = Object.entries(TONE_CHAR_TO_BASE).reduce((map, [base, marks]) => {
  marks.forEach((mark, index) => {
    map[mark] = `${base}${index + 1}`;
  });
  return map;
}, { ń: 'n2', ň: 'n3', ǹ: 'n4', ḿ: 'm2' });

const VOWEL_REGEX = /[aeiouü]/;

const cleanPinyinText = (value) => `${value || ''}`
  .toLowerCase()
  .replace(/u:/g, 'ü')
  .replace(/v/g, 'ü')
  .replace(/[’']/g, '')
  .replace(/[，。！？、；：,.!?;:()[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const chooseTonePosition = (syllable) => {
  if (syllable.includes('a')) return syllable.indexOf('a');
  if (syllable.includes('e')) return syllable.indexOf('e');

  const ouIndex = syllable.indexOf('ou');
  if (ouIndex >= 0) return ouIndex;

  for (let index = syllable.length - 1; index >= 0; index -= 1) {
    if (VOWEL_REGEX.test(syllable[index])) {
      return index;
    }
  }

  return -1;
};

const normalizeComparisonForm = (value, keepToneNumbers = false) => {
  const cleaned = cleanPinyinText(value);
  let normalized = '';

  for (const char of cleaned) {
    if (TONE_MARK_TO_BASE[char]) {
      normalized += TONE_MARK_TO_BASE[char];
      continue;
    }

    if (char === 'ü') {
      normalized += 'v';
      continue;
    }

    normalized += char;
  }

  normalized = normalized
    .replace(/[^a-z0-5\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!keepToneNumbers) {
    normalized = normalized.replace(/[0-5]/g, '');
  }

  return normalized.replace(/\s+/g, ' ').trim();
};

const buildComparisonForms = (value) => {
  const withTones = normalizeComparisonForm(value, true);
  const withoutTones = normalizeComparisonForm(value, false);

  return new Set([
    withTones,
    withTones.replace(/\s+/g, ''),
    withoutTones,
    withoutTones.replace(/\s+/g, '')
  ].filter(Boolean));
};

const splitPinyinVariants = (value) => `${value || ''}`
  .split(/[\n;|/]+/)
  .map((part) => part.trim())
  .filter(Boolean);

export const isChineseText = (text) => typeof text === 'string' && CHINESE_REGEX.test(text);

export const extractChineseCharacters = (text) => Array.from(`${text || ''}`).filter((char) => CHINESE_REGEX.test(char));

export const numberedPinyinToToneMarks = (value) => cleanPinyinText(value).replace(/([a-zü]+)([0-5])/g, (_, rawSyllable, rawTone) => {
  const tone = Number(rawTone);
  const syllable = rawSyllable.replace(/v/g, 'ü');

  if (!tone || tone === 5) {
    return syllable;
  }

  const tonePosition = chooseTonePosition(syllable);
  if (tonePosition < 0) {
    return syllable;
  }

  const vowel = syllable[tonePosition];
  const marked = TONE_CHAR_TO_BASE[vowel]?.[tone - 1];
  if (!marked) {
    return syllable;
  }

  return `${syllable.slice(0, tonePosition)}${marked}${syllable.slice(tonePosition + 1)}`;
});

export const stripPinyinToneMarks = (value) => normalizeComparisonForm(value, false).replace(/v/g, 'u');

export const toPinyin = (text) => {
  if (!isChineseText(text)) {
    return '';
  }

  try {
    const syllables = pinyin(text, {
      toneType: 'symbol',
      type: 'array',
      nonZh: 'removed'
    });

    return syllables.join(' ').trim();
  } catch (error) {
    console.error('Failed to convert text to pinyin:', error);
    return '';
  }
};

export const getPinyinAnswers = (answerText, preferredPinyin = '') => {
  if (!isChineseText(answerText)) {
    return [];
  }

  const variants = new Set();

  splitPinyinVariants(preferredPinyin).forEach((variant) => {
    const formatted = /\d/.test(variant) ? numberedPinyinToToneMarks(variant) : cleanPinyinText(variant);
    if (formatted) {
      variants.add(formatted);
    }
  });

  const generated = toPinyin(answerText);
  if (generated) {
    variants.add(generated);
  }

  return [...variants];
};

export const matchesPinyinAnswer = (userInput, expectedAnswers = []) => {
  const userForms = buildComparisonForms(/\d/.test(userInput) ? numberedPinyinToToneMarks(userInput) : userInput);

  return expectedAnswers.some((expected) => {
    const expectedForms = buildComparisonForms(expected);
    return [...userForms].some((form) => expectedForms.has(form));
  });
};

export const formatExpectedAnswer = (answerText, pinyinAnswers = []) => {
  if (!isChineseText(answerText) || pinyinAnswers.length === 0) {
    return answerText;
  }

  return `${pinyinAnswers[0]} (${answerText})`;
};