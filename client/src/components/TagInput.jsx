import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-secondary);
  min-height: 44px;
  align-items: center;
  
  &:focus-within {
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 1;
  }
`;

const Input = styled.input`
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  font-size: 0.95rem;
  padding: 0.25rem;
  background: transparent;
  
  &::placeholder {
    color: #a0aec0;
  }
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Suggestion = styled.button`
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e3f2fd;
    border-color: #63b3ed;
    color: #1976d2;
  }
`;

const TagInput = ({ 
  tags = [], 
  onChange, 
  label = '🏷️ Теги',
  placeholder = 'Добавьте тег и нажмите Enter',
  suggestions = []
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  
  const addTag = (tag) => {
    const normalized = tag.trim().toLowerCase();
    if (normalized && !tags.includes(normalized)) {
      onChange([...tags, normalized]);
    }
    setInput('');
  };
  
  const removeTag = (tagToRemove) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };
  
  // Фильтруем предложения которые уже есть
  const availableSuggestions = suggestions.filter(
    s => !tags.includes(s.toLowerCase()) && s.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 5);
  
  return (
    <Container>
      <Label>{label}</Label>
      <InputContainer onClick={() => inputRef.current?.focus()}>
        {tags.map(tag => (
          <Tag key={tag}>
            #{tag}
            <RemoveButton onClick={() => removeTag(tag)}>×</RemoveButton>
          </Tag>
        ))}
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </InputContainer>
      
      {availableSuggestions.length > 0 && (
        <Suggestions>
          {availableSuggestions.map(suggestion => (
            <Suggestion 
              key={suggestion}
              onClick={() => addTag(suggestion)}
            >
              + {suggestion}
            </Suggestion>
          ))}
        </Suggestions>
      )}
    </Container>
  );
};

export default TagInput;
