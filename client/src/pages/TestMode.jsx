import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { API_ROUTES, authFetch } from '../constants/api';



// 🎯 Styled Components
const TestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.3s ease;
`;

const TestHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const TestTitle = styled.h1`
  color: #63b3ed;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "📝 ";
  }
`;

const SetInfo = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%));
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
  display: inline-block;
  border: 1px solid var(--border-color, transparent);
  
  h3 {
    margin: 0;
    color: var(--text-primary, #0369a1);
    font-size: 1rem;
  }
`;

const ProgressSection = styled.div`
  margin-bottom: 2rem;
`;

const ProgressBarContainer = styled.div`
  background: var(--bg-tertiary, #e2e8f0);
  border-radius: 20px;
  height: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #63b3ed 0%, #4299e1 50%, #3182ce 100%);
  border-radius: 20px;
  transition: width 0.5s ease;
  position: relative;
  
  &::after {
    content: "✨";
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
  }
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: var(--text-secondary, #718096);
  font-size: 0.9rem;
`;

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--card-bg, ${({ isLow }) => isLow ? '#fed7d7' : '#e6fffa'});
  border-radius: 16px;
  border: 2px solid ${({ isLow }) => isLow ? '#fc8181' : '#81e6d9'};

`;

const TimerIcon = styled.span`
  font-size: 1.5rem;
`;

const TimerText = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ isLow }) => isLow ? '#c53030' : 'var(--text-primary, #2d3748)'};
`;

const QuestionCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(0, 0, 0, 0.1));
  margin-bottom: 2rem;
  transition: opacity 0.3s ease;
  border: 1px solid var(--border-color, transparent);
`;

const QuestionNumber = styled.div`
  color: var(--text-secondary, #a0aec0);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const QuestionText = styled.h2`
  color: var(--text-primary, #2d3748);
  font-size: 1.5rem;
  margin-bottom: 2rem;
  line-height: 1.4;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const OptionButton = styled.button`
  background: ${({ selected, correct, showResult }) => {
    if (!showResult) return selected ? '#bee3f8' : 'var(--bg-secondary, #f7fafc)';
    if (correct) return '#c6f6d5';
    if (selected && !correct) return '#fed7d7';
    return 'var(--bg-secondary, #f7fafc)';
  }};
  border: 3px solid ${({ selected, correct, showResult }) => {
    if (!showResult) return selected ? '#4299e1' : 'var(--border-color, #e2e8f0)';
    if (correct) return '#48bb78';
    if (selected && !correct) return '#f56565';
    return 'var(--border-color, #e2e8f0)';
  }};
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  font-size: 1.1rem;
  text-align: left;
  cursor: ${({ showResult }) => showResult ? 'default' : 'pointer'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  
  &:hover {
    ${({ showResult }) => !showResult && `
      transform: translateX(10px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const OptionLetter = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ selected, correct, showResult }) => {
    if (!showResult) return selected ? '#4299e1' : '#e2e8f0';
    if (correct) return '#48bb78';
    if (selected && !correct) return '#f56565';
    return '#e2e8f0';
  }};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
`;

const OptionText = styled.span`
  flex: 1;
  color: var(--text-primary, #2d3748);
`;

const ResultIcon = styled.span`
  font-size: 1.5rem;
`;

const TrueFalseContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const TrueFalseButton = styled.button`
  flex: 1;
  max-width: 200px;
  background: ${({ selected, isTrue, showResult, correct }) => {
    if (!showResult) return selected ? '#bee3f8' : 'var(--bg-secondary, #f7fafc)';
    if (selected && correct) return '#c6f6d5';
    if (selected && !correct) return '#fed7d7';
    return 'var(--bg-secondary, #f7fafc)';
  }};
  border: 3px solid ${({ selected, showResult, correct }) => {
    if (!showResult) return selected ? '#4299e1' : 'var(--border-color, #e2e8f0)';
    if (selected && correct) return '#48bb78';
    if (selected && !correct) return '#f56565';
    return 'var(--border-color, #e2e8f0)';
  }};
  border-radius: 16px;
  padding: 2rem;
  font-size: 1.5rem;
  cursor: ${({ showResult }) => showResult ? 'default' : 'pointer'};
  transition: all 0.3s ease;

  
  &:hover {
    ${({ showResult }) => !showResult && `
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    `}
  }
`;

const InputContainer = styled.div`
  margin-top: 1rem;
`;

const AnswerInput = styled.input`
  width: 100%;
  padding: 1.25rem;
  font-size: 1.1rem;
  border: 3px solid #e2e8f0;
  border-radius: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #63b3ed;
    box-shadow: 0 0 0 4px rgba(99, 179, 237, 0.2);
  }
