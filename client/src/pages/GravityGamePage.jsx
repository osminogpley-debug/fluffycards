import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';



const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #3b82f6;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "🚀 ";
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1.1rem;
`;

const GameArea = styled.div`
  position: relative;
  height: 60vh;
  background: linear-gradient(to bottom, #dbeafe 0%, #eff6ff 50%, #f8fafc 100%);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 3px solid #3b82f6;
`;

const Planet = styled.div`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  left: ${({ left }) => left}%;
  top: ${({ top }) => top}px;
  background: ${({ color }) => color};
  border-radius: 50%;
  box-shadow: 0 0 30px ${({ color }) => color}80, inset -10px -10px 20px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  cursor: default;
  transition: transform 0.2s ease;
  z-index: 10;
`;

const PlanetFace = styled.div`
  font-size: 1.5rem;
  position: absolute;
  bottom: 10%;
`;

const InputContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 1rem;
  z-index: 20;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  border-radius: 50px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const Input = styled.input`
  padding: 12px 24px;
  font-size: 1.1rem;
  border-radius: 50px;
  border: 2px solid #3b82f6;
  width: 300px;
  text-align: center;
  outline: none;
  font-family: inherit;
  
  &:focus {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ScorePanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const ScoreValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #3b82f6;
`;

const ScoreLabel = styled.div`
  color: #6b7280;
  font-size: 0.9rem;
`;

const LevelIndicator = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const LevelValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #8b5cf6;
`;

const LevelLabel = styled.div`
  color: #6b7280;
  font-size: 0.8rem;
`;

const QuestionCounter = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const QuestionValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #10b981;
`;

const QuestionLabel = styled.div`
  color: #6b7280;
  font-size: 0.8rem;
`;

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.3s ease;
`;

const GameOverCard = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 24px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const GameOverTitle = styled.h2`
  color: #ef4444;
  font-size: 2rem;
  margin-bottom: 1rem;
  
  &::before {
    content: "💥 ";
  }
`;

const GameOverText = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

const WinOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.3s ease;
`;

const WinCard = styled.div`
  background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
  padding: 3rem;
  border-radius: 24px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const WinTitle = styled.h2`
  color: #166534;
  font-size: 2rem;
  margin-bottom: 1rem;
  
  &::before {
    content: "🏆 ";
  }
`;

const WinText = styled.p`
  color: #15803d;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  transition: all 0.3s ease;
  margin: 0 0.5rem;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.5);
  }
`;

const ExitButton = styled(Button)`
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 4px 15px rgba(107, 114, 128, 0.4);
  
  &:hover {
    box-shadow: 0 8px 25px rgba(107, 114, 128, 0.5);
  }
`;

const StartOverlay = styled(GameOverOverlay)`
  background: rgba(0, 0, 0, 0.5);
`;

const StartCard = styled(GameOverCard)`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
`;

const StartTitle = styled.h2`
  color: #1e40af;
  font-size: 2rem;
  margin-bottom: 1rem;
`;

const Instructions = styled.ul`
  text-align: left;
  color: #4b5563;
  margin: 1.5rem 0;
  padding-left: 1.5rem;
  line-height: 1.8;
`;

const ExitButtonSmall = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  z-index: 30;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(239, 68, 68, 1);
    transform: translateY(-2px);
  }
`;

const SetInfo = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  text-align: center;
  
  h3 {
    margin: 0 0 0.25rem 0;
    color: #1e40af;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: #3b82f6;
    font-size: 0.9rem;
  }
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
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: none;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: #fee2e2;
  border-radius: 24px;
  color: #991b1b;
  margin: 2rem 0;
`;

const planetColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
const planetFaces = ['😊', '😄', '🤗', '😎', '🥳', '😋'];

const TOTAL_QUESTIONS = 10;

function GravityGamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [gameState, setGameState] = useState('start'); // start, playing, gameOver, won
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [planets, setPlanets] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentTerm, setCurrentTerm] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [usedTerms, setUsedTerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [gameCards, setGameCards] = useState([]);
  
  const inputRef = useRef(null);
  const gameAreaRef = useRef(null);
  const animationRef = useRef(null);
  const planetIdRef = useRef(0);

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
        setGameCards(setData.flashcards);
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

  const getNextTerm = useCallback(() => {
    const availableTerms = gameCards.filter(card => !usedTerms.includes(card.term));
    
    if (availableTerms.length === 0) {
      return gameCards[Math.floor(Math.random() * gameCards.length)];
    }
    
    return availableTerms[Math.floor(Math.random() * availableTerms.length)];
  }, [gameCards, usedTerms]);

  const spawnPlanet = useCallback(() => {
    if (questionNumber > TOTAL_QUESTIONS) {
      setGameState('won');
      trackGameWin();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }
    
    const termData = getNextTerm();
    const color = planetColors[Math.floor(Math.random() * planetColors.length)];
    const face = planetFaces[Math.floor(Math.random() * planetFaces.length)];
    const left = 10 + Math.random() * 70;
    const size = 80 + Math.random() * 40;
    
    planetIdRef.current += 1;
    
    const newPlanet = {
      id: planetIdRef.current,
      term: termData.term,
      definition: termData.definition,
      color,
      face,
      left,
      size,
      top: -100,
      speed: 1 + level * 0.3,
    };
    
    setCurrentTerm(termData);
    setPlanets([newPlanet]);
  }, [questionNumber, level, getNextTerm]);

  const startGame = () => {
    if (gameCards.length === 0) {
      setError('Нет карточек для игры');
      return;
    }
    
    setGameState('playing');
    setScore(0);
    setLevel(1);
    setPlanets([]);
    setInputValue('');
    setQuestionNumber(1);
    setCorrectAnswers(0);
    setUsedTerms([]);
    planetIdRef.current = 0;
    setTimeout(spawnPlanet, 500);
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setPlanets(prevPlanets => {
        if (prevPlanets.length === 0) return prevPlanets;
        
        const updated = prevPlanets.map(planet => ({
          ...planet,
          top: planet.top + planet.speed
        }));

        const gameHeight = gameAreaRef.current?.offsetHeight || 600;
        if (updated[0].top > gameHeight - 150) {
          setGameState('gameOver');
          return [];
        }

        return updated;
      });
    };

    animationRef.current = setInterval(gameLoop, 20);
    return () => clearInterval(animationRef.current);
  }, [gameState]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || planets.length === 0 || gameState !== 'playing') return;

    const currentPlanet = planets[0];
    const isCorrect = inputValue.toLowerCase().includes(currentPlanet.definition.toLowerCase()) ||
                      currentPlanet.definition.toLowerCase().includes(inputValue.toLowerCase());

    if (isCorrect) {
      const points = 100 * level;
      setScore(s => s + points);
      setCorrectAnswers(c => c + 1);
      setUsedTerms(prev => [...prev, currentPlanet.term]);
      
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: [currentPlanet.color]
      });
      
      const newCorrectCount = correctAnswers + 1;
      if (newCorrectCount % 3 === 0) {
        setLevel(l => l + 1);
      }
      
      setPlanets([]);
      setInputValue('');
      setQuestionNumber(q => q + 1);
      
      setTimeout(() => {
        if (gameState === 'playing') {
          spawnPlanet();
        }
      }, 600);
    } else {
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  const handleSelectSet = (set) => {
    navigate(`/games/gravity?setId=${set._id || set.id}`);
  };

  useEffect(() => {
    if (gameState === 'playing' && planets.length === 0 && questionNumber <= TOTAL_QUESTIONS) {
      const timer = setTimeout(spawnPlanet, 500);
      return () => clearTimeout(timer);
    }
  }, [questionNumber, gameState, planets.length, spawnPlanet]);

  // Если нет setId - показываем выбор набора
  if (!setId) {
    return (
      <SetSelector
        title="🚀 Гравитация"
        subtitle="Выберите набор карточек для игры"
        onSelectSet={handleSelectSet}
        gameMode={true}
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
          <Button onClick={() => navigate('/games/gravity')} style={{ marginTop: '1rem' }}>
            Выбрать другой набор
          </Button>
        </ErrorMessage>
      </Container>
    );
  }

  if (gameState === 'start') {
    return (
      <Container>
        <Header>
          <Title>Гравитация</Title>
          <Subtitle>Введите определение, чтобы спасти планету!</Subtitle>
        </Header>
        
        {currentSet && (
          <SetInfo>
            <h3>📚 {currentSet.title}</h3>
            <p>{currentSet.flashcards?.length || 0} карточек</p>
          </SetInfo>
        )}
        
        <StartOverlay>
          <StartCard>
            <StartTitle>🚀 Гравитация</StartTitle>
            <Instructions>
              <li>Планеты с терминами падают сверху</li>
              <li>Введите определение, чтобы "спасти" планету</li>
              <li>Чем выше уровень, тем быстрее падение</li>
              <li>Ответьте правильно на {TOTAL_QUESTIONS} вопросов!</li>
              <li>Не дайте планете упасть!</li>
            </Instructions>
            <Button onClick={startGame}>Начать игру</Button>
            <ExitButton onClick={() => navigate('/games/gravity')} style={{ marginLeft: '1rem' }}>Другой набор</ExitButton>
          </StartCard>
        </StartOverlay>
        <GameArea ref={gameAreaRef} style={{ opacity: 0.5 }} />
      </Container>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <Container>
        <GameArea ref={gameAreaRef}>
          <GameOverOverlay>
            <GameOverCard>
              <GameOverTitle>Планета разбилась!</GameOverTitle>
              <GameOverText>
                Ваш счет: <strong>{score}</strong><br />
                Уровень: <strong>{level}</strong><br />
                Правильных ответов: <strong>{correctAnswers} из {questionNumber - 1}</strong>
              </GameOverText>
              <Button onClick={startGame}>Играть снова</Button>
              <ExitButton onClick={() => navigate('/games/gravity')}>Другой набор</ExitButton>
              <ExitButton onClick={handleExit}>Выйти</ExitButton>
            </GameOverCard>
          </GameOverOverlay>
        </GameArea>
      </Container>
    );
  }

  if (gameState === 'won') {
    return (
      <Container>
        <GameArea ref={gameAreaRef}>
          <WinOverlay>
            <WinCard>
              <WinTitle>Победа!</WinTitle>
              <WinText>
                Поздравляем! Вы ответили на все {TOTAL_QUESTIONS} вопросов!<br />
                <strong>Итоговый счёт: {score}</strong><br />
                <strong>Уровень: {level}</strong><br />
                <strong>Правильных ответов: {correctAnswers}</strong>
              </WinText>
              <Button onClick={startGame}>Играть снова</Button>
              <ExitButton onClick={() => navigate('/games/gravity')}>Другой набор</ExitButton>
              <ExitButton onClick={handleExit}>Выйти</ExitButton>
            </WinCard>
          </WinOverlay>
        </GameArea>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Гравитация</Title>
        <Subtitle>Введите определение, чтобы спасти планету!</Subtitle>
      </Header>

      <GameArea ref={gameAreaRef}>
        <ExitButtonSmall onClick={handleExit}>Выйти</ExitButtonSmall>
        
        <LevelIndicator>
          <LevelValue>Ур. {level}</LevelValue>
          <LevelLabel>Уровень</LevelLabel>
        </LevelIndicator>

        <QuestionCounter>
          <QuestionValue>{questionNumber}/{TOTAL_QUESTIONS}</QuestionValue>
          <QuestionLabel>Вопрос</QuestionLabel>
        </QuestionCounter>

        <ScorePanel>
          <ScoreValue>{score}</ScoreValue>
          <ScoreLabel>очков</ScoreLabel>
        </ScorePanel>

        {planets.map(planet => (
          <Planet
            key={planet.id}
            size={planet.size}
            left={planet.left}
            top={planet.top}
            color={planet.color}
          >
            {planet.term}
            <PlanetFace>{planet.face}</PlanetFace>
          </Planet>
        ))}

        <InputContainer>
          <form onSubmit={handleSubmit}>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Определение для "${currentTerm?.term}"...`}
              autoFocus
            />
          </form>
        </InputContainer>
      </GameArea>
    </Container>
  );
}

export default GravityGamePage;
