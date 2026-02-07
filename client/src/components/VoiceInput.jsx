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

const StatusText = styled.span`
  font-size: 0.75rem;
  color: ${props => props.$isListening ? '#e53e3e' : '#718096'};
  font-style: italic;
`;

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

const VoiceInput = ({ onResult, disabled = false, contextText = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const onResultRef = useRef(onResult);
  
  // Auto-detect language from context text, default to Russian
  const language = contextText ? detectLanguage(contextText) : 'ru-RU';
  
  // Keep refs in sync with latest values
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  const detectLanguage = (text) => {
    if (/[^\u4e00-\u9fff]/.test('') && /[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
    if (/[^\uac00-\ud7af]/.test('') && /[\uac00-\ud7af]/.test(text)) return 'ko-KR';
    if (/[^\u3040-\u309f\u30a0-\u30ff]/.test('') && /[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja-JP';
    if (/[^\u0400-\u04ff]/.test('') && /[\u0400-\u04ff]/.test(text)) return 'ru-RU';
    if (/[^\u0600-\u06ff]/.test('') && /[\u0600-\u06ff]/.test(text)) return 'ar-SA';
    if (/[^\u0590-\u05ff]/.test('') && /[\u0590-\u05ff]/.test(text)) return 'he-IL';
    if (/[^\u0900-\u097f]/.test('') && /[\u0900-\u097f]/.test(text)) return 'hi-IN';
    if (/[^\u0e00-\u0e7f]/.test('') && /[\u0e00-\u0e7f]/.test(text)) return 'th-TH';
    if (/[^\u0370-\u03ff]/.test('') && /[\u0370-\u03ff]/.test(text)) return 'el-GR';
    return (navigator?.languages && navigator.languages[0]) || navigator?.language || 'en-US';
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;
    
    recognition.onstart = () => {
    const language = contextText ? detectLanguage(contextText) : ((navigator?.languages && navigator.languages[0]) || navigator?.language || 'en-US');
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
        alert('Не удалось запустить распознавание речи. Проверьте настройки микрофона.');
      }
    }
  };
  
  if (!isSpeechSupported()) {
    return null;
  }
  
  return (
    <VoiceContainer>
      <VoiceButton
        $isListening={isListening}
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Остановить запись' : 'Голосовой ввод (авто)'}
      >
        {isListening ? '⏹️' : '🎤'}
      </VoiceButton>
      
      {isListening && (
        <StatusText $isListening={isListening}>
          Слушаю...
        </StatusText>
      )}
    </VoiceContainer>
  );
};

export default VoiceInput;
