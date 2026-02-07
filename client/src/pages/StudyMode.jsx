import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
import SetSelector from '../components/SetSelector';

const resolveImageUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};



const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  50% { transform: translateX(8px); }
  75% { transform: translateX(-4px); }
`;

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

const RoundBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ round }) => round === 1
    ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'
    : 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)'};
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px ${({ round }) => round === 1
    ? 'rgba(99, 179, 237, 0.4)'
    : 'rgba(237, 137, 54, 0.4)'};
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
  width: ${({ progress }) => progress}%;
  position: relative;
  
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
  margin-bottom: 1.5rem;
`;

const RoundInfo = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const RoundStat = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  min-width: 100px;
  
  .label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  .value {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
  }
`;

const QuestionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%));
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(99, 179, 237, 0.2));
  transition: opacity 0.3s ease;
  border: 1px solid var(--border-color, transparent);
  animation: ${fadeIn} 0.3s ease;
`;

const PromptLabel = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const QuestionText = styled.h2`
  color: var(--text-primary);
  font-size: 1.8rem;
  text-align: center;
  margin-bottom: 0.5rem;
  word-break: break-word;
`;

const PinyinHint = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1rem; 
  font-style: italic;
`;

const CardImage = styled.img`
  display: block;
  max-width: 200px;
  max-height: 150px;
  margin: 0.5rem auto 1rem;
  border-radius: 12px;
  object-fit: cover;
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
  word-break: break-word;
  
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
  flex-wrap: wrap;
`;

const InputField = styled.input`
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  border-radius: 12px;
  border: 2px solid ${({ status }) =>
    status === 'correct' ? '#48bb78' :
    status === 'wrong' ? '#f56565' : 'var(--border-color)'};
  width: 100%;
  max-width: 400px;
  font-family: inherit;
  animation: ${({ status }) => status === 'wrong' ? shake : 'none'} 0.4s ease;
  background: var(--card-bg, white);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
  }
`;

const ChineseHint = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: -0.5rem;
  margin-bottom: 1rem;
  font-style: italic;
`;

const FeedbackMessage = styled.div`
  text-align: center;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  background: ${({ correct }) => correct ? '#c6f6d5' : '#fed7d7'};
  color: ${({ correct }) => correct ? '#22543d' : '#742a2a'};
  animation: ${fadeIn} 0.3s ease;
`;

const CorrectAnswerReveal = styled.div`
  text-align: center;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  
  strong {
    color: #48bb78;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%));
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(72, 187, 120, 0.3));
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

const RoundTransition = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.1));
  border: 1px solid var(--border-color, transparent);
  animation: ${fadeIn} 0.5s ease;
  
  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  p {
    color: var(--text-secondary);
    font-size: 1.1rem;
    margin-bottom: 1.5rem;
  }
`;

const encouragingMessages = {
  correct: ['Отлично! 🎉', 'Супер! 🌟', 'Ты молодец! 💪', 'Великолепно! ✨', 'Правильно! 🎯', 'Так держать! 🔥'],
  incorrect: ['Почти! 😊', 'Не сдавайся! 💪', 'У тебя получится! 🌈', 'Подумай ещё 🤔', 'Ничего страшного! 😉']
};

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const isChinese = (text) => /[\u4e00-\u9fff]/.test(text);

const normalizeAnswer = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

function StudyMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Round system
  const [round, setRound] = useState(1); // 1 = multiple choice, 2 = typing
  const [round1Queue, setRound1Queue] = useState([]); // card ids for round 1
  const [round2Queue, setRound2Queue] = useState([]); // card ids for round 2
  const [masteredIds, setMasteredIds] = useState([]); // fully mastered
  const [currentCardId, setCurrentCardId] = useState(null);
  const [showTermSide, setShowTermSide] = useState(true); // true = show term ask def; false = show def ask term

  // Answer state
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputStatus, setInputStatus] = useState(null); // null | 'correct' | 'wrong'
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const sessionStartRef = useRef(Date.now());
  const statsRecordedRef = useRef(false);
  const inputRef = useRef(null);

  // Load set
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
        setRound1Queue(ids);
        setRound2Queue([]);
        setMasteredIds([]);
        setRound(1);
        pickNextCard(ids, 1);
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

  const pickNextCard = (queue, currentRound) => {
    if (queue.length === 0) return;
    const nextId = queue[0];
    setCurrentCardId(nextId);
    // Randomly show term or definition side
    setShowTermSide(Math.random() > 0.5);
    setSelectedOption(null);
    setInputValue('');
    setInputStatus(null);
    setShowFeedback(false);

    if (currentRound === 1) {
      // Generate multiple choice options
      const card = flashcards.find(c => c.id === nextId);
      if (!card) return;
      const showTerm = Math.random() > 0.5;
      setShowTermSide(showTerm);
      const otherCards = flashcards.filter(c => c.id !== nextId);
      const wrongOptions = shuffleArray(otherCards).slice(0, Math.min(3, otherCards.length));
      const allOptions = shuffleArray([...wrongOptions, card]);
      setOptions(allOptions);
    }
  };

  const getCard = (id) => flashcards.find(c => c.id === id);

  const getRandomMessage = (correct) => {
    const msgs = correct ? encouragingMessages.correct : encouragingMessages.incorrect;
    return msgs[Math.floor(Math.random() * msgs.length)];
  };

  // Get prompt (what is shown to user) and answer (what user must identify)
  const getPromptAndAnswer = (card) => {
    if (!card) return { prompt: '', answer: '', promptLabel: '', answerLabel: '' };
    if (showTermSide) {
      return {
        prompt: card.term,
        answer: card.definition,
        promptLabel: 'Что означает этот термин?',
        answerLabel: 'определение'
      };
    } else {
      return {
        prompt: card.definition,
        answer: card.term,
        promptLabel: 'Какой термин соответствует?',
        answerLabel: 'термин'
      };
    }
  };

  // Get acceptable answers for Chinese cards (without pinyin)
  const getAcceptableAnswers = (card) => {
    if (!card) return [];
    const { answer } = getPromptAndAnswer(card);
    const answers = [normalizeAnswer(answer)];
    
    // For Chinese cards answering with definition
    if (showTermSide && card.translation) {
      // Accept just the translation without pinyin
      answers.push(normalizeAnswer(card.translation));
    }
    if (showTermSide && card.pinyin) {
      // Accept just pinyin
      answers.push(normalizeAnswer(card.pinyin));
      // Accept "pinyin - translation" in various formats
      if (card.translation) {
        answers.push(normalizeAnswer(`${card.pinyin} - ${card.translation}`));
        answers.push(normalizeAnswer(`${card.pinyin} ${card.translation}`));
      }
    }
    
    return [...new Set(answers)];
  };

  // Handle multiple choice selection
  const handleOptionSelect = (option) => {
    if (showFeedback) return;
    setSelectedOption(option);
    setAttempts(prev => prev + 1);
    
    const card = getCard(currentCardId);
    const { answer } = getPromptAndAnswer(card);
    
    // Check if selected option matches the correct answer
    let correct = false;
    if (showTermSide) {
      // User must pick the card with the matching definition
      correct = option.id === card.id;
    } else {
      // User must pick the card with the matching term
      correct = option.id === card.id;
    }

    setIsCorrect(correct);
    setFeedbackMessage(getRandomMessage(correct));
    setShowFeedback(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  // Handle typing submission
  const handleInputSubmit = () => {
    if (!inputValue.trim() || showFeedback) return;
    
    setAttempts(prev => prev + 1);
    const card = getCard(currentCardId);
    const userAnswer = normalizeAnswer(inputValue);
    const acceptableAnswers = getAcceptableAnswers(card);
    
    // Also check with fuzzy matching
    const isMatch = acceptableAnswers.some(ans => 
      ans === userAnswer || 
      ans.includes(userAnswer) || 
      userAnswer.includes(ans) ||
      calculateSimilarity(userAnswer, ans) > 0.8
    );

    setIsCorrect(isMatch);
    setInputStatus(isMatch ? 'correct' : 'wrong');
    setFeedbackMessage(getRandomMessage(isMatch));
    setShowFeedback(true);

    if (isMatch) {
      setCorrectCount(prev => prev + 1);
    }
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

  // Handle "Next" after feedback
  const handleNext = () => {
    if (round === 1) {
      const newQueue = round1Queue.filter(id => id !== currentCardId);
      
      if (isCorrect) {
        // Correct in round 1 → move to round 2 queue
        setRound2Queue(prev => [...prev, currentCardId]);
        setRound1Queue(newQueue);
      } else {
        // Wrong → card goes to end of round 1 queue
        setRound1Queue([...newQueue, currentCardId]);
      }

      if (newQueue.length > 0 || (!isCorrect && newQueue.length === 0)) {
        const nextQueue = isCorrect ? newQueue : [...newQueue, currentCardId];
        if (nextQueue.length > 0) {
          pickNextCard(nextQueue, 1);
        } else {
          // Round 1 complete, transition to Round 2
          startRound2();
        }
      } else {
        // Round 1 complete, transition to Round 2
        startRound2();
      }
    } else {
      // Round 2
      const newQueue = round2Queue.filter(id => id !== currentCardId);
      
      if (isCorrect) {
        // Correct in round 2 → mastered!
        setMasteredIds(prev => [...prev, currentCardId]);
        setRound2Queue(newQueue);
      } else {
        // Wrong → back to end of round 2 queue
        setRound2Queue([...newQueue, currentCardId]);
      }

      const nextQueue = isCorrect ? newQueue : [...newQueue, currentCardId];
      if (nextQueue.length > 0) {
        pickNextCard(nextQueue, 2);
      } else {
        // All done!
        setIsComplete(true);
      }
    }
  };

  const startRound2 = () => {
    setShowRoundTransition(true);
    setRound(2);
  };

  const handleStartRound2 = () => {
    setShowRoundTransition(false);
    const queue = shuffleArray([...round2Queue]);
    setRound2Queue(queue);
    pickNextCard(queue, 2);
  };

  const handleRestart = () => {
    const ids = shuffleArray(flashcards.map(c => c.id));
    setRound1Queue(ids);
    setRound2Queue([]);
    setMasteredIds([]);
    setRound(1);
    setIsComplete(false);
    setCorrectCount(0);
    setAttempts(0);
    setShowFeedback(false);
    setShowRoundTransition(false);
    sessionStartRef.current = Date.now();
    statsRecordedRef.current = false;
    pickNextCard(ids, 1);
  };

  // Stats
  const totalCards = flashcards.length;
  const progress = totalCards > 0 ? Math.round((masteredIds.length / totalCards) * 100) : 0;
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

  // Auto-focus input in round 2
  useEffect(() => {
    if (round === 2 && inputRef.current && !showFeedback) {
      inputRef.current.focus();
    }
  }, [currentCardId, round, showFeedback]);

  // --- RENDER ---

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

  // Completion screen
  if (isComplete) {
    return (
      <Container>
        <CompletionCard>
          <CompletionTitle>🎉 Поздравляем! 🎉</CompletionTitle>
          <p style={{ color: 'var(--text-primary)', fontSize: '1.2rem' }}>
            Ты прошёл оба раунда и выучил все карточки!
          </p>
          <CompletionStats>
            <StatBox>
              <StatValue>{totalCards}</StatValue>
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

  // Round transition screen
  if (showRoundTransition) {
    return (
      <Container>
        <Header>
          <Title>📚 Режим заучивания</Title>
        </Header>
        <RoundTransition>
          <h2>🏆 Раунд 1 пройден!</h2>
          <p>
            Ты справился с выбором ответов. Теперь напиши ответы самостоятельно!
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <RoundStat style={{ display: 'inline-block' }}>
              <div className="label">Карточек в Раунде 2</div>
              <div className="value">{round2Queue.length}</div>
            </RoundStat>
          </div>
          <PrimaryButton onClick={handleStartRound2}>
            Начать Раунд 2 ⌨️
          </PrimaryButton>
        </RoundTransition>
      </Container>
    );
  }

  const card = getCard(currentCardId);
  if (!card) return null;

  const { prompt, answer, promptLabel, answerLabel } = getPromptAndAnswer(card);
  const cardIsChinese = isChinese(card.term);
  const currentQueue = round === 1 ? round1Queue : round2Queue;
  const queuePosition = currentQueue.indexOf(currentCardId) + 1;

  return (
    <Container>
      <Header>
        <Title>📚 Режим заучивания</Title>
        <RoundBadge round={round}>
          {round === 1 ? '🎯 Раунд 1: Выбери ответ' : '⌨️ Раунд 2: Напиши ответ'}
        </RoundBadge>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>{totalCards} карточек</p>
        </SetInfo>
      )}

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>
      <ProgressText>
        Прогресс: {progress}% | Точность: {accuracy}% | 
        Карточка {queuePosition} из {currentQueue.length}
      </ProgressText>

      <RoundInfo>
        <RoundStat>
          <div className="label">🎯 Раунд 1</div>
          <div className="value">{round1Queue.length}</div>
        </RoundStat>
        <RoundStat>
          <div className="label">⌨️ Раунд 2</div>
          <div className="value">{round2Queue.length}</div>
        </RoundStat>
        <RoundStat>
          <div className="label">🏆 Усвоено</div>
          <div className="value">{masteredIds.length}</div>
        </RoundStat>
      </RoundInfo>

      <QuestionCard>
        <PromptLabel>{promptLabel}</PromptLabel>
        <QuestionText>{prompt}</QuestionText>
        
        {/* Show pinyin hint if showing Chinese term */}
        {showTermSide && card.pinyin && (
          <PinyinHint>{card.pinyin}</PinyinHint>
        )}

        {/* Show image if card has one */}
        {card.imageUrl && (
          <CardImage src={resolveImageUrl(card.imageUrl)} alt="Illustration" />
        )}

        {round === 1 ? (
          /* ROUND 1: Multiple Choice */
          <OptionsGrid>
            {options.map((option) => {
              const optionText = showTermSide ? option.definition : option.term;
              return (
                <OptionButton
                  key={option.id}
                  selected={selectedOption?.id === option.id}
                  correct={showFeedback && option.id === card.id}
                  wrong={showFeedback && selectedOption?.id === option.id && option.id !== card.id}
                  disabled={showFeedback}
                  onClick={() => handleOptionSelect(option)}
                >
                  {optionText}
                </OptionButton>
              );
            })}
          </OptionsGrid>
        ) : (
          /* ROUND 2: Typing */
          <>
            {cardIsChinese && showTermSide && card.translation && (
              <ChineseHint>
                💡 Можно ввести только перевод без пиньиня
              </ChineseHint>
            )}
            <InputContainer>
              <InputField
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Введите ${answerLabel}...`}
                onKeyDown={(e) => e.key === 'Enter' && handleInputSubmit()}
                disabled={showFeedback}
                status={inputStatus}
              />
              <PrimaryButton
                onClick={handleInputSubmit}
                disabled={!inputValue.trim() || showFeedback}
              >
                Проверить
              </PrimaryButton>
            </InputContainer>
          </>
        )}

        {showFeedback && (
          <FeedbackMessage correct={isCorrect}>
            {feedbackMessage}
          </FeedbackMessage>
        )}

        {showFeedback && !isCorrect && (
          <CorrectAnswerReveal>
            Правильный ответ: <strong>{answer}</strong>
          </CorrectAnswerReveal>
        )}

        {showFeedback && (
          <ActionButtons>
            {!isCorrect && round === 2 && (
              <SecondaryButton onClick={() => {
                setShowFeedback(false);
                setSelectedOption(null);
                setInputValue('');
                setInputStatus(null);
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
