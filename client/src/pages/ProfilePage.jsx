import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import { useTheme, themes, fonts, avatars } from '../contexts/ThemeContext';
import { AuthContext } from '../App';



const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #63b3ed;
  margin-bottom: 0.5rem;
`;

const ProfileCard = styled.div`
  background: var(--bg-secondary);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--border-color);
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

const UserID = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: monospace;
  cursor: pointer;
  display: inline-block;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--border-color);
    transform: translateY(-1px);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }
  
  &:disabled {
    background: var(--bg-tertiary);
    cursor: not-allowed;
  }
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
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 0.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

const Message = styled.div`
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  
  ${props => props.$type === 'success' && `
    background: #d1fae5;
    color: #065f46;
  `}
  
  ${props => props.$type === 'error' && `
    background: #fee2e2;
    color: #991b1b;
  `}
`;

const ThemeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ThemeCard = styled.button`
  padding: 1rem;
  border-radius: 16px;
  border: 3px solid ${props => props.$selected ? '#63b3ed' : 'transparent'};
  background: ${props => props.$bg};
  color: ${props => props.$text};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const AvatarCard = styled.button`
  padding: 1rem;
  border-radius: 16px;
  border: 3px solid ${props => props.$selected ? '#63b3ed' : 'transparent'};
  background: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 2rem;
  
  &:hover {
    transform: scale(1.1);
    background: var(--border-color);
  }
`;

const FontSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-secondary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const ToggleLabel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ToggleTitle = styled.span`
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
`;

const ToggleDescription = styled.span`
  color: var(--text-secondary);
  font-size: 0.85rem;
`;

const ToggleSwitch = styled.button`
  width: 52px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: ${props => props.$active ? '#63b3ed' : '#cbd5e0'};
  cursor: pointer;
  position: relative;
  transition: background 0.3s ease;
  flex-shrink: 0;
  
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$active ? '27px' : '3px'};
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: left 0.3s ease;
  }
