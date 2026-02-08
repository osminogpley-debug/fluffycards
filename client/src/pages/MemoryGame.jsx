import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';

const flipIn = keyframes`
  from { transform: rotateY(90deg); opacity: 0; }
  to { transform: rotateY(0deg); opacity: 1; }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;

  @media (max-width: 600px) {
    margin: 1rem auto;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #805ad5;
  font-size: 2.3rem;
  margin-bottom: 0.4rem;

  @media (max-width: 600px) {
    font-size: 2rem;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.button`
  background: ${({ flipped, matched }) =>
    matched ? 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)' :
    flipped ? 'linear-gradient(135deg, #e9d8fd 0%, #d6bcfa 100%)' :
    'var(--bg-secondary)'};
  border: 2px solid ${({ flipped, matched }) => (flipped || matched) ? '#805ad5' : 'var(--border-color)'};
  border-radius: 16px;
  padding: 1rem;
  min-height: 110px;
  font-size: 0.95rem;
  color: var(--text-primary);
  cursor: ${({ matched }) => matched ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  animation: ${flipIn} 0.2s ease;
  text-align: center;

  &:hover {
    transform: ${({ matched }) => matched ? 'none' : 'translateY(-2px)'};
    box-shadow: ${({ matched }) => matched ? 'none' : '0 6px 18px rgba(128, 90, 213, 0.2)'};
  }

  @media (max-width: 600px) {
    min-height: 90px;
    font-size: 0.9rem;
    padding: 0.75rem;
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 0.75rem;
  }
`;

const Stat = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 0.6rem 1rem;
  text-align: center;
  border: 1px solid var(--border-color);
  
  .value { font-weight: 700; color: #805ad5; }
  .label { font-size: 0.75rem; color: var(--text-secondary); }
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%));
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(72, 187, 120, 0.3));
  border: 1px solid var(--border-color, transparent);

  @media (max-width: 600px) {
    padding: 2rem 1.25rem;
  }
`;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MemoryGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [deck, setDeck] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const lockRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);

  useEffect(() => {
    if (setId) fetchSet(setId);
  }, [setId]);

  const fetchSet = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!response.ok) throw new Error('Не удалось загрузить набор');
      const setData = await response.json();
      sessionStartRef.current = Date.now();
      statsRecordedRef.current = false;

      if (setData.flashcards && setData.flashcards.length >= 2) {
        const cards = setData.flashcards.map((card, idx) => ({
          ...card,
          id: card._id || idx + 1
        }));
        const pairs = shuffleArray(cards).slice(0, Math.min(4, cards.length));
        const newDeck = shuffleArray(
          pairs.flatMap(card => ([
            { id: `${card.id}-t`, cardId: card.id, text: card.term, type: 'term' },
            { id: `${card.id}-d`, cardId: card.id, text: card.definition, type: 'definition' }
          ]))
        );
        setDeck(newDeck);
        setFlippedIds([]);
        setMatchedIds([]);
        setMoves(0);
        setIsComplete(false);
      } else {
        setError('Для игры нужно минимум 2 карточки');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = (card) => {
    if (lockRef.current) return;
    if (matchedIds.includes(card.id) || flippedIds.includes(card.id)) return;
    if (flippedIds.length >= 2) return;

    const newFlipped = [...flippedIds, card.id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped.map(id => deck.find(c => c.id === id));
      if (first && second && first.cardId === second.cardId) {
        setMatchedIds(prev => [...prev, first.id, second.id]);
        setFlippedIds([]);
      } else {
        lockRef.current = true;
        setTimeout(() => {
          setFlippedIds([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  useEffect(() => {
    if (deck.length > 0 && matchedIds.length === deck.length) {
      setIsComplete(true);
    }
  }, [matchedIds, deck.length]);

  const recordStats = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'memory',
          cardsCount: deck.length / 2,
          correctCount: deck.length / 2,
          timeSpent
        })
      });
    } catch (err) {
      console.error('Error recording stats:', err);
    }
  };

  useEffect(() => {
    if (isComplete && !statsRecordedRef.current && deck.length > 0) {
      statsRecordedRef.current = true;
      recordStats();
    }
  }, [isComplete, deck.length]);

  const handleSelectSet = (set) => {
    navigate(`/games/memory?setId=${set._id}`);
  };

  const handleRestart = () => {
    fetchSet(setId);
  };

  if (!setId) {
    return (
      <SetSelector
        title="🧠 Память"
        subtitle="Найди пары термин — определение"
        onSelectSet={handleSelectSet}
      />
    );
  }

  if (loading) {
    return (
      <Container>
        <CompletionCard>
          <div>Загрузка...</div>
        </CompletionCard>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <CompletionCard>
          <div style={{ color: '#991b1b' }}>{error}</div>
          <ButtonRow>
            <SecondaryButton onClick={() => navigate('/games/memory')}>Другой набор</SecondaryButton>
          </ButtonRow>
        </CompletionCard>
      </Container>
    );
  }

  if (isComplete) {
    return (
      <Container>
        <CompletionCard>
          <h2>🎉 Пары собраны!</h2>
          <p>Ходы: {moves}</p>
          <ButtonRow>
            <PrimaryButton onClick={handleRestart}>Сыграть снова</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/dashboard')}>⬅️ Мои наборы</SecondaryButton>
          </ButtonRow>
        </CompletionCard>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>🧠 Игра на память</Title>
      </Header>

      <StatRow>
        <Stat>
          <div className="value">{moves}</div>
          <div className="label">Ходы</div>
        </Stat>
        <Stat>
          <div className="value">{matchedIds.length / 2}/{deck.length / 2}</div>
          <div className="label">Пары</div>
        </Stat>
      </StatRow>

      <Grid>
        {deck.map(card => {
          const flipped = flippedIds.includes(card.id);
          const matched = matchedIds.includes(card.id);
          return (
            <Card
              key={card.id}
              flipped={flipped}
              matched={matched}
              onClick={() => handleFlip(card)}
            >
              {(flipped || matched) ? card.text : '❓'}
            </Card>
          );
        })}
      </Grid>
    </Container>
  );
}

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

export default MemoryGame;
