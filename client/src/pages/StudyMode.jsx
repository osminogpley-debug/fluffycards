import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';



const Container = styled.div`
  max-width: 900px;
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

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #63b3ed 0%, #48bb78 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
  width: ${({ progress }) => progress}%;  position: relative;
  
  &::after {
    content: '🌟';
    position: absolute;
    right: -15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
  }
`;

const ProgressText = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const ColumnsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  min-height: 150px;
`;

const Column = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 1rem;
  min-height: 120px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  border-top: 6px solid ${({ color }) => color};
`;

const ColumnHeader = styled.div`
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const CardCount = styled.span`
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const CardBadge = styled.div`
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
`;

const QuestionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%));
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(99, 179, 237, 0.2));
  transition: opacity 0.3s ease;
  border: 1px solid var(--border-color, transparent);
`;

const QuestionText = styled.h2`
  color: var(--text-primary);
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const ModeToggle = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModeButton = styled.button`
  background: ${({ active }) => active ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' : 'var(--bg-secondary)'};
  color: ${({ active }) => active ? 'white' : 'var(--text-secondary)'};
  border: 2px solid #63b3ed;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
  }
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const OptionButton = styled.button`
  background: ${({ selected, correct, wrong }) => 
    correct ? '#48bb78' : 
    wrong ? '#f56565' : 
    selected ? '#63b3ed' : 'var(--bg-secondary)'};
  color: ${({ selected, correct, wrong }) => 
    selected || correct || wrong ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${({ selected, correct, wrong }) => 
    correct ? '#48bb78' : 
    wrong ? '#f56565' : 
    selected ? '#63b3ed' : 'var(--border-color)'};
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  transition: transform 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    border-color: #63b3ed;
  }
  
  &:disabled {
    opacity: 0.7;
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const InputField = styled.input`
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  width: 100%;
  max-width: 400px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
  }
`;

const FeedbackMessage = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  transition: transform 0.2s ease;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%));
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(72, 187, 120, 0.3));
  transition: transform 0.2s ease;
  border: 1px solid var(--border-color, transparent);
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
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #48bb78;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
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
  background: #fee2e2;
  border-radius: 16px;
  color: #991b1b;
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
    color: var(--text-primary);
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
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

const encouragingMessages = [
  { correct: ['Отлично! 🎉', 'Супер! 🌟', 'Ты молодец! 💪', 'Великолепно! ✨', 'Правильно! 🎯'] },
  { incorrect: ['Почти! Попробуй еще раз 😊', 'Не сдавайся! 💪', 'У тебя получится! 🌈', 'Подумай еще немного 🤔'] }
];

function StudyMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [flashcards, setFlashcards] = useState([]);
  const [needToLearn, setNeedToLearn] = useState([]);
  const [familiar, setFamiliar] = useState([]);
  const [mastered, setMastered] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState('multiple');
  const [selectedOption, setSelectedOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [options, setOptions] = useState([]);
  const sessionStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);

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
        setNeedToLearn(cards.map(c => c.id));
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

  const getCurrentCard = () => {
    // Безопасное получение текущей карточки
    if (needToLearn.length === 0) return null;
    const safeIndex = Math.min(currentIndex, needToLearn.length - 1);
    const cardId = needToLearn[safeIndex];
    return flashcards.find(c => c.id === cardId) || null;
  };

  const generateOptions = useCallback(() => {
    const current = getCurrentCard();
    if (!current) return [];
    const otherCards = flashcards.filter(c => c.id !== current.id);
    const shuffled = [...otherCards].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...shuffled, current].sort(() => 0.5 - Math.random());
    return options;
  }, [flashcards, currentIndex, needToLearn]);

  useEffect(() => {
    if (needToLearn.length > 0 && currentIndex < needToLearn.length) {
      setOptions(generateOptions());
      setSelectedOption(null);
      setInputValue('');
      setShowFeedback(false);
    } else if (needToLearn.length === 0 && familiar.length === 0 && flashcards.length > 0 && !isComplete) {
      setIsComplete(true);
    }
  }, [currentIndex, needToLearn, familiar, generateOptions, isComplete, flashcards.length]);

  const getRandomMessage = (correct) => {
    const messages = correct ? encouragingMessages[0].correct : encouragingMessages[1].incorrect;
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleCheckAnswer = (isAnswerCorrect) => {
    setAttempts(prev => prev + 1);
    setIsCorrect(isAnswerCorrect);
    setFeedbackMessage(getRandomMessage(isAnswerCorrect));
    setShowFeedback(true);

    const currentCardId = getCurrentCard().id;

    if (isAnswerCorrect) {
      setCorrectCount(prev => prev + 1);
      
      // Сначала определяем новый статус карточки
      if (familiar.includes(currentCardId)) {
        // Карточка была в Знакомых -> переходит в Усвоенные
        setFamiliar(prev => prev.filter(id => id !== currentCardId));
        setMastered(prev => [...prev, currentCardId]);
      } else {
        // Карточка была в Нужно выучить -> переходит в Знакомые
        setFamiliar(prev => [...prev, currentCardId]);
      }
      
      // Удаляем из Нужно выучить (после всех остальных операций)
      setNeedToLearn(prev => prev.filter(id => id !== currentCardId));
      
    } else {
      // При неправильном ответе - если карточка была в Знакомых, возвращаем в Нужно выучить
      if (familiar.includes(currentCardId)) {
        setFamiliar(prev => prev.filter(id => id !== currentCardId));
        // Убедимся что карточка есть в needToLearn
        setNeedToLearn(prev => {
          if (!prev.includes(currentCardId)) {
            return [...prev, currentCardId];
          }
          return prev;
        });
      }
      // Если карточка в Mastered - возвращаем в NeedToLearn
      if (mastered.includes(currentCardId)) {
        setMastered(prev => prev.filter(id => id !== currentCardId));
        setNeedToLearn(prev => {
          if (!prev.includes(currentCardId)) {
            return [...prev, currentCardId];
          }
          return prev;
        });
      }
    }
  };

  const handleOptionSelect = (option) => {
    if (showFeedback) return;
    setSelectedOption(option);
    const current = getCurrentCard();
    handleCheckAnswer(option.id === current.id);
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim() || showFeedback) return;
    const current = getCurrentCard();
    const isMatch = inputValue.trim().toLowerCase() === current.definition.toLowerCase() ||
                    inputValue.trim().toLowerCase() === current.term.toLowerCase();
    handleCheckAnswer(isMatch);
  };

  const handleNext = () => {
    // Сбрасываем состояние ответа
    setShowFeedback(false);
    setSelectedOption(null);
    setInputValue('');
    
    // Рассчитываем сколько карточек останется после текущего ответа
    // При правильном ответе карточка будет удалена из needToLearn
    const willRemoveCard = isCorrect;
    const nextLength = willRemoveCard ? needToLearn.length - 1 : needToLearn.length;
    
    if (nextLength <= 0) {
      // Все карточки изучены - показываем экран завершения
      setIsComplete(true);
      return;
    }
    
    // Если текущий индекс указывает на последнюю карточку (которая будет удалена)
    // или за пределами массива после удаления - сбрасываем на 0
    const nextIndex = currentIndex >= nextLength ? 0 : currentIndex;
    setCurrentIndex(nextIndex);
  };

  const handleRestart = () => {
    setNeedToLearn(flashcards.map(c => c.id));
    setFamiliar([]);
    setMastered([]);
    setCurrentIndex(0);
    setIsComplete(false);
    setCorrectCount(0);
    setAttempts(0);
    setShowFeedback(false);
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
  };

  const getCardTerm = (id) => flashcards.find(c => c.id === id)?.term;

  const progress = flashcards.length > 0 ? Math.round(((familiar.length + mastered.length) / flashcards.length) * 100) : 0;
  const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

  const recordStatsSession = async () => {
    try {
      const timeSpent = Math.max(0, Math.round((Date.now() - sessionStartRef.current) / 1000));
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'study',
          cardsCount: flashcards.length,
          correctCount,
          timeSpent
        })
      });
    } catch (err) {
      console.error('Error recording study stats:', err);
    }
  };

  useEffect(() => {
    if (isComplete && !statsRecordedRef.current && flashcards.length > 0) {
      statsRecordedRef.current = true;
      recordStatsSession();
    }
  }, [isComplete, flashcards.length, correctCount]);

  const handleSelectSet = (set) => {
    navigate(`/learn/study?setId=${set._id || set.id}`);
  };

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="📚 Режим заучивания"
        subtitle="Выберите набор карточек для изучения"
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
          <Button onClick={() => navigate('/learn/study')} style={{ marginTop: '1rem' }}>
            Выбрать другой набор
          </Button>
        </ErrorMessage>
      </Container>
    );
  }

  // Проверяем завершение ДО получения текущей карточки
  if (isComplete || needToLearn.length === 0) {
    return (
      <Container>
        <CompletionCard>
          <CompletionTitle>🎉 Поздравляем! 🎉</CompletionTitle>
          <p style={{ color: '#2f855a', fontSize: '1.2rem' }}>Ты изучил все карточки!</p>
          <CompletionStats>
            <StatBox>
              <StatValue>{flashcards.length}</StatValue>
              <StatLabel>Карточек изучено</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue>{accuracy}%</StatValue>
              <StatLabel>Точность</StatLabel>
            </StatBox>
            <StatBox>
              <StatValue>{attempts}</StatValue>
              <StatLabel>Попыток</StatLabel>
            </StatBox>
          </CompletionStats>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={handleRestart}>Начать заново 🔄</PrimaryButton>
            <Button onClick={() => navigate('/learn/study')}>Другой набор</Button>
            <SecondaryButton onClick={() => navigate('/dashboard')}>⬅️ Мои наборы</SecondaryButton>
          </div>
        </CompletionCard>
      </Container>
    );
  }

  const current = getCurrentCard();
  if (!current) return null;

  return (
    <Container>
      <Header>
        <Title>📚 Режим заучивания</Title>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>{flashcards.length} карточек</p>
        </SetInfo>
      )}

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      <ProgressText>Прогресс: {progress}% | Точность: {accuracy}%</ProgressText>

      <ColumnsContainer>
        <Column color="#fee2e2">
          <ColumnHeader>
            📖 Нужно выучить
            <CardCount>{needToLearn.length}</CardCount>
          </ColumnHeader>
          {needToLearn.slice(0, 3).map(id => (
            <CardBadge key={id}>{getCardTerm(id)}</CardBadge>
          ))}
        </Column>
        <Column color="#fef3c7">
          <ColumnHeader>
            🌟 Знакомые
            <CardCount>{familiar.length}</CardCount>
          </ColumnHeader>
          {familiar.slice(0, 3).map(id => (
            <CardBadge key={id}>{getCardTerm(id)}</CardBadge>
          ))}
        </Column>
        <Column color="#d1fae5">
          <ColumnHeader>
            🏆 Усвоенные
            <CardCount>{mastered.length}</CardCount>
          </ColumnHeader>
          {mastered.slice(0, 3).map(id => (
            <CardBadge key={id}>{getCardTerm(id)}</CardBadge>
          ))}
        </Column>
      </ColumnsContainer>

      <QuestionCard>
        <ModeToggle>
          <ModeButton 
            active={mode === 'multiple'} 
            onClick={() => setMode('multiple')}
          >
            🎯 Выбор ответа
          </ModeButton>
          <ModeButton 
            active={mode === 'input'} 
            onClick={() => setMode('input')}
          >
            ⌨️ Ввод с клавиатуры
          </ModeButton>
        </ModeToggle>

        <QuestionText>{current.term}</QuestionText>

        {mode === 'multiple' ? (
          <OptionsGrid>
            {options.map((option) => (
              <OptionButton
                key={option.id}
                selected={selectedOption?.id === option.id}
                correct={showFeedback && option.id === current.id}
                wrong={showFeedback && selectedOption?.id === option.id && option.id !== current.id}
                disabled={showFeedback}
                onClick={() => handleOptionSelect(option)}
              >
                {option.definition}
              </OptionButton>
            ))}
          </OptionsGrid>
        ) : (
          <InputContainer>
            <InputField
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите определение..."
              onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
              disabled={showFeedback}
            />
            <PrimaryButton 
              onClick={handleInputSubmit}
              disabled={!inputValue.trim() || showFeedback}
            >
              Проверить
            </PrimaryButton>
          </InputContainer>
        )}

        {showFeedback && (
          <FeedbackMessage correct={isCorrect}>
            {feedbackMessage}
          </FeedbackMessage>
        )}

        {showFeedback && (
          <ActionButtons>
            {!isCorrect && (
              <SecondaryButton onClick={() => {
                setShowFeedback(false);
                setSelectedOption(null);
                setInputValue('');
              }}>
                Попробовать снова 🔄
              </SecondaryButton>
            )}
            <PrimaryButton onClick={handleNext}>
              Дальше ➡️
            </PrimaryButton>
          </ActionButtons>
        )}
      </QuestionCard>
    </Container>
  );
}

export default StudyMode;
