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
import SpellMode from './pages/SpellMode';
import LiveGame from './pages/LiveGame';
import MatchGamePage from './pages/MatchGamePage';
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
import logoImage from './assets/logo.png';
import CreateClassPage from './pages/CreateClassPage';
import ChainGame from './pages/ChainGame';
import TowerGame from './pages/TowerGame';
import RocketDock from './pages/RocketDock';
import HoneycombGame from './pages/HoneycombGame';
import FillBlanksGame from './pages/FillBlanksGame';
import HandwritingMode from './pages/HandwritingMode';
import LaoshiMode from './pages/LaoshiMode';
import FolderDetail from './pages/FolderDetail';
import AttendancePage from './pages/AttendancePage';
import SharedSetPage from './pages/SharedSetPage';

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

  @keyframes drift-soft {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
    50% { transform: translate3d(18px, -16px, 0) rotate(6deg); }
  }

  @keyframes bob-soft {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-14px); }
  }

  @keyframes pulse-soft {
    0%, 100% { opacity: 0.28; transform: scale(0.96); }
    50% { opacity: 0.52; transform: scale(1.04); }
  }

  @keyframes shimmer-line {
    0%, 100% { opacity: 0.18; transform: translateX(0); }
    50% { opacity: 0.42; transform: translateX(10px); }
  }

`;

const AtmosphereOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const CosmicStarsOverlay = styled(AtmosphereOverlay)``;

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

const GlowOrb = styled.div`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  border-radius: 50%;
  background: radial-gradient(circle, ${props => props.$color} 0%, rgba(255,255,255,0) 72%);
  opacity: ${props => props.$opacity || 0.35};
  filter: blur(${props => props.$blur || 0}px);
  animation: pulse-soft ${props => props.$duration || 8}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
`;

const AccentShape = styled.div`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  width: ${props => props.$width}px;
  height: ${props => props.$height}px;
  border-radius: ${props => props.$radius || 999}px;
  background: ${props => props.$background};
  border: ${props => props.$border || 'none'};
  opacity: ${props => props.$opacity || 0.35};
  transform: rotate(${props => props.$rotate || 0}deg);
  filter: blur(${props => props.$blur || 0}px);
  animation: drift-soft ${props => props.$duration || 10}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
`;

const AtmosphereDot = styled.div`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  width: ${props => props.$size || 4}px;
  height: ${props => props.$size || 4}px;
  border-radius: 50%;
  background: ${props => props.$color || '#fff'};
  box-shadow: 0 0 10px ${props => props.$color || '#fff'};
  opacity: 0.7;
  animation: twinkle ${props => props.$duration || 3}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
`;

const WaveLine = styled.div`
  position: absolute;
  top: ${props => props.$top}%;
  left: ${props => props.$left}%;
  width: ${props => props.$width}px;
  height: ${props => props.$height || 28}px;
  border-radius: 999px;
  border: 1px solid ${props => props.$color};
  opacity: ${props => props.$opacity || 0.25};
  transform: rotate(${props => props.$rotate || 0}deg);
  animation: shimmer-line ${props => props.$duration || 8}s ease-in-out infinite;
  animation-delay: ${props => props.$delay || 0}s;
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

