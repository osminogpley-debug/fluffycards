import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const SearchWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(99, 179, 237, 0.15);
  border: 2px solid ${props => props.$isFocused ? '#63b3ed' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 25px rgba(99, 179, 237, 0.25);
  }
`;

const SearchIcon = styled.span`
  font-size: 1.3rem;
  margin-left: 16px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 16px 12px;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--text-primary);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }
`;

const VoiceButton = styled.button`
  background: var(--bg-tertiary);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-right: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-secondary);
    transform: rotate(90deg);
  }
`;

const AutocompleteDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-secondary);
  border-radius: 16px;
  margin-top: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 100;
  transition: all 0.3s ease;
`;

const AutocompleteItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-hover);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }
`;

const HighlightText = styled.span`
  color: #63b3ed;
  font-weight: 600;
`;

const HistorySection = styled.div`
  padding: 12px 16px;
  background: var(--bg-tertiary);
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const HistoryItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 16px;
  margin: 4px;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-hover);
    border-color: #63b3ed;
    transform: translateY(-2px);
  }
`;

const ClearHistoryButton = styled.button`
  background: none;
  border: none;
  color: #63b3ed;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const VoiceModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.3s ease;
`;

const VoiceModalContent = styled.div`
  background: var(--modal-bg);
  padding: 2rem;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const VoiceIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const VoiceText = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const CloseVoiceButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }
`;

const suggestions = [
  'Испанские фразы',
  'Анатомия человека',
  'JavaScript основы',
  'Вторая мировая война',
  'Органическая химия',
  'Французские числа',
  'Мировая литература',
  'Python для начинающих'
];

function SearchBar({ value, onChange, onSearch, placeholder = '🔍 Ищите наборы...' }) {
  const [isFocused, setIsFocused] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : ['JavaScript', 'Анатомия', 'Испанский'];
  });
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowAutocomplete(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  }, [value]);

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowAutocomplete(false);
    addToHistory(suggestion);
    onSearch?.(suggestion);
  };

  const handleHistoryClick = (term) => {
    onChange(term);
    onSearch?.(term);
    setShowAutocomplete(false);
  };

  const addToHistory = (term) => {
    if (!term.trim()) return;
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      addToHistory(value);
      onSearch?.(value);
      setShowAutocomplete(false);
    }
  };

  const handleVoiceClick = () => {
    setShowVoiceModal(true);
    // Заглушка для голосового поиска
    setTimeout(() => {
      setShowVoiceModal(false);
    }, 3000);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <HighlightText key={i}>{part}</HighlightText> : part
    );
  };

  return (
    <>
      <SearchContainer ref={containerRef}>
        <SearchWrapper $isFocused={isFocused}>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          {value && (
            <ClearButton onClick={() => { onChange(''); inputRef.current?.focus(); }}>
              ✕
            </ClearButton>
          )}
          <VoiceButton onClick={handleVoiceClick} title="Голосовой поиск">
            🎤
          </VoiceButton>
        </SearchWrapper>

        {showAutocomplete && (
          <AutocompleteDropdown>
            {value && filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion, index) => (
                <AutocompleteItem 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  🔍 {highlightMatch(suggestion, value)}
                </AutocompleteItem>
              ))
            ) : (
              <HistorySection>
                <HistoryHeader>
                  <span>📜 История поиска</span>
                  <ClearHistoryButton onClick={clearHistory}>
                    Очистить
                  </ClearHistoryButton>
                </HistoryHeader>
                {searchHistory.map((term, index) => (
                  <HistoryItem 
                    key={index}
                    onClick={() => handleHistoryClick(term)}
                  >
                    🕐 {term}
                  </HistoryItem>
                ))}
              </HistorySection>
            )}
          </AutocompleteDropdown>
        )}
      </SearchContainer>

      {showVoiceModal && (
        <VoiceModal onClick={() => setShowVoiceModal(false)}>
          <VoiceModalContent onClick={e => e.stopPropagation()}>
            <VoiceIcon>🎙️</VoiceIcon>
            <VoiceText>Слушаю... 🎵</VoiceText>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Скажите что-нибудь милое! ✨
            </p>
            <CloseVoiceButton onClick={() => setShowVoiceModal(false)}>
              Отменить
            </CloseVoiceButton>
          </VoiceModalContent>
        </VoiceModal>
      )}
    </>
  );
}

export default SearchBar;
