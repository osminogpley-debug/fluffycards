import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { API_BASE_URL, API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
import { pinyin } from 'pinyin-pro';

import VoiceInput from '../components/VoiceInput';

// ===== КИТАЙСКИЙ ФУНКЦИОНАЛ =====

// Проверка содержит ли текст китайские иероглифы
const isChinese = (text) => {
  if (!text || typeof text !== 'string') return false;
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf]/;
  return chineseRegex.test(text);
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};

// Подсчет количества китайских иероглифов в тексте
const countChineseChars = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g);
  return matches ? matches.length : 0;
};

// Реальная конвертация в пиньинь с использованием pinyin-pro
const convertToPinyin = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  try {
    // Используем pinyin-pro для реальной конвертации
    const result = pinyin(text, {
      toneType: 'symbol',  // Используем символы тонов (ā, á, ǎ, à)
      type: 'array',       // Получаем массив слогов
      nonZh: 'removed'     // Убираем не-китайские символы
    });
    
    return result.join(' ');
  } catch (error) {
    console.error('Ошибка конвертации в пиньинь:', error);
    return '';
  }
};

// Кэш для переводов (чтобы не дублировать запросы)
const translationCache = new Map();

// API для получения перевода китайского текста (через серверный переводчик)
const translateChinese = async (chineseText) => {
  if (!chineseText || typeof chineseText !== 'string') {
    return '（введите перевод вручную）';
  }
  
  const trimmedText = chineseText.trim();
  if (!trimmedText) {
    return '（введите перевод вручную）';
  }
  
  // Проверяем кэш
  if (translationCache.has(trimmedText)) {
    return translationCache.get(trimmedText);
  }
  
  try {
    const response = await authFetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmedText, source: 'zh', target: 'ru' })
    });

    if (!response.ok) {
      throw new Error('Ошибка API перевода');
    }

    const data = await response.json();
    const translated = data?.data?.translatedText;
    if (translated) {
      translationCache.set(trimmedText, translated);
      return translated;
    }

    throw new Error('Нет результата перевода');
  } catch (error) {
    console.warn('Ошибка получения перевода:', error.message);
    return translateChineseFallback(trimmedText);
  }
};

// Резервный метод перевода (если API недоступен)
const translateChineseFallback = async (chineseText) => {
  const commonChars = {
    '你好': 'привет', '谢谢': 'спасибо', '再见': 'до свидания',
    '中国': 'Китай', '中文': 'китайский язык',
    '你': 'ты', '我': 'я', '他': 'он', '她': 'она', '们': '(мн.число)',
    '是': 'быть', '不': 'не', '有': 'иметь', '在': 'находиться',
    '大': 'большой', '小': 'маленький', '好': 'хороший', '多': 'много', '少': 'мало',
    '人': 'человек', '学': 'учиться', '生': 'рождаться; жизнь',
    '学生': 'студент', '老师': 'учитель', '朋友': 'друг',
    '家': 'дом; семья', '国': 'страна', '水': 'вода', '火': 'огонь',
    '山': 'гора', '天': 'небо; день', '地': 'земля',
    '日': 'солнце; день', '月': 'луна; месяц', '年': 'год',
    '吃': 'есть (кушать)', '喝': 'пить', '看': 'смотреть', '听': 'слушать',
    '说': 'говорить', '读': 'читать', '写': 'писать',
    '去': 'идти (туда)', '来': 'приходить', '走': 'идти',
    '上': 'верх; на', '下': 'низ; под', '里': 'внутри',
    '什么': 'что', '怎么': 'как', '哪里': 'где', '为什么': 'почему',
    '这': 'это', '那': 'то', '很': 'очень', '也': 'тоже',
    '和': 'и; с', '的': '(частица)', '了': '(частица прошедшего времени)',
    '一': 'один', '二': 'два', '三': 'три', '四': 'четыре', '五': 'пять',
    '六': 'шесть', '七': 'семь', '八': 'восемь', '九': 'девять', '十': 'десять',
    '百': 'сто', '千': 'тысяча', '万': 'десять тысяч',
    '爸爸': 'папа', '妈妈': 'мама', '哥哥': 'старший брат', '姐姐': 'старшая сестра',
    '弟弟': 'младший брат', '妹妹': 'младшая сестра',
    '今天': 'сегодня', '明天': 'завтра', '昨天': 'вчера',
    '早上': 'утро', '晚上': 'вечер', '现在': 'сейчас',
    '高兴': 'рад; счастливый', '快乐': 'счастье',
    '喜欢': 'нравиться', '爱': 'любить', '想': 'думать; хотеть; скучать',
    '知道': 'знать', '可以': 'можно', '会': 'уметь; мочь',
    '工作': 'работа', '电话': 'телефон', '电脑': 'компьютер',
    '手机': 'телефон (мобильный)', '钱': 'деньги',
    '饭': 'еда; рис', '菜': 'блюдо; овощи', '茶': 'чай', '咖啡': 'кофе',
    '猫': 'кот', '狗': 'собака', '鱼': 'рыба', '鸟': 'птица',
    '花': 'цветок', '树': 'дерево', '红': 'красный', '白': 'белый', '黑': 'чёрный',
    '蓝': 'синий', '绿': 'зелёный', '黄': 'жёлтый',
    '北京': 'Пекин', '上海': 'Шанхай', '俄罗斯': 'Россия'
  };
  if (commonChars[chineseText]) return commonChars[chineseText];
  // Try single char lookup for short text
  if (chineseText.length === 1 && commonChars[chineseText]) return commonChars[chineseText];
  return '（введите перевод вручную）';
};

// Получение данных о китайском слове (пиньинь + перевод)
const getChineseData = async (chineseText) => {
  if (!chineseText || typeof chineseText !== 'string') {
    throw new Error('Некорректный ввод');
  }
  
  const trimmedText = chineseText.trim();
  if (!trimmedText) {
    throw new Error('Пустой текст');
  }
  
  if (!isChinese(trimmedText)) {
    throw new Error('Текст не содержит китайских иероглифов');
  }
  
  // Получаем реальный пиньинь
  const pinyinResult = convertToPinyin(trimmedText);
  
  // Получаем перевод из API
  const translation = await translateChinese(trimmedText);
  
  return {
    pinyin: pinyinResult,
    translation: translation,
    isChinese: true,
    charCount: trimmedText.length
  };
};

