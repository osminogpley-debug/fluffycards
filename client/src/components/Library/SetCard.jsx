import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../../constants/api';

// SaveButton must be defined first since CardContainer references it
const SaveButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(-10px);
  z-index: 100;
  pointer-events: auto;

  &:hover {
    transform: translateY(0) scale(1.05);
    box-shadow: 0 6px 20px rgba(74, 222, 128, 0.4);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  &:disabled {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
  }

  .icon {
    font-size: 1rem;
  }
`;

const SuccessMessage = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(74, 222, 128, 0.3);
  transition: all 0.3s ease;
  z-index: 10;
`;

const CardContainer = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: visible;
  border: 2px solid var(--border-color);
  cursor: pointer;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 15px 40px rgba(99, 179, 237, 0.2);
    border-color: #63b3ed;
  }

  &:hover ${SaveButton} {
    opacity: 1;
    transform: translateY(0);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #63b3ed, #90cdf4, #63b3ed);
    background-size: 200% auto;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
  line-height: 1.3;
  flex: 1;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #d97706;
`;

const Description = styled.p`
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: ${props => {
    const colors = {
      'Языки': '#e0f2fe',
      'Наука': '#dcfce7',
      'История': '#fef3c7',
      'Математика': '#f3e8ff',
      'Искусство': '#ffe4e6',
      'Технологии': '#e0e7ff',
      'Литература': '#ffedd5'
    };
    return colors[props.$category] || 'var(--bg-tertiary)';
  }};
  color: ${props => {
    const colors = {
      'Языки': '#0369a1',
      'Наука': '#16a34a',
      'История': '#d97706',
      'Математика': '#9333ea',
      'Искусство': '#e11d48',
      'Технологии': '#4338ca',
      'Литература': '#ea580c'
    };
    return colors[props.$category] || 'var(--text-secondary)';
  }};
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const PreviewContainer = styled.div`
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 10px;
  display: block;
  margin-bottom: 0.75rem;
`;

const PreviewTitle = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const PreviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border-color);
  font-size: 0.85rem;
  color: var(--text-secondary);

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    font-weight: 500;
  }

  span:last-child {
    color: #718096;
    font-style: italic;
  }
`;

const MoreCards = styled.div`
  text-align: center;
  font-size: 0.8rem;
  color: #63b3ed;
  margin-top: 0.5rem;
  font-weight: 500;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(99, 179, 237, 0.3);
`;

const AuthorName = styled.span`
  font-size: 0.9rem;
  color: #4a5568;
  font-weight: 500;
`;

const CardCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #718096;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 10px;
`;

const PopularityBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
  color: #92400e;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 10px rgba(251, 191, 36, 0.3);
`;

function SetCard({ set, isPopular = false, onSave, showSaveButton = true }) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAuthorClick = (e) => {
    e.stopPropagation();
    if (set.owner?._id) {
      navigate(`/users/${set.owner._id}`);
    }
  };

  // Используем flashcards из БД (не cards)
  const previewCards = set.flashcards?.slice(0, 3) || [];
  const cardCount = set.flashcards?.length || 0;
  const remainingCards = cardCount - previewCards.length;

  const coverImage = set.coverImage?.startsWith('/uploads/')
    ? `${FILE_BASE_URL}${set.coverImage}`
    : set.coverImage;

  const handleSave = async (e) => {
    console.log('[SetCard] Save button clicked!');
    
    e.preventDefault();
    e.stopPropagation();
    
    if (isSaving || isSaved) {
      console.log('[SetCard] Already saving or saved, skipping');
      return;
    }

    // Получаем ID набора (поддержка _id или id)
    const setId = set._id;
    console.log('[SetCard] Set ID:', setId, 'Set object:', set);
    
    if (!setId) {
      console.error('[SetCard] No set ID found:', set);
      setError('Ошибка: ID набора не найден');
      return;
    }

    setIsSaving(true);
    setError(null);

    const url = `${API_ROUTES.DATA.SETS}/${setId}/copy`;
    console.log('[SetCard] Saving set to:', url);

    try {
      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('[SetCard] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[SetCard] Error response:', errorData);
        throw new Error(errorData.message || 'Ошибка сохранения набора');
      }

      const result = await response.json();
      console.log('[SetCard] Success:', result);
      setIsSaved(true);
      
      // Вызываем коллбэк если передан
      if (onSave) {
        onSave(result.data);
      }

      // Сбрасываем статус через 3 секунды
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('[SetCard] Error saving set:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCardClick = () => {
    const setId = set._id;
    if (setId) {
      navigate(`/sets/${setId}`);
    }
  };

  return (
    <CardContainer onClick={handleCardClick}>
      {showSaveButton && (
        <>
          {error ? (
            <SuccessMessage style={{ background: 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)' }}>
              ❌ {error}
            </SuccessMessage>
          ) : isSaved ? (
            <SuccessMessage>
              ✅ Сохранено!
            </SuccessMessage>
          ) : (
            <SaveButton 
              type="button"
              onClick={handleSave} 
              disabled={isSaving}
              title="Сохранить в мои наборы"
            >
              <span className="icon">💾</span>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </SaveButton>
          )}
        </>
      )}
      
      {isPopular && (
        <PopularityBadge>
          🔥 Популярно
        </PopularityBadge>
      )}
      
      <CardHeader>
        <Title>{set.title}</Title>
        <Rating>
          ⭐ {set.averageRating?.toFixed(1) || '0.0'}
        </Rating>
      </CardHeader>

      <Description>{set.description}</Description>

      <TagsContainer>
        {set.tags?.map((tag, index) => (
          <Tag key={index} $category={tag}>
            {tag}
          </Tag>
        ))}
      </TagsContainer>

      <PreviewContainer>
        {coverImage && <PreviewImage src={coverImage} alt="cover" />}
        <PreviewTitle>
          🎴 Предпросмотр
        </PreviewTitle>
        {previewCards.map((card, index) => (
          <PreviewItem key={index}>
            <span>{card.term}</span>
            <span>{card.definition?.substring(0, 30)}{card.definition?.length > 30 ? '...' : ''}</span>
          </PreviewItem>
        ))}
        {remainingCards > 0 && (
          <MoreCards>
            +{remainingCards} карточек 🌟
          </MoreCards>
        )}
      </PreviewContainer>

      <CardFooter>
        <AuthorInfo onClick={handleAuthorClick} title="Перейти в профиль">
          <Avatar>
            {set.owner?.profileImage ? (
              <img 
                src={set.owner.profileImage} 
                alt="avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              set.owner?.username?.[0]?.toUpperCase() || '👤'
            )}
          </Avatar>
          <AuthorName>{set.owner?.username || '👤 Аноним'}</AuthorName>
        </AuthorInfo>
        <CardCount>
          📝 {cardCount} карт
        </CardCount>
      </CardFooter>

    </CardContainer>
  );
}

export default SetCard;
