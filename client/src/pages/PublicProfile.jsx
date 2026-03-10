import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_ROUTES, authFetch, FILE_BASE_URL } from '../constants/api';

const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const ProfileCard = styled.div`
  background: var(--card-bg, var(--bg-secondary));
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(0, 0, 0, 0.1));
  margin-bottom: 1.5rem;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
  @media (max-width: 600px) { flex-direction: column; text-align: center; }
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  flex-shrink: 0;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const AvatarInfo = styled.div`flex: 1;`;

const UserName = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

const UserRole = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${p => p.$role === 'teacher' ? '#fef3c7' : '#e0f2fe'};
  color: ${p => p.$role === 'teacher' ? '#92400e' : '#0369a1'};
`;

const LevelBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  font-weight: 700;
  font-size: 0.85rem;
`;

const StreakBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-weight: 700;
  font-size: 0.85rem;
`;

const XpBarContainer = styled.div`margin-top: 0.75rem; max-width: 300px;`;

const XpBarBg = styled.div`
  width: 100%;
  height: 10px;
  background: var(--bg-tertiary, #e2e8f0);
  border-radius: 5px;
  overflow: hidden;
`;

const XpBarFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #63b3ed, #4299e1);
  border-radius: 5px;
  transition: width 0.5s ease;
  width: ${p => p.$pct}%;
`;

const XpLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-color, #e2e8f0);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  background: var(--bg-tertiary, #f0f9ff);
  padding: 1.25rem;
  border-radius: 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #63b3ed;
`;