`;

const SubmitButton = styled(PrimaryButton)`
  width: 100%;
  margin-top: 1rem;
  padding: 1rem;
  font-size: 1.2rem;
`;

const FeedbackMessage = styled.div`
  text-align: center;
  padding: 1.5rem;
  border-radius: 16px;
  margin-top: 1rem;
  background: ${({ isCorrect }) => isCorrect ? '#c6f6d5' : '#fed7d7'};
  border: 2px solid ${({ isCorrect }) => isCorrect ? '#48bb78' : '#f56565'};
  transition: opacity 0.3s ease;
`;

const FeedbackIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
`;

const FeedbackText = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${({ isCorrect }) => isCorrect ? '#22543d' : '#742a2a'};
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
`;

const NavButton = styled(SecondaryButton)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FinishButton = styled(PrimaryButton)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  
  &:hover {
    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  }
`;

const QuestionDots = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
`;

const QuestionDot = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${({ active, answered }) => {
    if (active) return '#63b3ed';
    if (answered) return '#48bb78';
    return '#e2e8f0';
  }};
  transform: ${({ active }) => active ? 'scale(1.3)' : 'scale(1)'};
  
  &:hover {
    transform: scale(1.2);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  transition: opacity 0.3s ease;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #63b3ed;
  border-radius: 50%;
  animation: none;
  margin-bottom: 1rem;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  background: var(--card-bg, #fee2e2);
  border-radius: 16px;
  color: var(--text-primary, #991b1b);
  border: 1px solid var(--border-color, #fca5a5);
  transition: opacity 0.3s ease;
`;

// 🎯 Utility Functions

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate questions from flashcards
const generateQuestionsFromFlashcards = (flashcards, settings) => {
  if (!flashcards || flashcards.length === 0) return [];
  
  const questions = [];
  const enabledTypes = Object.entries(settings.questionTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);
  
  // Shuffle flashcards
  const shuffledCards = shuffleArray(flashcards);
  
  // Limit to questionCount
  const cardsToUse = shuffledCards.slice(0, Math.min(settings.questionCount, shuffledCards.length));
  
  cardsToUse.forEach((card, index) => {
    // Randomly select question type from enabled types
    const type = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    
    if (type === 'multiple') {
      // Multiple choice: term -> select definition
      const correctAnswer = card.definition;
      // Get 3 random wrong answers from other cards
      const otherCards = flashcards.filter(c => c._id !== card._id);
      const wrongAnswers = shuffleArray(otherCards).slice(0, 3).map(c => c.definition);
      
      // Combine and shuffle options
      const options = shuffleArray([correctAnswer, ...wrongAnswers]);
      const correctIndex = options.indexOf(correctAnswer);
      
      questions.push({
        id: card._id || index,
        type: 'multiple_choice',
        question: `Что означает "${card.term}"?`,
        options: options,
        correctAnswer: correctIndex,
        card: card
      });
    } else if (type === 'truefalse') {
      // True/False: statement about term/definition
      const isCorrectStatement = Math.random() > 0.5;
      
      if (isCorrectStatement) {
        // True statement
        questions.push({
          id: card._id || index,
          type: 'true_false',
          question: `"${card.term}" означает "${card.definition}"`,
          correctAnswer: true,
          card: card
        });
      } else {
        // False statement - use random wrong definition
        const otherCards = flashcards.filter(c => c._id !== card._id);
        const wrongCard = otherCards[Math.floor(Math.random() * otherCards.length)];
        questions.push({
          id: card._id || index,
          type: 'true_false',
          question: `"${card.term}" означает "${wrongCard.definition}"`,
          correctAnswer: false,
          card: card
        });
      }
    } else if (type === 'writing') {
      // Writing: term -> write definition (or vice versa)
      const isTermToDef = Math.random() > 0.5;
      
      questions.push({
        id: card._id || index,
        type: 'writing',
        question: isTermToDef 
          ? `Напишите определение для: "${card.term}"`
          : `Какой термин соответствует определению: "${card.definition}"?`,
        correctAnswer: isTermToDef ? card.definition : card.term,
        card: card
      });
    }
  });
  
  return questions;
};

