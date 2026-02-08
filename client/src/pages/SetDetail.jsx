import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
import SocialFeatures from '../components/SocialFeatures';

// ===== ПРОВЕРКА КИТАЙСКОГО ТЕКСТА =====
const isChinese = (text) => {
  if (!text) return false;
  return /[\u4e00-\u9fff]/.test(text);
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};



// ===== СТИЛИ =====
const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-bottom: 40px;
`;

const Header = styled.div`
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  padding: 24px 32px;
  transition: opacity 0.3s ease;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #63b3ed;
  }
`;

const SetTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.3;
`;

const SetDescription = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
`;

const CoverImage = styled.img`
  width: 100%;
  max-width: 720px;
  height: 260px;
  object-fit: cover;
  border-radius: 16px;
  margin: 12px 0 16px 0;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
`;

const SetMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`;

const AuthorName = styled.span`
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
`;

const MetaDivider = styled.span`
  color: #d1d5db;
`;

const CardCount = styled.span`
  font-size: 14px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const VisibilityBadge = styled.span`
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 20px;
  background: ${props => props.isPublic ? '#dcfce7' : 'var(--bg-tertiary)'};
  color: ${props => props.isPublic ? '#16a34a' : 'var(--text-secondary)'};
  font-weight: 500;
`;

const CardImage = styled.img`
  width: 220px;
  height: 160px;
  max-width: 100%;
  border-radius: 12px;
  object-fit: contain;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 6px;
`;

// Основной контент
const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 32px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  transition: all 0.5s ease;
`;

const RightColumn = styled.div`
  transition: opacity 0.3s ease;

  @media (max-width: 900px) {
    order: -1;
  }
`;

// Секция режимов обучения
const Section = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px var(--shadow-color);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StudyModesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const StudyModeButton = styled.button`
  background: ${props => props.primary 
    ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' 
    : props.$highlight
      ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
      : 'var(--bg-tertiary)'};
  color: ${props => props.primary || props.$highlight ? 'white' : 'var(--text-primary)'};
  border: 2px solid ${props => props.primary ? '#63b3ed' : props.$highlight ? '#f59e0b' : 'var(--border-light)'};
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary 
      ? '0 6px 20px rgba(99, 179, 237, 0.4)' 
      : props.$highlight
        ? '0 6px 20px rgba(245, 158, 11, 0.4)'
        : '0 4px 12px rgba(0, 0, 0, 0.1)'};
    border-color: ${props => props.$highlight ? '#f59e0b' : '#63b3ed'};
  }
`;

// Игры
const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const GameButton = styled.button`
  background: linear-gradient(135deg, ${props => props.gradient});
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

// Тест
const TestButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }
`;

// Действия автора
const AuthorActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EditButton = styled.button`
  width: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-light);
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--bg-tertiary);
    border-color: #63b3ed;
    color: #63b3ed;
  }
`;

const DeleteButton = styled.button`
  width: 100%;
  background: var(--bg-secondary);
  color: #ef4444;
  border: 2px solid #fecaca;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: #fef2f2;
    border-color: #ef4444;
  }
`;

// Список карточек
const CardsSection = styled.div`
  margin-top: 8px;
`;

const CardsGrid = styled.div`
  display: grid;
  gap: 16px;
`;

