import React, { createContext, useContext, useState, useEffect } from 'react';

const themes = {
  default: {
    name: 'Стандартная',
    primary: '#63b3ed',
    secondary: '#4299e1',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
    cardBg: '#ffffff',
    text: '#2d3748',
    textMuted: '#718096',
    border: '#e2e8f0',
    buttonGradient: 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  dark: {
    name: 'Темная',
    primary: '#63b3ed',
    secondary: '#4a5568',
    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #1a202c 100%)',
    cardBg: '#2d3748',
    text: '#e2e8f0',
    textMuted: '#a0aec0',
    border: '#4a5568',
    buttonGradient: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  pink: {
    name: 'Розовая',
    primary: '#f687b3',
    secondary: '#ed64a6',
    background: 'linear-gradient(135deg, #fff5f7 0%, #fed7e2 50%, #fbb6ce 100%)',
    cardBg: '#ffffff',
    text: '#702459',
    textMuted: '#97266d',
    border: '#fbb6ce',
    buttonGradient: 'linear-gradient(135deg, #f687b3 0%, #ed64a6 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  mint: {
    name: 'Мятная',
    primary: '#68d391',
    secondary: '#48bb78',
    background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 50%, #9ae6b4 100%)',
    cardBg: '#ffffff',
    text: '#22543d',
    textMuted: '#276749',
    border: '#9ae6b4',
    buttonGradient: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  cosmic: {
    name: 'Космическая',
    primary: '#9f7aea',
    secondary: '#805ad5',
    background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #553c9a 50%, #2d3748 75%, #1a202c 100%)',
    cardBg: 'rgba(45, 55, 72, 0.9)',
    text: '#e9d8fd',
    textMuted: '#b794f6',
    border: '#6b46c1',
    buttonGradient: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  sunrise: {
    name: 'Рассвет',
    primary: '#f6ad55',
    secondary: '#ed8936',
    background: 'linear-gradient(135deg, #fffaf0 0%, #feebc8 25%, #fbd38d 50%, #f6ad55 75%, #ed8936 100%)',
    cardBg: '#fffaf0',
    text: '#7b341e',
    textMuted: '#9c4221',
    border: '#fbd38d',
    buttonGradient: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  ocean: {
    name: 'Океан',
    primary: '#4fd1c5',
    secondary: '#38b2ac',
    background: 'linear-gradient(135deg, #e6fffa 0%, #b2f5ea 25%, #81e6d9 50%, #4fd1c5 75%, #38b2ac 100%)',
    cardBg: '#f0ffff',
    text: '#234e52',
    textMuted: '#2c7a7b',
    border: '#81e6d9',
    buttonGradient: 'linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  forest: {
    name: 'Лес',
    primary: '#68d391',
    secondary: '#276749',
    background: 'linear-gradient(135deg, #1a332a 0%, #22543d 25%, #276749 50%, #2f855a 75%, #22543d 100%)',
    cardBg: 'rgba(34, 84, 61, 0.85)',
    text: '#c6f6d5',
    textMuted: '#9ae6b4',
    border: '#2f855a',
    buttonGradient: 'linear-gradient(135deg, #68d391 0%, #48bb78 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  lavender: {
    name: 'Лавандовая',
    primary: '#b794f6',
    secondary: '#9f7aea',
    background: 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 25%, #d6bcfa 50%, #e9d8fd 75%, #faf5ff 100%)',
    cardBg: '#ffffff',
    text: '#44337a',
    textMuted: '#6b46c1',
    border: '#d6bcfa',
    buttonGradient: 'linear-gradient(135deg, #b794f6 0%, #9f7aea 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  sunset: {
    name: 'Закат',
    primary: '#fc8181',
    secondary: '#f56565',
    background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 20%, #fbb6ce 40%, #f687b3 60%, #d6bcfa 80%, #b794f6 100%)',
    cardBg: '#fff5f5',
    text: '#742a2a',
    textMuted: '#9b2c2c',
    border: '#feb2b2',
    buttonGradient: 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  neon: {
    name: 'Неоновая',
    primary: '#0bc5ea',
    secondary: '#00b5d8',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 25%, #1a1a2e 50%, #111827 75%, #0a0e1a 100%)',
    cardBg: 'rgba(26, 26, 46, 0.9)',
    text: '#e0f7fa',
    textMuted: '#76e4f7',
    border: '#1a3a4a',
    buttonGradient: 'linear-gradient(135deg, #0bc5ea 0%, #00b5d8 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  },
  cherry: {
    name: 'Сакура',
    primary: '#ed64a6',
    secondary: '#d53f8c',
    background: 'linear-gradient(135deg, #fff0f5 0%, #ffe4ef 25%, #ffd1e8 50%, #ffb8d9 75%, #ffd1e8 100%)',
    cardBg: '#fff5f8',
    text: '#702459',
    textMuted: '#97266d',
    border: '#fbb6ce',
    buttonGradient: 'linear-gradient(135deg, #ed64a6 0%, #d53f8c 100%)',
    font: "'Nunito', 'Poppins', sans-serif"
  }
};

const fonts = {
  default: { name: 'Стандартный', value: "'Nunito', 'Poppins', sans-serif" },
  dyslexic: { name: 'Для дислексии', value: "'Comic Sans MS', 'Chalkboard SE', sans-serif" },
  large: { name: 'Крупный шрифт', value: "'Nunito', 'Poppins', sans-serif", size: '120%' }
};

const avatars = [
  { id: 'default', emoji: '👤', name: 'Стандартный' },
  { id: 'cat', emoji: '🐱', name: 'Котик' },
  { id: 'dog', emoji: '🐶', name: 'Песик' },
  { id: 'fox', emoji: '🦊', name: 'Лисичка' },
  { id: 'panda', emoji: '🐼', name: 'Панда' },
  { id: 'rabbit', emoji: '🐰', name: 'Зайчик' },
  { id: 'bear', emoji: '🐻', name: 'Мишка' },
  { id: 'tiger', emoji: '🐯', name: 'Тигренок' },
  { id: 'penguin', emoji: '🐧', name: 'Пингвин' },
  { id: 'koala', emoji: '🐨', name: 'Коала' },
  { id: 'lion', emoji: '🦁', name: 'Львенок' },
  { id: 'unicorn', emoji: '🦄', name: 'Единорог' },
  { id: 'dragon', emoji: '🐲', name: 'Дракончик' },
  { id: 'robot', emoji: '🤖', name: 'Робот' },
  { id: 'alien', emoji: '👽', name: 'Пришелец' },
  { id: 'ghost', emoji: '👻', name: 'Привидение' }
];

const cardColors = {
  default: { bg: '#ffffff', border: '#e2e8f0', name: 'Белый' },
  blue: { bg: '#ebf8ff', border: '#90cdf4', name: 'Голубой' },
  green: { bg: '#f0fff4', border: '#9ae6b4', name: 'Зеленый' },
  yellow: { bg: '#fffff0', border: '#f6e05e', name: 'Желтый' },
  red: { bg: '#fff5f5', border: '#fc8181', name: 'Красный' },
  purple: { bg: '#faf5ff', border: '#d6bcfa', name: 'Фиолетовый' },
  pink: { bg: '#fff5f7', border: '#fbb6ce', name: 'Розовый' },
  orange: { bg: '#fffaf0', border: '#fbd38d', name: 'Оранжевый' }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'default';
  });
  
  const [font, setFont] = useState(() => {
    return localStorage.getItem('font') || 'default';
  });
  
  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('avatar') || 'default';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('font', font);
    localStorage.setItem('avatar', avatar);
    
    // Apply theme to body
    const themeData = themes[theme];
    document.body.style.fontFamily = fonts[font]?.value || themeData.font;
    if (fonts[font]?.size) {
      document.body.style.fontSize = fonts[font].size;
    } else {
      document.body.style.fontSize = '';
    }
  }, [theme, font, avatar]);

  const value = {
    theme,
    setTheme,
    themeData: themes[theme],
    themes,
    font,
    setFont,
    fonts,
    avatar,
    setAvatar,
    avatars,
    cardColors
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { themes, fonts, avatars, cardColors };
