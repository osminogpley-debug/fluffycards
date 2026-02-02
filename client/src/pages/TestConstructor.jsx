import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';



// 🎯 Styled Components
const ConstructorContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.3s ease;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const Title = styled.h1`
  color: #63b3ed;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "🛠️ ";
  }
  
  &::after {
    content: " 🔧";
  }
`;

const Subtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
`;

const SetInfo = styled.div`
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-top: 1rem;
  display: inline-block;
  
  h3 {
    margin: 0 0 0.25rem 0;
    color: #0369a1;
    font-size: 1.1rem;
  }
  
  p {
    margin: 0;
    color: #0ea5e9;
    font-size: 0.9rem;
  }
`;

const ConstructorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  height: fit-content;
`;

const CardTitle = styled.h2`
  color: #2d3748;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SettingSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SettingLabel = styled.label`
  display: block;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1rem;
`;

const SettingDescription = styled.p`
  color: #718096;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  margin-top: -0.5rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: ${({ checked }) => checked ? '#ebf8ff' : '#f7fafc'};
  border: 2px solid ${({ checked }) => checked ? '#63b3ed' : '#e2e8f0'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #63b3ed;
    transform: translateX(5px);
  }
`;

const CheckboxInput = styled.input`
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #63b3ed;
`;

const CheckboxContent = styled.div`
  flex: 1;
`;

const CheckboxTitle = styled.div`
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxDescription = styled.div`
  font-size: 0.85rem;
  color: #718096;
  margin-top: 0.25rem;
`;

const RangeContainer = styled.div`
  margin-top: 0.5rem;
`;

const RangeInput = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #63b3ed;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(99, 179, 237, 0.4);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(99, 179, 237, 0.6);
    }
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #63b3ed;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(99, 179, 237, 0.4);
  }
`;

const RangeValue = styled.div`
  text-align: center;
  margin-top: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #63b3ed;
`;

const RangeLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #a0aec0;
  margin-top: 0.25rem;
`;

const TimerOptions = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const TimerOption = styled.button`
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 2px solid ${({ selected }) => selected ? '#63b3ed' : '#e2e8f0'};
  background: ${({ selected }) => selected ? '#ebf8ff' : 'white'};
  color: ${({ selected }) => selected ? '#2b6cb0' : '#4a5568'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    border-color: #63b3ed;
    transform: translateY(-2px);
  }
`;

const PreviewCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
`;

const PreviewContainer = styled.div`
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 16px;
  padding: 1.5rem;
  min-height: 300px;
  border: 2px dashed #e2e8f0;
`;

const PreviewQuestion = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: opacity 0.3s ease;
`;

const PreviewQuestionNumber = styled.div`
  font-size: 0.8rem;
  color: #a0aec0;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
`;

const PreviewQuestionText = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.75rem;
`;

const PreviewOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewOption = styled.div`
  padding: 0.75rem;
  background: #f7fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 2px solid #63b3ed;
`;

const SummaryTitle = styled.div`
  font-weight: 700;
  color: #2b6cb0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(99, 179, 237, 0.3);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SummaryLabel = styled.span`
  color: #4a5568;
`;

const SummaryValue = styled.span`
  font-weight: 600;
  color: #2b6cb0;
`;

const StartButton = styled(PrimaryButton)`
  width: 100%;
  margin-top: 1.5rem;
  padding: 1.25rem;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  
  &:hover {
    background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
  }
  
  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyPreview = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #a0aec0;
`;

const EmptyPreviewIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  transition: transform 0.2s ease;
`;

const EmptyPreviewText = styled.div`
  font-size: 1.1rem;
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s ease;
`;

const QuestionTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: ${({ type }) => {
    const colors = {
      multiple: '#ebf8ff',
      truefalse: '#f0fff4',
      writing: '#fffff0'
    };
    return colors[type] || '#f7fafc';
  }};
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ type }) => {
    const colors = {
      multiple: '#2b6cb0',
      truefalse: '#22543d',
      writing: '#744210'
    };
    return colors[type] || '#4a5568';
  }};
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

const ErrorContainer = styled.div`
  text-align: center;
  padding: 3rem;
  background: #fee2e2;
  border-radius: 16px;
  color: #991b1b;
`;

