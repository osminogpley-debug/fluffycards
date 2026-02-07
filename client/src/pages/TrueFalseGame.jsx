import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';

const pop = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const Container = styled.div`
  max-width: 760px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #2b6cb0;
  font-size: 2.3rem;
  margin-bottom: 0.5rem;
`;

const GameCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, transparent);
  animation: ${pop} 0.25s ease;
`;

const Prompt = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const MainText = styled.h2`
  text-align: center;
  font-size: 1.4rem;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
`;

const Statement = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 1rem 1.25rem;
  border-radius: 14px;
  margin-bottom: 1.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const TrueButton = styled.button`
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 0.9rem 1.8rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(56, 161, 105, 0.3); }
`;

const FalseButton = styled.button`
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
  border: none;
  padding: 0.9rem 1.8rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(229, 62, 62, 0.3); }
`;

const Feedback = styled.div`
  text-align: center;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
`;

const StatRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0 1.5rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 0.6rem 1rem;
  text-align: center;
  border: 1px solid var(--border-color);
  
  .value { font-weight: 700; color: #2b6cb0; }
  .label { font-size: 0.75rem; color: var(--text-secondary); }
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%));
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(72, 187, 120, 0.3));
  border: 1px solid var(--border-color, transparent);
`;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function TrueFalseGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [flashcards, setFlashcards] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [current, setCurrent] = useState(null);
  const [statement, setStatement] = useState('');
  const [isStatementCorrect, setIsStatementCorrect] = useState(false);
  const [showTermSide, setShowTermSide] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

      if (setData.flashcards && setData.flashcards.length > 0) {
        const cards = setData.flashcards.map((card, idx) => ({
          ...card,
          id: card._id || idx + 1
        }));
        const shuffled = shuffleArray(cards);
        setFlashcards(cards);
        setQueue(shuffled);
        setCurrentIndex(0);
        buildQuestion(shuffled, 0);
      } else {
        setError('В этом наборе нет карточек');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const buildQuestion = (cards, index) => {
    if (!cards[index]) return;
    const card = cards[index];
    const termSide = Math.random() > 0.5;
    const correctStatement = Math.random() > 0.5;

    let shownText = '';
    if (termSide) {
      if (correctStatement) {
        shownText = card.definition;
      } else {
        const wrong = cards.find(c => c.id !== card.id) || card;
        shownText = wrong.definition;
      }
    } else {
      if (correctStatement) {
        shownText = card.term;
      } else {
        const wrong = cards.find(c => c.id !== card.id) || card;
        shownText = wrong.term;
      }
    }

    setCurrent(card);
    setShowTermSide(termSide);
    setStatement(shownText);
    setIsStatementCorrect(correctStatement);
    setFeedback(null);
  };

  const handleAnswer = (answerTrue) => {
    if (!current || feedback) return;
    const isCorrect = answerTrue === isStatementCorrect;
    setAttempts(prev => prev + 1);
    if (isCorrect) setCorrect(prev => prev + 1);
    setFeedback(isCorrect);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      setIsComplete(true);
      return;
    }
    setCurrentIndex(nextIndex);
    buildQuestion(queue, nextIndex);
  };

  const handleRestart = () => {
    const shuffled = shuffleArray(flashcards);
    setQueue(shuffled);
    setCurrentIndex(0);
    setAttempts(0);
    setCorrect(0);
    setIsComplete(false);
    buildQuestion(shuffled, 0);
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
  };

  const recordStats = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'true-false',
          cardsCount: flashcards.length,
          correctCount: correct,
          timeSpent
        })
      });
    } catch (err) {
      console.error('Error recording stats:', err);
    }
  };

  useEffect(() => {
    if (isComplete && !statsRecordedRef.current && flashcards.length > 0) {
      statsRecordedRef.current = true;
      recordStats();
    }
  }, [isComplete, flashcards.length, correct]);

  const handleSelectSet = (set) => {
    navigate(`/games/true-false?setId=${set._id || set.id}`);
  };

  if (!setId) {
    return (
      <SetSelector
        title="✅ Верно или Неверно"
        subtitle="Выберите набор карточек"
        onSelectSet={handleSelectSet}
      />
    );
  }

  if (loading) {
    return (
      <Container>
        <GameCard>
          <div style={{ textAlign: 'center' }}>Загрузка...</div>
        </GameCard>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <GameCard>
          <div style={{ textAlign: 'center', color: '#991b1b' }}>{error}</div>
          <ButtonRow style={{ marginTop: '1rem' }}>
            <SecondaryButton onClick={() => navigate('/games/true-false')}>Другой набор</SecondaryButton>
          </ButtonRow>
        </GameCard>
      </Container>
    );
  }

  if (isComplete) {
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
    return (
      <Container>
        <CompletionCard>
          <h2>🎉 Готово!</h2>
          <p>Точность: {accuracy}%</p>
          <ButtonRow style={{ marginTop: '1rem' }}>
            <PrimaryButton onClick={handleRestart}>Сыграть ещё</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/dashboard')}>⬅️ Мои наборы</SecondaryButton>
          </ButtonRow>
        </CompletionCard>
      </Container>
    );
  }

  if (!current) return null;

  return (
    <Container>
      <Header>
        <Title>✅ Верно или Неверно</Title>
      </Header>

      <StatRow>
        <Stat>
          <div className="value">{currentIndex + 1}/{queue.length}</div>
          <div className="label">Вопрос</div>
        </Stat>
        <Stat>
          <div className="value">{correct}</div>
          <div className="label">Верно</div>
        </Stat>
        <Stat>
          <div className="value">{attempts}</div>
          <div className="label">Попыток</div>
        </Stat>
      </StatRow>

      <GameCard>
        <Prompt>{showTermSide ? 'Термин' : 'Определение'}</Prompt>
        <MainText>{showTermSide ? current.term : current.definition}</MainText>
        <Prompt>Сопоставление</Prompt>
        <Statement>{statement}</Statement>

        <ButtonRow>
          <TrueButton onClick={() => handleAnswer(true)}>Верно ✅</TrueButton>
          <FalseButton onClick={() => handleAnswer(false)}>Неверно ❌</FalseButton>
        </ButtonRow>

        {feedback !== null && (
          <>
            <Feedback correct={feedback}>
              {feedback ? 'Правильно!' : 'Неправильно!'}
            </Feedback>
            <ButtonRow style={{ marginTop: '1rem' }}>
              <PrimaryButton onClick={handleNext}>Дальше ➡️</PrimaryButton>
            </ButtonRow>
          </>
        )}
      </GameCard>
    </Container>
  );
}

export default TrueFalseGame;
