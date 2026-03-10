import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import TextToSpeech from '../components/TextToSpeech';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
import { trackCardsStudied } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};


const Container = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;
  transition: opacity 0.3s ease;
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
  color: var(--text-secondary, #718096);
  font-size: 1rem;
`;

const FlashcardContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  perspective: 1000px;
`;

const Flashcard = styled.div`
  width: 100%;
  height: 350px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
  transform: ${({ flipped }) => flipped ? 'rotateY(180deg)' : 'rotateY(0)'};
  cursor: pointer;
`;

const CardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
`;

const TermSide = styled(CardSide)`
  background: var(--card-bg, linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%));
  border: 1px solid var(--border-color, transparent);
`;

const DefinitionSide = styled(CardSide)`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%));
  border: 1px solid var(--border-color, transparent);
  transform: rotateY(180deg);
`;

const TermText = styled.h2`
  font-size: 2.5rem;
  color: var(--text-primary, #1e40af);
  margin-bottom: 1rem;
  text-align: center;
`;

const DefinitionText = styled.p`
  font-size: 1.5rem;
  color: var(--text-primary, #166534);
  text-align: center;
  line-height: 1.6;
`;

const CardImage = styled.img`
  width: 220px;
  height: 160px;
  max-width: 100%;
  margin-top: 1rem;
  border-radius: 12px;
  object-fit: contain;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 6px;
`;

const AudioButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  margin-top: 1rem;
  box-shadow: 0 4px 15px rgba(99, 179, 237, 0.4);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.5);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const CardCounter = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const NavigationButton = styled.button`
  background: ${({ disabled }) => disabled ? 'var(--bg-tertiary, #e5e7eb)' : 'var(--card-bg, white)'};
  color: ${({ disabled }) => disabled ? 'var(--text-secondary, #9ca3af)' : 'var(--text-primary, #4b5563)'};
  border: 2px solid ${({ disabled }) => disabled ? 'var(--border-color, #e5e7eb)' : 'var(--border-color, #d1d5db)'};
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
    transform: translateY(-2px);
  }
`;

const FlipHint = styled.div`
  text-align: center;
  margin-top: 1rem;
  color: var(--text-secondary, #9ca3af);
  font-size: 0.9rem;
  transition: transform 0.2s ease;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary, #e5e7eb);
  border-radius: 4px;
  margin-bottom: 2rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #63b3ed 0%, #48bb78 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${({ progress }) => progress}%;
`;

const CompletionCard = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%));
  border-radius: 24px;
  padding: 3rem;
  text-align: center;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(72, 187, 120, 0.3));
  transition: opacity 0.3s ease;
  border: 1px solid var(--border-color, transparent);
`;

const CompletionTitle = styled.h2`
  color: var(--text-primary, #22543d);
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const BigEmoji = styled.div`
  font-size: 5rem;
  margin: 1.5rem 0;
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

const FaceControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-secondary, #4a5568);
  font-weight: 600;
  font-size: 0.9rem;
`;

const FaceButton = styled.button`
  border: 2px solid ${({ active }) => active ? '#63b3ed' : 'var(--border-color, #e2e8f0)'};
  background: ${({ active }) => active ? 'rgba(99, 179, 237, 0.15)' : 'var(--bg-secondary, #f1f5f9)'};
  color: ${({ active }) => active ? '#1a202c' : 'var(--text-primary, #1a202c)'};
  padding: 0.4rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    border-color: #63b3ed;
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

// New styled components for tracking features
const ProgressStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatBadge = styled.div`
  background: ${({ type }) => {
    switch (type) {
      case 'known': return 'linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%)';
      case 'unknown': return 'linear-gradient(135deg, #fed7d7 0%, #fc8181 100%)';
      case 'remaining': return 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)';
      default: return '#e2e8f0';
    }
  }};
  color: ${({ type }) => {
    switch (type) {
      case 'known': return '#22543d';
      case 'unknown': return '#742a2a';
      case 'remaining': return '#4a5568';
      default: return '#4a5568';
    }
  }};
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
`;

const KnowButton = styled.button`
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  pointer-events: ${({ disabled }) => disabled ? 'none' : 'auto'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(72, 187, 120, 0.5);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const DontKnowButton = styled.button`
  background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(252, 129, 129, 0.4);
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
  pointer-events: ${({ disabled }) => disabled ? 'none' : 'auto'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(252, 129, 129, 0.5);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const ShuffleButton = styled.button`
  background: linear-gradient(135deg, #9f7aea 0%, #805ad5 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(159, 122, 234, 0.4);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(159, 122, 234, 0.5);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const UnknownCardsSection = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%));
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 2rem;
  text-align: left;
  border: 1px solid var(--border-color, transparent);
`;

const UnknownCardsTitle = styled.h3`
  color: var(--text-primary, #742a2a);
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UnknownCardItem = styled.div`
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--border-color, transparent);
  
  .term {
    font-weight: 600;
    color: var(--text-primary, #1a202c);
    margin-bottom: 0.25rem;
  }
  
  .definition {
    color: var(--text-secondary, #4a5568);
    font-size: 0.9rem;
  }
`;

const ResultsStats = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
`;

const ResultStat = styled.div`
  text-align: center;
  
  .number {
    font-size: 2.5rem;
    font-weight: 700;
    color: ${({ type }) => {
      if (type === 'known') return '#48bb78';
      if (type === 'xp') return '#f59e0b';
      return '#fc8181';
    }};
  }
  
  .label {
    color: #4a5568;
    font-size: 0.9rem;
  }
`;

function LearningMode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [flipped, setFlipped] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [originalCards, setOriginalCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  
  // New state for tracking
  const [cardStatuses, setCardStatuses] = useState({}); // pending | known | unknown
  const [showResults, setShowResults] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [cardFaceMode, setCardFaceMode] = useState('term');

  const initializeSession = (cards, options = {}) => {
    const statusMap = cards.reduce((acc, card) => {
      const cardId = card.id;
      acc[cardId] = 'pending';
      return acc;
    }, {});
    setCardStatuses(statusMap);
    setCurrentIndex(0);
    setFlipped(false);
    setIsComplete(false);
    setShowResults(false);
    if (options.resetXp) {
      setXpEarned(0);
    }
  };

  // Загрузка набора
  useEffect(() => {
    if (setId) {
      fetchSet(setId);
    }
  }, [setId]);

  // Initialize statuses when flashcards change is handled via helper

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
        const cards = setData.flashcards.map((card, idx) => ({ 
          ...card, 
          id: card._id || idx + 1 
        }));
        setOriginalCards(cards);
        setFlashcards(cards);
        initializeSession(cards, { resetXp: true });
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

  const knownCards = useMemo(
    () => flashcards.filter(card => cardStatuses[card.id] === 'known'),
    [flashcards, cardStatuses]
  );
  const unknownCards = useMemo(
    () => flashcards.filter(card => cardStatuses[card.id] === 'unknown'),
    [flashcards, cardStatuses]
  );
  const remainingCount = flashcards.length - knownCards.length - unknownCards.length;

  const currentCard = flashcards[currentIndex];
  const sessionTotal = flashcards.length;
  const currentPosition = sessionTotal > 0 ? currentIndex + 1 : 0;
  const progress = sessionTotal > 0 
    ? ((knownCards.length + unknownCards.length) / sessionTotal) * 100 
    : 0;
  const currentStatus = currentCard ? cardStatuses[currentCard.id] : 'pending';
  const actionsDisabled = !currentCard || currentStatus !== 'pending' || isComplete;

  const advanceToNextPendingCard = (statuses) => {
    if (flashcards.length === 0) return;
    let nextIndex = null;
    for (let offset = 1; offset <= flashcards.length; offset++) {
      const candidateIndex = (currentIndex + offset) % flashcards.length;
      const candidate = flashcards[candidateIndex];
      if (candidate && statuses[candidate.id] === 'pending') {
        nextIndex = candidateIndex;
        break;
      }
    }
    setFlipped(false);
    if (nextIndex !== null) {
      setCurrentIndex(nextIndex);
    } else {
      setIsComplete(true);
      setShowResults(true);
    }
  };

  const focusFirstPendingCard = (statuses) => {
    const firstPendingIndex = flashcards.findIndex(card => statuses[card.id] === 'pending');
    setCurrentIndex(firstPendingIndex === -1 ? 0 : firstPendingIndex);
    setFlipped(false);
  };

  const handleKnow = async () => {
    if (!currentCard) return;
    const currentState = cardStatuses[currentCard.id];
    if (currentState !== 'pending') {
      setFlipped(false);
      return;
    }

    // Track card study for gamification (non-blocking)
    try {
      const result = await trackCardsStudied(1);
      if (result?.questResults?.xpEarned) {
        setXpEarned(prev => prev + result.questResults.xpEarned);
      }
    } catch (error) {
      console.error('Error tracking card study:', error);
    }

    const updatedStatuses = {
      ...cardStatuses,
      [currentCard.id]: 'known'
    };
    setCardStatuses(updatedStatuses);
    advanceToNextPendingCard(updatedStatuses);
  };

  const handleDontKnow = () => {
    if (!currentCard) return;
    const currentState = cardStatuses[currentCard.id];
    if (currentState !== 'pending') {
      setFlipped(false);
      return;
    }

    const updatedStatuses = {
      ...cardStatuses,
      [currentCard.id]: 'unknown'
    };
    setCardStatuses(updatedStatuses);
    advanceToNextPendingCard(updatedStatuses);
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 200);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setTimeout(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      }, 200);
    }
  };

  const handleRestart = () => {
    if (originalCards.length === 0) return;
    const fullDeck = [...originalCards];
    setFlashcards(fullDeck);
    initializeSession(fullDeck);
  };

  const handleRestartWithUnknown = () => {
    if (unknownCards.length === 0) return;

    const updatedStatuses = flashcards.reduce((acc, card) => {
      acc[card.id] = cardStatuses[card.id] === 'unknown' ? 'pending' : 'known';
      return acc;
    }, {});

    setCardStatuses(updatedStatuses);
    focusFirstPendingCard(updatedStatuses);
    setIsComplete(false);
    setShowResults(false);
  };

  const handleShuffle = () => {
    if (flashcards.length === 0) return;
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    const firstPendingIndex = shuffled.findIndex(card => cardStatuses[card.id] === 'pending');
    setCurrentIndex(firstPendingIndex === -1 ? 0 : firstPendingIndex);
    setFlipped(false);
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    if (currentCard?.term) {
      TextToSpeech.speak(currentCard.term);
    }
  };

  const handleFaceModeChange = (mode) => {
    setCardFaceMode(mode);
    setFlipped(false);
  };

  const handleSelectSet = (set) => {
    navigate(`/learn/flashcards?setId=${set._id}`);
  };

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="🎓 Режим карточек"
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
          <Button onClick={() => navigate('/learn/flashcards')} style={{ marginTop: '1rem' }}>
            Выбрать другой набор
          </Button>
        </ErrorMessage>
      </Container>
    );
  }

  if (isComplete && showResults) {
    return (
      <Container>
        <CompletionCard>
          <CompletionTitle>🎉 Отлично!</CompletionTitle>
          <BigEmoji>{unknownCards.length === 0 ? '🏆' : '📚'}</BigEmoji>
          
          <ResultsStats>
            <ResultStat type="known">
              <div className="number">{knownCards.length}</div>
              <div className="label">✅ Знаю</div>
            </ResultStat>
            <ResultStat type="unknown">
              <div className="number">{unknownCards.length}</div>
              <div className="label">❌ Не знаю</div>
            </ResultStat>
            {xpEarned > 0 && (
              <ResultStat type="xp">
                <div className="number">+{xpEarned}</div>
                <div className="label">⭐ XP</div>
              </ResultStat>
            )}
          </ResultsStats>
          
          <p style={{ color: '#2f855a', fontSize: '1.2rem', marginBottom: '2rem' }}>
            {unknownCards.length === 0 
              ? 'Ты знаешь все карточки! Отличная работа!' 
              : `Ты знаешь ${knownCards.length} из ${flashcards.length} карточек. Продолжай учить!`}
          </p>
          
          {unknownCards.length > 0 && (
            <UnknownCardsSection>
              <UnknownCardsTitle>
                📚 Нужно подучить ({unknownCards.length})
              </UnknownCardsTitle>
              {unknownCards.map((card, idx) => (
                <UnknownCardItem key={card.id || idx}>
                  <div className="term">{card.term}</div>
                  <div className="definition">{card.definition}</div>
                </UnknownCardItem>
              ))}
            </UnknownCardsSection>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            {unknownCards.length > 0 && (
              <PrimaryButton onClick={handleRestartWithUnknown}>
                Повторить неизвестные 🔁
              </PrimaryButton>
            )}
            <Button onClick={handleRestart}>
              Начать заново 🔄
            </Button>
            <SecondaryButton onClick={() => navigate('/learn/flashcards')}>
              Другой набор
            </SecondaryButton>
            <PrimaryButton onClick={() => navigate('/dashboard')}>
              Дальше →
            </PrimaryButton>
          </div>
        </CompletionCard>
      </Container>
    );
  }

  // If complete but results not shown yet, show loading
  if (isComplete && !showResults) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
          <div>Подсчет результатов...</div>
        </div>
      </Container>
    );
  }

  if (!currentCard && !isComplete) return null;

  const renderTermContent = () => (
    <>
      <TermText>{currentCard.term}</TermText>
      <AudioButton onClick={handleSpeak}>
        🔊
      </AudioButton>
    </>
  );

  const renderDefinitionContent = () => (
    <>
      <DefinitionText>{currentCard.definition}</DefinitionText>
      {currentCard.imageUrl && (
        <CardImage
          src={resolveImageUrl(currentCard.imageUrl)}
          alt="Term illustration"
        />
      )}
    </>
  );

  const nextSideLabel = !flipped
    ? (cardFaceMode === 'term' ? 'определение' : 'термин')
    : (cardFaceMode === 'term' ? 'термин' : 'определение');

  return (
    <Container>
      <Header>
        <Title>🎓 Режим карточек</Title>
        <Subtitle>Кликните по карточке, чтобы перевернуть</Subtitle>
      </Header>

      {currentSet && (
        <SetInfo>
          <h3>📚 {currentSet.title}</h3>
          <p>Карточка {currentPosition} из {sessionTotal}</p>
        </SetInfo>
      )}

      {/* Progress Stats */}
      <ProgressStats>
        <StatBadge type="known">✅ Знаю: {knownCards.length}</StatBadge>
        <StatBadge type="unknown">❌ Не знаю: {unknownCards.length}</StatBadge>
        <StatBadge type="remaining">⏳ Осталось: {remainingCount}</StatBadge>
      </ProgressStats>

      <FaceControls>
        <span>Лицевая сторона:</span>
        <FaceButton
          type="button"
          active={cardFaceMode === 'term'}
          onClick={() => handleFaceModeChange('term')}
        >
          Сначала термин
        </FaceButton>
        <FaceButton
          type="button"
          active={cardFaceMode === 'definition'}
          onClick={() => handleFaceModeChange('definition')}
        >
          Сначала определение
        </FaceButton>
      </FaceControls>

      <ProgressBar>
        <ProgressFill progress={progress} />
      </ProgressBar>

      <FlashcardContainer>
        <Flashcard flipped={flipped} onClick={() => setFlipped(!flipped)}>
          <TermSide>
            {cardFaceMode === 'term' ? renderTermContent() : renderDefinitionContent()}
          </TermSide>
          <DefinitionSide>
            {cardFaceMode === 'term' ? renderDefinitionContent() : renderTermContent()}
          </DefinitionSide>
        </Flashcard>
      </FlashcardContainer>

      <FlipHint>
        👆 Кликните, чтобы увидеть {nextSideLabel}
      </FlipHint>

      <CardCounter>
        Карточка {currentPosition} из {sessionTotal}
      </CardCounter>

      {/* Action Buttons for Know/Don't Know */}
      <ActionButtonsContainer>
        <DontKnowButton onClick={handleDontKnow} disabled={actionsDisabled}>
          ❌ Не знаю
        </DontKnowButton>
        <KnowButton onClick={handleKnow} disabled={actionsDisabled}>
          ✅ Знаю
        </KnowButton>
      </ActionButtonsContainer>

      <ButtonGroup>
        <NavigationButton 
          onClick={handlePrev}
          disabled={flashcards.length === 0 || currentIndex === 0}
        >
          ← Назад
        </NavigationButton>
        
        <SecondaryButton onClick={() => setFlipped(!flipped)}>
          {flipped ? 'Показать термин' : 'Показать определение'}
        </SecondaryButton>
        
        <NavigationButton 
          onClick={handleNext}
          disabled={flashcards.length === 0 || currentIndex === flashcards.length - 1}
        >
          Вперед →
        </NavigationButton>
      </ButtonGroup>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <ShuffleButton onClick={handleShuffle}>
          🔀 Перемешать
        </ShuffleButton>
        <Button onClick={() => navigate('/learn/flashcards')}>
          Другой набор
        </Button>
      </div>
    </Container>
  );
}

export default LearningMode;
