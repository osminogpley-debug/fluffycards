import React, { useState } from 'react';
import styled from 'styled-components';
import { PrimaryButton } from '../UI/Buttons';

const Container = styled.div`
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 10px var(--shadow-color);
`;

const Title = styled.h4`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  
  &::before {
    content: '🤖';
    margin-right: 0.5rem;
  }
`;

const SuggestionBox = styled.div`
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #4299e1;
`;

const Loading = styled.div`
  padding: 1rem;
  text-align: center;
  color: var(--text-secondary);
`;

function AISuggestionBox({ term, onApply }) {
  const [definition, setDefinition] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState({
    definition: false,
    image: false
  });

  const getAIDefinition = async () => {
    setLoading(prev => ({ ...prev, definition: true }));
    try {
      const response = await fetch('/api/ai/definition', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ term })
      });
      
      const { suggestion } = await response.json();
      setDefinition(suggestion);
    } catch (error) {
      console.error('AI definition error:', error);
    } finally {
      setLoading(prev => ({ ...prev, definition: false }));
    }
  };

  const getAIImage = async () => {
    setLoading(prev => ({ ...prev, image: true }));
    try {
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ term })
      });
      
      const { url, alt } = await response.json();
      setImage({ url, alt });
    } catch (error) {
      console.error('AI image error:', error);
    } finally {
      setLoading(prev => ({ ...prev, image: false }));
    }
  };

  return (
    <Container>
      <Title>AI помощник</Title>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <PrimaryButton 
          onClick={getAIDefinition}
          disabled={loading.definition}
        >
          {loading.definition ? 'Генерация...' : 'Предложить определение'}
        </PrimaryButton>
        
        <PrimaryButton 
          onClick={getAIImage}
          disabled={loading.image}
        >
          {loading.image ? 'Поиск...' : 'Найти изображение'}
        </PrimaryButton>
      </div>
      
      {loading.definition && <Loading>Ищем лучшее определение...</Loading>}
      {definition && (
        <SuggestionBox aria-label="AI definition suggestion">
          <p>{definition}</p>
          <PrimaryButton 
            onClick={() => onApply('definition', definition)}
            style={{ marginTop: '0.5rem' }}
            aria-label="Apply definition"
          >
            Использовать определение
          </PrimaryButton>
        </SuggestionBox>
      )}
      
      {loading.image && <Loading>Ищем подходящее изображение...</Loading>}
      {image && (
        <SuggestionBox aria-label="AI image suggestion">
          <img 
            src={image.url} 
            alt={image.alt}
            style={{ 
              maxWidth: '100%', 
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}
          />
          <PrimaryButton 
            onClick={() => onApply('image', image.url)}
            aria-label="Apply image"
          >
            Использовать изображение
          </PrimaryButton>
        </SuggestionBox>
      )}
    </Container>
  );
}

export default AISuggestionBox;
