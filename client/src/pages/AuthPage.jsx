import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet-async';
import { PrimaryButton } from '../components/UI/Buttons';
import { AuthContext } from '../App';

const AuthContainer = styled.div`
  max-width: 500px;
  margin: 3rem auto;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const ToggleContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-radius: 12px;
  overflow: hidden;
  background: #edf2f7;
`;

const ToggleButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  background: ${({ active }) => active ? '#63b3ed' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#4a5568'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ active }) => active ? '#4299e1' : '#e2e8f0'};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 1.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #63b3ed;
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
  }
`;

const RoleSection = styled.div`
  margin-bottom: 1.5rem;
`;

const RoleLabel = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  color: #4a5568;
  font-weight: 600;
  font-size: 14px;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const RoleCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  border: 3px solid ${({ selected }) => selected ? '#63b3ed' : '#e2e8f0'};
  border-radius: 16px;
  background: ${({ selected }) => selected ? 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' : 'white'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #63b3ed;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.2);
  }

  .icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
  }

  .title {
    font-weight: 700;
    color: ${({ selected }) => selected ? '#1e40af' : '#2d3748'};
    margin-bottom: 4px;
  }

  .description {
    font-size: 12px;
    color: #718096;
    text-align: center;
  }
`;

const RoleFeatures = styled.div`
  margin-top: 1rem;
  padding: 12px;
  background: #f7fafc;
  border-radius: 12px;
  font-size: 13px;
  color: #4a5568;

  ul {
    margin: 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 4px;
  }
`;

const OAuthDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 1.25rem 0;
  color: #718096;
  font-size: 14px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }
`;

const YandexButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #fc3f1d;
  border-radius: 12px;
  background: #fff5f2;
  color: #b8321b;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #ffe8e1;
  }
`;

function AuthPage(props) {
  const [isLogin, setIsLogin] = useState(props.initialMode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: ''
  });
  
  const { setAuthState } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const token = params.get('token');
    const oauthError = params.get('error');

    if (oauth !== 'yandex') {
      return;
    }

    if (oauthError) {
      setError(oauthError);
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (!token) {
      return;
    }

    const finalizeYandexAuth = async () => {
      try {
        localStorage.setItem('token', token);
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Не удалось завершить вход через Яндекс');
        }

        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          role: data.user?.role || 'student',
          loading: false
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate('/');
      } catch (authError) {
        setError(authError.message || 'Не удалось завершить вход через Яндекс');
      }
    };

    finalizeYandexAuth();
  }, [navigate, setAuthState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate role for registration
    if (!isLogin && !formData.role) {
      setError('Пожалуйста, выберите роль: Ученик или Учитель');
      return;
    }
    
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const apiUrl = `${endpoint}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (isLogin) {
          // Store token for LAN play (fallback for cookies)
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          
          // Update auth context with user data including role
          setAuthState({
            isAuthenticated: true,
            user: data.user,
            role: data.user?.role || 'student',
            loading: false
          });
          navigate('/');
        } else {
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          setAuthState({
            isAuthenticated: true,
            user: data.user,
            role: data.user?.role || 'student',
            loading: false
          });
          setSuccessMessage(data.message || 'Регистрация успешна!');
          navigate('/');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Ошибка авторизации');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  const handleYandexAuth = () => {
    setError('');
    setSuccessMessage('');

    if (!isLogin && !formData.role) {
      setError('Пожалуйста, выберите роль перед входом через Яндекс');
      return;
    }

    const params = new URLSearchParams({
      platform: 'web',
      return_to: `${window.location.origin}/auth`
    });

    if (!isLogin) {
      params.set('role', formData.role);
    }

    window.location.href = `/api/auth/yandex/start?${params.toString()}`;
  };

  return (
    <AuthContainer>
      <Helmet>
        <title>{isLogin ? 'Вход — FluffyCards' : 'Регистрация — FluffyCards'}</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="googlebot" content="noindex, nofollow" />
      </Helmet>
      <ToggleContainer>
        <ToggleButton 
          active={isLogin}
          onClick={() => setIsLogin(true)}
        >
          Вход
        </ToggleButton>
        <ToggleButton
          active={!isLogin}
          onClick={() => setIsLogin(false)}
        >
          Регистрация
        </ToggleButton>
      </ToggleContainer>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <>
            <Input
              type="text"
              name="username"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={handleChange}
              required
            />
            
            <RoleSection>
              <RoleLabel>Выберите вашу роль ✨</RoleLabel>
              <RoleGrid>
                <RoleCard
                  type="button"
                  selected={formData.role === 'student'}
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                >
                  <span className="icon">🎓</span>
                  <span className="title">Ученик</span>
                  <span className="description">Учусь и играю</span>
                </RoleCard>
                <RoleCard
                  type="button"
                  selected={formData.role === 'teacher'}
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                >
                  <span className="icon">👨‍🏫</span>
                  <span className="title">Учитель</span>
                  <span className="description">Создаю материалы</span>
                </RoleCard>
              </RoleGrid>
              
              {formData.role && (
                <RoleFeatures>
                  <strong>Возможности {formData.role === 'student' ? 'ученика' : 'учителя'}:</strong>
                  <ul>
                    {formData.role === 'student' ? (
                      <>
                        <li>🎮 Играть в обучающие игры</li>
                        <li>⭐ Копить баллы и достижения</li>
                        <li>📚 Изучать наборы карточек</li>
                        <li>🏆 Участвовать в соревнованиях</li>
                      </>
                    ) : (
                      <>
                        <li>📝 Создавать наборы карточек</li>
                        <li>🎮 Создавать игры и тесты</li>
                        <li>👥 Управлять классами</li>
                        <li>📊 Отслеживать прогресс учеников</li>
                      </>
                    )}
                  </ul>
                </RoleFeatures>
              )}
            </RoleSection>
          </>
        )}
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {error && <p style={{ color: 'red', textAlign: 'center', margin: '1rem 0' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green', textAlign: 'center', margin: '1rem 0' }}>{successMessage}</p>}
        <PrimaryButton 
          type="submit" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
        </PrimaryButton>
        <OAuthDivider>или</OAuthDivider>
        <YandexButton type="button" onClick={handleYandexAuth}>
          {isLogin ? 'Войти через Яндекс' : 'Зарегистрироваться через Яндекс'}
        </YandexButton>
      </form>
    </AuthContainer>
  );
}

export default AuthPage;