const StatLabel = styled.div`
  color: var(--text-secondary, #718096);
  font-size: 0.85rem;
  margin-top: 0.25rem;
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(99, 179, 237, 0.4);
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

const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const SetCard = styled.div`
  background: var(--bg-tertiary, #f7fafc);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--border-color, #e2e8f0);
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow-color, rgba(0,0,0,0.1));
  }
  h4 { margin: 0 0 0.5rem 0; color: var(--text-primary, #2d3748); }
  .meta {
    color: var(--text-secondary, #718096);
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

const SaveSetBtn = styled.button`
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(72,187,120,0.4); }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const PrivateProfileNotice = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  .icon { font-size: 4rem; margin-bottom: 1rem; }
  h3 { font-size: 1.3rem; color: var(--text-primary); margin-bottom: 0.5rem; }
  p { color: var(--text-secondary); font-size: 0.95rem; }
`;

const AchievementsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 1rem;
`;

const AchBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  background: var(--bg-tertiary, #fef3c7);
  font-size: 0.85rem;
  .icon { font-size: 1.3rem; }
  .name { font-weight: 600; color: var(--text-primary); }
`;

const FollowButton = styled.button`
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${p => p.$following ? '#e2e8f0' : '#4299e1'};
  background: ${p => p.$following ? 'var(--bg-secondary, #f7fafc)' : 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
  color: ${p => p.$following ? 'var(--text-secondary)' : 'white'};
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
`;

const FollowStats = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
`;

const FollowStat = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  &:hover { color: #4299e1; }
  strong { color: var(--text-primary); font-weight: 700; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalCard = styled.div`
  background: var(--card-bg, #fff);
  border-radius: 20px;
  padding: 1.5rem;
  max-width: 420px;
  width: 100%;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
`;

const ModalTitle = styled.h3`
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
`;

const FollowerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  cursor: pointer;
  &:hover { opacity: 0.8; }
  &:last-child { border-bottom: none; }
`;

const FollowerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed, #4299e1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const FollowerName = styled.div`
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
`;

const CloseBtn = styled.button`
  background: var(--bg-secondary, #f0f0f0);
  border: none;
  padding: 8px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
  &:hover { opacity: 0.8; }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #48bb78;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(72,187,120,0.4);
  z-index: 999;
`;

function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [stats, setStats] = useState({ setsCreated: 0, cardsStudied: 0, testsPassed: 0, streakDays: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [savingSet, setSavingSet] = useState({});
  const [toast, setToast] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(null); // 'followers' | 'following' | null
  const [followersList, setFollowersList] = useState([]);

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

  useEffect(() => { fetchUserProfile(); fetchFollowStatus(); }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userRes = await authFetch(`${API_ROUTES.SOCIAL}/users/${userId}`);
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error('Пользователь не найден');
        throw new Error('Ошибка загрузки профиля');
      }
      const userData = await userRes.json();
      const userObj = userData.data || userData;
      setUser(userObj);
      const profilePublic = userObj.isProfilePublic !== false;
      setIsProfilePublic(profilePublic);
      
      const statsRes = await authFetch(`${API_ROUTES.SOCIAL}/users/${userId}/stats`);
      if (statsRes.ok) {
        const sd = await statsRes.json();
        setStats(sd.data || stats);
      }

      // Gamification data
      try {
        const gRes = await authFetch(`${API_ROUTES.SOCIAL}/users/${userId}/gamification`);
        if (gRes.ok) {
          const gd = await gRes.json();
          setGamification(gd.data || null);
        }
      } catch(e) { /* unavailable */ }

      if (profilePublic) {
        const setsRes = await authFetch(`${API_ROUTES.DATA.SETS}/public?userId=${userId}`);
        if (setsRes.ok) {
          const sd = await setsRes.json();
          setUserSets(sd.data || []);
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSet = async (setId, e) => {
    e.stopPropagation();
    setSavingSet(prev => ({ ...prev, [setId]: true }));
    try {
      const res = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}/clone`, { method: 'POST' });
      setToast(res.ok ? 'Набор сохранён в вашу библиотеку! ✅' : 'Набор добавлен ✅');
      setTimeout(() => setToast(null), 3000);
    } catch(err) { console.error(err); }
    finally { setSavingSet(prev => ({ ...prev, [setId]: false })); }
  };

  const fetchFollowStatus = async () => {
    try {
      const res = await authFetch(`${API_ROUTES.SOCIAL}/follow/${userId}/status`);
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.data.isFollowing);
        setFollowersCount(data.data.followersCount);
        setFollowingCount(data.data.followingCount);
      }
    } catch (e) { /* ignore */ }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await authFetch(`${API_ROUTES.SOCIAL}/follow/${userId}`, { method: 'DELETE' });
        setIsFollowing(false);
        setFollowersCount(c => c - 1);
      } else {
        await authFetch(`${API_ROUTES.SOCIAL}/follow/${userId}`, { method: 'POST' });
        setIsFollowing(true);
        setFollowersCount(c => c + 1);
      }
    } catch(e) { console.error(e); }
    finally { setFollowLoading(false); }
  };

  const openFollowModal = async (type) => {
    setShowFollowersModal(type);
    try {
      const res = await authFetch(`${API_ROUTES.SOCIAL}/follow/${userId}/${type}`);
      if (res.ok) {
        const data = await res.json();
        setFollowersList(data.data || []);
      }
    } catch(e) { setFollowersList([]); }
  };

  const level = gamification?.level || user?.level || 1;
  const xp = gamification?.xp || 0;
  const totalXp = gamification?.totalXp || user?.totalXp || 0;
  const xpForNext = gamification?.xpForNextLevel || 100;
  const xpPct = xpForNext > 0 ? Math.min(100, Math.round((xp / xpForNext) * 100)) : 0;
  const achievements = gamification?.achievements || [];
  const streak = gamification?.streak?.current || stats.streakDays || 0;

  if (loading) return <Container><div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Загрузка...</div></Container>;
  if (error) return <Container><BackButton onClick={() => navigate(-1)}>← Назад</BackButton><ErrorMessage><h3>😕 Ошибка</h3><p>{error}</p></ErrorMessage></Container>;
  if (!user) return <Container><BackButton onClick={() => navigate(-1)}>← Назад</BackButton><ErrorMessage><h3>😕 Пользователь не найден</h3></ErrorMessage></Container>;

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
      
      <ProfileCard>
        <AvatarSection>
          <Avatar>
            {isCustomProfileImage(user.profileImage) ? (
              <AvatarImage src={resolveProfileImage(user.profileImage)} alt="Avatar" />
            ) : (
              user.username?.[0]?.toUpperCase() || '👤'
            )}
          </Avatar>
          <AvatarInfo>
            <UserName>
              {user.username || 'Пользователь'}
              <LevelBadge>⭐ Ур. {level}</LevelBadge>
              {streak > 0 && <StreakBadge>🔥 {streak} дн.</StreakBadge>}
            </UserName>
            <UserRole $role={user.role}>
              {user.role === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик'}
            </UserRole>
            <FollowStats>
              <FollowStat onClick={() => openFollowModal('followers')}>
                <strong>{followersCount}</strong> подписчиков
              </FollowStat>
              <FollowStat onClick={() => openFollowModal('following')}>
                <strong>{followingCount}</strong> подписок
              </FollowStat>
            </FollowStats>
            {isProfilePublic && (
              <XpBarContainer>
                <XpBarBg><XpBarFill $pct={xpPct} /></XpBarBg>
                <XpLabel>{xp} / {xpForNext} XP • Всего: {totalXp} XP</XpLabel>
              </XpBarContainer>
            )}
          </AvatarInfo>
          <FollowButton $following={isFollowing} onClick={handleFollow} disabled={followLoading}>
            {isFollowing ? '✓ Подписан' : '+ Подписаться'}
          </FollowButton>
        </AvatarSection>
      </ProfileCard>

      {!isProfilePublic ? (
        <>
          <ProfileCard>
            <PrivateProfileNotice>
              <div className="icon">🔒</div>
              <h3>Профиль закрыт</h3>
              <p>Часть информации доступна, но подробная статистика и наборы скрыты</p>
            </PrivateProfileNotice>
          </ProfileCard>
          <ProfileCard>
            <SectionTitle>📊 Частичная информация</SectionTitle>
            <StatsGrid>
              <StatCard><StatValue>{level}</StatValue><StatLabel>Уровень</StatLabel></StatCard>
              <StatCard><StatValue>{stats.cardsStudied || 0}</StatValue><StatLabel>Карточек изучено</StatLabel></StatCard>
              <StatCard><StatValue>{streak}</StatValue><StatLabel>Дней подряд</StatLabel></StatCard>
            </StatsGrid>
          </ProfileCard>
        </>
      ) : (
        <>
          <ProfileCard>
            <SectionTitle>📊 Полная статистика</SectionTitle>
            <StatsGrid>
              <StatCard><StatValue>{level}</StatValue><StatLabel>Уровень</StatLabel></StatCard>
              <StatCard><StatValue>{stats.setsCreated || 0}</StatValue><StatLabel>Наборов</StatLabel></StatCard>
              <StatCard><StatValue>{stats.cardsStudied || 0}</StatValue><StatLabel>Карточек</StatLabel></StatCard>
              <StatCard><StatValue>{stats.testsPassed || 0}</StatValue><StatLabel>Тестов</StatLabel></StatCard>
              <StatCard><StatValue>{streak}</StatValue><StatLabel>Серия дней</StatLabel></StatCard>
              <StatCard><StatValue>{totalXp}</StatValue><StatLabel>Всего XP</StatLabel></StatCard>
            </StatsGrid>
          </ProfileCard>

          {achievements.length > 0 && (
            <ProfileCard>
              <SectionTitle>🏆 Достижения ({achievements.length})</SectionTitle>
              <AchievementsRow>
                {achievements.map((a, i) => (
                  <AchBadge key={i}>
                    <span className="icon">{a.icon || '🏆'}</span>
                    <span className="name">{a.name}</span>
                  </AchBadge>
                ))}
              </AchievementsRow>
            </ProfileCard>
          )}

          <ProfileCard>
            <SectionTitle>📚 Публичные наборы ({userSets.length})</SectionTitle>
            {userSets.length > 0 ? (
              <SetsGrid>
                {userSets.map(set => (
                  <SetCard key={set._id} onClick={() => navigate(`/set/${set._id}`)}>
                    <h4>{set.title}</h4>
                    <div className="meta">
                      <span>📝 {set.flashcards?.length || set.cards?.length || 0} терминов</span>
                      <SaveSetBtn onClick={(e) => handleSaveSet(set._id, e)} disabled={savingSet[set._id]}>
                        {savingSet[set._id] ? '⏳...' : '💾 Сохранить'}
                      </SaveSetBtn>
                    </div>
                    {set.tags?.length > 0 && (
                      <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {set.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </SetCard>
                ))}
              </SetsGrid>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                У пользователя пока нет публичных наборов
              </div>
            )}
          </ProfileCard>
        </>
      )}

      {toast && <Toast>{toast}</Toast>}

      {showFollowersModal && (
        <ModalOverlay onClick={() => setShowFollowersModal(null)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>
              {showFollowersModal === 'followers' ? `Подписчики (${followersCount})` : `Подписки (${followingCount})`}
            </ModalTitle>
            {followersList.length > 0 ? followersList.map(u => (
              <FollowerItem key={u._id} onClick={() => { setShowFollowersModal(null); navigate(`/profile/${u._id}`); }}>
                <FollowerAvatar>
                  {isCustomProfileImage(u.profileImage) ? (
                    <img src={resolveProfileImage(u.profileImage)} alt="" />
                  ) : u.username?.[0]?.toUpperCase() || '👤'}
                </FollowerAvatar>
                <div>
                  <FollowerName>{u.username}</FollowerName>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>⭐ Ур. {u.level || 1}</div>
                </div>
              </FollowerItem>
            )) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                {showFollowersModal === 'followers' ? 'Пока нет подписчиков' : 'Пока нет подписок'}
              </div>
            )}
            <CloseBtn onClick={() => setShowFollowersModal(null)}>Закрыть</CloseBtn>
          </ModalCard>
        </ModalOverlay>
      )}
    </Container>
  );
}

export default PublicProfile;
