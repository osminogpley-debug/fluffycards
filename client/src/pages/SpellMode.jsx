import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';



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

const Subtitle = styled.p`
  color: #718096;
  font-size: 1rem;
`;

const CardContainer = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 24px;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(251, 191, 36, 0.25);
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    transition: transform 0.3s ease;
  }
`;

const AudioButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  font-size: 3rem;
  cursor: pointer;
  position: relative;
  z-index: 1;
  box-shadow: 0 8px 30px rgba(99, 179, 237, 0.4);
  transition: all 0.3s ease;

  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 40px rgba(99, 179, 237, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const SoundWaves = styled.div`
  display: ${({ isPlaying }) => isPlaying ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 1.5rem;
  height: 40px;
`;

const WaveBar = styled.div`
  width: 6px;
  height: 100%;
  background: linear-gradient(to top, #63b3ed, #4299e1);
  border-radius: 3px;

`;

const Hint = styled.p`
  color: #4a5568;
  font-size: 1rem;
  margin-top: 1.5rem;
  position: relative;
  z-index: 1;
`;

const InputContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
`;

const InputLabel = styled.div`
  color: #718096;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const InputField = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.3rem;
  border-radius: 12px;
  border: 3px solid ${({ status }) => 
    status === 'correct' ? '#48bb78' : 
    status === 'incorrect' ? '#f56565' : '#e2e8f0'};
  text-align: center;
  font-family: inherit;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: all 0.3s ease;

  
  &:focus {
    outline: none;
    border-color: ${({ status }) => 
      status === 'correct' ? '#48bb78' : 
      status === 'incorrect' ? '#f56565' : 
      '#63b3ed'};
    box-shadow: 0 0 0 4px ${({ status }) => 
      status === 'correct' ? 'rgba(72, 187, 120, 0.2)' : 
      status === 'incorrect' ? 'rgba(245, 101, 101, 0.2)' : 
      'rgba(99, 179, 237, 0.2)'};
  }
`;

const FeedbackContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  transition: opacity 0.3s ease;
`;

const FeedbackEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`;

const FeedbackText = styled.div`
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const CorrectAnswer = styled.div`
  color: #4a5568;
  font-size: 1.1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const ProgressContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const ProgressItem = styled.div`
  text-align: center;
`;

const ProgressValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
`;

const ProgressLabel = styled.div`
  font-size: 0.85rem;
  color: #718096;
`;

const CompletionCard = styled.div`
  background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px rgba(72, 187, 120, 0.3);
  transition: transform 0.2s ease;
`;

const CompletionTitle = styled.h2`
  color: #22543d;
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const BigEmoji = styled.div`
  font-size: 5rem;
  margin: 1.5rem 0;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  flex-wrap: wrap;
`;

const StatBox = styled.div`
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #48bb78;
`;

const StatText = styled.div`
  color: #4a5568;
  font-size: 0.9rem;
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
  background: #fee2e2;
  border-radius: 16px;
  color: #991b1b;
  margin: 2rem 0;
`;

const SetInfo = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  text-align: center;
  
  h3 {
    margin: 0 0 0.25rem 0;
    color: #92400e;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: #b45309;
    font-size: 0.9rem;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
  }
`;

function SpellMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [terms, setTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [inputStatus, setInputStatus] = useState('neutral');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);

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
      
      if (setData.flashcards && setData.flashcards.length > 0) {
        // Фильтруем только карточки с терминами на английском (для произношения)
        const spellCards = setData.flashcards
          .filter(card => card.term && /^[a-zA-Z\s]+$/.test(card.term.trim()))
          .map((card, idx) => ({ 
            ...card, 
            id: card._id || idx + 1,
            hint: card.definition.substring(0, 100) + (card.definition.length > 100 ? '...' : '')
          }));
        
        if (spellCards.length > 0) {
          setTerms(spellCards);
        } else {
          // Если нет английских терминов, используем все
          setTerms(setData.flashcards.map((card, idx) => ({ 
            ...card, 
            id: card._id || idx + 1,
            hint: card.definition.substring(0, 100) + (card.definition.length > 100 ? '...' : '')
          })));
        }
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

  const currentTerm = terms[currentIndex];

  const speak = useCallback(() => {
    if (!currentTerm?.term) return;
    
    if (!window.speechSynthesis) {
      alert('Ваш браузер не поддерживает Web Speech API');
      return;
    }

    setIsPlaying(true);
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(currentTerm.term);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [currentTerm]);

  // Auto-play on first load of each term
  useEffect(() => {
    if (currentTerm && !showFeedback) {
      const timer = setTimeout(() => {
        speak();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, speak, showFeedback, currentTerm]);

  const handleCheck = () => {
    if (!inputValue.trim() || !currentTerm) return;

    setAttempts(prev => prev + 1);
    const userAnswer = inputValue.trim().toLowerCase();
    const correct = currentTerm.term.toLowerCase();

    const isMatch = userAnswer === correct;

    setIsCorrect(isMatch);
    setInputStatus(isMatch ? 'correct' : 'incorrect');
    setShowFeedback(true);

    if (isMatch) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setInputValue('');
    setInputStatus('neutral');
    setShowFeedback(false);

    if (currentIndex < terms.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleRepeat = () => {
    setInputValue('');
    setInputStatus('neutral');
    setShowFeedback(false);
    speak();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setInputValue('');
    setInputStatus('neutral');
    setShowFeedback(false);
    setCorrectCount(0);
    setAttempts(0);
    setStreak(0);
    setIsComplete(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (showFeedback) {
        handleNext();
      } else {
        handleCheck();
      }
    }
  };

  const accuracy = attempts > 0 ? Math.round((correctCount / attempts) * 100) : 0;

  const handleSelectSet = (set) => {
    navigate(`/learn/spell?setId=${set._id || set.id}`);
  };

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="🔊 Режим правописания"
        subtitle="Выберите набор карточек для тренировки правописания"
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
          <Button onClick={() => navigate('/learn/spell')} style={{ marginTop: '1rem' }}>
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
          <CompletionTitle>🎉 Поздравляем!</CompletionTitle>
          <BigEmoji>🏆</BigEmoji>
          <p style={{ color: '#2f855a', fontSize: '1.2rem' }}>
            Ты завершил режим правописания!
          </p>
          <StatsRow>
            <StatBox>
              <StatNumber>{correctCount}</StatNumber>
              <StatText>Правильно</StatText>
            </StatBox>
            <StatBox>
              <StatNumber>{accuracy}%</StatNumber>
              <StatText>Точность</StatText>
            </StatBox>
            <StatBox>
              <StatNumber>{attempts}</StatNumber>
              <StatText>Попыток</StatText>
            </StatBox>
          </StatsRow>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryButton onClick={handleRestart}>
              Пройти еще раз 🔄
            </PrimaryButton>
            <Button onClick={() => navigate('/learn/spell')}>Другой набор</Button>
          </div>
        </CompletionCard>
      </Container>
    );
  }

  if (!currentTerm) return null;

  return (
    <Container>
      <Header>
        <Title>🔊 Режим правописания</Title>
        <Subtitle>Слушай и печатай услышанное слово</Subtitle>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>{currentIndex + 1} из {terms.length}</p>
        </SetInfo>
      )}

      <ProgressContainer>
        <ProgressItem>
          <ProgressValue>{currentIndex + 1}/{terms.length}</ProgressValue>
          <ProgressLabel>Прогресс</ProgressLabel>
        </ProgressItem>
        <ProgressItem>
          <ProgressValue>{accuracy}%</ProgressValue>
          <ProgressLabel>Точность</ProgressLabel>
        </ProgressItem>
        <ProgressItem>
          <ProgressValue>{streak} 🔥</ProgressValue>
          <ProgressLabel>Серия</ProgressLabel>
        </ProgressItem>
      </ProgressContainer>

      <CardContainer>
        <AudioButton 
          onClick={speak} 
          isPlaying={isPlaying}
          aria-label="Прослушать термин"
        >
          {isPlaying ? '🔊' : '▶️'}
        </AudioButton>
        
        <SoundWaves isPlaying={isPlaying}>
          <WaveBar delay={0} />
          <WaveBar delay={0.1} />
          <WaveBar delay={0.2} />
          <WaveBar delay={0.3} />
          <WaveBar delay={0.4} />
        </SoundWaves>

        <Hint>
          💡 Подсказка: {currentTerm.hint}
        </Hint>
      </CardContainer>

      <InputContainer>
        <InputLabel>Введите услышанное слово:</InputLabel>
        <InputField
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Напишите здесь..."
          status={inputStatus}
          disabled={showFeedback && isCorrect}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {showFeedback && (
          <FeedbackContainer correct={isCorrect}>
            <FeedbackEmoji>
              {isCorrect ? '🎉' : '😔'}
            </FeedbackEmoji>
            <FeedbackText correct={isCorrect}>
              {isCorrect 
                ? 'Отлично! Правильное написание!' 
                : 'Неправильно, попробуй еще раз'}
            </FeedbackText>
            {!isCorrect && (
              <CorrectAnswer>
                Правильно: <strong>{currentTerm.term}</strong>
              </CorrectAnswer>
            )}
          </FeedbackContainer>
        )}
      </InputContainer>

      <ButtonGroup>
        {!showFeedback ? (
          <>
            <SecondaryButton onClick={speak}>
              🔊 Повторить
            </SecondaryButton>
            <SecondaryButton onClick={() => {
              setInputValue(currentTerm.term);
              setInputStatus('neutral');
            }}>
              👁️ Подсказка
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
              <SecondaryButton onClick={handleRepeat}>
                🔄 Попробовать снова
              </SecondaryButton>
            )}
            <PrimaryButton onClick={handleNext}>
              Дальше ➡️
            </PrimaryButton>
          </>
        )}
      </ButtonGroup>
    </Container>
  );
}

export default SpellMode;
