import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';
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
  max-width: 700px;
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
  background: ${props => props.$isDark 
    ? 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' 
    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'};
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  
  .icon {
    font-size: 36px;
    transition: transform 0.3s ease;
  }
  
  .text h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: ${props => props.$isDark ? '#f9fafb' : '#92400e'};
  }
  
  .text p {
    margin: 4px 0 0 0;
    font-size: 14px;
    color: ${props => props.$isDark ? '#9ca3af' : '#a16207'};
  }
`;

const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'};
  color: ${props => props.$isDark ? '#f9fafb' : '#92400e'};
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)'};
    transform: rotate(90deg);
  }
`;

const TopThreeSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 16px;
  padding: 32px 28px;
  background: ${props => props.$isDark 
    ? 'linear-gradient(180deg, #111827 0%, #1f2937 100%)' 
    : 'linear-gradient(180deg, #fef3c7 0%, #fff 100%)'};
  position: relative;
  overflow: hidden;
`;

const TopUserCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  &.first {
    order: 2;
    transform: scale(1.15);
    z-index: 3;
  }
  
  &.second {
    order: 1;
    transform: translateY(20px);
    opacity: 0.9;
  }
  
  &.third {
    order: 3;
    transform: translateY(30px);
    opacity: 0.8;
  }
`;

const CrownIcon = styled.div`
  font-size: 32px;
  margin-bottom: 8px;
  transition: transform 0.2s ease;
  filter: drop-shadow(0 4px 8px rgba(251, 191, 36, 0.4));
`;

const TopUserAvatar = styled.div`
  width: ${props => props.$rank === 1 ? '80px' : '64px'};
  height: ${props => props.$rank === 1 ? '80px' : '64px'};
  border-radius: 50%;
  background: ${props => {
    if (props.$rank === 1) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    if (props.$rank === 2) return 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)';
    return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.$rank === 1 ? '36px' : '28px'};
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }
  
  &::after {
    content: '${props => props.$rank}';
    position: absolute;
    bottom: -8px;
    background: ${props => {
      if (props.$rank === 1) return '#fbbf24';
      if (props.$rank === 2) return '#9ca3af';
      return '#f97316';
    }};
    color: white;
    font-size: 12px;
    font-weight: 700;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }
`;

const TopUserInfo = styled.div`
  text-align: center;
  
  .username {
    font-size: ${props => props.$rank === 1 ? '16px' : '14px'};
    font-weight: 700;
    color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
    margin-bottom: 4px;
  }
  
  .level {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 13px;
    color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  }
  
  .xp {
    font-size: 12px;
    color: #f59e0b;
    font-weight: 600;
    margin-top: 4px;
  }
`;

const LeaderboardContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.$isDark ? '#1f2937' : '#f3f4f6'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.$isDark ? '#4b5563' : '#d1d5db'};
    border-radius: 4px;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 80px 100px;
  gap: 16px;
  padding: 16px 28px;
  background: ${props => props.$isDark ? '#111827' : '#f9fafb'};
  border-bottom: 1px solid ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
`;

const LeaderboardRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 80px 100px;
  gap: 16px;
  padding: 14px 28px;
  align-items: center;
  border-bottom: 1px solid ${props => props.$isDark ? '#374151' : '#f3f4f6'};
  background: ${props => props.$isCurrentUser 
    ? (props.$isDark ? 'rgba(99, 179, 237, 0.1)' : '#eff6ff') 
    : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$isDark ? '#374151' : '#f9fafb'};
  }
  
  ${props => props.$isCurrentUser && `
    border-left: 3px solid #63b3ed;
  `}
`;

