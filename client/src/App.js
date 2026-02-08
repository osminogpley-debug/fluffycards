import React, { useState, useEffect, createContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { authFetch } from './constants/api';
import { useTheme } from './contexts/ThemeContext';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import LearningMode from './pages/LearningMode';
import StudyMode from './pages/StudyMode';
import WriteMode from './pages/WriteMode';
import SpellMode from './pages/SpellMode';
import LiveGame from './pages/LiveGame';
import MatchGamePage from './pages/MatchGamePage';
import GravityGamePage from './pages/GravityGamePage';
import PublicLibrary from './pages/PublicLibrary';
import SetBuilder from './pages/SetBuilder';
import SetDetail from './pages/SetDetail';
import TestMode from './pages/TestMode';
import TestResults from './pages/TestResults';
import TestConstructor from './pages/TestConstructor';
import LearningModesPage from './pages/LearningModesPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfile from './pages/PublicProfile';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/HelpPage';
import ContactsPage from './pages/ContactsPage';
import ScrambleGame from './pages/ScrambleGame';
import QuizBlitz from './pages/QuizBlitz';
import logoImage from './assets/logo.png';
import CreateClassPage from './pages/CreateClassPage';
import TrueFalseGame from './pages/TrueFalseGame';
import MemoryGame from './pages/MemoryGame';
import TreasureIsland from './pages/TreasureIsland';
import ChainGame from './pages/ChainGame';
import TowerGame from './pages/TowerGame';

const GlobalStyle = createGlobalStyle`
  :root {
    --bg-primary: ${props => props.$isDark ? '#1a202c' : '#f8f9fa'};
    --bg-secondary: ${props => props.$isDark ? '#2d3748' : 'white'};
    --bg-tertiary: ${props => props.$isDark ? '#4a5568' : '#f3f4f6'};
    --bg-hover: ${props => props.$isDark ? '#4a5568' : '#f8fafc'};
    --text-primary: ${props => props.$themeText || '#2d3748'};
    --text-secondary: ${props => props.$isDark ? '#a0aec0' : '#6b7280'};
    --text-muted: ${props => props.$isDark ? '#a0aec0' : '#9ca3af'};
    --border-color: ${props => props.$isDark ? '#4a5568' : '#e2e8f0'};
    --border-light: ${props => props.$isDark ? '#4a5568' : '#e5e7eb'};
    --card-bg: ${props => props.$cardBg || (props.$isDark ? '#2d3748' : 'white')};
    --primary-color: ${props => props.$themePrimary || '#63b3ed'};
    --danger-bg: ${props => props.$isDark ? '#742a2a' : '#fee2e2'};
    --danger-color: ${props => props.$isDark ? '#feb2b2' : '#dc2626'};
    --danger-hover-bg: ${props => props.$isDark ? '#9b2c2c' : '#fecaca'};
    --modal-bg: ${props => props.$isDark ? '#2d3748' : 'white'};
    --shadow-color: ${props => props.$isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Nunito', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.3s ease;
  }

  input, textarea, select {
    border: 2px solid var(--border-color);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: var(--bg-secondary);
    color: var(--text-primary);

    &:focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
    }
    
    &::placeholder {
      color: var(--text-muted);
    }
  }

  select option, select optgroup {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  table th {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  table td {
    color: var(--text-primary);
    border-bottom-color: var(--border-color);
  }

  @keyframes twinkle {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  
  @keyframes float-star {
    0% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
    100% { transform: translateY(0) rotate(360deg); }
  }
  
  @keyframes shoot {
    0% { transform: translateX(0) translateY(0); opacity: 1; }
    100% { transform: translateX(-200px) translateY(200px); opacity: 0; }
  }
`;

const CosmicStarsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const Star = styled.div`
  position: absolute;
  width: ${props => props.$size || 2}px;
  height: ${props => props.$size || 2}px;
  background: ${props => props.$color || '#e9d8fd'};
  border-radius: 50%;
  box-shadow: 0 0 ${props => (props.$size || 2) * 2}px ${props => props.$color || '#e9d8fd'};
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  animation: twinkle ${props => props.$duration || 3}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
`;

const ShootingStar = styled.div`
  position: absolute;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.6);
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  animation: shoot ${props => props.$duration || 2}s linear infinite;
  animation-delay: ${props => props.$delay || 0}s;
  
  &::after {
    content: '';
    position: absolute;
    width: 60px;
    height: 1px;
    background: linear-gradient(to right, rgba(255,255,255,0.6), transparent);
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
  }
`;

const cosmicStars = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 4 + 2,
  delay: Math.random() * 5,
  color: ['#e9d8fd', '#b794f6', '#9f7aea', '#d6bcfa', '#fff'][Math.floor(Math.random() * 5)]
}));

