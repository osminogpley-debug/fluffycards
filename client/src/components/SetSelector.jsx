import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES, authFetch } from '../constants/api';

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.5s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #63b3ed;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
`;

const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const SetCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${({ selected }) => selected ? '#63b3ed' : 'transparent'};
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: #63b3ed;
  }
`;

const SetTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  font-size: 1.2rem;
`;

const SetDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const SetMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.85rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #63b3ed;
    border-radius: 50%;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: #fee2e2;
  border-radius: 16px;
  color: #991b1b;
  margin-top: 2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  
  .icon {
    font-size: 64px;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
  }
  
  p {
    color: #6b7280;
    margin: 0 0 1.5rem 0;
  }
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(99, 179, 237, 0.4);
  }
`;

const BackButton = styled.button`
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  
  &:hover {
    background: #e5e7eb;
  }
`;

function SetSelector({ title, subtitle, onSelectSet, gameMode = false }) {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(API_ROUTES.DATA.SETS);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить наборы');
      }
      
      const data = await response.json();
      setSets(data);
    } catch (err) {
      console.error('Error fetching sets:', err);
      setError(err.message || 'Ошибка загрузки наборов');
    } finally {
      setLoading(false);
    }
  };

  const handleSetClick = (set) => {
    if (onSelectSet) {
      onSelectSet(set);
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>
          <div className="spinner" />
        </LoadingSpinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <BackButton onClick={() => navigate('/dashboard')}>← Назад</BackButton>
        <ErrorMessage>
          <h3>😕 Ошибка загрузки</h3>
          <p>{error}</p>
          <CreateButton onClick={fetchSets} style={{ marginTop: '1rem' }}>
            Попробовать снова
          </CreateButton>
        </ErrorMessage>
      </Container>
    );
  }

  if (sets.length === 0) {
    return (
      <Container>
        <BackButton onClick={() => navigate('/dashboard')}>← Назад</BackButton>
        <EmptyState>
          <div className="icon">📚</div>
          <h3>У вас пока нет наборов</h3>
          <p>Создайте свой первый набор, чтобы начать {gameMode ? 'играть' : 'учиться'}</p>
          <CreateButton onClick={() => navigate('/sets/create')}>
            ➕ Создать набор
          </CreateButton>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate('/dashboard')}>← Назад</BackButton>
      <Header>
        <Title>{title || 'Выберите набор'}</Title>
        <Subtitle>{subtitle || 'Выберите набор карточек для продолжения'}</Subtitle>
      </Header>

      <SetsGrid>
        {sets.map((set) => (
          <SetCard 
            key={set._id} 
            onClick={() => handleSetClick(set)}
          >
            <SetTitle>{set.title}</SetTitle>
            {set.description && (
              <SetDescription>{set.description}</SetDescription>
            )}
            <SetMeta>
              <span>📝 {set.flashcards?.length || 0} терминов</span>
              <span>{set.isPublic ? '🌍' : '🔒'}</span>
            </SetMeta>
          </SetCard>
        ))}
      </SetsGrid>
    </Container>
  );
}

export default SetSelector;
