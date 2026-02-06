import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_ROUTES, authFetch } from '../constants/api';

const Container = styled.div`
  max-width: 800px;
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
  margin-bottom: 2rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
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
`;

const AvatarInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const UserRole = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.$role === 'teacher' ? '#fef3c7' : '#e0f2fe'};
  color: ${props => props.$role === 'teacher' ? '#92400e' : '#0369a1'};
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #63b3ed;
`;

const StatLabel = styled.div`
  color: var(--text-secondary, #718096);
  font-size: 0.9rem;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary, #2d3748);
  }
  
  .meta {
    color: var(--text-secondary, #718096);
    font-size: 0.85rem;
  }
`;

const PrivateProfileNotice = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  
  .icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    font-size: 1.3rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  p {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
`;

function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [stats, setStats] = useState({
    setsCreated: 0,
    cardsStudied: 0,
    testsPassed: 0,
    streakDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Получаем данные пользователя
      const userRes = await authFetch(`${API_ROUTES.SOCIAL}/users/${userId}`);
      if (!userRes.ok) {
        if (userRes.status === 404) {
          throw new Error('Пользователь не найден');
        }
        throw new Error('Ошибка загрузки профиля');
      }
      const userData = await userRes.json();
      const userObj = userData.data || userData;
      setUser(userObj);
      
      // Проверяем, открыт ли профиль
      const profilePublic = userObj.isProfilePublic !== false;
      setIsProfilePublic(profilePublic);
      
      // Получаем статистику пользователя (частичная видимость даже при закрытом профиле)
      const statsRes = await authFetch(`${API_ROUTES.SOCIAL}/users/${userId}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data || stats);
      }

      // Загружаем публичные наборы только для открытых профилей
      if (profilePublic) {
        const setsRes = await authFetch(`${API_ROUTES.DATA.SETS}/public?userId=${userId}`);
        if (setsRes.ok) {
          const setsData = await setsRes.json();
          setUserSets(setsData.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
        <ErrorMessage>
          <h3>😕 Ошибка</h3>
          <p>{error}</p>
        </ErrorMessage>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <BackButton onClick={() => navigate(-1)}>← Назад</BackButton>
        <ErrorMessage>
          <h3>😕 Пользователь не найден</h3>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>|← Назад</BackButton>
      
      <ProfileCard>
        <AvatarSection>
          <Avatar>{user.username?.[0]?.toUpperCase() || '👤'}</Avatar>
          <AvatarInfo>
            <UserName>{user.username || 'Пользователь'}</UserName>
            <UserRole $role={user.role}>
              {user.role === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик'}
            </UserRole>
          </AvatarInfo>
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
              <StatCard>
                <StatValue>{user?.level || 1}</StatValue>
                <StatLabel>Уровень</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.cardsStudied || 0}</StatValue>
                <StatLabel>Карточек изучено</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.streakDays || 0}</StatValue>
                <StatLabel>Дней подряд</StatLabel>
              </StatCard>
            </StatsGrid>
          </ProfileCard>
        </>
      ) : (
        <>
          <ProfileCard>
            <SectionTitle>📊 Статистика</SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatValue>{stats.setsCreated || 0}</StatValue>
                <StatLabel>Наборов создано</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.cardsStudied || 0}</StatValue>
                <StatLabel>Карточек изучено</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.testsPassed || 0}</StatValue>
                <StatLabel>Тестов пройдено</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{stats.streakDays || 0}</StatValue>
                <StatLabel>Дней подряд</StatLabel>
              </StatCard>
            </StatsGrid>
          </ProfileCard>

          {userSets.length > 0 && (
            <ProfileCard>
              <SectionTitle>📚 Публичные наборы</SectionTitle>
              <SetsGrid>
                {userSets.map(set => (
                  <SetCard key={set._id} onClick={() => navigate(`/set/${set._id}`)}>
                    <h4>{set.title}</h4>
                    <div className="meta">
                      📝 {set.flashcards?.length || set.cards?.length || 0} терминов
                    </div>
                  </SetCard>
                ))}
              </SetsGrid>
            </ProfileCard>
          )}
        </>
      )}
    </Container>
  );
}

export default PublicProfile;