function TestMode() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  // Get settings from navigation state or use defaults
  const settings = location.state?.settings || {
    questionTypes: { multiple: true, truefalse: true, writing: false },
    questionCount: 10,
    timer: 30
  };
  
  const [flashcards, setFlashcards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.timer);
  const [inputValue, setInputValue] = useState('');
  const [shakeOption, setShakeOption] = useState(false);

  // Fetch set data
  useEffect(() => {
    if (setId) {
      fetchSet(setId);
    } else {
      setError('Не указан ID набора');
      setLoading(false);
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
        setFlashcards(setData.flashcards);
        
        // Generate questions from flashcards
        const generatedQuestions = generateQuestionsFromFlashcards(
          setData.flashcards,
          settings
        );
        
        if (generatedQuestions.length === 0) {
          setError('Не удалось создать вопросы из карточек');
        } else {
          setQuestions(generatedQuestions);
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

  const question = questions[currentQuestion];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  // ⏰ Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !showResult && !loading && question) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !showResult && !loading) {
      handleNext();
    }
  }, [timeLeft, showResult, loading, question]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(settings.timer);
    setShowResult(false);
    if (question) {
      setInputValue(answers[question.id] || '');
    }
  }, [currentQuestion, question?.id]);

  const handleAnswer = useCallback((answer) => {
    if (showResult || !question) return;
    
    setAnswers({ ...answers, [question.id]: answer });
    setShowResult(true);
  }, [answers, question, showResult]);

  const handleWritingSubmit = useCallback(() => {
    if (!inputValue.trim()) {
      setShakeOption(true);
      setTimeout(() => setShakeOption(false), 500);
      return;
    }
    handleAnswer(inputValue.trim());
  }, [inputValue, handleAnswer]);

  const handleNext = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }, [currentQuestion]);

  const handleFinish = useCallback(() => {
    // Calculate results
    const results = questions.map(q => ({
      question: q,
      userAnswer: answers[q.id],
      isCorrect: q.type === 'writing' 
        ? answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
        : answers[q.id] === q.correctAnswer
    }));
    
    navigate('/test/results', { state: { results, setId, setTitle: currentSet?.title } });
  }, [answers, currentSet?.title, navigate, questions, setId]);

  const isAnswered = question && answers[question.id] !== undefined;
  const isCorrect = question && isAnswered && (
    question.type === 'writing' 
      ? answers[question.id]?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
      : answers[question.id] === question.correctAnswer
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <TestContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <div>Загрузка набора...</div>
        </LoadingContainer>
      </TestContainer>
    );
  }

  if (error) {
    return (
      <TestContainer>
        <ErrorContainer>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <SecondaryButton onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            ← Назад
          </SecondaryButton>
        </ErrorContainer>
      </TestContainer>
    );
  }

  if (questions.length === 0) {
    return (
      <TestContainer>
        <ErrorContainer>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h2>Нет вопросов</h2>
          <p>Не удалось создать вопросы из карточек этого набора</p>
          <SecondaryButton onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            ← Назад
          </SecondaryButton>
        </ErrorContainer>
      </TestContainer>
    );
  }

  return (
    <TestContainer>
      <TestHeader>
        <TestTitle>Режим тестирования</TestTitle>
        {currentSet && (
          <SetInfo>
            <h3>📚 {currentSet.title}</h3>
          </SetInfo>
        )}
      </TestHeader>

      {/* ⏱️ Timer */}
      <TimerContainer isLow={timeLeft <= 10}>
        <TimerIcon>{timeLeft <= 10 ? '⏰' : '⏱️'}</TimerIcon>
        <TimerText isLow={timeLeft <= 10}>
          {timeLeft <= 10 ? 'Осталось: ' : ''}{formatTime(timeLeft)}
        </TimerText>
      </TimerContainer>

      {/* 📊 Progress Bar */}
      <ProgressSection>
        <ProgressBarContainer>
          <ProgressBar style={{ width: `${progress}%` }} />
        </ProgressBarContainer>
        <ProgressInfo>
          <span>Вопрос {currentQuestion + 1} из {totalQuestions}</span>
          <span>Отвечено: {answeredCount} 📝</span>
        </ProgressInfo>
      </ProgressSection>

      {/* ❓ Question Card */}
      <QuestionCard key={question.id}>
        <QuestionNumber>Вопрос {currentQuestion + 1}</QuestionNumber>
        <QuestionText>{question.question}</QuestionText>

        {/* 🔘 Multiple Choice */}
        {question.type === 'multiple_choice' && (
          <OptionsContainer>
            {question.options.map((option, index) => (
              <OptionButton
                key={index}
                selected={answers[question.id] === index}
                correct={question.correctAnswer === index}
                showResult={showResult}
                onClick={() => handleAnswer(index)}
              >
                <OptionLetter
                  selected={answers[question.id] === index}
                  correct={question.correctAnswer === index}
                  showResult={showResult}
                >
                  {String.fromCharCode(65 + index)}
                </OptionLetter>
                <OptionText>{option}</OptionText>
                {showResult && question.correctAnswer === index && (
                  <ResultIcon>✅</ResultIcon>
                )}
                {showResult && answers[question.id] === index && answers[question.id] !== question.correctAnswer && (
                  <ResultIcon>❌</ResultIcon>
                )}
              </OptionButton>
            ))}
          </OptionsContainer>
        )}

        {/* ✅❌ True/False */}
        {question.type === 'true_false' && (
          <TrueFalseContainer>
            <TrueFalseButton
              selected={answers[question.id] === true}
              isTrue={true}
              showResult={showResult}
              correct={question.correctAnswer === true}
              onClick={() => handleAnswer(true)}
              bounceOption={showResult && answers[question.id] === true && question.correctAnswer === true}
            >
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>Верно</div>
              {showResult && question.correctAnswer === true && <div style={{ marginTop: '0.5rem', color: '#48bb78' }}>Правильно! 🎉</div>}
            </TrueFalseButton>
            <TrueFalseButton
              selected={answers[question.id] === false}
              isTrue={false}
              showResult={showResult}
              correct={question.correctAnswer === false}
              onClick={() => handleAnswer(false)}
              bounceOption={showResult && answers[question.id] === false && question.correctAnswer === false}
            >
              <div style={{ fontSize: '2.5rem' }}>❌</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>Неверно</div>
              {showResult && question.correctAnswer === false && <div style={{ marginTop: '0.5rem', color: '#48bb78' }}>Правильно! 🎉</div>}
            </TrueFalseButton>
          </TrueFalseContainer>
        )}

        {/* ✍️ Writing */}
        {question.type === 'writing' && (
          <InputContainer>
            <AnswerInput
              type="text"
              placeholder="Введите ваш ответ... ✍️"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleWritingSubmit()}
              disabled={showResult}
            />
            {!showResult && (
              <SubmitButton onClick={handleWritingSubmit}>
                Ответить 🚀
              </SubmitButton>
            )}
          </InputContainer>
        )}

        {/* 🎯 Feedback */}
        {showResult && (
          <FeedbackMessage isCorrect={isCorrect}>
            <FeedbackIcon>{isCorrect ? '🎉' : '😔'}</FeedbackIcon>
            <FeedbackText isCorrect={isCorrect}>
              {isCorrect 
                ? 'Отлично! Правильный ответ! 🌟' 
                : `Не совсем. Правильный ответ: ${question.type === 'multiple_choice' ? question.options[question.correctAnswer] : question.correctAnswer}`}
            </FeedbackText>
          </FeedbackMessage>
        )}
      </QuestionCard>

      {/* 🔄 Navigation */}
      <NavigationContainer>
        <NavButton onClick={handlePrev} disabled={currentQuestion === 0}>
          ← Назад
        </NavButton>
        
        {currentQuestion === totalQuestions - 1 ? (
          <FinishButton onClick={handleFinish}>
            Завершить 🎓
          </FinishButton>
        ) : (
          <NavButton onClick={handleNext}>
            Далее →
          </NavButton>
        )}
      </NavigationContainer>

      {/* 🔘 Question Dots */}
      <QuestionDots>
        {questions.map((q, index) => (
          <QuestionDot
            key={q.id}
            active={index === currentQuestion}
            answered={answers[q.id] !== undefined}
            onClick={() => setCurrentQuestion(index)}
          />
        ))}
      </QuestionDots>
    </TestContainer>
  );
}

export default TestMode;