// ===== СТИЛИ (БЕЗ KEYFRAMES) =====
const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 60px;
`;

const Header = styled.header`
  background: var(--bg-secondary);
  padding: 16px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  gap: 12px;

  @media (max-width: 720px) {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  .icon {
    font-size: 32px;
  }
  
  .text {
    font-size: 24px;
    font-weight: 800;
    background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media (max-width: 720px) {
    justify-content: center;

    .text {
      font-size: 20px;
    }
    .icon {
      font-size: 28px;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 720px) {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
`;

const CardCounter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  color: #92400e;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  .count {
    font-size: 18px;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    justify-content: center;
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;

  @media (max-width: 720px) {
    width: 100%;
    justify-content: center;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 179, 237, 0.3);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const SecondaryButton = styled(Button)`
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
  
  &:hover:not(:disabled) {
    background: var(--bg-tertiary);
    border-color: var(--border-color);
    transform: translateY(-2px);
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #feb2b2 0%, #fc8181 100%);
    transform: translateY(-2px);
  }
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
`;

const ConfirmModal = styled.div`
  width: 100%;
  max-width: 460px;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-color);
  overflow: hidden;
`;

const ConfirmHeader = styled.div`
  padding: 20px 24px 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
`;

const ConfirmBody = styled.div`
  padding: 0 24px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
`;

const ConfirmActions = styled.div`
  padding: 0 24px 24px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const DraftStatus = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
`;

const MainContent = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 32px;
  opacity: 1;
  transition: opacity 0.3s ease;

  @media (max-width: 720px) {
    padding: 16px;
  }
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .emoji {
    font-size: 36px;
  }

  @media (max-width: 720px) {
    font-size: 24px;
    gap: 8px;
    flex-wrap: wrap;

    .emoji {
      font-size: 28px;
    }
  }
`;

const PageSubtitle = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 32px 0;

  @media (max-width: 720px) {
    margin-bottom: 20px;
  }
`;

const FormSection = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  padding: 28px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);

  @media (max-width: 720px) {
    padding: 20px;
    margin-bottom: 18px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  .icon {
    font-size: 22px;
  }

  @media (max-width: 720px) {
    font-size: 16px;
    margin-bottom: 14px;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  
  .required {
    color: #f56565;
    margin-left: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    background: var(--bg-secondary);
    box-shadow: 0 0 0 4px rgba(99, 179, 237, 0.1);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 14px 18px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    background: var(--bg-secondary);
    box-shadow: 0 0 0 4px rgba(99, 179, 237, 0.1);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const ImportTextArea = styled(TextArea)`
  min-height: 150px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
`;

const ImportHint = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 8px;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  
  code {
    background: var(--bg-secondary);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    color: var(--text-primary);
  }
`;

const CardsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CardItem = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #ffffff 0%, #f7fafc 100%));
  border-radius: 16px;
  padding: 20px;
  border: 2px solid ${props => props.$isChinese ? '#fc8181' : 'var(--border-color)'};
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: ${props => props.$isChinese ? '#f56565' : '#63b3ed'};
    box-shadow: 0 4px 20px ${props => props.$isChinese ? 'rgba(245, 101, 101, 0.15)' : 'rgba(99, 179, 237, 0.15)'};
  }
  
  &::before {
    content: attr(data-number);
    position: absolute;
    top: -10px;
    left: 20px;
    background: ${props => props.$isChinese 
      ? 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)' 
      : 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    box-shadow: 0 2px 8px ${props => props.$isChinese ? 'rgba(245, 101, 101, 0.3)' : 'rgba(99, 179, 237, 0.3)'};
  }

  @media (max-width: 720px) {
    padding: 16px;

    &::before {
      left: 12px;
      top: -8px;
      width: 24px;
      height: 24px;
      font-size: 11px;
    }
  }
`;

const CardField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CardFieldLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TabSplitBadge = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: #0f172a;
  background: #fde68a;
  border: 1px solid #f59e0b;
  padding: 1px 6px;
  border-radius: 999px;
  text-transform: none;
`;

const CardInput = styled.input`
  flex: 1;
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  min-height: 60px;
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 4px rgba(99, 179, 237, 0.1);
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const CardRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: stretch;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CardPreviewImage = styled.img`
  width: 220px;
  height: 160px;
  max-width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 6px;

  @media (max-width: 600px) {
    width: 100%;
    height: 140px;
  }
`;

const ChineseBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  margin-left: auto;
`;

const PinyinDisplay = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  display: inline-block;
`;

const AddPinyinButton = styled.button`
  margin-top: 8px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 10px;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .sparkle {
    transition: transform 0.3s ease;
  }
  
  &:hover .sparkle {
    transform: rotate(15deg) scale(1.1);
  }
`;

const DeletePinyinButton = styled.button`
  margin-top: 8px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  border: 2px solid #f56565;
  border-radius: 10px;
  color: #c53030;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #feb2b2 0%, #fc8181 100%);
    box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ChineseButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const ChineseFieldsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
`;

const DeleteButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: var(--danger-bg);
  color: var(--danger-color);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  align-self: center;
  
  &:hover {
    background: var(--danger-hover-bg);
    color: white;
    transform: scale(1.1) rotate(90deg);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    align-self: flex-end;
    width: 40px;
    height: 40px;
  }
`;

const AddCardButton = styled.button`
  width: 100%;
  padding: 20px;
  border: 3px dashed var(--border-color);
  border-radius: 16px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  margin-top: 8px;
  
  &:hover {
    border-color: #63b3ed;
    color: #63b3ed;
    background: rgba(99, 179, 237, 0.08);
    transform: translateY(-2px);
  }
  
  .plus {
    font-size: 24px;
    transition: transform 0.3s ease;
  }
  
  &:hover .plus {
    transform: rotate(90deg);
  }

  @media (max-width: 600px) {
    padding: 16px;
    font-size: 15px;
  }
`;

const ImportButton = styled(PrimaryButton)`
  margin-top: 12px;
  width: 100%;
  justify-content: center;
`;

const ToggleSection = styled.button`
  width: 100%;
  padding: 16px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  margin-bottom: ${props => props.$isOpen ? '16px' : '0'};
  
  &:hover {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }
  
  .arrow {
    transition: transform 0.3s ease;
    transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  }
`;

const ImportSection = styled.div`
  overflow: hidden;
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  opacity: ${props => props.$isOpen ? '1' : '0'};
  transition: all 0.4s ease;
`;

const ClozeEditor = styled.div`
  display: grid;
  gap: 16px;
`;

const ClozeTextArea = styled(TextArea)`
  min-height: 160px;
`;

const ClozeActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ClozePreview = styled.div`
  background: var(--bg-tertiary);
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  padding: 16px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
`;

const ClozeBlank = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  margin: 0 4px;
  min-width: 48px;
  border-radius: 999px;
  background: ${props => props.$highlight ? '#fde68a' : 'var(--bg-secondary)'};
  color: ${props => props.$highlight ? '#92400e' : 'var(--text-secondary)'};
  border: 2px solid ${props => props.$highlight ? '#f59e0b' : 'var(--border-color)'};
  font-weight: 600;
  letter-spacing: 1px;
`;

const ClozeList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ClozeChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  font-size: 13px;
  color: var(--text-primary);
`;

const ClozeRemove = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 14px;
`;

const ClozeHint = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
`;

const FooterActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 2px solid var(--border-color);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const LoadingSpinner = styled.div`
  width: 60px;
  height: 60px;
  border: 4px solid var(--border-color);
  border-top-color: #63b3ed;
  border-radius: 50%;
  transition: transform 0.5s linear;
  animation: none;
`;

const ErrorMessage = styled.div`
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #22543d;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const PrivacyToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 2px solid var(--border-color);

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  
  input {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #63b3ed;
  }
`;

const EmptyCardsState = styled.div`
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  
  .icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  .text {
    font-size: 16px;
    font-weight: 500;
  }
`;

// Стили для тегов
const TagInputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  min-height: 48px;
  align-items: center;
  
  &:focus-within {
    border-color: #63b3ed;
  }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const TagInputField = styled.input`
  flex: 1;
  min-width: 120px;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  padding: 4px;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: var(--text-muted);
  }
`;

const PopularTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
`;

const PopularTag = styled.button`
  padding: 3px 10px;
  background: ${props => props.disabled ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'};
  border: 1px solid ${props => props.disabled ? 'var(--border-color)' : 'var(--border-light)'};
  color: ${props => props.disabled ? 'var(--text-muted)' : 'var(--text-primary)'};
  border-radius: 15px;
  font-size: 12px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.disabled ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)'};
    border-color: ${props => props.disabled ? 'var(--border-color)' : '#63b3ed'};
  }
`;

// ===== КОМПОНЕНТ =====
function SetBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';
  
  const isEditMode = Boolean(id);
  
  // Состояние формы
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState([]);
  const [cards, setCards] = useState([{ id: Date.now(), term: '', definition: '', pinyin: '', translation: '', imageUrl: '', tabSplit: false }]);
  const [clozeText, setClozeText] = useState('');
  const [clozeBlanks, setClozeBlanks] = useState([]);
  const [clozeError, setClozeError] = useState('');
  const [clozeNotice, setClozeNotice] = useState('');
  const [importText, setImportText] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  
  // Состояние загрузки
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [draftStatus, setDraftStatus] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitTarget, setExitTarget] = useState('/dashboard');
  const [savingDraft, setSavingDraft] = useState(false);

  const autosaveTimerRef = useRef(null);
  const lastSavedSnapshotRef = useRef('');
  const clozeTextRef = useRef(null);
  
  // Состояние загрузки пиньиня для каждой карточки
  const [loadingPinyin, setLoadingPinyin] = useState({});
  const [uploadingImage, setUploadingImage] = useState({});
  const [uploadingCover, setUploadingCover] = useState(false);
  
  // Состояние для отслеживания изменений терминов (для китайских карточек)
  const [originalTerms, setOriginalTerms] = useState({});
  
  // Загрузка данных при редактировании
  useEffect(() => {
    const init = async () => {
      if (isEditMode && id) {
        await loadSetData();
      }
      await loadDraft();
      loadPopularTags();
    };
    init();
  }, [isEditMode, id]);
  
  const loadPopularTags = async () => {
    try {
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/tags/popular`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPopularTags(data.data.map(t => t.tag));
        }
      }
    } catch (error) {
      console.error('Error loading popular tags:', error);
    }
  };

  const buildClozeSegments = (text, blanks) => {
    if (!text) return [];
    const sorted = [...blanks].sort((a, b) => a.start - b.start);
    const segments = [];
    let cursor = 0;

    sorted.forEach((blank, index) => {
      if (blank.start > cursor) {
        segments.push({ type: 'text', value: text.slice(cursor, blank.start) });
      }
      segments.push({ type: 'blank', index, answer: blank.answer });
      cursor = blank.end;
    });

    if (cursor < text.length) {
      segments.push({ type: 'text', value: text.slice(cursor) });
    }

    return segments;
  };

  const adjustClozeBlanksForTextChange = (prevText, nextText, prevBlanks) => {
    if (!prevBlanks.length) return prevBlanks;
    if (prevText === nextText) return prevBlanks;

    const minLen = Math.min(prevText.length, nextText.length);
    let prefix = 0;
    while (prefix < minLen && prevText[prefix] === nextText[prefix]) {
      prefix += 1;
    }

    let suffix = 0;
    while (
      suffix < minLen - prefix &&
      prevText[prevText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
    ) {
      suffix += 1;
    }

    const prevMidLen = prevText.length - prefix - suffix;
    const nextMidLen = nextText.length - prefix - suffix;
    const delta = nextMidLen - prevMidLen;
    const editStart = prefix;
    const suffixStartPrev = prevText.length - suffix;

    const nextBlanks = prevBlanks.map(blank => {
      if (blank.end <= editStart) {
        return blank;
      }

      if (blank.start >= suffixStartPrev) {
        const shiftedStart = blank.start + delta;
        const shiftedEnd = blank.end + delta;
        if (shiftedStart < 0 || shiftedEnd > nextText.length) return null;
        return { ...blank, start: shiftedStart, end: shiftedEnd, answer: nextText.slice(shiftedStart, shiftedEnd).trim() };
      }

      const adjustedStart = blank.start;
      const adjustedEnd = blank.end + delta;
      if (adjustedEnd <= adjustedStart) return null;
      if (adjustedStart < 0 || adjustedEnd > nextText.length) return null;
      const updatedAnswer = nextText.slice(adjustedStart, adjustedEnd).trim();
      if (!updatedAnswer) return null;
      return { ...blank, start: adjustedStart, end: adjustedEnd, answer: updatedAnswer };
    }).filter(Boolean);

    return nextBlanks.sort((a, b) => a.start - b.start);
  };

  const addClozeBlank = () => {
    setClozeError('');
    if (!clozeTextRef.current) return;
    const start = clozeTextRef.current.selectionStart;
    const end = clozeTextRef.current.selectionEnd;

    if (start === end) {
      setClozeError('Выделите слово или фразу для пропуска');
      return;
    }

    const raw = clozeText.slice(start, end);
    const trimmed = raw.trim();
    if (!trimmed) {
      setClozeError('Выделение не содержит текста');
      return;
    }

    const offset = raw.indexOf(trimmed);
    const blankStart = start + offset;
    const blankEnd = blankStart + trimmed.length;

    const overlaps = clozeBlanks.some(blank => blankStart < blank.end && blankEnd > blank.start);
    if (overlaps) {
      setClozeError('Этот участок уже используется как пропуск');
      return;
    }

    const nextBlanks = [...clozeBlanks, { start: blankStart, end: blankEnd, answer: trimmed }]
      .sort((a, b) => a.start - b.start);
    setClozeBlanks(nextBlanks);
  };

  const removeClozeBlank = (index) => {
    setClozeBlanks(prev => prev.filter((_, idx) => idx !== index));
  };

  const buildDraftPayload = () => {
    return {
      setId: isEditMode ? id : null,
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage || '',
      isPublic,
      tags: tags.filter(tag => tag.trim()),
      clozeText,
      clozeBlanks,
      cards: cards.map(card => ({
        id: String(card.id),
        term: card.term || '',
        definition: card.definition || '',
        pinyin: card.pinyin || '',
        translation: card.translation || '',
        imageUrl: card.imageUrl || ''
      }))
    };
  };

  const hasDraftData = () => {
    if (title.trim() || description.trim() || coverImage.trim()) return true;
    if (tags.length > 0) return true;
    if (clozeText.trim() || clozeBlanks.length > 0) return true;
    return cards.some(card => card.term.trim() || card.definition.trim());
  };

  const saveDraft = async (silent = false) => {
    if (!hasDraftData()) return;

    const snapshot = JSON.stringify(buildDraftPayload());
    if (snapshot === lastSavedSnapshotRef.current) return;

    setSavingDraft(true);
    try {
      const res = await authFetch(`${API_ROUTES.DATA.DRAFTS}/sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildDraftPayload())
      });

      if (res.ok) {
        const data = await res.json();
        lastSavedSnapshotRef.current = snapshot;
        if (!silent) {
          setDraftStatus('Черновик сохранен');
          setTimeout(() => setDraftStatus(''), 2000);
        }
      }
    } catch (err) {
      if (!silent) {
        setDraftStatus('Ошибка сохранения черновика');
        setTimeout(() => setDraftStatus(''), 2500);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  const applyDraftData = (draft) => {
    setTitle(draft?.title || '');
    setDescription(draft?.description || '');
    setCoverImage(draft?.coverImage || '');
    setIsPublic(Boolean(draft?.isPublic));
    setTags(draft?.tags || []);
    setClozeText(draft?.clozeText || '');
    setClozeBlanks(draft?.clozeBlanks || []);

    const draftCards = Array.isArray(draft?.cards) && draft.cards.length > 0
      ? draft.cards.map((card, index) => ({
        id: card.id || String(Date.now() + index),
        term: card.term || '',
        definition: card.definition || '',
        pinyin: card.pinyin || '',
        translation: card.translation || '',
        imageUrl: card.imageUrl || '',
        tabSplit: false
      }))
      : [{ id: Date.now(), term: '', definition: '', pinyin: '', translation: '', imageUrl: '', tabSplit: false }];

    setCards(draftCards);

    const termsMap = {};
    draftCards.forEach(card => {
      termsMap[card.id] = card.term;
    });
    setOriginalTerms(termsMap);

    const snapshot = JSON.stringify({
      setId: isEditMode ? id : null,
      title: draft?.title || '',
      description: draft?.description || '',
      coverImage: draft?.coverImage || '',
      isPublic: Boolean(draft?.isPublic),
      tags: draft?.tags || [],
      clozeText: draft?.clozeText || '',
      clozeBlanks: draft?.clozeBlanks || [],
      cards: draftCards.map(card => ({
        id: String(card.id),
        term: card.term || '',
        definition: card.definition || '',
        pinyin: card.pinyin || '',
        translation: card.translation || '',
        imageUrl: card.imageUrl || ''
      }))
    });
    lastSavedSnapshotRef.current = snapshot;
  };

  const loadDraft = async () => {
    try {
      const params = isEditMode && id ? `?setId=${id}` : '';
      const res = await authFetch(`${API_ROUTES.DATA.DRAFTS}/sets${params}`);
      if (!res.ok) return;
      const draft = await res.json();
      if (draft) {
        applyDraftData(draft);
        setDraftStatus('Черновик восстановлен');
        setTimeout(() => setDraftStatus(''), 2500);
      }
    } catch (err) {
      console.warn('Draft load error:', err);
    }
  };

  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (!hasDraftData()) return;

    const snapshot = JSON.stringify(buildDraftPayload());
    if (snapshot === lastSavedSnapshotRef.current) return;

    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(true);
    }, 1500);

    return () => clearTimeout(autosaveTimerRef.current);
  }, [title, description, coverImage, isPublic, tags, cards, clozeText, clozeBlanks]);
  
  // useEffect для отслеживания изменения term
  // Если term изменился и это китайское слово - сбрасываем pinyin и translation
  useEffect(() => {
    cards.forEach(card => {
      const cardIsChinese = isChinese(card.term);
      const originalTerm = originalTerms[card.id];
      
      // Если карточка китайская и term изменился с момента последнего сохранения
      if (cardIsChinese && originalTerm !== undefined && originalTerm !== card.term) {
        // Если есть pinyin или translation - они устарели
        if (card.pinyin || card.translation) {
          // Помечаем, что данные устарели, но не сбрасываем автоматически
          // Пользователь увидит кнопку "Обновить"
        }
      }
    });
  }, [cards, originalTerms]);
  
  const loadSetData = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные набора');
      }
      const data = await response.json();
      
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCoverImage(data.coverImage || '');
      setIsPublic(data.isPublic || false);
      setTags(data.tags || []);
      setClozeText(data.clozeText || '');
      setClozeBlanks(data.clozeBlanks || []);
      
      if (data.flashcards && data.flashcards.length > 0) {
        const loadedCards = data.flashcards.map((card, index) => ({
          id: Date.now() + index,
          term: card.term || '',
          definition: card.definition || '',
          pinyin: card.pinyin || '',
          translation: card.translation || '',
          imageUrl: card.imageUrl || '',
          tabSplit: false
        }));
        
        setCards(loadedCards);
        
        // Сохраняем оригинальные термины для отслеживания изменений
        const termsMap = {};
        loadedCards.forEach(card => {
          termsMap[card.id] = card.term;
        });
        setOriginalTerms(termsMap);

        lastSavedSnapshotRef.current = JSON.stringify({
          setId: id,
          title: data.title || '',
          description: data.description || '',
          coverImage: data.coverImage || '',
          isPublic: Boolean(data.isPublic),
          tags: data.tags || [],
          clozeText: data.clozeText || '',
          clozeBlanks: data.clozeBlanks || [],
          cards: loadedCards.map(card => ({
            id: String(card.id),
            term: card.term || '',
            definition: card.definition || '',
            pinyin: card.pinyin || '',
            translation: card.translation || '',
            imageUrl: card.imageUrl || ''
          }))
        });
      }
    } catch (err) {
      setError('Ошибка загрузки набора: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Добавление новой карточки
  const addCard = () => {
    const newCard = { id: Date.now(), term: '', definition: '', pinyin: '', translation: '', imageUrl: '', tabSplit: false };
    setCards([...cards, newCard]);
    // Сохраняем пустой оригинальный термин для новой карточки
    setOriginalTerms(prev => ({ ...prev, [newCard.id]: '' }));
    
    // Прокрутка к новой карточке
    setTimeout(() => {
      const container = document.querySelector('.cards-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  };
  
  // Удаление карточки
  const removeCard = (cardId) => {
    if (cards.length <= 1) {
      setError('Набор должен содержать хотя бы одну карточку');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setCards(cards.filter(card => card.id !== cardId));
    // Удаляем оригинальный термин
    setOriginalTerms(prev => {
      const newTerms = { ...prev };
      delete newTerms[cardId];
      return newTerms;
    });
  };
  
  // Обработчики тегов
  const handleAddTag = (tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Удаляем последний тег при Backspace в пустом поле
      handleRemoveTag(tags[tags.length - 1]);
    }
  };
  
  const handleTagBlur = () => {
    if (tagInput.trim()) {
      handleAddTag(tagInput);
    }
  };
  
  // Обновление поля карточки
  const updateCard = (cardId, field, value) => {
    setCards(cards.map(card => {
      if (card.id === cardId) {
        // Если обновляется term и это новое значение
        if (field === 'term') {
          // Инициализируем оригинальный термин если его еще нет
          if (originalTerms[cardId] === undefined) {
            setOriginalTerms(prev => ({ ...prev, [cardId]: card.term }));
          }
        }
        return { ...card, [field]: value };
      }
      return card;
    }));
  };

  const applyTabSplit = (cardId, value) => {
    const parts = value.split('\t');
    const termValue = parts[0]?.trim() || '';
    const definitionValue = parts.slice(1).join(' ').trim();

    if (!termValue) return;

    setCards(prev => prev.map(card => (
      card.id === cardId
        ? { ...card, term: termValue, definition: definitionValue, tabSplit: true }
        : card
    )));

    requestAnimationFrame(() => {
      const defInput = document.querySelector(`[data-definition-input="${cardId}"]`);
      defInput?.focus();
    });
  };

  // Загрузка изображения с компьютера
  const handleImageUpload = async (cardId, file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой (макс. 5 МБ)');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setUploadingImage(prev => ({ ...prev, [cardId]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadUrl = `${API_BASE_URL}/upload`;
      const res = await authFetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.imageUrl) {
        throw new Error(data?.message || 'Ошибка загрузки');
      }
      updateCard(cardId, 'imageUrl', data.data.imageUrl);
      setSuccess('Изображение загружено ✅');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки изображения');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingImage(prev => ({ ...prev, [cardId]: false }));
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Файл слишком большой (макс. 5 МБ)');
      setTimeout(() => setError(null), 3000);
      return;
    }
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadUrl = `${API_BASE_URL}/upload`;
      const res = await authFetch(uploadUrl, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.imageUrl) {
        throw new Error(data?.message || 'Ошибка загрузки');
      }
      setCoverImage(data.data.imageUrl);
      setSuccess('Превью набора обновлено ✅');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки изображения');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingCover(false);
    }
  };
  
  // Добавление пиньиня и перевода для китайской карточки
  const handleAddPinyin = async (cardId, chineseText) => {
    if (!chineseText.trim()) return;
    
    // Проверяем, что текст содержит китайские символы
    if (!isChinese(chineseText)) {
      setError('Текст не содержит китайских иероглифов');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setLoadingPinyin(prev => ({ ...prev, [cardId]: true }));
    
    try {
      const data = await getChineseData(chineseText.trim());

      setCards(prevCards => prevCards.map(card => {
        if (card.id === cardId) {
          return { 
            ...card, 
            pinyin: data.pinyin, 
            translation: data.translation
          };
        }
        return card;
      }));
      
      // Обновляем оригинальный термин после успешного получения данных
      setOriginalTerms(prev => ({ ...prev, [cardId]: chineseText.trim() }));
      
      setSuccess('Пиньинь и перевод добавлены! ✨');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Ошибка получения данных: ' + err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoadingPinyin(prev => ({ ...prev, [cardId]: false }));
    }
  };
  
  // Удаление пиньиня и перевода
  const handleDeletePinyin = (cardId) => {
    setCards(prevCards => prevCards.map(card => {
      if (card.id !== cardId) return card;
      return { ...card, pinyin: '', translation: '' };
    }));
    
    setSuccess('Пиньинь и перевод удалены 🗑️');
    setTimeout(() => setSuccess(null), 2000);
  };
  
  // Проверка, изменился ли термин с момента получения пиньиня
  const isTermChanged = (card) => {
    const originalTerm = originalTerms[card.id];
    if (originalTerm === undefined) return false;
    return originalTerm !== card.term;
  };
  
  // Импорт из текста
  const handleImport = () => {
    if (!importText.trim()) {
      setError('Введите текст для импорта');
      return;
    }
    
    const lines = importText.split('\n').filter(line => line.trim());
    const newCards = [];
    
    for (const line of lines) {
      let term = '';
      let definition = '';
      let pinyin = '';
      let translation = '';
      
      // TAB имеет приоритет для удобного импорта из Excel/Google Sheets
      const tabSeparator = '\t';
      if (line.includes(tabSeparator)) {
        const parts = line.split(tabSeparator).map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 2) {
          term = parts[0];
          
          // Автоопределение формата по количеству колонок
          if (parts.length === 2) {
            // Формат: Термин TAB Определение
            definition = parts[1];
          } else if (parts.length === 3) {
            // Формат: Термин TAB Пиньинь TAB Перевод (для китайского)
            // или: Термин TAB Определение TAB Перевод
            if (isChinese(term)) {
              pinyin = parts[1];
              definition = parts[2];
            } else {
              definition = parts[1];
              translation = parts[2];
            }
          } else if (parts.length >= 4) {
            // Формат: Термин TAB Пиньинь TAB Перевод TAB Определение
            // или: Термин TAB Определение TAB Примечание TAB Другое
            if (isChinese(term)) {
              pinyin = parts[1];
              definition = parts[2];
              translation = parts[3];
            } else {
              definition = parts[1];
              translation = parts[2];
              pinyin = parts[3]; // или другое поле
            }
          }
        }
      } else {
        // Обычные разделители (дефисы, точка с запятой — Quizlet позволяет экспорт с ";")
        const separators = [' - ', ' – ', ' — ', '; ', ' -', '- ', '-'];
        
        for (const separator of separators) {
          if (line.includes(separator)) {
            const parts = line.split(separator);
            if (parts.length >= 2) {
              term = parts[0].trim();
              definition = parts.slice(1).join(separator).trim();
              
              // Проверяем, является ли термин китайским
              if (isChinese(term)) {
                // Формат: 你好 - pinyin - перевод
                const subParts = definition.split(' - ');
                if (subParts.length >= 2) {
                  pinyin = subParts[0].trim();
                  definition = subParts.slice(1).join(' - ').trim();
                }
              }
            }
            break;
          }
        }
      }
      
      if (term && definition) {
        const newCard = {
          id: Date.now() + Math.random(),
          term,
          definition,
          pinyin,
          translation,
          imageUrl: '',
          tabSplit: false
        };
        newCards.push(newCard);
      }
    }
    
    if (newCards.length === 0) {
      setError('Не удалось распознать формат. Используйте TAB или дефис: термин - определение');
      return;
    }
    
    setCards([...cards, ...newCards]);
    
    // Сохраняем оригинальные термины для импортированных карточек
    const newTermsMap = { ...originalTerms };
    newCards.forEach(card => {
      newTermsMap[card.id] = card.term;
    });
    setOriginalTerms(newTermsMap);
    
    setImportText('');
    setSuccess(`Добавлено ${newCards.length} карточек! 🎉`);
    setTimeout(() => setSuccess(null), 3000);
  };
  
  // Валидация перед сохранением
  const validateForm = () => {
    if (!title.trim()) {
      setError('Введите название набора');
      return false;
    }
    
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length === 0) {
      setError('Добавьте хотя бы одну заполненную карточку');
      return false;
    }
    
    return true;
  };
  
  // Сохранение набора
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    
    const setData = {
      title: title.trim(),
      description: description.trim(),
      coverImage: coverImage || '',
      isPublic,
      tags: tags.filter(tag => tag.trim()),
      clozeText: clozeText || '',
      clozeBlanks: clozeBlanks || [],
      flashcards: validCards.map(card => ({
        term: card.term.trim(),
        definition: card.definition.trim(),
        pinyin: card.pinyin || '',
        translation: card.translation || '',
        imageUrl: card.imageUrl || ''
      }))
    };
    
    try {
      const url = isEditMode 
        ? `${API_ROUTES.DATA.SETS}/${id}`
        : API_ROUTES.DATA.SETS;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await authFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(setData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка сохранения набора');
      }
      
      const savedSet = await response.json();

      try {
        const params = isEditMode && id ? `?setId=${id}` : '';
        await authFetch(`${API_ROUTES.DATA.DRAFTS}/sets${params}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Draft delete error:', err);
      }
      
      // Показываем успех и переходим на Dashboard
      alert(isEditMode ? '✅ Набор обновлен!' : '✅ Набор создан!');
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError('Ошибка: ' + err.message);
      setSaving(false);
    }
  };

  const requestExit = (target) => {
    const snapshot = JSON.stringify(buildDraftPayload());
    const hasChanges = snapshot !== lastSavedSnapshotRef.current;
    if (!hasChanges) {
      navigate(target);
      return;
    }

    setExitTarget(target);
    setShowExitConfirm(true);
  };

  const handleExit = async (saveBeforeExit) => {
    if (saveBeforeExit) {
      await saveDraft(false);
    }
    setShowExitConfirm(false);
    navigate(exitTarget);
  };
  
  // Отмена
  const handleCancel = () => {
    requestExit('/dashboard');
  };
  
  if (loading) {
    return (
      <LoadingOverlay>
        <LoadingSpinner />
      </LoadingOverlay>
    );
  }
  
  return (
    <PageContainer>
      <Header>
        <Logo onClick={() => requestExit('/dashboard')}>
          <span className="text">FluffyCards</span>
        </Logo>
        
        <HeaderActions>
          <CardCounter>
            <span>📝</span>
            <span>Карточек:</span>
            <span className="count">{cards.length}</span>
          </CardCounter>

          {(savingDraft || draftStatus) && (
            <DraftStatus>
              {savingDraft ? 'Сохранение черновика...' : draftStatus}
            </DraftStatus>
          )}
          
          <SecondaryButton onClick={handleCancel} disabled={saving}>
            ❌ Отмена
          </SecondaryButton>
          
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
          </PrimaryButton>
        </HeaderActions>
      </Header>
      
      <MainContent>
        <PageTitle>
          <span className="emoji">{isEditMode ? '✏️' : '📝'}</span>
          {isEditMode ? 'Редактирование набора' : 'Создание нового набора'}
        </PageTitle>
        <PageSubtitle>
          {isEditMode 
            ? 'Внесите изменения и сохраните набор' 
            : 'Создайте свой набор карточек для изучения'}
        </PageSubtitle>
        
        {error && (
          <ErrorMessage>
            ⚠️ {error}
          </ErrorMessage>
        )}
        
        {success && (
          <SuccessMessage>
            ✅ {success}
          </SuccessMessage>
        )}
        
        {/* Информация о наборе */}
        <FormSection>
          <SectionTitle>
            <span className="icon">📋</span>
            Информация о наборе
          </SectionTitle>
          
          <FormGroup>
            <Label>
              Название набора <span className="required">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Например: Английские слова для путешествий"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Описание</Label>
            <TextArea
              placeholder="Добавьте описание, чтобы лучше запомнить, что изучаете..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </FormGroup>

          <FormGroup>
            <Label>🖼️ Превью набора</Label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Input
                type="text"
                placeholder="https://example.com/cover.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                style={{ flex: 1 }}
              />
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)',
                color: 'white',
                borderRadius: '12px',
                cursor: uploadingCover ? 'wait' : 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: uploadingCover ? 0.6 : 1
              }}>
                {uploadingCover ? '⏳' : '📁'} Загрузить
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverUpload(file);
                    e.target.value = '';
                  }}
                  disabled={uploadingCover}
                />
              </label>
            </div>
            {coverImage && (
              <div style={{ marginTop: '10px' }}>
                <CardPreviewImage
                  src={resolveImageUrl(coverImage)}
                  alt="Cover preview"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </FormGroup>
          
          <PrivacyToggle>
            <ToggleLabel>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>🌍 Сделать набор публичным</span>
            </ToggleLabel>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Публичные наборы видны всем пользователям
            </span>
          </PrivacyToggle>
          
          {/* Теги */}
          <FormGroup style={{ marginTop: '20px' }}>
            <Label>🏷️ Теги</Label>
            <TagInputContainer>
              <TagList>
                {tags.map((tag, index) => (
                  <Tag key={index}>
                    {tag}
                    <TagRemove onClick={() => handleRemoveTag(tag)}>×</TagRemove>
                  </Tag>
                ))}
              </TagList>
              <TagInputField
                type="text"
                placeholder={tags.length === 0 ? "Добавьте теги (Enter или запятая)" : ""}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={handleTagBlur}
              />
            </TagInputContainer>
            {popularTags.length > 0 && (
              <PopularTags>
                <span>Популярные:</span>
                {popularTags.slice(0, 8).map((tag, index) => (
                  <PopularTag 
                    key={index} 
                    onClick={() => handleAddTag(tag)}
                    disabled={tags.includes(tag)}
                  >
                    {tag}
                  </PopularTag>
                ))}
              </PopularTags>
            )}
          </FormGroup>
        </FormSection>

        {/* Текст с пропусками */}
        <FormSection>
          <SectionTitle>
            <span className="icon">🧩</span>
            Текст с пропусками
          </SectionTitle>

          <ClozeEditor>
            <ClozeTextArea
              ref={clozeTextRef}
              placeholder="Вставьте полный текст, затем выделите слова или фразы и нажмите 'Сделать пропуск'"
              value={clozeText}
              onChange={(e) => {
                const next = e.target.value;
                const updatedBlanks = adjustClozeBlanksForTextChange(clozeText, next, clozeBlanks);
                setClozeText(next);
                if (updatedBlanks.length !== clozeBlanks.length) {
                  setClozeNotice('Текст изменен, пропуски обновлены');
                  setTimeout(() => setClozeNotice(''), 2500);
                }
                setClozeBlanks(updatedBlanks);
              }}
            />

            <ClozeActions>
              <PrimaryButton onClick={addClozeBlank} type="button">
                ✂️ Сделать пропуск
              </PrimaryButton>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setClozeText('');
                  setClozeBlanks([]);
                }}
              >
                Очистить текст
              </SecondaryButton>
              <DraftStatus>
                Пропусков: {clozeBlanks.length}
              </DraftStatus>
            </ClozeActions>

            {(clozeError || clozeNotice) && (
              <ClozeHint style={{ color: clozeError ? '#ef4444' : 'var(--text-secondary)' }}>
                {clozeError || clozeNotice}
              </ClozeHint>
            )}

            <ClozePreview>
              {clozeText
                ? buildClozeSegments(clozeText, clozeBlanks).map((segment, idx) => {
                    if (segment.type === 'text') {
                      return <span key={`text-${idx}`}>{segment.value}</span>;
                    }
                    return (
                      <ClozeBlank key={`blank-${idx}`} $highlight>
                        ...
                      </ClozeBlank>
                    );
                  })
                : 'Здесь появится предпросмотр текста с пропусками'}
            </ClozePreview>

            {clozeBlanks.length > 0 && (
              <ClozeList>
                {clozeBlanks.map((blank, index) => (
                  <ClozeChip key={`${blank.start}-${blank.end}-${index}`}>
                    «{blank.answer}»
                    <ClozeRemove type="button" onClick={() => removeClozeBlank(index)}>✕</ClozeRemove>
                  </ClozeChip>
                ))}
              </ClozeList>
            )}
          </ClozeEditor>
        </FormSection>
        
        {/* Импорт из текста */}
        <FormSection>
          <ToggleSection 
            $isOpen={isImportOpen}
            onClick={() => setIsImportOpen(!isImportOpen)}
          >
            <span>📥 Импорт из текста / Quizlet</span>
            <span className="arrow">▼</span>
          </ToggleSection>
          
          <ImportSection $isOpen={isImportOpen}>
            <ImportTextArea
              placeholder={`📋 Обычный формат (с дефисом):
Солнце - звезда в центре Солнечной системы
Вода - химическое соединение H2O

📊 Из Quizlet / Excel / Google Sheets (TAB):
Скопируйте карточки из Quizlet (Экспорт → Копировать)
или из таблицы Excel и вставьте сюда!

🇨🇳 Для китайских слов (TAB - 3 колонки):
你好\tnǐ hǎo\tпривет
中国\tzhōng guó\tКитай

💡 Quizlet: откройте набор → ⋯ → Экспорт → Копировать`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            <ImportHint>
              💡 <strong>Из Quizlet:</strong> откройте набор → <code>⋯</code> → <code>Экспорт</code> → скопируйте и вставьте сюда<br/>
              <strong>Обычный:</strong> <code>термин - определение</code><br/>
              <strong>Excel/Google Sheets:</strong> скопируйте прямо из таблицы — TAB разделит автоматически<br/>
              <strong>Китайский (TAB):</strong> <code>иероглиф[Tab]пиньинь[Tab]перевод</code>
            </ImportHint>
            <ImportButton onClick={handleImport} disabled={!importText.trim()}>
              📥 Импортировать карточки
            </ImportButton>
          </ImportSection>
        </FormSection>
        
        {/* Карточки */}
        <FormSection className="cards-container">
          <SectionTitle>
            <span className="icon">🎴</span>
            Карточки <span style={{ color: '#63b3ed' }}>({cards.length})</span>
          </SectionTitle>
          
          <CardsContainer>
            {cards.length === 0 ? (
              <EmptyCardsState>
                <div className="icon">📝</div>
                <div className="text">Нет карточек. Добавьте первую!</div>
              </EmptyCardsState>
            ) : (
              cards.map((card, index) => {
                const cardIsChinese = isChinese(card.term);
                const termChanged = isTermChanged(card);
                const hasPinyinData = card.pinyin || card.translation;
                
                return (
                  <CardItem 
                    key={card.id} 
                    data-number={index + 1}
                    $isChinese={cardIsChinese}
                  >
                    <CardRow>
                      <CardField>
                        <CardFieldLabel>
                          Термин
                          {card.tabSplit && (
                            <TabSplitBadge>TAB</TabSplitBadge>
                          )}
                          {cardIsChinese && (
                            <ChineseBadge>🇨🇳 Китайский</ChineseBadge>
                          )}
                        </CardFieldLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <CardInput
                            placeholder="Введите термин..."
                            value={card.term}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.includes('\t')) {
                                applyTabSplit(card.id, value);
                                return;
                              }
                              updateCard(card.id, 'term', value);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Tab' && card.term.trim()) {
                                e.preventDefault();
                                const defInput = document.querySelector(`[data-definition-input="${card.id}"]`);
                                if (defInput) defInput.focus();
                              }
                            }}
                            style={{ ...cardIsChinese ? { borderColor: '#fc8181' } : {}, flex: 1 }}
                          />
                          <VoiceInput
                            onResult={(text) => updateCard(card.id, 'term', text)}
                            disabled={false}
                            contextText={card.term}
                          />
                        </div>
                        
                        {/* Отображение пиньиня под термином */}
                        {card.pinyin && (
                          <PinyinDisplay>
                            🔊 {card.pinyin}
                          </PinyinDisplay>
                        )}
                        
                        {/* Кнопки для китайских слов */}
                        {cardIsChinese && (
                          <ChineseButtonsContainer>
                            {/* Кнопка добавления/обновления пиньиня */}
                            {(!hasPinyinData || termChanged) && (
                              <AddPinyinButton
                                onClick={() => handleAddPinyin(card.id, card.term)}
                                disabled={loadingPinyin[card.id] || !card.term.trim()}
                              >
                                <span className="sparkle">{termChanged ? '🔄' : '✨'}</span>
                                {loadingPinyin[card.id] 
                                  ? 'Загрузка...' 
                                  : termChanged 
                                    ? 'Обновить пиньинь' 
                                    : 'Добавить пиньинь и перевод'
                                }
                              </AddPinyinButton>
                            )}
                            
                            {/* Кнопка удаления пиньиня и перевода */}
                            {hasPinyinData && (
                              <DeletePinyinButton
                                onClick={() => handleDeletePinyin(card.id)}
                                title="Удалить пиньинь и перевод"
                              >
                                🗑️ Удалить пиньинь и перевод
                              </DeletePinyinButton>
                            )}
                          </ChineseButtonsContainer>
                        )}
                      </CardField>
                      
                      <CardField>
                        <CardFieldLabel>
                          Определение
                        </CardFieldLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <CardInput
                            placeholder="Введите определение..."
                            value={card.definition}
                            onChange={(e) => updateCard(card.id, 'definition', e.target.value)}
                            data-definition-input={card.id}
                            style={{ flex: 1 }}
                          />
                          <VoiceInput
                            onResult={(text) => updateCard(card.id, 'definition', text)}
                            disabled={false}
                            contextText={card.definition}
                          />
                        </div>
                      </CardField>
                      
                      <DeleteButton 
                        onClick={() => removeCard(card.id)}
                        title="Удалить карточку"
                      >
                        ✕
                      </DeleteButton>
                    </CardRow>
                    
                    {/* Поле для изображения */}
                    <CardRow>
                      <CardField style={{ flex: 2 }}>
                        <CardFieldLabel>
                          🖼️ Изображение
                        </CardFieldLabel>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <CardInput
                            placeholder="https://example.com/image.jpg"
                            value={card.imageUrl || ''}
                            onChange={(e) => updateCard(card.id, 'imageUrl', e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)',
                            color: 'white',
                            borderRadius: '12px',
                            cursor: uploadingImage[card.id] ? 'wait' : 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            opacity: uploadingImage[card.id] ? 0.6 : 1
                          }}>
                            {uploadingImage[card.id] ? '⏳' : '📁'} Загрузить
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(card.id, file);
                                e.target.value = '';
                              }}
                              disabled={uploadingImage[card.id]}
                            />
                          </label>
                        </div>
                      </CardField>
                      {card.imageUrl && (
                        <CardField style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                          <CardPreviewImage
                            src={resolveImageUrl(card.imageUrl)} 
                            alt="Preview" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </CardField>
                      )}
                    </CardRow>
                    
                    {/* Дополнительные поля для китайских карточек */}
                    {cardIsChinese && (
                      <CardRow>
                        <CardField>
                          <CardFieldLabel>
                            Пиньинь <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(произношение)</span>
                          </CardFieldLabel>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <CardInput
                              placeholder="Пиньинь появится здесь..."
                              value={card.pinyin}
                              onChange={(e) => updateCard(card.id, 'pinyin', e.target.value)}
                              style={{ fontStyle: 'italic', color: 'var(--text-secondary)', flex: 1 }}
                            />
                            <VoiceInput
                              onResult={(text) => updateCard(card.id, 'pinyin', text)}
                              disabled={false}
                              contextText={card.term}
                            />
                          </div>
                        </CardField>
                        
                        <CardField>
                          <CardFieldLabel>
                            Перевод <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>(автоматический)</span>
                          </CardFieldLabel>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <CardInput
                              placeholder="Перевод появится здесь..."
                              value={card.translation}
                              onChange={(e) => updateCard(card.id, 'translation', e.target.value)}
                              style={{ flex: 1 }}
                            />
                            <VoiceInput
                              onResult={(text) => updateCard(card.id, 'translation', text)}
                              disabled={false}
                              contextText={card.translation}
                            />
                          </div>
                        </CardField>
                      </CardRow>
                    )}
                  </CardItem>
                );
              })
            )}
          </CardsContainer>
          
          <AddCardButton onClick={addCard}>
            <span className="plus">+</span>
            Добавить карточку
          </AddCardButton>
        </FormSection>
        
        {/* Действия внизу страницы */}
        <FooterActions>
          <SecondaryButton onClick={handleCancel} disabled={saving}>
            ❌ Отмена
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <span>⏳</span>
                Сохранение...
              </>
            ) : (
              <>
                💾 {isEditMode ? 'Сохранить изменения' : 'Сохранить набор'}
              </>
            )}
          </PrimaryButton>
        </FooterActions>
      </MainContent>

      {showExitConfirm && (
        <ConfirmOverlay onClick={() => setShowExitConfirm(false)}>
          <ConfirmModal onClick={(e) => e.stopPropagation()}>
            <ConfirmHeader>Покинуть страницу?</ConfirmHeader>
            <ConfirmBody>
              Есть несохраненные изменения. Хотите сохранить черновик перед выходом?
            </ConfirmBody>
            <ConfirmActions>
              <PrimaryButton onClick={() => handleExit(true)} disabled={savingDraft}>
                💾 Сохранить черновик и выйти
              </PrimaryButton>
              <DangerButton onClick={() => handleExit(false)}>
                Выйти без сохранения
              </DangerButton>
              <SecondaryButton onClick={() => setShowExitConfirm(false)}>
                Остаться
              </SecondaryButton>
            </ConfirmActions>
          </ConfirmModal>
        </ConfirmOverlay>
      )}
    </PageContainer>
  );
}

export default SetBuilder;