const shootingStars = [
  { id: 1, top: 15, left: 80, duration: 3, delay: 2 },
  { id: 2, top: 35, left: 90, duration: 2.5, delay: 7 },
  { id: 3, top: 8, left: 60, duration: 2, delay: 12 },
];

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$theme?.background || 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'};
  color: ${props => props.$theme?.text || '#2d3748'};
`;

const Header = styled.header`
  background: ${props => props.$isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, ${props => props.$isDark ? '0.3' : '0.1'});
  border-bottom: 2px solid ${props => props.$isDark ? '#4a5568' : '#e6fffa'};
`;

const Logo = styled.h1`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.8rem;
  font-weight: 700;
  color: #63b3ed;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  margin: 0;
`;

const LogoImage = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 12px;
  flex: 0 0 auto;
`;

const Tagline = styled.p`
  color: #718096;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  margin-bottom: 0;
`;

const MainContent = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

export const AuthContext = createContext(null);

const YANDEX_METRIKA_COUNTER_ID = 106706105;

function MetrikaRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (typeof window.ym !== 'function') return;

    const url = `https://fluffycards.ru${location.pathname}${location.search}${location.hash}`;
    window.ym(YANDEX_METRIKA_COUNTER_ID, 'hit', url, {
      referer: document.referrer,
      title: document.title,
    });
  }, [location]);

  return null;
}

const HeaderActions = styled.div`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const DonateLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  opacity: 0.85;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }
`;

const NavButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 179, 237, 0.4);
    background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const LogoutButton = styled.button`
  background: linear-gradient(135deg, #fc8181 0%, #e53e3e 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(252, 129, 129, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(252, 129, 129, 0.4);
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const AuthButton = styled(NavButton)`
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.28);

  &:hover {
    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.32);
  }