const RankCell = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: ${props => {
    if (props.$rank === 1) return '#fbbf24';
    if (props.$rank === 2) return '#9ca3af';
    if (props.$rank === 3) return '#f97316';
    return props.$isDark ? '#9ca3af' : '#6b7280';
  }};
  display: flex;
  align-items: center;
  gap: 4px;
  
  ${props => props.$rank <= 3 && `
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `}
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }
  }
  
  .info {
    min-width: 0;
    
    .username {
      font-size: 14px;
      font-weight: 600;
      color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .you-badge {
      display: inline-block;
      font-size: 10px;
      background: #63b3ed;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      margin-top: 2px;
      font-weight: 600;
    }
  }
`;

const LevelCell = styled.div`
  display: flex;
  justify-content: center;
`;

const XpCell = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CurrentUserSection = styled.div`
  padding: 20px 28px;
  background: ${props => props.$isDark ? '#111827' : '#f9fafb'};
  border-top: 1px solid ${props => props.$isDark ? '#374151' : '#e5e7eb'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .info {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .text {
      .label {
        font-size: 12px;
        color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
        margin-bottom: 4px;
      }
      
      .position {
        font-size: 20px;
        font-weight: 700;
        color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
      }
    }
  }
  
  .stats {
    display: flex;
    gap: 24px;
    
    .stat {
      text-align: center;
      
      .value {
        font-size: 18px;
        font-weight: 700;
        color: ${props => props.$isDark ? '#f9fafb' : '#1a1a1a'};
      }
      
      .label {
        font-size: 11px;
        color: ${props => props.$isDark ? '#9ca3af' : '#6b7280'};
        text-transform: uppercase;
      }
    }
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

/**
 * Модальное окно лидерборда
 * Показывает топ-50 пользователей и позицию текущего пользователя
 */
function LeaderboardModal({ isOpen, onClose, isDark = false, currentUserId }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const DEFAULT_PROFILE_IMAGE = 'https://fluffycards.com/default-avatar.png';

  const isCustomProfileImage = (url) => {
    if (!url) return false;
    return !url.includes('default-avatar.png') && url !== DEFAULT_PROFILE_IMAGE;
  };

  const resolveProfileImage = (url) => {
    if (!isCustomProfileImage(url)) return '';
    if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
    return url;
  };

  const renderAvatar = (avatarUrl, fallback = '👤') => {
    const resolved = resolveProfileImage(avatarUrl);
    if (resolved) {
      return <img src={resolved} alt="Avatar" />;
    }
    return <span>{fallback}</span>;
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const url = `${API_ROUTES.GAMIFICATION}/leaderboard`;
      
      const response = await authFetch(url);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const normalized = (result.data || []).map((entry) => ({
            id: entry.userId || entry.id,
            username: entry.username,
            level: entry.level,
            totalXp: entry.totalXp,
            avatarUrl: entry.profileImage || entry.avatar
          }));
          setLeaderboard(normalized);
        } else {
          setLeaderboard([]);
        }
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };



  const topThree = leaderboard.slice(0, 3);
  const restOfList = leaderboard.slice(3);

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer $isDark={isDark} onClick={e => e.stopPropagation()}>
        <ModalHeader $isDark={isDark}>
          <HeaderTitle $isDark={isDark}>
            <span className="icon">🏆</span>
            <div className="text">
              <h2>Топ-50 игроков</h2>
              <p>Лучшие из лучших по XP</p>
            </div>
          </HeaderTitle>
          <CloseButton $isDark={isDark} onClick={onClose}>×</CloseButton>
        </ModalHeader>

        {loading ? (
          <LoadingState $isDark={isDark}>
            <div className="spinner" />
            <div className="text">Загрузка лидерборда...</div>
          </LoadingState>
        ) : (
          <>
            <TopThreeSection $isDark={isDark}>
              {topThree[1] && (
                <TopUserCard className="second">
                  <TopUserAvatar $rank={2}>
                    {renderAvatar(topThree[1].avatarUrl, topThree[1].username?.[0]?.toUpperCase())}
                  </TopUserAvatar>
                  <TopUserInfo $rank={2} $isDark={isDark}>
                    <div className="username">{topThree[1].username}</div>
                    <div className="level">
                      <LevelBadge level={topThree[1].level} size="small" />
                    </div>
                    <div className="xp">{topThree[1].totalXp?.toLocaleString() || 0} XP</div>
                  </TopUserInfo>
                </TopUserCard>
              )}
              
              {topThree[0] && (
                <TopUserCard className="first">
                  <CrownIcon>👑</CrownIcon>
                  <TopUserAvatar $rank={1}>
                    {renderAvatar(topThree[0].avatarUrl, topThree[0].username?.[0]?.toUpperCase())}
                  </TopUserAvatar>
                  <TopUserInfo $rank={1} $isDark={isDark}>
                    <div className="username">{topThree[0].username}</div>
                    <div className="level">
                      <LevelBadge level={topThree[0].level} size="small" />
                    </div>
                    <div className="xp">{topThree[0].totalXp?.toLocaleString() || 0} XP</div>
                  </TopUserInfo>
                </TopUserCard>
              )}
              
              {topThree[2] && (
                <TopUserCard className="third">
                  <TopUserAvatar $rank={3}>
                    {renderAvatar(topThree[2].avatarUrl, topThree[2].username?.[0]?.toUpperCase())}
                  </TopUserAvatar>
                  <TopUserInfo $rank={3} $isDark={isDark}>
                    <div className="username">{topThree[2].username}</div>
                    <div className="level">
                      <LevelBadge level={topThree[2].level} size="small" />
                    </div>
                    <div className="xp">{topThree[2].totalXp?.toLocaleString() || 0} XP</div>
                  </TopUserInfo>
                </TopUserCard>
              )}
            </TopThreeSection>

            <LeaderboardContent $isDark={isDark}>
              <TableHeader $isDark={isDark}>
                <span>Место</span>
                <span>Игрок</span>
                <span style={{ textAlign: 'center' }}>Уровень</span>
                <span>XP</span>
              </TableHeader>

              <LeaderboardList>
                {restOfList.map((user, index) => {
                  const rank = index + 4;
                  const isCurrentUser = user.id === currentUserId || user.id === 'me';
                  
                  return (
                    <LeaderboardRow 
                      key={user.id} 
                      $isCurrentUser={isCurrentUser}
                      $isDark={isDark}
                    >
                      <RankCell $rank={rank}>
                        {rank <= 10 && '🏅'}
                        {rank > 10 && rank}
                      </RankCell>
                      <UserCell $isDark={isDark}>
                        <div className="avatar">
                          {renderAvatar(user.avatarUrl, user.username?.[0]?.toUpperCase())}
                        </div>
                        <div className="info">
                          <div className="username">{user.username}</div>
                          {isCurrentUser && <span className="you-badge">ВЫ</span>}
                        </div>
                      </UserCell>
                      <LevelCell>
                        <LevelBadge level={user.level} size="small" />
                      </LevelCell>
                      <XpCell>
                        <span>⭐</span>
                        {user.totalXp?.toLocaleString() || 0}
                      </XpCell>
                    </LeaderboardRow>
                  );
                })}
              </LeaderboardList>
            </LeaderboardContent>

            {currentUser && (
              <CurrentUserSection $isDark={isDark}>
                <div className="info">
                  <LevelBadge level={currentUser.level} size="medium" animated />
                  <div className="text">
                    <div className="label">Ваша позиция</div>
                    <div className="position">#{currentUser.rank}</div>
                  </div>
                </div>
                <div className="stats">
                  <div className="stat">
                    <div className="value">{currentUser.level}</div>
                    <div className="label">Уровень</div>
                  </div>
                  <div className="stat">
                    <div className="value" style={{ color: '#f59e0b' }}>
                      {currentUser.totalXp?.toLocaleString() || 0}
                    </div>
                    <div className="label">XP</div>
                  </div>
                </div>
              </CurrentUserSection>
            )}
          </>
        )}
      </ModalContainer>
    </Overlay>
  );
}

export default LeaderboardModal;
