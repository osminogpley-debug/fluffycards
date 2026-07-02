import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
import SetSelector from '../components/SetSelector';
import ChineseInputHelper from '../components/ChineseInputHelper';
import {
  formatExpectedAnswer,
  getPinyinAnswers,
  matchesPinyinAnswer
} from '../utils/chineseLearning';

const resolveImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};



const Container = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #63b3ed;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProgressContainer = styled.div`
  background: var(--card-bg, white);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px var(--shadow-color, rgba(0, 0, 0, 0.08));
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid var(--border-color, transparent);
`;

const ProgressMascot = styled.div`
  font-size: 3rem;
  transition: transform 0.2s ease;
`;

const ProgressInfo = styled.div`
  flex: 1;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 16px;
  background: var(--bg-tertiary, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #ef4444 100%);
  border-radius: 8px;
  transition: width 0.5s ease;
  width: ${({ progress }) => progress}%;
`;

const ProgressText = styled.div`
  color: var(--text-secondary, #4a5568);
  font-size: 0.9rem;
`;

const AccuracyBadge = styled.div`
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #22543d;
  padding: 0.75rem 1.25rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
`;

const CardContainer = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%));
  border-radius: 24px;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(99, 179, 237, 0.2));
  text-align: center;
  transition: opacity 0.3s ease;
  border: 1px solid var(--border-color, transparent);
`;

const PromptLabel = styled.div`
  color: #63b3ed;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1rem;
`;

const PromptText = styled.h2`
  color: var(--text-primary, #2d3748);
  font-size: 2rem;
  margin-bottom: 2rem;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardImage = styled.img`
  width: 220px;
  height: 160px;
  max-width: 100%;
  margin-top: 0.5rem;
  border-radius: 12px;
  object-fit: contain;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 6px;
`;

const DirectionToggle = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
`;

const DirectionButton = styled.button`
  background: ${({ active }) => active ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' : 'var(--card-bg, white)'};
  color: ${({ active }) => active ? 'white' : 'var(--text-secondary, #4a5568)'};
  border: 2px solid #63b3ed;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const InputContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const ChineseHint = styled.div`
  margin: -0.5rem 0 1rem;
  color: var(--text-secondary, #4a5568);
  font-size: 0.9rem;
  text-align: center;
`;

const InputField = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 1rem 1.5rem;
  font-size: 1.2rem;
  border-radius: 16px;
  border: 3px solid ${({ status }) => 
    status === 'correct' ? '#48bb78' : 
    status === 'incorrect' ? '#f56565' : '#e2e8f0'};
  text-align: center;
  font-family: inherit;
  transition: all 0.3s ease;

  
  &:focus {
    outline: none;
    border-color: ${({ status }) => 
      status === 'correct' ? '#48bb78' : 
      status === 'incorrect' ? '#f56565' : '#63b3ed'};
    box-shadow: 0 0 0 4px ${({ status }) => 
      status === 'correct' ? 'rgba(72, 187, 120, 0.2)' : 
      status === 'incorrect' ? 'rgba(245, 101, 101, 0.2)' : 
      'rgba(99, 179, 237, 0.2)'};
  }
`;

const FeedbackContainer = styled.div`
  margin: 1.5rem 0;
  padding: 1rem;
  border-radius: 12px;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  transition: all 0.3s ease;
`;

const FeedbackText = styled.div`
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const CorrectAnswer = styled.div`
  color: var(--text-secondary, #4a5568);
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 4px 15px var(--shadow-color, rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, transparent);
`;

const StatIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #2d3748);
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary, #718096);
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fef3c7 0%, #fde68a 100%));
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(251, 191, 36, 0.3));
  transition: transform 0.2s ease;
  border: 1px solid var(--border-color, transparent);
`;

const CompletionTitle = styled.h2`
  color: var(--text-primary, #92400e);
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const Trophy = styled.div`
  font-size: 5rem;
  margin: 1.5rem 0;
  transition: all 0.3s ease;
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
    animation: none;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: var(--card-bg, #fee2e2);
  border-radius: 16px;
  color: var(--text-primary, #991b1b);
  border: 1px solid var(--border-color, #fca5a5);
  margin: 2rem 0;
`;

const SetInfo = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%));
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 1px solid var(--border-color, transparent);
  
  h3 {
    margin: 0 0 0.25rem 0;
    color: var(--text-primary, #0369a1);
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary, #0ea5e9);
    font-size: 0.9rem;
  }
`;

const Button = styled.button`
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

function WriteMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('term-to-def');
  const [inputValue, setInputValue] = useState('');
  const [inputStatus, setInputStatus] = useState('neutral');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [answeredCards, setAnsweredCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const sessionStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const inputRef = useRef(null);

  // Загрузка набора
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
      sessionStartRef.current = Date.now();
      statsRecordedRef.current = false;
      
      if (setData.flashcards && setData.flashcards.length > 0) {
        const cards = setData.flashcards.map((card, idx) => ({ ...card, id: card._id || idx + 1 }));
        setFlashcards(cards);
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

  const currentCard = flashcards[currentIndex];
  const isTermToDef = direction === 'term-to-def';

  const prompt = isTermToDef ? currentCard?.term : currentCard?.definition;
  const correctAnswer = isTermToDef ? currentCard?.definition : currentCard?.term;
  const pinyinAnswers = getPinyinAnswers(correctAnswer, isTermToDef ? '' : currentCard?.pinyin);
  const requiresPinyin = pinyinAnswers.length > 0;
  const chineseDictionaryEntries = useMemo(
    () => flashcards.flatMap((flashcard) => [flashcard.term, flashcard.definition]),
    [flashcards]
  );

  const progress = flashcards.length > 0 ? Math.round((answeredCards.length / flashcards.length) * 100) : 0;
  const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

  const getMascot = () => {
    if (accuracy >= 80) return '🌟';
    if (accuracy >= 60) return '😊';
    if (accuracy >= 40) return '🤔';
    return '💪';
  };

  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter[i - 1] !== longer[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[longer.length] = lastValue;
    }
    return (longer.length - costs[longer.length]) / longer.length;
  };

  const handleCheck = () => {
    if (!inputValue.trim() || !correctAnswer) return;
    
    setAttempts(prev => prev + 1);
    const userAnswer = inputValue.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();
    
    const isMatch = requiresPinyin
      ? matchesPinyinAnswer(inputValue, pinyinAnswers)
      : userAnswer === correct || 
        correct.includes(userAnswer) || 
        userAnswer.includes(correct) ||
        calculateSimilarity(userAnswer, correct) > 0.8;
    
    setIsCorrect(isMatch);
    setInputStatus(isMatch ? 'correct' : 'incorrect');
    setShowFeedback(true);
    
    if (isMatch) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
      if (currentCard && !answeredCards.includes(currentCard.id)) {
        setAnsweredCards(prev => [...prev, currentCard.id]);
      }
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setInputValue('');
    setInputStatus('neutral');
    setShowFeedback(false);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleSkip = () => {
    setStreak(0);
    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setInputValue('');
    setInputStatus('neutral');
    setShowFeedback(false);
    setCorrectCount(0);
    setAttempts(0);
    setStreak(0);
    setAnsweredCards([]);
    setIsComplete(false);
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
  };

  const recordStatsSession = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'write',
          cardsCount: flashcards.length,
          correctCount,
          timeSpent
        })
      });
    } catch (err) {
      console.error('Error recording write stats:', err);
    }
  };

  useEffect(() => {
    if (isComplete && !statsRecordedRef.current && flashcards.length > 0) {
      statsRecordedRef.current = true;
      recordStatsSession();
    }
  }, [isComplete, flashcards.length, correctCount]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showFeedback) {
        handleNext();
      } else {
        handleCheck();
      }
    }
  };

  const handleSelectSet = (set) => {
    navigate(`/learn/write?setId=${set._id}`);
  };

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="✍️ Режим письма"
        subtitle="Выберите набор карточек для тренировки письма"
        onSelectSet={handleSelectSet}
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
          <Button onClick={() => navigate('/learn/write')} style={{ marginTop: '1rem' }}>
            Выбрать другой набор
          </Button>
        </ErrorMessage>
      </Container>
    );
  }

  if (isComplete) {
    return (
      <Container>
        <CompletionCard>
          <CompletionTitle>🎉 Отличная работа!</CompletionTitle>
          <Trophy>🏆</Trophy>
          <p style={{ color: '#78350f', fontSize: '1.2rem', marginBottom: '2rem' }}>
            Ты завершил все карточки!
          </p>
          <StatsGrid style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>
            <StatCard>
              <StatIcon>🎯</StatIcon>
              <StatValue>{accuracy}%</StatValue>
              <StatLabel>Точность</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>✅</StatIcon>
              <StatValue>{correctCount}</StatValue>
              <StatLabel>Правильно</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>🔥</StatIcon>
              <StatValue>{streak}</StatValue>
              <StatLabel>Лучшая серия</StatLabel>
            </StatCard>
          </StatsGrid>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={handleRestart}>Пройти еще раз 🔄</PrimaryButton>
            <Button onClick={() => navigate('/learn/write')}>Другой набор</Button>
          </div>
        </CompletionCard>
      </Container>
    );
  }

  if (!currentCard) return null;

  return (
    <Container>
      <Header>
        <Title>✍️ Режим письма</Title>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>Карточка {currentIndex + 1} из {flashcards.length}</p>
        </SetInfo>
      )}

      <ProgressContainer>
        <ProgressMascot>{getMascot()}</ProgressMascot>
        <ProgressInfo>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <ProgressText>
            Карточка {currentIndex + 1} из {flashcards.length} • Серия: {streak} 🔥
          </ProgressText>
        </ProgressInfo>
        <AccuracyBadge>{accuracy}%</AccuracyBadge>
      </ProgressContainer>

      <StatsGrid>
        <StatCard>
          <StatIcon>✅</StatIcon>
          <StatValue>{correctCount}</StatValue>
          <StatLabel>Правильно</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>📝</StatIcon>
          <StatValue>{attempts}</StatValue>
          <StatLabel>Попыток</StatLabel>
        </StatCard>
        <StatCard>
          <StatIcon>🔥</StatIcon>
          <StatValue>{streak}</StatValue>
          <StatLabel>Серия</StatLabel>
        </StatCard>
      </StatsGrid>

      <CardContainer>
        <DirectionToggle>
          <DirectionButton 
            active={direction === 'term-to-def'}
            onClick={() => setDirection('term-to-def')}
          >
            Термин → Определение
          </DirectionButton>
          <DirectionButton 
            active={direction === 'def-to-term'}
            onClick={() => setDirection('def-to-term')}
          >
            Определение → Термин
          </DirectionButton>
        </DirectionToggle>

        <PromptLabel>
          {isTermToDef ? 'Напишите определение для термина:' : 'Напишите термин для определения:'}
        </PromptLabel>
        <PromptText>{prompt}</PromptText>
        {currentCard?.imageUrl && (
          <CardImage
            src={resolveImageUrl(currentCard.imageUrl)}
            alt="Card illustration"
          />
        )}

        <InputContainer>
          <InputField
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={requiresPinyin ? 'Введите пиньинь...' : isTermToDef ? 'Введите определение...' : 'Введите термин...'}
            status={inputStatus}
            disabled={showFeedback && isCorrect}
            autoFocus
          />
        </InputContainer>
        {requiresPinyin && (
          <ChineseHint>
            Используйте пиньинь. Подойдут nǐ hǎo, ni hao и ni3 hao3.
          </ChineseHint>
        )}
        {requiresPinyin && (
          <ChineseInputHelper
            value={inputValue}
            onChange={setInputValue}
            disabled={showFeedback && isCorrect}
            inputRef={inputRef}
            dictionaryCharacters={chineseDictionaryEntries}
          />
        )}

        {showFeedback && (
          <FeedbackContainer correct={isCorrect}>
            <FeedbackText correct={isCorrect}>
              {isCorrect ? '✨ Правильно! Отличная работа!' : '❌ Не совсем верно'}
            </FeedbackText>
            {!isCorrect && (
              <CorrectAnswer>
                Правильный ответ: <strong>{formatExpectedAnswer(correctAnswer, pinyinAnswers) || correctAnswer}</strong>
              </CorrectAnswer>
            )}
          </FeedbackContainer>
        )}

        <ButtonGroup>
          {!showFeedback ? (
            <>
              <SecondaryButton onClick={handleSkip}>
                Пропустить ⏭️
              </SecondaryButton>
              <PrimaryButton 
                onClick={handleCheck}
                disabled={!inputValue.trim()}
              >
                Проверить ✓
              </PrimaryButton>
            </>
          ) : (
            <>
              {!isCorrect && (
                <SecondaryButton onClick={() => {
                  setInputValue(pinyinAnswers[0] || correctAnswer);
                  setInputStatus('correct');
                  setIsCorrect(true);
                }}>
                  Показать ответ 👁️
                </SecondaryButton>
              )}
              <PrimaryButton onClick={handleNext}>
                Дальше ➡️
              </PrimaryButton>
            </>
          )}
        </ButtonGroup>
      </CardContainer>
    </Container>
  );
}

export default WriteMode;