`;

function ProfilePage() {
  const navigate = useNavigate();
  const { theme, setTheme, themes, font, setFont, fonts, avatar, setAvatar, avatars } = useTheme();
  const { setAuthState } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    setsCreated: 0,
    cardsStudied: 0,
    testsPassed: 0,
    streakDays: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    isProfilePublic: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user data
      const apiUrl = `http://${window.location.hostname}:5001/api/auth/me`;
      const userRes = await authFetch(apiUrl);
      if (userRes.ok) {
        const userData = await userRes.json();
        console.log('User data:', userData);
        setUser(userData.user);
        setFormData({
          username: userData.user?.username || '',
          email: userData.user?.email || '',
          isProfilePublic: userData.user?.isProfilePublic !== false
        });
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: userData.user,
          role: userData.user?.role || prev.role
        }));
      }
      
      // Fetch stats
      const statsUrl = `http://${window.location.hostname}:5001/api/stats`;
      const statsRes = await authFetch(statsUrl);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          setsCreated: statsData.data?.setsCreated || 0,
          cardsStudied: statsData.data?.cardsStudied || 0,
          testsPassed: statsData.data?.testsPassed || 0,
          streakDays: statsData.data?.streakDays || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки данных' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const apiUrl = `http://${window.location.hostname}:5001/api/auth/profile`;
      const res = await authFetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, isProfilePublic: formData.isProfilePublic })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: data.user,
          role: data.user?.role || prev.role
        }));
        setMessage({ type: 'success', text: data.message || 'Профиль обновлен!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка...</div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>👤 Профиль</Title>
      </Header>

      {message && (
        <Message $type={message.type}>
          {message.text}
        </Message>
      )}

      <ProfileCard>
        <AvatarSection>
          <Avatar style={{fontSize: '3rem'}}>
            {avatars.find(a => a.id === avatar)?.emoji || '👤'}
          </Avatar>
          <AvatarInfo>
            <UserName>{user?.username || 'Пользователь'}</UserName>
            <UserRole $role={user?.role}>
              {user?.role === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик'}
            </UserRole>
            {user?._id ? (
              <UserID onClick={() => {
                navigator.clipboard.writeText(user?._id);
                alert('ID скопирован: ' + user?._id);
              }}>
                🆔 {user?._id}
                <span style={{fontSize: '0.7rem', marginLeft: '0.5rem'}}>(кликни чтобы скопировать)</span>
              </UserID>
            ) : (
              <UserID>🆔 Загрузка...</UserID>
            )}
          </AvatarInfo>
        </AvatarSection>
      </ProfileCard>

      <ProfileCard>
        <SectionTitle>📊 Статистика</SectionTitle>
        <StatsGrid>
          <StatCard>
            <StatValue>{stats.setsCreated}</StatValue>
            <StatLabel>Наборов создано</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.cardsStudied}</StatValue>
            <StatLabel>Карточек изучено</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.testsPassed}</StatValue>
            <StatLabel>Тестов пройдено</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.streakDays}</StatValue>
            <StatLabel>Дней подряд</StatLabel>
          </StatCard>
        </StatsGrid>
      </ProfileCard>

      <ProfileCard>
        <SectionTitle>⚙️ Настройки</SectionTitle>
        
        <FormGroup>
          <Label>Имя пользователя</Label>
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </FormGroup>

        <FormGroup>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled
          />
        </FormGroup>

        <FormGroup>
          <Label>🔒 Приватность</Label>
          <ToggleContainer>
            <ToggleLabel>
              <ToggleTitle>
                {formData.isProfilePublic ? '🌐 Профиль открыт' : '🔒 Профиль закрыт'}
              </ToggleTitle>
              <ToggleDescription>
                {formData.isProfilePublic 
                  ? 'Другие пользователи видят вашу статистику и публичные наборы' 
                  : 'Другие пользователи видят только имя и роль'}
              </ToggleDescription>
            </ToggleLabel>
            <ToggleSwitch 
              $active={formData.isProfilePublic}
              onClick={() => setFormData(prev => ({ ...prev, isProfilePublic: !prev.isProfilePublic }))}
            />
          </ToggleContainer>
        </FormGroup>

        <ButtonGroup>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/dashboard')}>
            ← Назад
          </SecondaryButton>
        </ButtonGroup>
      </ProfileCard>

      {/* Кастомизация */}
      <ProfileCard>
        <SectionTitle>🎨 Кастомизация</SectionTitle>
        
        {/* Темы */}
        <FormGroup>
          <Label>Тема оформления</Label>
          <ThemeGrid>
            {Object.entries(themes).map(([key, themeData]) => (
              <ThemeCard
                key={key}
                $selected={theme === key}
                $bg={themeData.background}
                $text={themeData.text}
                onClick={() => setTheme(key)}
              >
                {themeData.name}
              </ThemeCard>
            ))}
          </ThemeGrid>
        </FormGroup>

        {/* Аватарки */}
        <FormGroup>
          <Label>Аватарка</Label>
          <AvatarGrid>
            {avatars.map((av) => (
              <AvatarCard
                key={av.id}
                $selected={avatar === av.id}
                onClick={() => setAvatar(av.id)}
                title={av.name}
              >
                {av.emoji}
              </AvatarCard>
            ))}
          </AvatarGrid>
        </FormGroup>

        {/* Шрифты */}
        <FormGroup>
          <Label>Шрифт</Label>
          <FontSelect value={font} onChange={(e) => setFont(e.target.value)}>
            {Object.entries(fonts).map(([key, fontData]) => (
              <option key={key} value={key}>
                {fontData.name}
              </option>
            ))}
          </FontSelect>
        </FormGroup>
        
        <ButtonGroup style={{marginTop: '2rem'}}>
          <PrimaryButton onClick={() => {
            // All settings are auto-saved to localStorage, but show confirmation
            setMessage({ type: 'success', text: '✅ Все настройки сохранены!' });
            setTimeout(() => setMessage(null), 2000);
          }}>
            💾 Сохранить все настройки
          </PrimaryButton>
        </ButtonGroup>
      </ProfileCard>
    </Container>
  );
}

export default ProfilePage;
