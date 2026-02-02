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
