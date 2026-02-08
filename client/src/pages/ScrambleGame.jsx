import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';

const pop = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;

  @media (max-width: 600px) {
    margin: 1rem auto;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #ed8936;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 600px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatBubble = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  text-align: center;
  min-width: 90px;
  
  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ed8936;
  }
  .label {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }
`;

const GameCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%));
  border-radius: 24px;
  padding: 2.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(237, 137, 54, 0.2));
  border: 1px solid var(--border-color, transparent);
  animation: ${pop} 0.4s ease;

  @media (max-width: 600px) {
    padding: 1.5rem 1.25rem;
    margin-bottom: 1.5rem;
  }
`;

const HintText = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 0.75rem;
`;

const DefinitionText = styled.div`
  text-align: center;
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 2rem;
  font-weight: 600;
  line-height: 1.5;

  @media (max-width: 600px) {
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }
`;

const LetterTilesArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 2rem;
  min-height: 60px;
`;

const LetterTile = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid ${({ used }) => used ? '#cbd5e0' : '#ed8936'};
  background: ${({ used }) => used ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'};
  color: ${({ used }) => used ? '#a0aec0' : '#7c2d12'};
  font-size: 1.3rem;
  font-weight: 700;
  cursor: ${({ used }) => used ? 'default' : 'pointer'};
  transition: all 0.2s ease;
  font-family: inherit;
  opacity: ${({ used }) => used ? 0.4 : 1};
  animation: ${pop} 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: ${({ used }) => used ? 'none' : 'translateY(-4px) scale(1.05)'};
    box-shadow: ${({ used }) => used ? 'none' : '0 6px 20px rgba(237, 137, 54, 0.3)'};
  }

  @media (max-width: 600px) {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
  }
`;

const AnswerArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  min-height: 52px;
  padding: 0.75rem;
  border: 2px dashed ${({ status }) => 
    status === 'correct' ? '#48bb78' : 
    status === 'wrong' ? '#f56565' : 'var(--border-color)'};
  border-radius: 16px;
  background: ${({ status }) => 
    status === 'correct' ? 'rgba(72, 187, 120, 0.05)' : 
    status === 'wrong' ? 'rgba(245, 101, 101, 0.05)' : 'transparent'};
  animation: ${({ status }) => status === 'wrong' ? shake : 'none'} 0.4s ease;
  transition: border-color 0.3s ease, background 0.3s ease;
`;

