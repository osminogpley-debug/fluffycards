import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import LiveLeaderboard from '../components/Games/LiveLeaderboard';
import LiveRoom from '../components/Games/LiveRoom';
import { API_ROUTES, authFetch } from '../constants/api';
import { 
  createRoom, 
  joinRoom, 
  getRoom, 
  startGame, 
  updateScore, 
  nextQuestion, 
  endGame 
} from '../services/liveService';



// ==================== СТИЛИ ====================
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.3s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  color: #e91e63;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "🎮 ";
  }
  
  &::after {
    content: " 🎮";
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #718096;
`;

// Выбор роли
const RoleSelector = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 3rem 0;
`;

const RoleCard = styled.button`
  background: ${({ selected }) => selected 
    ? 'linear-gradient(135deg, #f48fb1 0%, #e91e63 100%)' 
    : 'white'};
  color: ${({ selected }) => selected ? 'white' : '#4a5568'};
  border: 3px solid ${({ selected }) => selected ? '#e91e63' : '#e2e8f0'};
  border-radius: 24px;
  padding: 2rem 3rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #f48fb1;
  }
`;

const RoleEmoji = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  transition: transform 0.2s ease;
`;

const RoleTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
`;

const RoleDescription = styled.div`
  font-size: 0.9rem;
  margin-top: 0.5rem;
  opacity: 0.9;
`;

// Формы
const FormContainer = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #e2e8f0;
  transition: opacity 0.3s ease;
`;

const FormTitle = styled.h2`
  text-align: center;
  color: #4a5568;
  margin-bottom: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  border: 3px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: center;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #f48fb1;
    box-shadow: 0 0 0 4px rgba(244, 143, 177, 0.2);
    outline: none;
  }
`;

const PinInput = styled(Input)`
  font-size: 2rem;
  letter-spacing: 0.5rem;
  font-weight: 700;
  color: #e91e63;
  font-family: 'Courier New', monospace;
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(102, 187, 106, 0.4);
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Кнопка выхода в Dashboard
const DashboardButton = styled.button`
  position: fixed;
  top: 1rem;
  left: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #78909c 0%, #546e7a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

// Кнопка Назад
const BackButton = styled.button`
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f7fafc;
    color: #4a5568;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;

// Выбор команды
const TeamSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 2rem 0;
`;

const TeamOption = styled.button`
  background: ${({ selected }) => selected ? '#fff3e0' : 'white'};
  border: 3px solid ${({ selected, color }) => selected ? color : '#e2e8f0'};
  border-radius: 16px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    border-color: ${({ color }) => color};
  }
`;

const TeamEmoji = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;

`;

const TeamName = styled.div`
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
`;

// Игровой экран
const GameContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const QuestionCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #e2e8f0;
  transition: opacity 0.3s ease;
`;

const QuestionNumber = styled.div`
  text-align: center;
  color: #718096;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const QuestionText = styled.h2`
  text-align: center;
  font-size: 1.8rem;
  color: #2d3748;
  margin-bottom: 2rem;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const OptionButton = styled.button`
  background: ${({ correct, wrong }) => {
    if (correct) return 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)';
    if (wrong) return 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)';
    return 'white';
  }};
  color: ${({ correct, wrong }) => (correct || wrong) ? 'white' : '#4a5568'};
  border: 3px solid ${({ correct, wrong }) => {
    if (correct) return '#43a047';
    if (wrong) return '#d32f2f';
    return '#e2e8f0';
  }};
  border-radius: 16px;
  padding: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;

  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    border-color: #f48fb1;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

// Таймер
const Timer = styled.div`
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 2rem;
`;

const TimerBar = styled.div`
  height: 100%;
  background: ${({ percent }) => {
    if (percent > 60) return 'linear-gradient(90deg, #66bb6a, #43a047)';
    if (percent > 30) return 'linear-gradient(90deg, #ffa726, #f57c00)';
    return 'linear-gradient(90deg, #ef5350, #d32f2f)';
  }};
  width: ${({ percent }) => percent}%;
  transition: width 1s linear;
`;

// Обратная связь
const FeedbackOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.3s ease;
`;