function TestConstructor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');
  
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [settings, setSettings] = useState({
    questionTypes: {
      multiple: true,
      truefalse: true,
      writing: false
    },
    questionCount: 10,
    timer: 30
  });
  const [showError, setShowError] = useState(false);

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
        // Adjust question count to not exceed available cards
        setSettings(prev => ({
          ...prev,
          questionCount: Math.min(prev.questionCount, setData.flashcards.length)
        }));
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

  const handleQuestionTypeToggle = (type) => {
    setSettings({
      ...settings,
      questionTypes: {
        ...settings.questionTypes,
        [type]: !settings.questionTypes[type]
      }
    });
    setShowError(false);
  };

  const handleQuestionCountChange = (e) => {
    const count = parseInt(e.target.value);
    const maxCount = flashcards.length > 0 ? flashcards.length : 50;
    setSettings({
      ...settings,
      questionCount: Math.min(count, maxCount)
    });
  };

  const handleTimerChange = (value) => {
    setSettings({
      ...settings,
      timer: value
    });
  };

  const handleStartTest = () => {
    const hasSelectedType = Object.values(settings.questionTypes).some(v => v);
    if (!hasSelectedType) {
      setShowError(true);
      return;
    }
    
    // Pass settings and setId to test mode
    navigate(`/test?setId=${setId}`, { state: { settings } });
  };

  // Get enabled question types for preview
  const enabledTypes = Object.entries(settings.questionTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);

  // Calculate estimated time
  const estimatedTime = Math.ceil((settings.questionCount * settings.timer) / 60);

  const getQuestionTypeName = (type) => {
    const names = {
      multiple: 'Выбор ответа',
      truefalse: 'Верно/Неверно',
      writing: 'Написание ответа'
    };
    return names[type] || type;
  };

  const getQuestionTypeIcon = (type) => {
    const icons = {
      multiple: '🔘',
      truefalse: '✅',
      writing: '✍️'
    };
    return icons[type] || '📝';
  };

  // Generate preview questions from real flashcards
  const generatePreviewQuestions = () => {
    if (!flashcards || flashcards.length === 0) return [];
    
    const previewCards = flashcards.slice(0, 3);
    
    return previewCards.map((card, index) => {
      // Cycle through enabled types
      const typeIndex = index % enabledTypes.length;
      const type = enabledTypes[typeIndex];
      
      if (type === 'multiple') {
        return {
          type: 'multiple',
          question: `Что означает "${card.term}"?`,
          options: [card.definition, '...', '...'],
          icon: '🔘'
        };
      } else if (type === 'truefalse') {
        return {
          type: 'truefalse',
          question: `"${card.term}" означает "${card.definition}"`,
          options: ['Верно', 'Неверно'],
          icon: '✅'
        };
      } else {
        return {
          type: 'writing',
          question: `Напишите определение для: "${card.term}"`,
          options: ['Введите ответ...'],
          icon: '✍️'
        };
      }
    });
  };

  if (loading) {
    return (
      <ConstructorContainer>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <LoadingSpinner>
            <div className="spinner" />
          </LoadingSpinner>
          <div>Загрузка набора...</div>
        </div>
      </ConstructorContainer>
    );
  }

  if (error) {
    return (
      <ConstructorContainer>
        <ErrorContainer>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h2>Ошибка</h2>
          <p>{error}</p>
          <SecondaryButton onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            ← Назад
          </SecondaryButton>
        </ErrorContainer>
      </ConstructorContainer>
    );
  }

  const previewQuestions = generatePreviewQuestions();
  const maxQuestions = flashcards.length;

  return (
    <ConstructorContainer>
      <Header>
        <Title>Конструктор теста</Title>
        <Subtitle>Настройте параметры теста под себя 🎨</Subtitle>
        {currentSet && (
          <SetInfo>
            <h3>📚 {currentSet.title}</h3>
            <p>{flashcards.length} карточек</p>
          </SetInfo>
        )}
      </Header>

      <ConstructorGrid>
        {/* 🔧 Settings Panel */}
        <SettingsCard>
          <CardTitle>⚙️ Настройки</CardTitle>

          {/* Question Types */}
          <SettingSection>
            <SettingLabel>Типы вопросов</SettingLabel>
            <SettingDescription>
              Выберите хотя бы один тип вопросов
            </SettingDescription>
            
            {showError && (
              <ErrorMessage>
                ⚠️ Выберите хотя бы один тип вопроса!
              </ErrorMessage>
            )}
            
            <CheckboxGroup>
              <CheckboxItem 
                checked={settings.questionTypes.multiple}
                onClick={() => handleQuestionTypeToggle('multiple')}
              >
                <CheckboxInput
                  type="checkbox"
                  checked={settings.questionTypes.multiple}
                  onChange={() => {}}
                />
                <CheckboxContent>
                  <CheckboxTitle>
                    🔘 Множественный выбор
                  </CheckboxTitle>
                  <CheckboxDescription>
                    Выберите один правильный ответ из нескольких вариантов
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>
              
              <CheckboxItem 
                checked={settings.questionTypes.truefalse}
                onClick={() => handleQuestionTypeToggle('truefalse')}
              >
                <CheckboxInput
                  type="checkbox"
                  checked={settings.questionTypes.truefalse}
                  onChange={() => {}}
                />
                <CheckboxContent>
                  <CheckboxTitle>
                    ✅ Верно / Неверно
                  </CheckboxTitle>
                  <CheckboxDescription>
                    Определите, является ли утверждение правдой
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>
              
              <CheckboxItem 
                checked={settings.questionTypes.writing}
                onClick={() => handleQuestionTypeToggle('writing')}
              >
                <CheckboxInput
                  type="checkbox"
                  checked={settings.questionTypes.writing}
                  onChange={() => {}}
                />
                <CheckboxContent>
                  <CheckboxTitle>
                    ✍️ Написание ответа
                  </CheckboxTitle>
                  <CheckboxDescription>
                    Введите правильный ответ с клавиатуры
                  </CheckboxDescription>
                </CheckboxContent>
              </CheckboxItem>
            </CheckboxGroup>
          </SettingSection>

          {/* Question Count */}
          <SettingSection>
            <SettingLabel>Количество вопросов</SettingLabel>
            <SettingDescription>
              Максимум: {maxQuestions} (по количеству карточек в наборе)
            </SettingDescription>
            <RangeContainer>
              <RangeInput
                type="range"
                min="1"
                max={maxQuestions}
                step="1"
                value={settings.questionCount}
                onChange={handleQuestionCountChange}
              />
              <RangeValue>{settings.questionCount} 📝</RangeValue>
              <RangeLabels>
                <span>1</span>
                <span>{maxQuestions}</span>
              </RangeLabels>
            </RangeContainer>
          </SettingSection>

          {/* Timer */}
          <SettingSection>
            <SettingLabel>Время на вопрос</SettingLabel>
            <SettingDescription>
              Сколько времени даётся на каждый вопрос
            </SettingDescription>
            <TimerOptions>
              {[15, 30, 45, 60, 90].map((time) => (
                <TimerOption
                  key={time}
                  selected={settings.timer === time}
                  onClick={() => handleTimerChange(time)}
                >
                  ⏱️ {time} сек
                </TimerOption>
              ))}
            </TimerOptions>
          </SettingSection>
        </SettingsCard>

        {/* 👁️ Preview Panel */}
        <PreviewCard>
          <CardTitle>👁️ Предпросмотр</CardTitle>
          
          <PreviewContainer>
            {enabledTypes.length === 0 ? (
              <EmptyPreview>
                <EmptyPreviewIcon>📋</EmptyPreviewIcon>
                <EmptyPreviewText>
                  Выберите типы вопросов, чтобы увидеть предпросмотр
                </EmptyPreviewText>
              </EmptyPreview>
            ) : previewQuestions.length === 0 ? (
              <EmptyPreview>
                <EmptyPreviewIcon>📝</EmptyPreviewIcon>
                <EmptyPreviewText>
                  Нет карточек для предпросмотра
                </EmptyPreviewText>
              </EmptyPreview>
            ) : (
              <>
                {previewQuestions.map((item, index) => (
                  <PreviewQuestion key={index}>
                    <PreviewQuestionNumber>
                      Вопрос {index + 1}
                    </PreviewQuestionNumber>
                    <PreviewQuestionText>
                      {item.icon} {item.question}
                    </PreviewQuestionText>
                    <PreviewOptions>
                      {item.options.map((option, optIndex) => (
                        <PreviewOption key={optIndex}>
                          {item.type === 'multiple' && (
                            <span style={{ 
                              width: '20px', 
                              height: '20px', 
                              borderRadius: '50%', 
                              border: '2px solid #cbd5e0',
                              display: 'inline-block'
                            }} />
                          )}
                          {item.type === 'truefalse' && (
                            <span style={{ fontSize: '1.2rem' }}>
                              {optIndex === 0 ? '✅' : '❌'}
                            </span>
                          )}
                          {item.type === 'writing' && (
                            <span style={{ color: '#a0aec0' }}>✍️</span>
                          )}
                          {option}
                        </PreviewOption>
                      ))}
                    </PreviewOptions>
                    <div style={{ marginTop: '0.75rem' }}>
                      <QuestionTypeBadge type={item.type}>
                        {getQuestionTypeIcon(item.type)} {getQuestionTypeName(item.type)}
                      </QuestionTypeBadge>
                    </div>
                  </PreviewQuestion>
                ))}
                
                {settings.questionCount > previewQuestions.length && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#a0aec0',
                    padding: '1rem'
                  }}>
                    ... и ещё {settings.questionCount - previewQuestions.length} вопросов
                  </div>
                )}
              </>
            )}
          </PreviewContainer>

          {/* 📊 Summary */}
          {enabledTypes.length > 0 && (
            <SummaryCard>
              <SummaryTitle>
                📊 Итого
              </SummaryTitle>
              <SummaryItem>
                <SummaryLabel>Типы вопросов:</SummaryLabel>
                <SummaryValue>
                  {enabledTypes.map(t => getQuestionTypeIcon(t)).join(' ')}
                </SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Всего вопросов:</SummaryLabel>
                <SummaryValue>{settings.questionCount} 📝</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Время на вопрос:</SummaryLabel>
                <SummaryValue>{settings.timer} сек ⏱️</SummaryValue>
              </SummaryItem>
              <SummaryItem>
                <SummaryLabel>Примерное время:</SummaryLabel>
                <SummaryValue>~{estimatedTime} мин ⌛</SummaryValue>
              </SummaryItem>
            </SummaryCard>
          )}

          {/* 🚀 Start Button */}
          <StartButton 
            onClick={handleStartTest}
            disabled={enabledTypes.length === 0 || flashcards.length === 0}
          >
            Начать тест 🚀
          </StartButton>
        </PreviewCard>
      </ConstructorGrid>
    </ConstructorContainer>
  );
}

export default TestConstructor;
