import React, { useState, useEffect, createContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Nunito', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #f8f9fa;
    color: #2d3748;
    line-height: 1.6;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 1rem;
  }

  button {
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 0.3s ease;
  }

  input, textarea {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 16px;
    transition: all 0.3s ease;

    &:focus {
      border-color: #63b3ed;
      box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
    }
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$theme?.background || 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'};
  color: ${props => props.$theme?.text || '#2d3748'};
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border-bottom: 2px solid #e6fffa;
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: #63b3ed;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  margin: 0;
  
  &::before {
    content: "🎀 ";
  }
  
  &::after {
    content: " 🎀";
  }
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

const NavLinks = styled.div`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0.75rem;
  align-items: center;
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

// Header component with navigation
function HeaderComponent({ authState, logout }) {
  const navigate = useNavigate();
  
  return (
    <Header>
      <Logo onClick={() => navigate('/')}>FluffyCards</Logo>
      <Tagline>Learning made fun and friendly! 🎓</Tagline>
      
      {authState.isAuthenticated && !authState.loading && (
        <NavLinks>
          <NavButton onClick={() => navigate('/dashboard')}>👤 Личный кабинет</NavButton>
          <LogoutButton onClick={logout}>🚪 Выйти</LogoutButton>
        </NavLinks>
      )}
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
        const apiUrl = `http://${window.location.hostname}:5001/api/auth/me`;
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

  const logout = async () => {
    const apiUrl = `http://${window.location.hostname}:5001/api/auth/logout`;
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
      <Router>
        <GlobalStyle />
        <AppContainer $theme={themeData}>
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
    </AuthContext.Provider>
  );
}

export default App;
