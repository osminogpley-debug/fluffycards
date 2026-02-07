import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';

const pop = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
`;

const slideIn = keyframes`
  from { transform: translateX(30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #e53e3e;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const TimerBar = styled.div`
  width: 100%;
  height: 12px;
  background: var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 1rem;
  position: relative;
`;

const TimerFill = styled.div`
  height: 100%;
  border-radius: 6px;
  transition: width 0.1s linear;
  width: ${({ pct }) => pct}%;
  background: ${({ pct }) => 
    pct > 60 ? 'linear-gradient(90deg, #48bb78, #68d391)' :
    pct > 30 ? 'linear-gradient(90deg, #ecc94b, #f6e05e)' :
    'linear-gradient(90deg, #e53e3e, #fc8181)'};
`;

const TimerText = styled.div`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${({ seconds }) => seconds <= 5 ? '#e53e3e' : 'var(--text-primary)'};
  animation: ${({ seconds }) => seconds <= 5 ? css`${pulse} 0.5s ease infinite` : 'none'};
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
  padding: 0.6rem 1rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color);
  text-align: center;
  min-width: 80px;
  
  .value {
    font-size: 1.3rem;
    font-weight: 700;
    color: ${({ color }) => color || '#e53e3e'};
  }
  .label {
    font-size: 0.7rem;
    color: var(--text-secondary);
  }
`;

const QuestionCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, transparent);
  animation: ${slideIn} 0.25s ease;
`;

const QuestionLabel = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const QuestionText = styled.h2`
  text-align: center;
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  word-break: break-word;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

const OptionButton = styled.button`
  background: ${({ correct, wrong }) =>
    correct ? '#48bb78' :
    wrong ? '#f56565' :
    'var(--bg-secondary)'};
  color: ${({ correct, wrong }) =>
    correct || wrong ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${({ correct, wrong }) =>
    correct ? '#38a169' :
    wrong ? '#e53e3e' :
    'var(--border-color)'};
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.95rem;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  word-break: break-word;
  font-family: inherit;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border-color: #e53e3e;
  }
  
  &:disabled { opacity: 0.8; }
`;

const SetupCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.1));
  border: 1px solid var(--border-color, transparent);
`;

const DurationGrid = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const DurationButton = styled.button`
  background: ${({ active }) => active 
    ? 'linear-gradient(135deg, #e53e3e, #fc8181)' 
    : 'var(--bg-secondary)'};
  color: ${({ active }) => active ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${({ active }) => active ? '#e53e3e' : 'var(--border-color)'};
  padding: 1rem 2rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  
  &:hover {
    transform: translateY(-3px);
    border-color: #e53e3e;
  }
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%));
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(229, 62, 62, 0.2));
  border: 1px solid var(--border-color, transparent);
  animation: ${pop} 0.4s ease;
`;

const CompletionTitle = styled.h2`
  font-size: 2.5rem;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const CompletionStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const BigStat = styled.div`
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: 16px;
  min-width: 120px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: ${({ color }) => color || '#e53e3e'};
  }
  .label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.3rem;
  }