const FlashcardItem = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px var(--shadow-color);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  border-color: ${props => props.$isChinese ? '#fecaca' : 'transparent'};
  transition: opacity 0.3s ease;
  animation-delay: ${props => props.index * 0.05}s;
  animation-fill-mode: both;

  &:hover {
    border-color: ${props => props.$isChinese ? '#f56565' : '#63b3ed'};
    box-shadow: 0 4px 16px ${props => props.$isChinese 
      ? 'rgba(245, 101, 101, 0.15)' 
      : 'rgba(99, 179, 237, 0.15)'};
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const CardDivider = styled.div`
  width: 1px;
  height: 40px;
  background: var(--border-light);

  @media (max-width: 600px) {
    width: 100%;
    height: 1px;
  }
`;

const CardTerm = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.5;
`;

const CardTermHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const CardDefinition = styled.div`
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.5;
`;

const CardNumber = styled.span`
  font-size: 13px;
  color: #9ca3af;
  font-weight: 500;
  margin-right: 8px;
`;

// Бейдж китайского языка
const ChineseBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
`;

// Отображение пиньиня
const PinyinDisplay = styled.div`
  font-size: 14px;
  color: var(--text-secondary, #718096);
  font-style: italic;
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--bg-secondary, #f7fafc);
  border-radius: 6px;
  display: inline-block;
`;

// Перевод для китайских карточек
const TranslationDisplay = styled.div`
  font-size: 13px;
  color: var(--text-secondary, #4a5568);
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--bg-tertiary, #fef3c7);
  border-radius: 6px;
  display: inline-block;
`;

// Загрузка
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid var(--bg-tertiary);
  border-top: 4px solid #63b3ed;
  border-radius: 50%;
  animation: none;
`;

const LoadingText = styled.p`
  margin-top: 16px;
  color: var(--text-secondary);
  font-size: 15px;
`;

// Ошибка
const ErrorContainer = styled.div`
  text-align: center;
  padding: 60px 20px;
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
`;

const ErrorText = styled.p`
  color: var(--text-secondary);
  margin: 0 0 24px 0;
`;

// Модальное окно подтверждения удаления
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.2s ease;
`;

const ModalContent = styled.div`
  background: var(--modal-bg);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  transition: transform 0.2s ease;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
`;

const ModalText = styled.p`
  color: var(--text-secondary);
  margin: 0 0 24px 0;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: ${props => props.danger ? 'none' : '2px solid var(--border-light)'};
  background: ${props => props.danger ? '#ef4444' : 'var(--bg-secondary)'};
  color: ${props => props.danger ? 'white' : 'var(--text-primary)'};

  &:hover {
    background: ${props => props.danger ? '#dc2626' : 'var(--bg-tertiary)'};
  }
`;

// ===== КОМПОНЕНТ =====
function SetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Загрузка данных набора
  useEffect(() => {
    const fetchSet = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Набор не найден');
          }
          throw new Error('Ошибка загрузки набора');
        }

        const data = await response.json();
        setSetData(data);
      } catch (err) {
        console.error('Error fetching set:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSet();
    }
  }, [id]);

  // Проверка, является ли пользователь автором
  const isAuthor = user && setData && (
    user.id === setData.owner || 
    user._id === setData.owner ||
    user.id === setData.owner?._id ||
    user._id === setData.owner?._id ||
    user.id === setData.authorId || 
    user._id === setData.authorId ||
    user.id === setData.author?._id ||
    user._id === setData.author?._id
  );

  // Переключение публичности набора
  const handleTogglePublic = async () => {
    try {
      const newIsPublic = !setData.isPublic;
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic })
      });

      if (response.ok) {
        const updatedSet = await response.json();
        setSetData(prev => ({ ...prev, isPublic: newIsPublic }));
        alert(newIsPublic ? '🌍 Набор теперь публичный!' : '🔒 Набор теперь приватный');
      } else {
        throw new Error('Failed to update');
      }
    } catch (err) {
      console.error('Error toggling public status:', err);
      alert('Не удалось изменить статус набора');
    }
  };

  // Удаление набора
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления набора');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error deleting set:', err);
      alert('Не удалось удалить набор');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Навигация к режимам обучения
  const navigateToLearn = (mode) => {
    if (mode === 'modes') {
      navigate(`/learn/${id}`);
    } else {
      navigate(`/learn/${mode}?setId=${id}`);
    }
  };

  // Навигация к играм
  const navigateToGame = (game) => {
    navigate(`/games/${game}?setId=${id}`);
  };

  // Навигация к тесту
  const navigateToTest = () => {
    navigate(`/test/constructor?setId=${id}`);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Загружаем набор...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (error || !setData) {
    return (
      <PageContainer>
        <ErrorContainer>
          <ErrorIcon>😕</ErrorIcon>
          <ErrorTitle>{error || 'Набор не найден'}</ErrorTitle>
          <ErrorText>Проверьте правильность ссылки или попробуйте позже</ErrorText>
          <StudyModeButton onClick={() => navigate('/dashboard')}>
            ← Вернуться к наборам
          </StudyModeButton>
        </ErrorContainer>
      </PageContainer>
    );
  }

  const flashcards = setData.flashcards || setData.cards || [];
  const authorName = setData.owner?.username || setData.author?.username || setData.author?.name || 'Неизвестный автор';
  const authorAvatar = setData.owner?.username?.[0]?.toUpperCase() || setData.author?.avatar || '👤';

  return (
    <PageContainer>
      {/* Шапка */}
      <Header>
        <HeaderContent>
          <BackButton onClick={() => navigate(-1)}>
            ← Назад
          </BackButton>
          <SetTitle>{setData.title}</SetTitle>
          {setData.description && (
            <SetDescription>{setData.description}</SetDescription>
          )}
          {setData.coverImage && (
            <CoverImage
              src={resolveImageUrl(setData.coverImage)}
              alt="cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <SetMeta>
            <AuthorInfo>
              <Avatar>{authorAvatar}</Avatar>
              <AuthorName>{authorName}</AuthorName>
            </AuthorInfo>
            <MetaDivider>•</MetaDivider>
            <CardCount>
              📝 {flashcards.length} {flashcards.length === 1 ? 'карточка' : 
                  flashcards.length < 5 ? 'карточки' : 'карточек'}
            </CardCount>
            <MetaDivider>•</MetaDivider>
            <VisibilityBadge 
              isPublic={setData.isPublic !== false}
              onClick={isAuthor ? handleTogglePublic : undefined}
              style={isAuthor ? { cursor: 'pointer' } : {}}
              title={isAuthor ? 'Нажмите чтобы изменить' : ''}
            >
              {setData.isPublic !== false ? '🌍 Публичный' : '🔒 Приватный'}
              {isAuthor && ' (кликните для изменения)'}
            </VisibilityBadge>
          </SetMeta>
        </HeaderContent>
      </Header>

      <MainContent>
        <LeftColumn>
          {/* Список карточек */}
          <CardsSection>
            <Section style={{ marginBottom: 16 }}>
              <SectionTitle>
                🎴 Карточки ({flashcards.length})
              </SectionTitle>
            </Section>
            
            <CardsGrid>
              {flashcards.map((card, index) => {
                const cardIsChinese = card.isChinese || isChinese(card.term) || card.pinyin;
                
                return (
                  <FlashcardItem 
                    key={card._id || card.id || index} 
                    index={index}
                    $isChinese={cardIsChinese}
                  >
                    <div>
                      <CardTermHeader>
                        <CardTerm>
                          <CardNumber>{index + 1}</CardNumber>
                          {card.term}
                        </CardTerm>
                        {cardIsChinese && (
                          <ChineseBadge>🇨🇳 Китайский</ChineseBadge>
                        )}
                      </CardTermHeader>
                      
                      {/* Пиньинь для китайских карточек */}
                      {card.pinyin && (
                        <PinyinDisplay>
                          🔊 {card.pinyin}
                        </PinyinDisplay>
                      )}
                      
                      {/* Перевод для китайских карточек */}
                      {card.translation && (
                        <TranslationDisplay>
                          📖 {card.translation}
                        </TranslationDisplay>
                      )}
                    </div>
                    
                    {/* Изображение карточки */}
                    {card.imageUrl && (
                      <div style={{ margin: '8px 0' }}>
                        <CardImage
                          src={resolveImageUrl(card.imageUrl)} 
                          alt="" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    )}
                    
                    <CardDefinition>{card.definition}</CardDefinition>
                  </FlashcardItem>
                );
              })}
            </CardsGrid>

            {flashcards.length === 0 && (
              <Section style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>В этом наборе пока нет карточек</h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {isAuthor ? 'Добавьте карточки, чтобы начать обучение' : 'Автор ещё не добавил карточки'}
                </p>
              </Section>
            )}
          </CardsSection>
        </LeftColumn>

        <RightColumn>
          {/* Режимы обучения */}
          <Section>
            <SectionTitle>📚 Режимы обучения</SectionTitle>
            <StudyModesGrid>
              <StudyModeButton 
                primary
                onClick={() => navigateToLearn('flashcards')}
                disabled={flashcards.length === 0}
              >
                🎴 Карточки
              </StudyModeButton>
              <StudyModeButton 
                onClick={() => navigateToLearn('study')}
                disabled={flashcards.length === 0}
              >
                🎯 Заучивание
              </StudyModeButton>
              <StudyModeButton 
                onClick={() => navigateToLearn('write')}
                disabled={flashcards.length === 0}
              >
                ✍️ Письмо
              </StudyModeButton>
              <StudyModeButton 
                onClick={() => navigateToLearn('spell')}
                disabled={flashcards.length === 0}
              >
                🔊 Правописание
              </StudyModeButton>
              <StudyModeButton 
                $highlight
                onClick={() => navigateToLearn('modes')}
                disabled={flashcards.length === 0}
              >
                ✨ Все режимы
              </StudyModeButton>
            </StudyModesGrid>
          </Section>

          {/* Игры */}
          <Section>
            <SectionTitle>🎮 Игры</SectionTitle>
            <GamesGrid>
              <GameButton 
                gradient="#fbbf24, #f59e0b"
                onClick={() => navigateToGame('match')}
                disabled={flashcards.length === 0}
              >
                🎯 Подбор
              </GameButton>
              <GameButton 
                gradient="#60a5fa, #3b82f6"
                onClick={() => navigateToGame('gravity')}
                disabled={flashcards.length === 0}
              >
                🚀 Гравитация
              </GameButton>
            </GamesGrid>
          </Section>

          {/* Тест */}
          <Section>
            <SectionTitle>📝 Тестирование</SectionTitle>
            <TestButton 
              onClick={navigateToTest}
              disabled={flashcards.length === 0}
            >
              📝 Создать тест
            </TestButton>
          </Section>

          {/* Действия автора */}
          {isAuthor && (
            <Section>
              <SectionTitle>⚙️ Управление</SectionTitle>
              <AuthorActions>
                <EditButton onClick={() => navigate(`/sets/${id}/edit`)}>
                  ✏️ Редактировать
                </EditButton>
                <DeleteButton onClick={() => setShowDeleteModal(true)}>
                  🗑️ Удалить
                </DeleteButton>
              </AuthorActions>
            </Section>
          )}
        </RightColumn>
      </MainContent>

      {/* Социальные функции для публичных наборов */}
      {setData?.isPublic !== false && (
        <SocialFeatures 
          setId={id} 
          isOwner={user && setData?.userId?._id === user?._id}
          user={user}
        />
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>🗑️ Удалить набор?</ModalTitle>
            <ModalText>
              Вы уверены, что хотите удалить набор "{setData.title}"? 
              Это действие нельзя отменить.
            </ModalText>
            <ModalButtons>
              <ModalButton onClick={() => setShowDeleteModal(false)}>
                Отмена
              </ModalButton>
              <ModalButton danger onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Удаление...' : 'Удалить'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
}

export default SetDetail;
