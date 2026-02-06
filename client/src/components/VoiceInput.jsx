import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const VoiceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VoiceButton = styled.button`
  background: ${props => props.$isListening 
    ? 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' 
    : 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  ${props => props.$isListening && `
    animation: pulse 1.5s infinite;
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(229, 62, 62, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(229, 62, 62, 0);
      }
    }
  `}
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    animation: none;
    transform: none;
  }
`;

const LanguageSelect = styled.select`
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.75rem;
  background: var(--bg-secondary);
  color: #4a5568;
  cursor: pointer;
  
  &:hover {
    border-color: #63b3ed;
  }
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`;

const StatusText = styled.span`
  font-size: 0.75rem;
  color: ${props => props.$isListening ? '#e53e3e' : '#718096'};
  font-style: italic;
`;

// Доступные языки
const LANGUAGES = [
  { code: 'ru-RU', name: '🇷🇺 Русский', flag: '🇷🇺' },
  { code: 'en-US', name: '🇺🇸 English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '🇨🇳 中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-HK', name: '🇭🇰 中文 (繁體)', flag: '🇭🇰' },
  { code: 'ko-KR', name: '🇰🇷 한국어', flag: '🇰🇷' },
  { code: 'ja-JP', name: '🇯🇵 日本語', flag: '🇯🇵' },
  { code: 'de-DE', name: '🇩🇪 Deutsch', flag: '🇩🇪' },
  { code: 'fr-FR', name: '🇫🇷 Français', flag: '🇫🇷' },
  { code: 'es-ES', name: '🇪🇸 Español', flag: '🇪🇸' },
  { code: 'it-IT', name: '🇮🇹 Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: '🇧🇷 Português', flag: '🇧🇷' },
];

// Проверка поддержки Speech API
const isSpeechSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

// Определение языка по тексту (простая эвристика)
const detectLanguage = (text) => {
  // Китайские иероглифы
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
  // Корейские символы
  if (/[\uac00-\ud7af]/.test(text)) return 'ko-KR';
  // Японские символы (хирагана/катакана)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja-JP';
  // Русские буквы
  if (/[\u0400-\u04ff]/.test(text)) return 'ru-RU';
  // По умолчанию английский
  return 'en-US';
};

const VoiceInput = ({ onResult, disabled = false, autoDetect = true }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('ru-RU');
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const onResultRef = useRef(onResult);
  
  // Keep refs in sync with latest values
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);
  
  const setupRecognition = (lang) => {
    if (!isSpeechSupported()) return;
    
    // Stop old instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      transcriptRef.current = '';
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0] && result[0].transcript) {
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }
      }
      
      if (finalTranscript) {
        setTranscript(prev => {
          const updated = prev + finalTranscript;
          transcriptRef.current = updated;
          return updated;
        });
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error, 'Language:', lang);
      setIsListening(false);
      
      switch (event.error) {
        case 'language-not-supported':
          console.warn(`Language ${lang} is not supported, falling back to English`);
          setLanguage('en-US');
          break;
        case 'no-speech':
          break;
        case 'audio-capture':
          console.error('No microphone found or microphone is not working');
          break;
        case 'not-allowed':
          console.error('Microphone permission denied');
          break;
        default:
          console.error('Unknown speech recognition error:', event.error);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        onResultRef.current(finalText);
        setTranscript('');
        transcriptRef.current = '';
      }
    };
    
    recognitionRef.current = recognition;
  };
  
  useEffect(() => {
    setupRecognition(language);
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, [language]);
  
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Голосовой ввод не поддерживается в вашем браузере. Используйте Chrome или Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        
        if (language !== 'en-US') {
          console.log('Trying fallback to English...');
          setLanguage('en-US');
          // setupRecognition will be called by the useEffect
        } else {
          alert('Не удалось запустить распознавание речи. Проверьте настройки микрофона.');
        }
      }
    }
  };
  
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Recognition will be recreated by useEffect[language]
  };
  
  if (!isSpeechSupported()) {
    return null;
  }
  
  return (
    <VoiceContainer>
      <LanguageSelect 
        value={language} 
        onChange={handleLanguageChange}
        title="Выберите язык распознавания"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name.split(' ')[1]}
          </option>
        ))}
      </LanguageSelect>
      
      <VoiceButton
        $isListening={isListening}
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Остановить запись' : language.startsWith('zh') ? 'Китайский: используйте Chrome на Android/Windows или Safari на iOS' : 'Голосовой ввод'}
      >
        {isListening ? '⏹️' : '🎤'}
      </VoiceButton>
      
      {isListening && (
        <StatusText $isListening={isListening}>
          {language.startsWith('zh') ? '请讲中文...' : 'Слушаю...'}
        </StatusText>
      )}
      
      {!isListening && language.startsWith('zh') && (
        <StatusText $isListening={false} style={{ fontSize: '0.7rem', maxWidth: '150px' }}>
          Chrome/Android/Win
        </StatusText>
      )}
    </VoiceContainer>
  );
};

export default VoiceInput;