const AnswerTile = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 2px solid #63b3ed;
  background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
  color: #1e40af;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  animation: ${pop} 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
  }

  @media (max-width: 600px) {
    width: 42px;
    height: 42px;
    font-size: 1.1rem;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Feedback = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
  animation: ${pop} 0.3s ease;
`;

const CorrectAnswer = styled.div`
  text-align: center;
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  strong { color: #48bb78; }
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

const CompletionTitle = styled.h2`
  color: var(--text-primary, #22543d);
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const CompletionStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const StatBox = styled.div`
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 16px;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #48bb78;
  }
  .label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 16px;
  background: var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #ed8936, #f6ad55);
  border-radius: 8px;
  transition: width 0.5s ease;
  width: ${({ progress }) => progress}%;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  .spinner {
    width: 48px; height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #ed8936;
    border-radius: 50%;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: #fee2e2;
  border-radius: 16px;
  color: #991b1b;
  margin: 2rem 0;
`;

const SkipButton = styled.button`
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    border-color: #ed8936;
    color: #ed8936;
  }
`;

const Mascot = styled.div`
  font-size: 3rem;
  animation: ${float} 2s ease-in-out infinite;
  margin-bottom: 1rem;
`;

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function ScrambleGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [queue, setQueue] = useState([]);
  const [currentCardId, setCurrentCardId] = useState(null);
  const [scrambledLetters, setScrambledLetters] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [answerLetters, setAnswerLetters] = useState([]);
  const [answerStatus, setAnswerStatus] = useState(null); // null | 'correct' | 'wrong'
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
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
      setCurrentSet(setData);
      sessionStartRef.current = Date.now();
      statsRecordedRef.current = false;
      
      if (setData.flashcards && setData.flashcards.length > 0) {
        const cards = setData.flashcards.map((card, idx) => ({
          ...card,
          id: card._id || idx + 1
        }));
        setFlashcards(cards);
        const ids = shuffleArray(cards.map(c => c.id));
        setQueue(ids);
        setupCard(ids[0], cards);
      } else {
        setError('В этом наборе нет карточек');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const setupCard = (cardId, cards = flashcards) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    setCurrentCardId(cardId);
    const letters = card.term.split('').map((char, i) => ({ char, originalIndex: i }));
    // Scramble (make sure it's actually scrambled)
    let scrambled = shuffleArray(letters);
    let tries = 0;
    while (scrambled.map(l => l.char).join('') === card.term && tries < 10) {
      scrambled = shuffleArray(letters);
      tries++;
    }
    setScrambledLetters(scrambled);
    setSelectedIndices([]);
    setAnswerLetters([]);
    setAnswerStatus(null);
    setShowFeedback(false);
  };

  const handleLetterClick = (scrambleIndex) => {
    if (showFeedback || selectedIndices.includes(scrambleIndex)) return;
    const letter = scrambledLetters[scrambleIndex];
    const newSelected = [...selectedIndices, scrambleIndex];
    const newAnswer = [...answerLetters, letter];
    setSelectedIndices(newSelected);
    setAnswerLetters(newAnswer);

    // Auto-check when all letters are placed
    const card = flashcards.find(c => c.id === currentCardId);
    if (newAnswer.length === card.term.length) {
      const userAnswer = newAnswer.map(l => l.char).join('');
      checkAnswer(userAnswer, card);
    }
  };

  const handleAnswerTileClick = (answerIndex) => {
    if (showFeedback) return;
    // Remove letter from answer and put it back
    const removedLetter = answerLetters[answerIndex];
    const scrIdx = selectedIndices.find((si, i) => i === answerIndex);
    setSelectedIndices(prev => prev.filter((_, i) => i !== answerIndex));
    setAnswerLetters(prev => prev.filter((_, i) => i !== answerIndex));
  };

  const checkAnswer = (userAnswer, card) => {
    const correct = userAnswer.toLowerCase() === card.term.toLowerCase();
    setShowFeedback(true);
    setAnswerStatus(correct ? 'correct' : 'wrong');
    
    if (correct) {
      const streakBonus = streak >= 3 ? 5 : streak >= 2 ? 3 : 0;
      const points = 10 + streakBonus;
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      setMaxStreak(prev => Math.max(prev, streak + 1));
      setCompleted(prev => prev + 1);
      setFeedbackMsg(streak >= 2 
        ? `🔥 Серия x${streak + 1}! +${points} очков!` 
        : '✨ Правильно!');
    } else {
      setStreak(0);
      setFeedbackMsg(`Неправильно! Это: ${card.term}`);
    }
  };

  const handleNext = () => {
    const newQueue = queue.filter(id => id !== currentCardId);
    if (!showFeedback || !isCorrectAnswer()) {
      // Wrong answer — card goes back to end
      if (!isCorrectAnswer() && showFeedback) {
        newQueue.push(currentCardId);
      }
    }
    
    setQueue(newQueue);
    if (newQueue.length > 0) {
      setupCard(newQueue[0]);
    } else {
      setIsComplete(true);
    }
  };

  const isCorrectAnswer = () => answerStatus === 'correct';

  const handleSkip = () => {
    setSkipped(prev => prev + 1);
    setStreak(0);
    const newQueue = [...queue.filter(id => id !== currentCardId), currentCardId];
    setQueue(newQueue);
    setupCard(newQueue[0]);
  };

  const handleClearAnswer = () => {
    if (showFeedback) return;
    setSelectedIndices([]);
    setAnswerLetters([]);
    setAnswerStatus(null);
  };

  const handleRestart = () => {
    const ids = shuffleArray(flashcards.map(c => c.id));
    setQueue(ids);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCompleted(0);
    setSkipped(0);
    setIsComplete(false);
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
    setupCard(ids[0]);
  };

  const recordStats = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'scramble', cardsCount: flashcards.length, correctCount: completed, timeSpent })
      });
    } catch (err) { console.error('Stats error:', err); }
  };

  useEffect(() => {
    if (isComplete && !statsRecordedRef.current && flashcards.length > 0) {
      statsRecordedRef.current = true;
      recordStats();
    }
  }, [isComplete]);

  const handleSelectSet = (set) => {
    navigate(`/games/scramble?setId=${set._id}`);
  };

  // RENDER
  if (!setId) {
    return (
      <SetSelector
        title="🔤 Собери слово"
        subtitle="Выберите набор карточек"
        onSelectSet={handleSelectSet}
      />
    );
  }

  if (loading) return <Container><LoadingSpinner><div className="spinner" /></LoadingSpinner></Container>;
  if (error) return (
    <Container>
      <ErrorMessage>
        <h3>😕 Ошибка</h3>
        <p>{error}</p>
        <PrimaryButton onClick={() => navigate('/games/scramble')} style={{ marginTop: '1rem' }}>Выбрать другой набор</PrimaryButton>
      </ErrorMessage>
    </Container>
  );

  if (isComplete) {
    return (
      <Container>
        <CompletionCard>
          <Mascot>🏆</Mascot>
          <CompletionTitle>Игра завершена!</CompletionTitle>
          <CompletionStats>
            <StatBox>
              <div className="value">{score}</div>
              <div className="label">Очков</div>
            </StatBox>
            <StatBox>
              <div className="value">{completed}</div>
              <div className="label">Собрано</div>
            </StatBox>
            <StatBox>
              <div className="value">{maxStreak}</div>
              <div className="label">Макс. серия</div>
            </StatBox>
          </CompletionStats>
          <ButtonRow>
            <PrimaryButton onClick={handleRestart}>Играть снова 🔄</PrimaryButton>
            <SecondaryButton onClick={() => navigate('/games/scramble')}>Другой набор</SecondaryButton>
            <SecondaryButton onClick={() => navigate('/dashboard')}>⬅️ Мои наборы</SecondaryButton>
          </ButtonRow>
        </CompletionCard>
      </Container>
    );
  }

  const card = flashcards.find(c => c.id === currentCardId);
  if (!card) return null;

  const progress = flashcards.length > 0 ? Math.round((completed / flashcards.length) * 100) : 0;

  return (
    <Container>
      <Header>
        <Title>🔤 Собери слово</Title>
        <Subtitle>Составь термин из перемешанных букв</Subtitle>
      </Header>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>

      <StatsRow>
        <StatBubble>
          <div className="value">{score}</div>
          <div className="label">Очки</div>
        </StatBubble>
        <StatBubble>
          <div className="value">{streak > 0 ? `🔥${streak}` : '0'}</div>
          <div className="label">Серия</div>
        </StatBubble>
        <StatBubble>
          <div className="value">{completed}/{flashcards.length}</div>
          <div className="label">Прогресс</div>
        </StatBubble>
      </StatsRow>

      <GameCard key={currentCardId}>
        <HintText>📖 Определение:</HintText>
        <DefinitionText>{card.definition}</DefinitionText>

        <HintText>Твой ответ:</HintText>
        <AnswerArea status={answerStatus}>
          {answerLetters.map((letter, idx) => (
            <AnswerTile key={idx} onClick={() => handleAnswerTileClick(idx)}>
              {letter.char}
            </AnswerTile>
          ))}
        </AnswerArea>

        <HintText>Доступные буквы:</HintText>
        <LetterTilesArea>
          {scrambledLetters.map((letter, idx) => (
            <LetterTile 
              key={idx}
              used={selectedIndices.includes(idx)}
              onClick={() => handleLetterClick(idx)}
            >
              {letter.char}
            </LetterTile>
          ))}
        </LetterTilesArea>

        {showFeedback && (
          <Feedback correct={isCorrectAnswer()}>
            {feedbackMsg}
          </Feedback>
        )}

        {showFeedback && !isCorrectAnswer() && (
          <CorrectAnswer>
            Правильный ответ: <strong>{card.term}</strong>
          </CorrectAnswer>
        )}

        <ButtonRow>
          {!showFeedback && (
            <>
              <SecondaryButton onClick={handleClearAnswer} disabled={answerLetters.length === 0}>
                Сбросить ↩️
              </SecondaryButton>
              <SkipButton onClick={handleSkip}>Пропустить ⏭️</SkipButton>
            </>
          )}
          {showFeedback && (
            <PrimaryButton onClick={handleNext}>
              Дальше ➡️
            </PrimaryButton>
          )}
        </ButtonRow>
      </GameCard>
    </Container>
  );
}

export default ScrambleGame;