const FeedbackCard = styled.div`
  background: white;
  border-radius: 32px;
  padding: 3rem;
  text-align: center;
  max-width: 400px;
  transition: transform 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const FeedbackEmoji = styled.div`
  font-size: 6rem;
  margin-bottom: 1rem;
`;

const FeedbackText = styled.h2`
  color: ${({ correct }) => correct ? '#43a047' : '#d32f2f'};
  margin-bottom: 1rem;
`;

const FeedbackScore = styled.div`
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 0.5rem;
`;

// Панель учителя
const TeacherPanel = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #e2e8f0;
  margin-bottom: 2rem;
`;

const PanelTitle = styled.h3`
  color: #4a5568;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${({ variant }) => {
    switch (variant) {
      case 'primary': return 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)';
      case 'success': return 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)';
      case 'danger': return 'linear-gradient(135deg, #ef5350 0%, #d32f2f 100%)';
      case 'warning': return 'linear-gradient(135deg, #ffa726 0%, #f57c00 100%)';
      default: return '#e2e8f0';
    }
  }};
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Список вопросов для учителя
const QuestionList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const QuestionItem = styled.div`
  padding: 1rem;
  background: ${({ active }) => active ? '#e3f2fd' : '#f8f9fa'};
  border: 2px solid ${({ active }) => active ? '#42a5f5' : '#e2e8f0'};
  border-radius: 12px;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #42a5f5;
  }
`;

// Правильный ответ для учителя
const CorrectAnswerBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  margin-top: 1rem;
`;

// Экран управления учителя
const TeacherControlPanel = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 3px solid #e2e8f0;
  transition: opacity 0.3s ease;
  margin-bottom: 2rem;
`;

const TeacherQuestionDisplay = styled.div`
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  text-align: center;
`;

const TeacherQuestionText = styled.h2`
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 1.5rem;
`;

const AnswerReveal = styled.div`
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const AnswerLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const AnswerText = styled.div`
  font-size: 1.3rem;
  color: #2e7d32;
  font-weight: 700;
`;

// ==================== КОМАНДЫ ====================
const TEAMS = [
  { id: 'fox', name: 'Хитрые Лисы', emoji: '🦊', color: '#ff8a65', mascot: 'fox' },
  { id: 'rabbit', name: 'Быстрые Кролики', emoji: '🐰', color: '#81c784', mascot: 'rabbit' },
  { id: 'bear', name: 'Сильные Медведи', emoji: '🐻', color: '#a1887f', mascot: 'bear' },
  { id: 'cat', name: 'Ловкие Кошки', emoji: '🐱', color: '#ffd54f', mascot: 'cat' },
  { id: 'panda', name: 'Милые Панды', emoji: '🐼', color: '#e0e0e0', mascot: 'panda' },
  { id: 'dog', name: 'Верные Псы', emoji: '🐶', color: '#4fc3f7', mascot: 'dog' },
  { id: 'owl', name: 'Мудрые Совы', emoji: '🦉', color: '#9575cd', mascot: 'owl' },
  { id: 'penguin', name: 'Отважные Пингвины', emoji: '🐧', color: '#4dd0e1', mascot: 'penguin' }
];

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: 'Какой орган человека отвечает за фильтрацию крови?',
    options: ['Сердце', 'Почки', 'Лёгкие', 'Печень'],
    correct: 1
  },
  {
    id: 2,
    question: 'Сколько планет в Солнечной системе?',
    options: ['7', '8', '9', '10'],
    correct: 1
  },
  {
    id: 3,
    question: 'Какой химический элемент обозначается как "Au"?',
    options: ['Серебро', 'Алюминий', 'Золото', 'Аргон'],
    correct: 2
  },
  {
    id: 4,
    question: 'Кто написал "Войну и мир"?',
    options: ['Достоевский', 'Толстой', 'Пушкин', 'Гоголь'],
    correct: 1
  },
  {
    id: 5,
    question: 'Какая столица Франции?',
    options: ['Лондон', 'Берлин', 'Париж', 'Мадрид'],
    correct: 2
  }
];

