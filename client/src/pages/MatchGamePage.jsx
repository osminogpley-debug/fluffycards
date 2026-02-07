import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';



const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.3s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #f59e0b;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "🎯 ";
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1.1rem;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  background: var(--card-bg, white);
  padding: 1rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px var(--shadow-color, rgba(0, 0, 0, 0.1));
  text-align: center;
  border: 1px solid var(--border-color, transparent);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #f59e0b;
`;

const StatLabel = styled.div`
  color: var(--text-secondary, #6b7280);
  font-size: 0.9rem;
`;

const GameContainer = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, transparent);
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

const Card = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ flipped, matched }) => 
    matched ? '#dcfce7' : flipped ? 'var(--card-bg, white)' : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'};
  border: 3px solid ${({ flipped, matched }) => 
    matched ? '#22c55e' : flipped ? 'var(--border-color, #e5e7eb)' : '#f59e0b'};
  border-radius: 16px;
  cursor: ${({ matched }) => matched ? 'default' : 'pointer'};
  font-size: ${({ type }) => type === 'term' ? '1.1rem' : '0.95rem'};
  font-weight: 600;
  color: ${({ flipped, matched }) => 
    matched ? '#166534' : flipped ? 'var(--text-primary, #1f2937)' : 'white'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  transition: transform 0.4s ease;
  text-align: center;
  padding: 1rem;
  
  &:hover {
    transform: ${({ matched }) => matched ? 'none' : 'translateY(-5px) scale(1.02)'};
    box-shadow: ${({ matched }) => matched ? 'none' : '0 8px 20px rgba(245, 158, 11, 0.3)'};
  }
`;

const WinMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: var(--card-bg, linear-gradient(135deg, #fef3c7 0%, #fde68a 100%));
  border-radius: 24px;
  transition: transform 0.2s ease;
  border: 1px solid var(--border-color, transparent);
`;

const WinTitle = styled.h2`
  color: var(--text-primary, #92400e);
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const WinText = styled.p`
  color: var(--text-secondary, #a16207);
  font-size: 1.2rem;
  margin-bottom: 2rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
  }
`;

const ExitButton = styled(Button)`
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 4px 15px rgba(107, 114, 128, 0.4);
  
  &:hover {
    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.5);
  }
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
    border-top: 4px solid #f59e0b;
    border-radius: 50%;
    animation: none;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: var(--card-bg, #fee2e2);
  border-radius: 24px;
  color: var(--text-primary, #991b1b);
  border: 1px solid var(--border-color, #fca5a5);
  margin: 2rem 0;
`;

const SetInfo = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fef3c7 0%, #fde68a 100%));
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 1px solid var(--border-color, transparent);
  
  h3 {
    margin: 0 0 0.25rem 0;
    color: var(--text-primary, #92400e);
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary, #a16207);
    font-size: 0.9rem;
  }
`;

function MatchGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [originalCards, setOriginalCards] = useState([]);

  // Загрузка набора при наличии setId
  useEffect(() => {
    if (setId) {
      fetchSet(setId);
    }
  }, [setId]);

  const fetchSet = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить набор');
      }
      
      const setData = await response.json();
      setCurrentSet(setData);
      
      // Подготовка карточек для игры
      if (setData.flashcards && setData.flashcards.length > 0) {
        // Берем максимум 6 пар для игры (12 карточек)
        const gameCards = setData.flashcards.slice(0, 6);
        setOriginalCards(gameCards);
        
        const pairs = gameCards.flatMap((card, idx) => [
          { ...card, id: idx * 2, type: 'term', content: card.term },
          { ...card, id: idx * 2 + 1, type: 'definition', content: card.definition }
        ]);
        setCards(pairs.sort(() => Math.random() - 0.5));
      } else {
        setError('В этом наборе нет карточек');
      }
    } catch (err) {
      console.error('Error fetching set:', err);
      setError(err.message || 'Ошибка загрузки набора');
    } finally {
      setLoading(false);
    }
  };

  // Эффект для отслеживания победы
  useEffect(() => {
    if (originalCards.length > 0 && matchedPairs.length === originalCards.length) {
      setGameWon(true);
      trackGameWin();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [matchedPairs, originalCards.length]);

  const handleCardClick = (index) => {
    if (flippedIndices.length === 2 || flippedIndices.includes(index)) return;
    
    const card = cards[index];
    if (matchedPairs.includes(card.term)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.term === secondCard.term) {
        setMatchedPairs(prev => [...prev, firstCard.term]);
        setFlippedIndices([]);
      } else {
        setTimeout(() => setFlippedIndices([]), 1000);
      }
    }
  };

  const resetGame = () => {
    const pairs = originalCards.flatMap((card, idx) => [
      { ...card, id: idx * 2, type: 'term', content: card.term },
      { ...card, id: idx * 2 + 1, type: 'definition', content: card.definition }
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  const handleSelectSet = (set) => {
    navigate(`/games/match?setId=${set._id || set.id}`);
  };

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="🎯 Найди пару"
        subtitle="Выберите набор карточек для игры"
        onSelectSet={handleSelectSet}
        gameMode={true}
      />
    );
  }

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
        <ErrorMessage>
          <h3>😕 Ошибка</h3>
          <p>{error}</p>
          <Button onClick={() => navigate('/games/match')} style={{ marginTop: '1rem' }}>
            Выбрать другой набор
          </Button>
        </ErrorMessage>
      </Container>
    );
  }

  if (gameWon) {
    return (
      <Container>
        <WinMessage>
          <WinTitle>🎉 Поздравляем!</WinTitle>
          <WinText>Вы нашли все пары за {moves} ходов!</WinText>
          <ButtonGroup>
            <Button onClick={resetGame}>Играть снова</Button>
            <Button onClick={() => navigate('/games/match')}>Другой набор</Button>
            <ExitButton onClick={handleExit}>Выйти</ExitButton>
          </ButtonGroup>
        </WinMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Найди пару</Title>
        <Subtitle>Соедините термины с их определениями</Subtitle>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>{currentSet.flashcards?.length || 0} карточек в наборе</p>
        </SetInfo>
      )}

      <StatsBar>
        <StatItem>
          <StatValue>{moves}</StatValue>
          <StatLabel>Ходов</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{matchedPairs.length}/{originalCards.length}</StatValue>
          <StatLabel>Пар найдено</StatLabel>
        </StatItem>
      </StatsBar>

      <GameContainer>
        <CardsGrid>
          {cards.map((card, index) => (
            <Card
              key={card.id}
              onClick={() => handleCardClick(index)}
              flipped={flippedIndices.includes(index)}
              matched={matchedPairs.includes(card.term)}
              type={card.type}
            >
              {flippedIndices.includes(index) || matchedPairs.includes(card.term)
                ? card.content
                : "?"}
            </Card>
          ))}
        </CardsGrid>
        
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button onClick={() => navigate('/games/match')} style={{ marginRight: '1rem' }}>
            Другой набор
          </Button>
          <ExitButton onClick={handleExit}>Выйти</ExitButton>
        </div>
      </GameContainer>
    </Container>
  );
}

export default MatchGamePage;