const renderThemeAtmosphere = (theme) => {
  switch (theme) {
    case 'pink':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={12} $left={72} $size={220} $color="rgba(246, 135, 179, 0.35)" $blur={6} />
          <GlowOrb $top={58} $left={6} $size={180} $color="rgba(237, 100, 166, 0.24)" $blur={10} $delay={1.5} />
          <AccentShape $top={18} $left={12} $width={100} $height={28} $background="rgba(255,255,255,0.32)" $rotate={-18} $opacity={0.3} />
          <AccentShape $top={70} $left={78} $width={92} $height={26} $background="rgba(255,255,255,0.22)" $rotate={24} $opacity={0.28} $delay={1.2} />
          {[{ id: 1, top: 20, left: 32 }, { id: 2, top: 34, left: 84 }, { id: 3, top: 64, left: 26 }, { id: 4, top: 82, left: 66 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#fff7fb" $size={3} $duration={3 + item.id} />
          ))}
        </AtmosphereOverlay>
      );
    case 'mint':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={10} $left={8} $size={160} $color="rgba(104, 211, 145, 0.26)" $blur={8} />
          <AccentShape $top={18} $left={76} $width={140} $height={42} $background="rgba(255,255,255,0.18)" $rotate={-12} $radius={60} />
          <AccentShape $top={60} $left={14} $width={110} $height={34} $background="rgba(72, 187, 120, 0.18)" $rotate={18} $radius={90} $delay={1.4} />
          <AccentShape $top={72} $left={72} $width={88} $height={28} $background="rgba(255,255,255,0.2)" $rotate={-22} $radius={90} $delay={0.8} />
          {[{ id: 1, top: 22, left: 24 }, { id: 2, top: 30, left: 68 }, { id: 3, top: 54, left: 88 }, { id: 4, top: 76, left: 38 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#f0fff4" $size={4} $duration={2.6 + item.id} />
          ))}
        </AtmosphereOverlay>
      );
    case 'sunrise':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={-12} $left={72} $size={320} $color="rgba(246, 173, 85, 0.36)" $blur={10} $duration={10} />
          <WaveLine $top={22} $left={58} $width={240} $height={84} $color="rgba(255,255,255,0.22)" $opacity={0.3} />
          <WaveLine $top={26} $left={54} $width={320} $height={120} $color="rgba(255,255,255,0.16)" $opacity={0.24} $delay={1.4} />
          <AccentShape $top={68} $left={4} $width={180} $height={36} $background="rgba(255,255,255,0.22)" $rotate={-6} $radius={999} />
          <AccentShape $top={74} $left={72} $width={120} $height={24} $background="rgba(255,255,255,0.16)" $rotate={8} $radius={999} $delay={1.1} />
        </AtmosphereOverlay>
      );
    case 'ocean':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={16} $left={78} $size={180} $color="rgba(79, 209, 197, 0.24)" $blur={8} />
          <WaveLine $top={72} $left={6} $width={280} $height={64} $color="rgba(255,255,255,0.26)" $delay={0.4} />
          <WaveLine $top={78} $left={46} $width={320} $height={76} $color="rgba(255,255,255,0.18)" $delay={1.2} />
          {[{ id: 1, top: 18, left: 22, size: 20 }, { id: 2, top: 32, left: 84, size: 12 }, { id: 3, top: 56, left: 72, size: 18 }, { id: 4, top: 66, left: 14, size: 10 }, { id: 5, top: 82, left: 88, size: 14 }].map(item => (
            <AccentShape key={item.id} $top={item.top} $left={item.left} $width={item.size} $height={item.size} $background="rgba(255,255,255,0.06)" $border="1px solid rgba(255,255,255,0.34)" $radius={999} $duration={6 + item.id} $opacity={0.55} />
          ))}
        </AtmosphereOverlay>
      );
    case 'forest':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={64} $left={4} $size={180} $color="rgba(104, 211, 145, 0.18)" $blur={14} $duration={12} />
          <AccentShape $top={16} $left={76} $width={132} $height={42} $background="rgba(154, 230, 180, 0.12)" $rotate={-28} $radius={90} />
          <AccentShape $top={62} $left={82} $width={96} $height={30} $background="rgba(154, 230, 180, 0.1)" $rotate={20} $radius={90} $delay={1.6} />
          {[{ id: 1, top: 18, left: 24 }, { id: 2, top: 26, left: 62 }, { id: 3, top: 38, left: 84 }, { id: 4, top: 54, left: 18 }, { id: 5, top: 68, left: 72 }, { id: 6, top: 82, left: 36 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#f0fff4" $size={3} $duration={2.4 + item.id * 0.35} />
          ))}
        </AtmosphereOverlay>
      );
    case 'lavender':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={8} $left={14} $size={180} $color="rgba(183, 148, 246, 0.28)" $blur={10} />
          <GlowOrb $top={62} $left={76} $size={220} $color="rgba(159, 122, 234, 0.18)" $blur={12} $delay={1.2} />
          <AccentShape $top={20} $left={70} $width={120} $height={120} $background="rgba(255,255,255,0.1)" $radius={42} $rotate={18} />
          <AccentShape $top={72} $left={20} $width={88} $height={88} $background="rgba(255,255,255,0.08)" $radius={30} $rotate={-14} $delay={0.8} />
          {[{ id: 1, top: 14, left: 46 }, { id: 2, top: 28, left: 88 }, { id: 3, top: 52, left: 12 }, { id: 4, top: 76, left: 58 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#ffffff" $size={3} $duration={3.2 + item.id} />
          ))}
        </AtmosphereOverlay>
      );
    case 'sunset':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={58} $left={72} $size={220} $color="rgba(252, 129, 129, 0.24)" $blur={10} />
          <GlowOrb $top={12} $left={12} $size={140} $color="rgba(183, 148, 246, 0.16)" $blur={12} $delay={1} />
          <WaveLine $top={64} $left={58} $width={220} $height={92} $color="rgba(255,255,255,0.22)" />
          <AccentShape $top={24} $left={74} $width={132} $height={30} $background="rgba(255,255,255,0.18)" $rotate={-12} $radius={999} />
          <AccentShape $top={34} $left={12} $width={94} $height={24} $background="rgba(255,255,255,0.14)" $rotate={8} $radius={999} $delay={1.2} />
        </AtmosphereOverlay>
      );
    case 'neon':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={18} $left={78} $size={180} $color="rgba(11, 197, 234, 0.22)" $blur={14} />
          <AccentShape $top={12} $left={10} $width={220} $height={2} $background="linear-gradient(90deg, rgba(11,197,234,0), rgba(11,197,234,0.65), rgba(11,197,234,0))" $duration={7} />
          <AccentShape $top={74} $left={60} $width={260} $height={2} $background="linear-gradient(90deg, rgba(11,197,234,0), rgba(118,228,247,0.55), rgba(11,197,234,0))" $duration={8.5} $delay={0.8} />
          <AccentShape $top={22} $left={76} $width={2} $height={160} $background="linear-gradient(180deg, rgba(11,197,234,0), rgba(118,228,247,0.4), rgba(11,197,234,0))" $duration={9} />
          {[{ id: 1, top: 28, left: 18 }, { id: 2, top: 42, left: 86 }, { id: 3, top: 68, left: 34 }, { id: 4, top: 82, left: 72 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#76e4f7" $size={4} $duration={2.8 + item.id} />
          ))}
        </AtmosphereOverlay>
      );
    case 'cherry':
      return (
        <AtmosphereOverlay>
          <GlowOrb $top={18} $left={78} $size={210} $color="rgba(237, 100, 166, 0.2)" $blur={10} />
          <AccentShape $top={16} $left={18} $width={28} $height={18} $background="rgba(255,255,255,0.4)" $rotate={-18} $radius={20} />
          <AccentShape $top={30} $left={80} $width={24} $height={16} $background="rgba(255,255,255,0.34)" $rotate={24} $radius={20} $delay={0.6} />
          <AccentShape $top={62} $left={12} $width={26} $height={16} $background="rgba(255,255,255,0.38)" $rotate={-24} $radius={20} $delay={1.1} />
          <AccentShape $top={80} $left={72} $width={22} $height={14} $background="rgba(255,255,255,0.36)" $rotate={18} $radius={20} $delay={1.4} />
          {[{ id: 1, top: 24, left: 52 }, { id: 2, top: 48, left: 90 }, { id: 3, top: 74, left: 40 }].map(item => (
            <AtmosphereDot key={item.id} $top={item.top} $left={item.left} $color="#fff5f8" $size={3} $duration={3.4 + item.id} />
          ))}
        </AtmosphereOverlay>
      );
    default:
      return null;
  }
};

const AppContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.$theme?.background || 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'};
  color: ${props => props.$theme?.text || '#2d3748'};
  position: relative;
`;

const Header = styled.header`
  background: ${props => props.$isDark ? 'rgba(45, 55, 72, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
  backdrop-filter: blur(10px);
  padding: 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, ${props => props.$isDark ? '0.3' : '0.1'});
  border-bottom: 2px solid ${props => props.$isDark ? '#4a5568' : '#e6fffa'};
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
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

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const LogoImage = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  border-radius: 12px;
  flex: 0 0 auto;

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
  }
`;

const Tagline = styled.p`
  color: #718096;
  font-size: 0.9rem;
  margin-top: 0.25rem;
  margin-bottom: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.main`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
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

  @media (max-width: 768px) {
    position: static;
    transform: none;
    justify-content: center;
    gap: 0.5rem;
  }
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
  white-space: nowrap;

  @media (max-width: 768px) {
    padding: 0.5rem 0.9rem;
    font-size: 0.8rem;
  }
  
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
    <Header $isDark={['Темная', 'Космическая', 'Лес', 'Неоновая'].includes(themeData?.name)}>
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
  const { theme, themeData } = useTheme();
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
            $isDark={['Темная', 'Космическая', 'Лес', 'Неоновая'].includes(themeData?.name)}
            $themeText={themeData?.text}
            $themePrimary={themeData?.primary}
            $cardBg={themeData?.cardBg}
          />
          <MetrikaRouteTracker />
          <AppContainer $theme={themeData}>
            {renderThemeAtmosphere(theme)}
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
                    <Navigate to="/learn" replace />
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
              <Route
                path="/learn/handwriting"
                element={
                  authState.isAuthenticated ? (
                    <HandwritingMode />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/learn/laoshi"
                element={
                  authState.isAuthenticated ? (
                    <LaoshiMode />
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
                    <Navigate to="/dashboard?tab=games" replace />
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
                    <Navigate to="/dashboard?tab=games" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/true-false"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard?tab=games" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/treasure-island"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard?tab=games" replace />
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
              <Route
                path="/games/rocket"
                element={
                  authState.isAuthenticated ? (
                    <RocketDock />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/maze"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard?tab=games" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/train"
                element={
                  authState.isAuthenticated ? (
                    <Navigate to="/dashboard?tab=games" replace />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/honeycomb"
                element={
                  authState.isAuthenticated ? (
                    <HoneycombGame />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/games/fill-blanks"
                element={
                  authState.isAuthenticated ? (
                    <FillBlanksGame />
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
              <Route
                path="/folders/:id"
                element={
                  authState.isAuthenticated ? (
                    <FolderDetail />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/attendance"
                element={
                  authState.isAuthenticated ? (
                    <AttendancePage />
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
                path="/share/:id"
                element={<SharedSetPage />}
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