// ==================== КОМПОНЕНТ ====================
const LiveGame = () => {
  const navigate = useNavigate();
  
  // Состояния
  const [role, setRole] = useState(null); // 'teacher' | 'student'
  const [gameState, setGameState] = useState('select-role'); // select-role | select-set | join | lobby | playing | finished
  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [teamScores, setTeamScores] = useState([]);
  
  // Для учителя - выбор набора карточек
  const [userSets, setUserSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loadingSets, setLoadingSets] = useState(false);
  
  // Генерация PIN
  const generatePin = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };
  
  // Загрузка наборов пользователя (для учителя)
  const loadUserSets = async () => {
    try {
      setLoadingSets(true);
      const response = await authFetch(API_ROUTES.DATA.SETS);
      if (response.ok) {
        const sets = await response.json();
        setUserSets(sets);
      }
    } catch (error) {
      console.error('Error loading sets:', error);
    } finally {
      setLoadingSets(false);
    }
  };
  
  // Преобразование карточек в вопросы для игры
  const convertCardsToQuestions = (flashcards) => {
    if (!flashcards || flashcards.length === 0) return DEFAULT_QUESTIONS;
    
    // Берем до 20 карточек случайным образом
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 20);
    
    return selected.map((card, index) => {
      // Создаем варианты ответов (1 правильный + 3 неправильных)
      const wrongAnswers = flashcards
        .filter(c => c.term !== card.term)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.term);
      
      // Если не хватает неправильных ответов, добавляем заглушки
      while (wrongAnswers.length < 3) {
        wrongAnswers.push(`Вариант ${wrongAnswers.length + 2}`);
      }
      
      // Перемешиваем варианты
      const options = [card.term, ...wrongAnswers].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(card.term);
      
      return {
        id: index + 1,
        question: card.definition || card.pinyin || 'Что это?',
        options: options,
        correct: correctIndex
      };
    });
  };
  
  // Возврат в Dashboard
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Сброс игры и возврат к выбору роли
  const handleResetGame = () => {
    setRole(null);
    setGameState('select-role');
    setPin('');
    setPlayerName('');
    setSelectedTeam(null);
    setRoomData(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
    setScore(0);
    setTimeLeft(20);
    setTeamScores([]);
  };
  
  // Polling для синхронизации состояния комнаты
  useEffect(() => {
    if (!roomData?.pin) return;
    
    const pollRoom = async () => {
      const room = await getRoom(roomData.pin);
      if (room) {
        setRoomData(room);
        // Обновляем очки команд
        const teamsWithScores = TEAMS.map(team => {
          const teamParticipants = room.participants?.filter(p => p.teamId === team.id) || [];
          const teamScore = teamParticipants.reduce((sum, p) => sum + (p.score || 0), 0);
          return { ...team, score: teamScore };
        });
        setTeamScores(teamsWithScores);
        
        // Синхронизируем состояние игры
        setGameState(prevState => {
          // Если игра началась
          if (room.status === 'playing' && prevState === 'lobby') {
            return 'playing';
          }
          // Если игра закончилась
          if (room.status === 'finished' && prevState !== 'finished') {
            return 'finished';
          }
          return prevState;
        });
        
        // Синхронизируем текущий вопрос (только вперёд, никогда назад)
        setCurrentQuestion(prev => {
          if (role === 'student' && room.currentQuestion > prev) {
            return room.currentQuestion;
          }
          return prev;
        });
      }
    };
    
    pollRoom();
    const interval = setInterval(pollRoom, 2000);
    return () => clearInterval(interval);
  }, [roomData?.pin, role]);
  
  // Выбор роли учителя - переход к выбору набора
  const handleSelectTeacher = () => {
    setRole('teacher');
    loadUserSets();
    setGameState('select-set');
  };
  
  // Создание комнаты (учитель)
  const handleCreateRoom = async () => {
    const questions = selectedSet 
      ? convertCardsToQuestions(selectedSet.flashcards)
      : DEFAULT_QUESTIONS;
    
    const room = await createRoom(questions);
    if (room) {
      setRoomData(room);
      setTeamScores(TEAMS.slice(0, 4).map(t => ({ ...t, score: 0 })));
      setPin(room.pin);
      setGameState('lobby');
    } else {
      alert('Не удалось создать комнату');
    }
  };
  
  // Присоединение к комнате (ученик)
  const handleJoinRoom = async () => {
    if (pin.length === 6 && selectedTeam) {
      const room = await joinRoom(pin, selectedTeam);
      if (room) {
        setRoomData(room);
        setTeamScores(TEAMS.slice(0, 4).map(t => ({ ...t, score: 0 })));
        setGameState('lobby');
      } else {
        alert('Не удалось присоединиться к комнате. Проверьте PIN.');
      }
    }
  };
  
  // Начало игры
  const handleStartGame = async () => {
    if (roomData?.pin) {
      await startGame(roomData.pin);
      setGameState('playing');
      setTimeLeft(20);
    }
  };
  
  // Следующий вопрос (только для учителя)
  const handleNextQuestion = async () => {
    const questions = roomData?.questions || DEFAULT_QUESTIONS;
    if (roomData?.pin && currentQuestion < questions.length - 1) {
      await nextQuestion(roomData.pin);
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(20);
    } else {
      // Если это был последний вопрос, завершаем игру
      await handleEndGame();
    }
  };
  
  // Завершение игры (только для учителя)
  const handleEndGame = async () => {
    if (roomData?.pin) {
      await endGame(roomData.pin);
      setGameState('finished');
    }
  };
  
  // Переход к конкретному вопросу (только для учителя)
  const handleJumpToQuestion = (index) => {
    setCurrentQuestion(index);
    setTimeLeft(20);
  };
  
  // Ответ на вопрос (только для ученика)
  const handleAnswer = async (index) => {
    if (selectedAnswer !== null || role === 'teacher') return;
    
    const questions = roomData?.questions || DEFAULT_QUESTIONS;
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].correct;
    setIsCorrect(correct);
    
    if (correct) {
      const points = Math.ceil(timeLeft / 2) * 10;
      setScore(prev => prev + points);
      
      // Обновляем очки на сервере
      if (roomData?.pin) {
        await updateScore(roomData.pin, points);
      }
    }
    
    setShowFeedback(true);
    
    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      
      const questions = roomData?.questions || DEFAULT_QUESTIONS;
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(20);
      } else {
        setGameState('finished');
      }
    }, 2000);
  };
  
  // Таймер (только для ученика)
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0 && selectedAnswer === null && role === 'student') {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && role === 'student') {
      handleAnswer(-1);
    }
  }, [timeLeft, gameState, selectedAnswer, role]);
  
  // ==================== РЕНДЕР ====================
  
  // Выбор роли
  if (gameState === 'select-role') {
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <Header>
            <Title>Live Режим</Title>
            <Subtitle>Выберите свою роль и начните игру! 🌟</Subtitle>
          </Header>
          
          <RoleSelector>
            <RoleCard 
              selected={role === 'teacher'}
              onClick={handleSelectTeacher}
            >
              <RoleEmoji>👨‍🏫</RoleEmoji>
              <RoleTitle>Я учитель</RoleTitle>
              <RoleDescription>Создайте игру и управляйте ею</RoleDescription>
            </RoleCard>
            
            <RoleCard 
              selected={role === 'student'}
              onClick={() => { setRole('student'); setGameState('join'); }}
            >
              <RoleEmoji>🙋</RoleEmoji>
              <RoleTitle>Я ученик</RoleTitle>
              <RoleDescription>Присоединитесь к игре по PIN</RoleDescription>
            </RoleCard>
          </RoleSelector>
        </PageContainer>
      </>
    );
  }
  
  // Выбор набора карточек (для учителя)
  if (gameState === 'select-set') {
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <FormContainer>
            <FormTitle>👨‍🏫 Выбор набора карточек</FormTitle>
            <Subtitle style={{ marginBottom: '2rem' }}>
              Выберите набор для игры или используйте стандартные вопросы
            </Subtitle>
            
            {loadingSets ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка...</div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  marginBottom: '1.5rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem'
                }}>
                  {/* Опция: Стандартные вопросы */}
                  <div
                    onClick={() => setSelectedSet(null)}
                    style={{
                      padding: '1rem',
                      marginBottom: '0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedSet === null ? '#e3f2fd' : 'white',
                      border: selectedSet === null ? '2px solid #2196f3' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#2196f3' }}>🎲 Стандартные вопросы</div>
                    <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                      5 общих вопросов на разные темы
                    </div>
                  </div>
                  
                  {/* Список наборов пользователя */}
                  {userSets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                      У вас пока нет наборов карточек
                    </div>
                  ) : (
                    userSets.map(set => (
                      <div
                        key={set._id}
                        onClick={() => setSelectedSet(set)}
                        style={{
                          padding: '1rem',
                          marginBottom: '0.5rem',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: selectedSet?._id === set._id ? '#e3f2fd' : 'white',
                          border: selectedSet?._id === set._id ? '2px solid #2196f3' : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{set.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                          {set.flashcards?.length || 0} карточек • {set.isPublic ? '🌍 Публичный' : '🔒 Приватный'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <Button onClick={handleCreateRoom}>
                  🚀 Создать игру
                </Button>
                
                <BackButton onClick={() => setGameState('select-role')} style={{ marginTop: '1rem' }}>
                  ← Назад
                </BackButton>
              </>
            )}
          </FormContainer>
        </PageContainer>
      </>
    );
  }
  
  // Форма входа
  if (gameState === 'join') {
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <FormContainer>
            <FormTitle>
              {role === 'teacher' ? `👨‍🏫 ${selectedSet ? selectedSet.title : 'Новая игра'}` : '🙋 Присоединение к игре'}
            </FormTitle>
            
            {role === 'student' && (
              <>
                <InputGroup>
                  <Label>🔐 Введите PIN код</Label>
                  <PinInput 
                    type="text" 
                    maxLength={6}
                    placeholder="000000"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  />
                </InputGroup>
                
                <InputGroup>
                  <Label>👤 Ваше имя</Label>
                  <Input 
                    type="text"
                    placeholder="Введите имя"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                  />
                </InputGroup>
                
                <InputGroup>
                  <Label>🎨 Выберите команду</Label>
                  <TeamSelector>
                    {TEAMS.map(team => (
                      <TeamOption 
                        key={team.id}
                        selected={selectedTeam === team.id}
                        color={team.color}
                        onClick={() => setSelectedTeam(team.id)}
                      >
                        <TeamEmoji selected={selectedTeam === team.id}>{team.emoji}</TeamEmoji>
                        <TeamName>{team.name}</TeamName>
                      </TeamOption>
                    ))}
                  </TeamSelector>
                </InputGroup>
              </>
            )}
            
            <Button onClick={role === 'teacher' ? handleCreateRoom : handleJoinRoom}>
              {role === 'teacher' ? '🚀 Создать игру' : '🎮 Присоединиться'}
            </Button>
            
            <button 
              onClick={() => setGameState('select-role')}
              style={{ 
                marginTop: '1rem', 
                background: 'none', 
                border: 'none', 
                color: '#718096',
                cursor: 'pointer'
              }}
            >
              ← Назад
            </button>
          </FormContainer>
        </PageContainer>
      </>
    );
  }
  
  // Лобби
  if (gameState === 'lobby' && roomData) {
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <LiveRoom 
            roomData={roomData}
            isHost={role === 'teacher'}
            currentUser={{ username: playerName || 'Игрок', name: playerName || 'Игрок' }}
            onStartGame={handleStartGame}
          />
        </PageContainer>
      </>
    );
  }
  
  // Игра
  if (gameState === 'playing') {
    const questions = roomData?.questions || DEFAULT_QUESTIONS;
    const question = questions[currentQuestion];
    
    // УЧИТЕЛЬ: Панель управления
    if (role === 'teacher') {
      return (
        <>
          <DashboardButton onClick={handleBackToDashboard}>
            🏠 Выйти в Dashboard
          </DashboardButton>
          <PageContainer>
            <GameContainer>
              <div>
                <TeacherControlPanel>
                  <QuestionNumber>
                    Вопрос {currentQuestion + 1} из {questions.length}
                  </QuestionNumber>
                  
                  <TeacherQuestionDisplay>
                    <TeacherQuestionText>{question.question}</TeacherQuestionText>
                    
                    <AnswerReveal>
                      <AnswerLabel>✅ Правильный ответ:</AnswerLabel>
                      <AnswerText>{question.options[question.correct]}</AnswerText>
                    </AnswerReveal>
                  </TeacherQuestionDisplay>
                  
                  <PanelTitle>🎛️ Управление игрой</PanelTitle>
                  
                  <ControlButton 
                    variant="success"
                    onClick={handleNextQuestion}
                    disabled={currentQuestion >= questions.length - 1}
                  >
                    {currentQuestion >= questions.length - 1 
                      ? '⛔ Это последний вопрос' 
                      : '⏭️ Следующий вопрос'}
                  </ControlButton>
                  
                  <ControlButton 
                    variant="danger"
                    onClick={handleEndGame}
                  >
                    ⏹️ Завершить игру
                  </ControlButton>
                </TeacherControlPanel>
                
                <TeacherPanel>
                  <PanelTitle>📋 Список вопросов</PanelTitle>
                  <QuestionList>
                    {questions.map((q, i) => (
                      <QuestionItem 
                        key={q.id} 
                        active={i === currentQuestion}
                        onClick={() => handleJumpToQuestion(i)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Вопрос {i + 1}</strong>
                          {i === currentQuestion && <span style={{ color: '#42a5f5' }}>▶️</span>}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                          {q.question.substring(0, 50)}...
                        </div>
                        {i === currentQuestion && (
                          <div style={{ fontSize: '0.8rem', color: '#43a047', marginTop: '0.5rem', fontWeight: 600 }}>
                            ✅ {q.options[q.correct]}
                          </div>
                        )}
                      </QuestionItem>
                    ))}
                  </QuestionList>
                </TeacherPanel>
              </div>
              
              <div>
                <LiveLeaderboard 
                  teams={teamScores} 
                  totalQuestions={questions.length}
                />
              </div>
            </GameContainer>
          </PageContainer>
        </>
      );
    }
    
    // УЧЕНИК: Интерфейс ответов
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <GameContainer>
            <div>
              <QuestionCard>
                <QuestionNumber>
                  Вопрос {currentQuestion + 1} из {questions.length}
                </QuestionNumber>
                
                <Timer>
                  <TimerBar percent={(timeLeft / 20) * 100} />
                </Timer>
                
                <QuestionText>{question.question}</QuestionText>
                
                <OptionsGrid>
                  {question.options.map((option, index) => (
                    <OptionButton
                      key={index}
                      onClick={() => handleAnswer(index)}
                      disabled={selectedAnswer !== null}
                      correct={selectedAnswer !== null && index === question.correct}
                      wrong={selectedAnswer === index && index !== question.correct}
                    >
                      {option}
                    </OptionButton>
                  ))}
                </OptionsGrid>
              </QuestionCard>
            </div>
            
            <div>
              <LiveLeaderboard 
                teams={teamScores} 
                totalQuestions={questions.length}
              />
            </div>
          </GameContainer>
          
          {showFeedback && (
            <FeedbackOverlay>
              <FeedbackCard>
                <FeedbackEmoji>{isCorrect ? '🎉' : '😅'}</FeedbackEmoji>
                <FeedbackText correct={isCorrect}>
                  {isCorrect ? 'Правильно!' : 'Не совсем...'}
                </FeedbackText>
                <FeedbackScore>
                  {isCorrect ? `+${Math.ceil(timeLeft / 2) * 10} очков!` : 'Правильный ответ подсвечен'}
                </FeedbackScore>
                <div style={{ color: '#718096', fontSize: '0.9rem' }}>
                  Следующий вопрос через 2 сек...
                </div>
              </FeedbackCard>
            </FeedbackOverlay>
          )}
        </PageContainer>
      </>
    );
  }
  
  // Результаты
  if (gameState === 'finished') {
    const questions = roomData?.questions || DEFAULT_QUESTIONS;
    return (
      <>
        <DashboardButton onClick={handleBackToDashboard}>
          🏠 Выйти в Dashboard
        </DashboardButton>
        <PageContainer>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <LiveLeaderboard 
              teams={teamScores}
              totalQuestions={questions.length}
              showPodium={true}
            />
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              {role === 'student' && (
                <h2 style={{ color: '#4a5568', marginBottom: '1rem' }}>
                  🎯 Ваш счёт: {score} очков
                </h2>
              )}
              {role === 'teacher' && (
                <h2 style={{ color: '#4a5568', marginBottom: '1rem' }}>
                  👨‍🏫 Игра завершена!
                </h2>
              )}
              <Button onClick={handleResetGame}>
                🔄 Играть снова
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }
  
  return null;
};

export default LiveGame;