`;

const StarRating = styled.div`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  letter-spacing: 0.5rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  .spinner {
    width: 48px; height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #e53e3e;
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

const CountdownOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const CountdownNumber = styled.div`
  font-size: 8rem;
  font-weight: 800;
  color: white;
  animation: ${pulse} 0.8s ease infinite;
  text-shadow: 0 4px 20px rgba(0,0,0,0.3);
`;

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function QuizBlitz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Game phases: 'setup' | 'countdown' | 'playing' | 'done'
  const [phase, setPhase] = useState('setup');
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [countdown, setCountdown] = useState(3);

  // Question state
  const [currentCard, setCurrentCard] = useState(null);
  const [showTermSide, setShowTermSide] = useState(true);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Stats
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const timerRef = useRef(null);
  const nextQuestionTimeoutRef = useRef(null);
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
      
      if (setData.flashcards && setData.flashcards.length >= 4) {
        const cards = setData.flashcards.map((card, idx) => ({
          ...card,
          id: card._id || idx + 1
        }));
        setFlashcards(cards);
      } else {
        setError('Для этой игры нужно минимум 4 карточки');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const generateQuestion = useCallback(() => {
    if (flashcards.length < 4) return;
    const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
    const isTermSide = Math.random() > 0.5;
    
    const otherCards = flashcards.filter(c => c.id !== randomCard.id);
    const wrongOptions = shuffleArray(otherCards).slice(0, 3);
    const allOptions = shuffleArray([...wrongOptions, randomCard]);

    setCurrentCard(randomCard);
    setShowTermSide(isTermSide);
    setOptions(allOptions);
    setSelectedOption(null);
    setAnswered(false);
  }, [flashcards]);

  // Start game
  const handleStart = () => {
    setTimeLeft(duration);
    setScore(0);
    setCorrect(0);
    setWrong(0);
    setStreak(0);
    setMaxStreak(0);
    setTotalAnswered(0);
    setCountdown(3);
    setPhase('countdown');
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      setPhase('playing');
      generateQuestion();
      return;
    }
    const t = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, generateQuestion]);

  // Game timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleOptionClick = (option) => {
    if (answered || phase !== 'playing') return;
    setSelectedOption(option);
    setAnswered(true);
    setTotalAnswered(prev => prev + 1);

    const isCorrect = option.id === currentCard.id;
    
    if (isCorrect) {
      const streakBonus = streak >= 5 ? 5 : streak >= 3 ? 3 : streak >= 1 ? 1 : 0;
      setScore(prev => prev + 10 + streakBonus);
      setCorrect(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(ms => Math.max(ms, newStreak));
        return newStreak;
      });
      // Bonus time for correct answer
      setTimeLeft(prev => Math.min(prev + 2, duration + 10));
    } else {
      setWrong(prev => prev + 1);
      setStreak(0);
      // Penalty for wrong answer
      setTimeLeft(prev => Math.max(prev - 3, 0));
    }

    // Auto-advance after short delay
    nextQuestionTimeoutRef.current = setTimeout(() => {
      generateQuestion();
    }, isCorrect ? 400 : 1200);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(nextQuestionTimeoutRef.current);
    };
  }, []);

  // Record stats
  const recordStats = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'quiz-blitz', cardsCount: totalAnswered, correctCount: correct, timeSpent })
      });
    } catch (err) { console.error('Stats error:', err); }
  };

  useEffect(() => {
    if (phase === 'done' && !statsRecordedRef.current) {
      statsRecordedRef.current = true;
      recordStats();
    }
  }, [phase]);

  const handleSelectSet = (set) => {
    navigate(`/games/quiz-blitz?setId=${set._id || set.id}`);
  };

  const getStars = () => {
    const accuracy = totalAnswered > 0 ? correct / totalAnswered : 0;
    if (accuracy >= 0.9 && totalAnswered >= 10) return '⭐⭐⭐';
    if (accuracy >= 0.7 && totalAnswered >= 5) return '⭐⭐';
    if (totalAnswered >= 3) return '⭐';
    return '';
  };

  const getTitle = () => {
    const accuracy = totalAnswered > 0 ? correct / totalAnswered : 0;
    if (accuracy >= 0.9 && totalAnswered >= 15) return '🏆 Невероятно!';
    if (accuracy >= 0.8 && totalAnswered >= 10) return '🔥 Отлично!';
    if (accuracy >= 0.6) return '👍 Хорошая работа!';
    return '💪 Продолжай тренироваться!';
  };

  // RENDER
  if (!setId) {
    return (
      <SetSelector
        title="⚡ Блиц-викторина"
        subtitle="Выберите набор карточек (минимум 4)"
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
        <PrimaryButton onClick={() => navigate('/games/quiz-blitz')} style={{ marginTop: '1rem' }}>
          Выбрать другой набор
        </PrimaryButton>
      </ErrorMessage>
    </Container>
  );

  // Countdown overlay
  if (phase === 'countdown') {
    return (
      <CountdownOverlay>
        <CountdownNumber>
          {countdown > 0 ? countdown : '🚀'}
        </CountdownNumber>
      </CountdownOverlay>
    );
  }

  // Setup - choose duration
  if (phase === 'setup') {
    return (
      <Container>
        <Header>
          <Title>⚡ Блиц-викторина</Title>
        </Header>
        <SetupCard>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            Выберите длительность
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Ответь на максимум вопросов за время!<br/>
            +2 сек за правильный ответ, -3 сек за неправильный
          </p>
          {currentSet && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              📚 {currentSet.title} ({flashcards.length} карточек)
            </p>
          )}
          <DurationGrid>
            <DurationButton active={duration === 30} onClick={() => setDuration(30)}>
              30 сек ⚡
            </DurationButton>
            <DurationButton active={duration === 60} onClick={() => setDuration(60)}>
              60 сек 🔥
            </DurationButton>
            <DurationButton active={duration === 120} onClick={() => setDuration(120)}>
              2 мин 🏋️
            </DurationButton>
          </DurationGrid>
          <PrimaryButton onClick={handleStart} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
            Начать! 🚀
          </PrimaryButton>
        </SetupCard>
      </Container>
    );
  }

  // Game over
  if (phase === 'done') {
    const accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
    return (
      <Container>
        <CompletionCard>
          <StarRating>{getStars()}</StarRating>
          <CompletionTitle>{getTitle()}</CompletionTitle>
          <CompletionStats>
            <BigStat color="#e53e3e">
              <div className="value">{score}</div>
              <div className="label">Очков</div>
            </BigStat>
            <BigStat color="#48bb78">
              <div className="value">{correct}</div>
              <div className="label">Верно</div>
            </BigStat>
            <BigStat color="#ecc94b">
              <div className="value">{accuracy}%</div>
              <div className="label">Точность</div>
            </BigStat>
            <BigStat color="#ed8936">
              <div className="value">{maxStreak}</div>
              <div className="label">Макс. серия</div>
            </BigStat>
          </CompletionStats>
          <ButtonRow>
            <PrimaryButton onClick={() => { setPhase('setup'); }}>
              Играть снова 🔄
            </PrimaryButton>
            <SecondaryButton onClick={() => navigate('/games/quiz-blitz')}>
              Другой набор
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate('/dashboard')}>
              ⬅️ Мои наборы
            </SecondaryButton>
          </ButtonRow>
        </CompletionCard>
      </Container>
    );
  }

  // Playing
  if (!currentCard) return null;
  
  const prompt = showTermSide ? currentCard.term : currentCard.definition;
  const questionLabel = showTermSide ? 'Что означает этот термин?' : 'Какой термин соответствует?';
  const timerPct = (timeLeft / duration) * 100;

  return (
    <Container>
      <Header>
        <Title>⚡ Блиц-викторина</Title>
      </Header>

      <TimerBar>
        <TimerFill pct={timerPct} />
      </TimerBar>
      <TimerText seconds={timeLeft}>
        ⏱️ {timeLeft} сек
      </TimerText>

      <StatsRow>
        <StatBubble color="#e53e3e">
          <div className="value">{score}</div>
          <div className="label">Очки</div>
        </StatBubble>
        <StatBubble color="#48bb78">
          <div className="value">{correct}</div>
          <div className="label">Верно</div>
        </StatBubble>
        <StatBubble color="#f56565">
          <div className="value">{wrong}</div>
          <div className="label">Ошибки</div>
        </StatBubble>
        <StatBubble color="#ed8936">
          <div className="value">{streak > 0 ? `🔥${streak}` : '0'}</div>
          <div className="label">Серия</div>
        </StatBubble>
      </StatsRow>

      <QuestionCard key={`${currentCard.id}-${totalAnswered}`}>
        <QuestionLabel>{questionLabel}</QuestionLabel>
        <QuestionText>{prompt}</QuestionText>
        
        <OptionsGrid>
          {options.map((option) => {
            const optionText = showTermSide ? option.definition : option.term;
            const isSelected = selectedOption?.id === option.id;
            const isCorrectOption = option.id === currentCard.id;
            return (
              <OptionButton
                key={option.id}
                correct={answered && isCorrectOption}
                wrong={answered && isSelected && !isCorrectOption}
                disabled={answered}
                onClick={() => handleOptionClick(option)}
              >
                {optionText}
              </OptionButton>
            );
          })}
        </OptionsGrid>
      </QuestionCard>
    </Container>
  );
}

export default QuizBlitz;
