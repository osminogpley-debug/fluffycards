import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';



const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #63b3ed;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const SetInfo = styled.div`
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 1rem 2rem;
  border-radius: 16px;
  display: inline-block;
  margin-bottom: 2rem;
  
  h3 {
    margin: 0;
    color: #0369a1;
  }
  
  p {
    margin: 0.5rem 0 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
`;

const ModesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const ModeCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 2px solid ${props => props.$selected ? '#63b3ed' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: #63b3ed;
  }
`;

const SettingsButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--bg-tertiary);
  border: none;
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  z-index: 10;
  
  &:hover {
    background: #e5e7eb;
    transform: scale(1.1);
  }
`;

const ModeIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ModeTitle = styled.h3`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const ModeDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const ModeFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
  
  li {
    color: var(--text-secondary);
    font-size: 0.9rem;
    padding: 0.3rem 0;
    padding-left: 1.2rem;
    position: relative;
    
    &::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #48bb78;
      font-weight: bold;
    }
  }
`;

const OptionsSection = styled.div`
  background: var(--bg-tertiary);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const OptionsTitle = styled.h3`
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0f2fe;
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
  
  input[type="radio"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const DifficultyBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 0.5rem;
  
  ${props => props.$level === 'easy' && `
    background: #d1fae5;
    color: #065f46;
  `}
  
  ${props => props.$level === 'medium' && `
    background: #fef3c7;
    color: #92400e;
  `}
  
  ${props => props.$level === 'hard' && `
    background: #fee2e2;
    color: #991b1b;
  `}
`;

const learningModes = [
  {
    id: 'flashcards',
    icon: '🎴',
    title: 'Карточки',
    description: 'Классический режим с переворачивающимися карточками',
    difficulty: 'easy',
    features: ['Переворот по клику', 'Автовоспроизведение звука', 'Отслеживание прогресса'],
    path: '/learn/flashcards'
  },
  {
    id: 'study',
    icon: '🎯',
    title: 'Заучивание',
    description: 'Распределяйте карточки по колонкам "Знаю" и "Учу"',
    difficulty: 'easy',
    features: ['Визуальное распределение', 'Фокус на сложных', 'Повторение ошибок'],
    path: '/learn/study'
  },
  {
    id: 'spell',
    icon: '🔊',
    title: 'Правописание',
    description: 'Слушайте произношение и пишите термины',
    difficulty: 'medium',
    features: ['Аудио поддержка', 'Проверка написания', 'Тренировка восприятия'],
    path: '/learn/spell'
  },
  {
    id: 'test',
    icon: '📝',
    title: 'Тест',
    description: 'Пройдите тест с вариантами ответов и письменными вопросами',
    difficulty: 'medium',
    features: ['Разные типы вопросов', 'Оценка знаний', 'Статистика ошибок'],
    path: '/test'
  },
  {
    id: 'match',
    icon: '🎯',
    title: 'Подбор',
    description: 'Игра на соединение терминов с определениями',
    difficulty: 'easy',
    features: ['Игровой формат', 'На время', 'Соревновательно'],
    path: '/games/match'
  },
  {
    id: 'scramble',
    icon: '🔤',
    title: 'Собери слово',
    description: 'Составь термин из перемешанных букв по подсказке',
    difficulty: 'medium',
    features: ['Буквы вперемешку', 'Серии правильных ответов', 'Очки за скорость'],
    path: '/games/scramble'
  },
  {
    id: 'handwriting',
    icon: '汉',
    title: 'Иероглифы',
    description: 'Рисуйте китайские иероглифы и проверяйте точность написания',
    difficulty: 'hard',
    features: ['Практика написания', 'Оценка точности', 'Подсказка-призрак'],
    path: '/learn/handwriting'
  },
  {
    id: 'laoshi',
    icon: '🐼',
    title: 'Лаоши',
    description: 'Комплексный режим: карточки → соединение → тест → написание (раунды по 10)',
    difficulty: 'medium',
    features: ['Раунды по 10 карточек', 'Соединение пар', 'Тест с вариантами', 'Написание иероглифов'],
    path: '/learn/laoshi'
  }
];

