import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { API_ROUTES, authFetch } from '../constants/api';
import LevelBadge from './LevelBadge';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: all 0.3s ease;
  padding: 20px;
`;

const ModalContainer = styled.div`
  background: ${props => props.$isDark ? '#1f2937' : 'white'};
  border-radius: 20px;
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  background: ${props => props.$isDark ? '#111827' : '#f9fafb'};
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  .icon {
    font-size: 32px;
    transition: transform 0.2s ease;
  }
  
  .text h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
  }
  
  .text p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  }
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  color: ${props => props.$isDark ? '#f9fafb' : '#374151'};
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isDark ? '#4b5563' : '#d1d5db'};
    transform: rotate(90deg);
  }
`;

const ProgressSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 28px;
  background: ${props => props.$isDark ? '#111827' : '#f3f4f6'};
  border-bottom: 1px solid ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .value {
      font-size: 24px;
      font-weight: 700;
      color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
    }
    
    .label {
      font-size: 13px;
      color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
    }
  }
  
  .divider {
    width: 1px;
    height: 30px;
    background: ${props => props.$isDark ? '#374151' : '#d1d5db'};
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px 28px;
  border-bottom: 1px solid ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$isDark ? '#4b5563' : '#d1d5db'};
    border-radius: 2px;
  }
`;

const CategoryTab = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' 
    : props.$isDark ? '#374151' : '#f3f4f6'};
  color: ${props => props.$active ? 'white' : props.$isDark ? '#d1d5db' : '#6b7280'};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)' 
      : props.$isDark ? '#4b5563' : '#e5e7eb'};
  }
  
  .count {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : props.$isDark ? '#1f2937' : 'white'};
  }
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.$isDark ? '#1f2937' : '#f3f4f6'};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$isDark ? '#4b5563' : '#d1d5db'};
    border-radius: 4px;
  }
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
`;

const AchievementCard = styled.div`
  background: ${props => props.$isDark ? '#374151' : '#f9fafb'};
  border-radius: 16px;
  padding: 20px;
  border: 2px solid ${props => {
    if (props.$unlocked) {
      if (props.$rarity === 'legendary') return '#fbbf24';
      if (props.$rarity === 'epic') return '#a78bfa';
      if (props.$rarity === 'rare') return '#60a5fa';
      return '#22c55e';
    }
    return props.$isDark ? '#4b5563' : '#e5e7eb';
  }};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${props => props.$unlocked ? 1 : 0.6};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
  
  ${props => props.$unlocked && props.$rarity === 'legendary' && `
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        120deg,
        transparent 30%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 70%
      );
      transition: all 0.3s ease;
    }
  `}
`;

const AchievementIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${props => {
    if (!props.$unlocked) return props.$isDark ? '#4b5563' : '#e5e7eb';
    switch (props.$rarity) {
      case 'legendary': return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      case 'epic': return 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)';
      case 'rare': return 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
      default: return 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
  position: relative;
  filter: ${props => props.$unlocked ? 'none' : 'grayscale(100%)'};
  
  ${props => props.$unlocked && props.$rarity === 'legendary' && `
    transition: transform 0.2s ease;
    box-shadow: 0 4px 16px rgba(251, 191, 36, 0.4);
  `}
`;

const LockOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  font-size: 24px;
`;

const AchievementInfo = styled.div`
  position: relative;
  z-index: 1;
  
  .name {
    font-size: 15px;
    font-weight: 700;
    color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .rarity-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  
  .description {
    font-size: 13px;
    color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
    line-height: 1.4;
    margin-bottom: 12px;
  }
`;

const RarityBadge = styled.span`
  background: ${props => {
    switch (props.$rarity) {
      case 'legendary': return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
      case 'epic': return 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)';
      case 'rare': return 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)';
      default: return '#22c55e';
    }
  }};
  color: white;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${props => props.$isDark ? '#4b5563' : '#e5e7eb'};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    switch (props.$rarity) {
      case 'legendary': return 'linear-gradient(90deg, #fbbf24, #f59e0b)';
      case 'epic': return 'linear-gradient(90deg, #a78bfa, #8b5cf6)';
      case 'rare': return 'linear-gradient(90deg, #60a5fa, #3b82f6)';
      default: return 'linear-gradient(90deg, #22c55e, #16a34a)';
    }
  }};
  border-radius: 4px;
  transition: width 0.6s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  display: flex;
  justify-content: space-between;
  
  .reward {
    color: #f59e0b;
    font-weight: 600;
  }
`;

const UnlockedBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #22c55e;
  font-weight: 600;
  
  .date {
    color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
    font-weight: 400;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  
  .icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 8px 0;
    color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
    font-size: 18px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  gap: 16px;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid ${props => props.$isDark ? '#374151' : '#f3f4f6'};
    border-top-color: #63b3ed;
    border-radius: 50%;
  }
  
  .text {
    color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
    font-size: 14px;
  }
`;

const categories = [
  { id: 'all', name: 'Все', icon: '🏆' },
  { id: 'study', name: 'Обучение', icon: '📚' },
  { id: 'tests', name: 'Тесты', icon: '📝' },
  { id: 'games', name: 'Игры', icon: '🎮' },
  { id: 'streak', name: 'Streak', icon: '🔥' },
];

const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };

/**
 * Модальное окно достижений
 * Показывает все достижения с прогрессом и категориями
 */
function AchievementsModal({ isOpen, onClose, isDark = false }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [stats, setStats] = useState({ total: 0, unlocked: 0, points: 0 });

  useEffect(() => {
    if (isOpen) {
      fetchAchievements();
    }
  }, [isOpen]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const url = `${API_ROUTES.GAMIFICATION}/achievements`;
      
      const response = await authFetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAchievements(result.data.achievements || []);
          setStats(result.data.stats || { total: 0, unlocked: 0, points: 0 });
        } else {
          // Empty state if no data
          setAchievements([]);
          setStats({ total: 0, unlocked: 0, points: 0 });
        }
      } else {
        // Empty state on error
        setAchievements([]);
        setStats({ total: 0, unlocked: 0, points: 0 });
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      // Empty state on error - no demo data
      setAchievements([]);
      setStats({ total: 0, unlocked: 0, points: 0 });
    } finally {
      setLoading(false);
    }
  };



  const filteredAchievements = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === activeCategory);

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    // Сначала разблокированные, потом по редкости
    if (a.unlocked !== b.unlocked) return b.unlocked - a.unlocked;
    return rarityOrder[b.rarity] - rarityOrder[a.rarity];
  });

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return achievements.length;
    return achievements.filter(a => a.category === categoryId).length;
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer $isDark={isDark} onClick={e => e.stopPropagation()}>
        <ModalHeader $isDark={isDark}>
          <HeaderTitle $isDark={isDark}>
            <span className="icon">🏆</span>
            <div className="text">
              <h2>Достижения</h2>
              <p>Разблокируйте все награды и станьте легендой!</p>
            </div>
          </HeaderTitle>
          <CloseButton $isDark={isDark} onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ProgressSummary $isDark={isDark}>
          <div className="stat">
            <LevelBadge level={Math.floor((stats.points || 0) / 100) + 1} size="small" />
            <div>
              <div className="value">{stats.unlocked || 0}/{stats.total || 0}</div>
              <div className="label">Разблокировано</div>
            </div>
          </div>
          <div className="divider" />
          <div className="stat">
            <div className="value" style={{ color: '#f59e0b' }}>{(stats.points || 0).toLocaleString()}</div>
            <div className="label">⭐ Очков</div>
          </div>
          <div className="divider" />
          <div className="stat">
            <div className="value" style={{ color: '#22c55e' }}>
              {stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0}%
            </div>
            <div className="label">Прогресс</div>
          </div>
        </ProgressSummary>

        <CategoryTabs $isDark={isDark}>
          {categories.map(cat => (
            <CategoryTab
              key={cat.id}
              $active={activeCategory === cat.id}
              $isDark={isDark}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="count">{getCategoryCount(cat.id)}</span>
            </CategoryTab>
          ))}
        </CategoryTabs>

        <ContentArea $isDark={isDark}>
          {loading ? (
            <LoadingState $isDark={isDark}>
              <div className="spinner" />
              <div className="text">Загрузка достижений...</div>
            </LoadingState>
          ) : sortedAchievements.length === 0 ? (
            <EmptyState $isDark={isDark}>
              <div className="icon">📭</div>
              <h3>Нет достижений в этой категории</h3>
              <p>Продолжайте учиться, чтобы разблокировать больше наград!</p>
            </EmptyState>
          ) : (
            <AchievementsGrid>
              {sortedAchievements.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  $unlocked={achievement.unlocked}
                  $rarity={achievement.rarity}
                  $isDark={isDark}
                >
                  <AchievementIcon 
                    $unlocked={achievement.unlocked}
                    $rarity={achievement.rarity}
                    $isDark={isDark}
                  >
                    {achievement.icon}
                    {!achievement.unlocked && (
                      <LockOverlay>🔒</LockOverlay>
                    )}
                  </AchievementIcon>

                  <AchievementInfo $isDark={isDark}>
                    <div className="name">
                      {achievement.name}
                      <RarityBadge 
                        className="rarity-badge"
                        $rarity={achievement.rarity}
                      >
                        {achievement.rarity === 'legendary' && '★★★'}
                        {achievement.rarity === 'epic' && '★★'}
                        {achievement.rarity === 'rare' && '★'}
                        {achievement.rarity === 'common' && '○'}
                      </RarityBadge>
                    </div>
                    <div className="description">{achievement.description}</div>
                    
                    {achievement.unlocked ? (
                      <UnlockedBadge $isDark={isDark}>
                        <span>✅</span>
                        <span>Разблокировано</span>
                        {achievement.unlockedAt && !isNaN(new Date(achievement.unlockedAt).getTime()) && (
                          <span className="date">
                            {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </UnlockedBadge>
                    ) : (
                      <>
                        <ProgressBar $isDark={isDark}>
                          <ProgressFill 
                            $rarity={achievement.rarity}
                            style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </ProgressBar>
                        <ProgressText $isDark={isDark}>
                          <span>{achievement.progress} / {achievement.target}</span>
                          <span className="reward">+{achievement.reward} ⭐</span>
                        </ProgressText>
                      </>
                    )}
                  </AchievementInfo>
                </AchievementCard>
              ))}
            </AchievementsGrid>
          )}
        </ContentArea>
      </ModalContainer>
    </Overlay>
  );
}

export default AchievementsModal;