`;

// Header component with navigation
function HeaderComponent({ authState, logout }) {
  const navigate = useNavigate();
  const { themeData } = useTheme();
  
  return (
    <Header $isDark={themeData?.name === 'Темная' || themeData?.name === 'Космическая'}>
      <Logo onClick={() => navigate('/')}
        aria-label="FluffyCards — на главную"
        title="FluffyCards"
      >
        <LogoImage src={logoImage} alt="Логотип FluffyCards" />
        FluffyCards
      </Logo>
      <Tagline>Learning made fun and friendly! 🎓</Tagline>
      
      <HeaderActions>
        <DonateLink
          href="https://www.donationalerts.com/r/flufficards"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Поддержать FluffyCards"
          title="Поддержать FluffyCards"
        >
          💙 Поддержать
        </DonateLink>
        {!authState.loading && authState.isAuthenticated && (
          <>
            <NavButton onClick={() => navigate('/dashboard')}>👤 Личный кабинет</NavButton>
            <LogoutButton onClick={logout}>🚪 Выйти</LogoutButton>
          </>
        )}
        {!authState.loading && !authState.isAuthenticated && (
          <>
            <NavButton onClick={() => navigate('/login')}>🔑 Вход</NavButton>
            <AuthButton onClick={() => navigate('/register')}>✨ Регистрация</AuthButton>
          </>
        )}
      </HeaderActions>
    </Header>
  );
}

function App() {
  const { themeData } = useTheme();
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    role: null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiUrl = `/api/auth/me`;
        const response = await authFetch(apiUrl);

        if (response.ok) {
          const data = await response.json();
          setAuthState({
            isAuthenticated: true,
            user: data.user,
            role: data.user?.role || 'student',
            loading: false
          });
        } else {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
            role: null,
            loading: false
          }));
        }
      } catch (error) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          role: null,
          loading: false
        }));
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!authState.isAuthenticated) return;

    let heartbeatTimer = null;

    const sendHeartbeat = async () => {
      try {
        const apiUrl = `/api/auth/heartbeat`;
        await authFetch(apiUrl, { method: 'POST' });
      } catch (error) {
        // Ignore heartbeat errors to avoid disrupting the session
      }
    };

    const startHeartbeat = () => {
      if (heartbeatTimer) return;
      sendHeartbeat();
      heartbeatTimer = setInterval(() => {
        if (document.visibilityState === 'visible') {
          sendHeartbeat();
        }
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    startHeartbeat();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopHeartbeat();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authState.isAuthenticated]);

  const logout = async () => {
    const apiUrl = `/api/auth/logout`;
    await fetch(apiUrl, {
      credentials: 'include'
    });
    // Clear token from localStorage
    localStorage.removeItem('token');
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider value={{ authState, role: authState.role, logout, setAuthState }}>
      <HelmetProvider>
        <Router>
          <GlobalStyle 
            $isDark={themeData?.name === 'Темная' || themeData?.name === 'Космическая'}
            $themeText={themeData?.text}
            $themePrimary={themeData?.primary}
            $cardBg={themeData?.cardBg}
          />
          <MetrikaRouteTracker />
          <AppContainer $theme={themeData}>
            {themeData?.name === 'Космическая' && (
              <CosmicStarsOverlay>
                {cosmicStars.map(star => (
                  <Star
                    key={star.id}
                    $top={star.top}
                    $left={star.left}
                    $size={star.size}
                    $duration={star.duration}
                    $delay={star.delay}
                    $color={star.color}
                  />
                ))}
                {shootingStars.map(s => (
                  <ShootingStar
                    key={`shoot-${s.id}`}
                    $top={s.top}
                    $left={s.left}
                    $duration={s.duration}
                    $delay={s.delay}
                  />
                ))}
              </CosmicStarsOverlay>
            )}
            <HeaderComponent authState={authState} logout={logout} />
            
            <MainContent>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route 
                path="/login" 
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <AuthPage initialMode="login" />
                  )
                } 
              />
              <Route 
                path="/register" 
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard" />
                  ) : (
                    <AuthPage initialMode="register" />
                  )
                } 
              />
              
              <Route
                path="/dashboard"
                element={
                  authState.isAuthenticated ? (
                    <Dashboard />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/classes/create"
                element={
                  authState.isAuthenticated ? (
                    <CreateClassPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn"
                element={
                  authState.isAuthenticated ? (
                    <LearningModesPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/:setId"
                element={
                  authState.isAuthenticated ? (
                    <LearningModesPage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/flashcards"
                element={
                  authState.isAuthenticated ? (
                    <LearningMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/study"
                element={
                  authState.isAuthenticated ? (
                    <StudyMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/write"
                element={
                  authState.isAuthenticated ? (
                    <WriteMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/spell"
                element={
                  authState.isAuthenticated ? (
                    <SpellMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route path="/live" element={<LiveGame />} />
              <Route
                path="/games/match"
                element={
                  authState.isAuthenticated ? (
                    <MatchGamePage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/gravity"
                element={
                  authState.isAuthenticated ? (
                    <GravityGamePage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/scramble"
                element={
                  authState.isAuthenticated ? (
                    <ScrambleGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/quiz-blitz"
                element={
                  authState.isAuthenticated ? (
                    <QuizBlitz />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/true-false"
                element={
                  authState.isAuthenticated ? (
                    <TrueFalseGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/memory"
                element={
                  authState.isAuthenticated ? (
                    <MemoryGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/treasure-island"
                element={
                  authState.isAuthenticated ? (
                    <TreasureIsland />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/chain"
                element={
                  authState.isAuthenticated ? (
                    <ChainGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/tower"
                element={
                  authState.isAuthenticated ? (
                    <TowerGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route path="/library" element={<PublicLibrary />} />
              <Route path="/users/:userId" element={<PublicProfile />} />
              <Route
                path="/profile"
                element={
                  authState.isAuthenticated ? (
                    <ProfilePage />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route
                path="/sets/create"
                element={
                  authState.isAuthenticated ? (
                    <SetBuilder />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/sets/:id"
                element={
                  authState.isAuthenticated ? (
                    <SetDetail />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/sets/:id/edit"
                element={
                  authState.isAuthenticated ? (
                    <SetBuilder />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/test"
                element={
                  authState.isAuthenticated ? (
                    <TestMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/test/constructor"
                element={
                  authState.isAuthenticated ? (
                    <TestConstructor />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/test/results"
                element={
                  authState.isAuthenticated ? (
                    <TestResults />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/admin"
                element={
                  authState.isAuthenticated && authState.user?.role === 'admin' ? (
                    <AdminPage />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                }
              />
              </Routes>
            </MainContent>
          </AppContainer>
        </Router>
      </HelmetProvider>
    </AuthContext.Provider>
  );
}

export default App;