function LearningModesPage() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const [set, setSet] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [options, setOptions] = useState({
    shuffle: true,
    audio: true,
    hints: true,
    trackProgress: true,
    difficulty: 'normal'
  });

  useEffect(() => {
    if (setId) {
      fetchSet();
    }
  }, [setId]);

  const fetchSet = async () => {
    try {
      const res = await authFetch(`${API_ROUTES.FLASHCARD_SETS}/${setId}`);
      if (res.ok) {
        const data = await res.json();
        setSet(data.data);
      }
    } catch (error) {
      console.error('Error fetching set:', error);
    }
  };

  const handleModeSelect = (mode) => {
    // Immediately navigate to selected mode with default options
    let url = mode.path;
    if (setId) {
      url += url.includes('?') ? `&setId=${setId}` : `?setId=${setId}`;
    }
    
    // Add default options as query params
    if (options.shuffle) url += '&shuffle=true';
    if (options.audio) url += '&audio=true';
    url += `&difficulty=${options.difficulty}`;
    
    navigate(url);
  };

  const handleShowOptions = (e, mode) => {
    e.stopPropagation();
    setSelectedMode(mode);
  };

  const handleStart = () => {
    if (!selectedMode) return;
    
    let url = selectedMode.path;
    if (setId) {
      url += url.includes('?') ? `&setId=${setId}` : `?setId=${setId}`;
    }
    
    // Add options as query params
    if (options.shuffle) url += '&shuffle=true';
    if (options.audio) url += '&audio=true';
    if (options.hints) url += '&hints=true';
    url += `&difficulty=${options.difficulty}`;
    
    navigate(url);
  };

  const toggleOption = (key) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Container>
      <Header>
        <Title>📚 Выберите режим обучения</Title>
        <Subtitle>Разные способы изучения для разных целей</Subtitle>
        
        {set && (
          <SetInfo>
            <h3>📖 {set.title}</h3>
            <p>{set.flashcards?.length || 0} карточек</p>
          </SetInfo>
        )}
      </Header>

      <ModesGrid>
        {learningModes.map((mode) => (
          <ModeCard 
            key={mode.id}
            $selected={selectedMode?.id === mode.id}
            onClick={() => handleModeSelect(mode)}
          >
            <SettingsButton 
              onClick={(e) => handleShowOptions(e, mode)}
              title="Настройки"
            >
              ⚙️
            </SettingsButton>
            <ModeIcon>{mode.icon}</ModeIcon>
            <ModeTitle>
              {mode.title}
              <DifficultyBadge $level={mode.difficulty}>
                {mode.difficulty === 'easy' && 'Легко'}
                {mode.difficulty === 'medium' && 'Средне'}
                {mode.difficulty === 'hard' && 'Сложно'}
              </DifficultyBadge>
            </ModeTitle>
            <ModeDescription>{mode.description}</ModeDescription>
            <ModeFeatures>
              {mode.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ModeFeatures>
          </ModeCard>
        ))}
      </ModesGrid>

      {selectedMode && (
        <>
          <OptionsSection>
            <OptionsTitle>⚙️ Настройки режима</OptionsTitle>
            <OptionsGrid>
              <Option>
                <input
                  type="checkbox"
                  checked={options.shuffle}
                  onChange={() => toggleOption('shuffle')}
                />
                <span>🔀 Перемешать карточки</span>
              </Option>
              <Option>
                <input
                  type="checkbox"
                  checked={options.audio}
                  onChange={() => toggleOption('audio')}
                />
                <span>🔊 Включить аудио</span>
              </Option>
              <Option>
                <input
                  type="checkbox"
                  checked={options.hints}
                  onChange={() => toggleOption('hints')}
                />
                <span>💡 Показывать подсказки</span>
              </Option>
              <Option>
                <input
                  type="checkbox"
                  checked={options.trackProgress}
                  onChange={() => toggleOption('trackProgress')}
                />
                <span>📊 Отслеживать прогресс</span>
              </Option>
            </OptionsGrid>
            
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#4a5568', marginBottom: '0.5rem' }}>Сложность:</p>
              <OptionsGrid>
                <Option>
                  <input
                    type="radio"
                    name="difficulty"
                    checked={options.difficulty === 'easy'}
                    onChange={() => setOptions(prev => ({ ...prev, difficulty: 'easy' }))}
                  />
                  <span>🌱 Легко</span>
                </Option>
                <Option>
                  <input
                    type="radio"
                    name="difficulty"
                    checked={options.difficulty === 'normal'}
                    onChange={() => setOptions(prev => ({ ...prev, difficulty: 'normal' }))}
                  />
                  <span>⚖️ Нормально</span>
                </Option>
                <Option>
                  <input
                    type="radio"
                    name="difficulty"
                    checked={options.difficulty === 'hard'}
                    onChange={() => setOptions(prev => ({ ...prev, difficulty: 'hard' }))}
                  />
                  <span>🔥 Сложно</span>
                </Option>
              </OptionsGrid>
            </div>
          </OptionsSection>

          <ButtonGroup>
            <PrimaryButton onClick={handleStart}>
              ▶️ Начать обучение
            </PrimaryButton>
            <SecondaryButton onClick={() => setSelectedMode(null)}>
              Отменить выбор
            </SecondaryButton>
          </ButtonGroup>
        </>
      )}
    </Container>
  );
}

export default LearningModesPage;
