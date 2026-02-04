import React, { useEffect, useState, useCallback, useRef, useContext } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { API_ROUTES, authFetch } from '../constants/api';
import { useTheme, avatars } from '../contexts/ThemeContext';
import GamificationPanel from '../components/GamificationPanel';
import SocialFeatures from '../components/SocialFeatures';
import Challenges from '../components/Challenges';
import FriendsList from '../components/FriendsList';
import AchievementsModal from '../components/AchievementsModal';
import LeaderboardModal from '../components/LeaderboardModal';
import LevelBadge from '../components/LevelBadge';

// ===== СТИЛИ =====
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f6f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

// Верхняя панель пользователя
const UserHeader = styled.div`
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 20px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Avatar = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
`;

const UserDetails = styled.div`
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .role {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    padding: 4px 12px;
    background: ${props => props.$role === 'teacher' ? '#fef3c7' : '#e0f2fe'};
    color: ${props => props.$role === 'teacher' ? '#92400e' : '#0369a1'};
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }
`;

const QuickStats = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
`;

const StatItem = styled.div`
  text-align: center;
  
  .value {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .label {
    font-size: 12px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  &.streak .value {
    color: #f59e0b;
  }
`;

const CreateButton = styled.button`
  background: #63b3ed;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);
  
  &:hover {
    background: #4299e1;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 179, 237, 0.4);
  }
`;

const CreateFolderButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  
  &:hover {
    background: #059669;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
`;

const GamificationButton = styled.button`
  background: ${props => props.$variant === 'leaderboard' 
    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' 
    : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px ${props => props.$variant === 'leaderboard' 
    ? 'rgba(251, 191, 36, 0.3)' 
    : 'rgba(139, 92, 246, 0.3)'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px ${props => props.$variant === 'leaderboard' 
      ? 'rgba(251, 191, 36, 0.4)' 
      : 'rgba(139, 92, 246, 0.4)'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

// Навигация по вкладкам
const TabNavigation = styled.div`
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 32px;
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${props => props.active ? '#63b3ed' : 'transparent'};
  color: ${props => props.active ? '#63b3ed' : '#6b7280'};
  font-size: 15px;
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #63b3ed;
    background: #f8fafc;
  }
`;

// Основной контент
const MainContent = styled.div`
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
  gap: 32px;
`;

const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const Sidebar = styled.div`
  width: 280px;
  flex-shrink: 0;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

// Панель поиска и сортировки
const ControlPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const TagsCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  .label {
    font-size: 14px;
    color: #6b7280;
    margin-right: 8px;
  }
`;

const TagFilterButton = styled.button`
  padding: 5px 12px;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    : '#f3f4f6'};
  color: ${props => props.active ? 'white' : '#374151'};
  border: none;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  }
`;

const ClearTagButton = styled.button`
  padding: 5px 10px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #fecaca;
  }
`;

const SearchInput = styled.div`
  flex: 1;
  position: relative;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 15px;
    transition: all 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: #63b3ed;
    }
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: #9ca3af;
  }
`;

const SortSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const FolderButton = styled.button`
  padding: 12px 20px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
    color: #374151;
  }
`;

// Сетка наборов
const SetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const SetCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: #63b3ed;
  }
  
  .preview {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .preview-term {
    font-weight: 600;
    color: #1a1a1a;
    font-size: 15px;
  }
  
  .preview-definition {
    color: #6b7280;
    font-size: 13px;
    margin-top: 4px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 17px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .meta {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #6b7280;
    font-size: 13px;
  }
  
  .actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f3f4f6;
  }
  
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s ease;
  opacity: 0;
  
  ${SetCard}:hover & {
    opacity: 1;
  }
  
  &:hover {
    background: #fecaca;
    transform: scale(1.1);
  }
`;

const TagBadge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  &.primary {
    background: #63b3ed;
    color: white;
    border-color: #63b3ed;
    
    &:hover {
      background: #4299e1;
      border-color: #4299e1;
    }
  }
`;

// Папки
const FolderCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  border-left: 4px solid ${props => props.$color || '#63b3ed'};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    border-color: ${props => props.$color || '#63b3ed'};
  }
  
  .folder-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 17px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .description {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .meta {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #6b7280;
    font-size: 13px;
  }
`;

// Модальное окно
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  h2 {
    margin: 0 0 24px 0;
    font-size: 22px;
    font-weight: 600;
    color: #1a1a1a;
  }
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  margin-bottom: 16px;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const ColorOption = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid ${props => props.$selected ? '#1a1a1a' : 'transparent'};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.cancel {
    background: #f3f4f6;
    color: #374151;
    border: none;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &.create {
    background: #63b3ed;
    color: white;
    border: none;
    
    &:hover {
      background: #4299e1;
    }
  }
`;

// Блок рекомендаций
const RecommendationsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
  
  h2 {
    margin: 0 0 20px 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

// Боковая панель
const SidebarCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  
  h3 {
    margin: 0 0 16px 0;
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const SidebarMenu = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SidebarItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: none;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: #f3f4f6;
  }
  
  .icon {
    font-size: 18px;
  }
`;

// Достижения
const AchievementBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.locked ? '#f9fafb' : '#fef3c7'};
  margin-bottom: 8px;
  opacity: ${props => props.locked ? 0.6 : 1};
  
  .badge-icon {
    font-size: 28px;
  }
  
  .badge-info {
    flex: 1;
    
    .name {
      font-weight: 600;
      font-size: 14px;
      color: #1a1a1a;
    }
    
    .desc {
      font-size: 12px;
      color: #6b7280;
    }
  }
`;

// Загрузка
const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  
  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #63b3ed;
    border-radius: 50%;
    /* animation removed for compatibility */
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  
  .icon {
    font-size: 64px;
    margin-bottom: 16px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  p {
    margin: 0 0 24px 0;
    color: #6b7280;
  }
`;

// Пресет цветов для папок
const FOLDER_COLORS = [
  '#63b3ed', // blue
  '#f56565', // red
  '#48bb78', // green
  '#ed8936', // orange
  '#9f7aea', // purple
  '#38b2ac', // teal
  '#ed64a6', // pink
  '#ecc94b', // yellow
];

// ===== КОМПОНЕНТ =====
function Dashboard() {
  const navigate = useNavigate();
  const { authState } = useContext(AuthContext);
  const { avatar } = useTheme();
  const user = authState?.user;
  const userRole = user?.role || 'student';
  const [activeTab, setActiveTab] = useState('sets');
  const [stats, setStats] = useState(null);
  const [userSets, setUserSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [popularTags, setPopularTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  
  // State для геймификации
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);
  
  // State для папок
  const [folders, setFolders] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  
  const cacheRef = useRef({
    stats: null,
    sets: null,
    folders: null,
    timestamp: 0
  });

  // Загрузка данных
  const fetchData = useCallback(async () => {
    const cache = cacheRef.current;
    try {
      setError(null);
      setLoading(true);
      
      // Кэш на 5 минут
      const now = Date.now();
      if (cache.stats && cache.sets && (now - cache.timestamp) < 300000) {
        setStats(cache.stats);
        setUserSets(cache.sets);
        setFolders(cache.folders || []);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const statsPromise = authFetch(API_ROUTES.DATA.STATS, {
        signal: controller.signal
      }).then(async res => {
        if (!res.ok) throw new Error('Failed to load stats');
        return res.json();
      }).catch(() => ({
        setsStudied: 0,
        cardsMastered: 0,
        streakDays: 0,
        accuracy: 0,
        sessionHistory: []
      }));
      
      const setsPromise = authFetch(API_ROUTES.DATA.SETS, {
        signal: controller.signal
      }).then(async res => {
        if (!res.ok) throw new Error('Failed to load sets');
        return res.json();
      }).catch(() => []);
      
      const foldersPromise = fetchFolders().catch(() => []);
      
      const gamificationPromise = authFetch(API_ROUTES.GAMIFICATION, {
        signal: controller.signal
      }).then(async res => {
        if (!res.ok) throw new Error('Failed to load gamification');
        return res.json();
      }).catch(() => null);

      const [statsData, setsData, foldersData, gamificationRes] = await Promise.all([
        statsPromise, setsPromise, foldersPromise, gamificationPromise
      ]);
      
      clearTimeout(timeoutId);
      
      cache.stats = statsData;
      cache.sets = setsData;
      cache.folders = foldersData;
      cache.timestamp = Date.now();
      
      setStats(statsData);
      setUserSets(setsData);
      setGamificationData(gamificationRes);
      setFolders(foldersData);
      
      // Извлекаем популярные теги из наборов
      const tagCounts = {};
      setsData.forEach(set => {
        set.tags?.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const sortedTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag]) => tag);
      setPopularTags(sortedTags);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  // API вызовы
  const fetchFolders = async () => {
    const res = await authFetch('/api/folders');
    if (!res.ok) throw new Error('Failed to load folders');
    const data = await res.json();
    return data;
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await authFetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          description: newFolderDescription.trim(),
          color: newFolderColor
        })
      });
      
      if (!res.ok) throw new Error('Failed to create folder');
      
      const newFolder = await res.json();
      setFolders(prev => [...prev, newFolder]);
      
      // Сброс формы
      setNewFolderName('');
      setNewFolderDescription('');
      setNewFolderColor(FOLDER_COLORS[0]);
      setShowCreateFolderModal(false);
      
      // Обновить кэш
      cacheRef.current.folders = [...folders, newFolder];
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Не удалось создать папку');
    }
  };

  const deleteSet = async (setId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот набор?')) return;
    
    try {
      const res = await authFetch(`/api/sets/${setId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Failed to delete set');
      
      setUserSets(prev => prev.filter(s => (s._id || s.id) !== setId));
      
      // Обновить кэш
      cacheRef.current.sets = userSets.filter(s => (s._id || s.id) !== setId);
    } catch (error) {
      console.error('Error deleting set:', error);
      alert('Не удалось удалить набор');
    }
  };

  // Фильтрация и сортировка наборов
  const filteredSets = userSets.filter(set => {
    const query = searchQuery.toLowerCase();
    const matchesTitle = set.title?.toLowerCase().includes(query);
    const matchesDescription = set.description?.toLowerCase().includes(query);
    const matchesTags = set.tags?.some(tag => tag.toLowerCase().includes(query));
    const matchesSelectedTag = !selectedTag || set.tags?.includes(selectedTag);
    return (matchesTitle || matchesDescription || matchesTags) && matchesSelectedTag;
  });

  const sortedSets = [...filteredSets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.title || '').localeCompare(b.title || '');
      case 'cards':
        return (b.flashcards?.length || 0) - (a.flashcards?.length || 0);
      case 'recent':
      default:
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    }
  });

  // Рекомендуемые наборы (те, что давно не изучались)
  const recommendedSets = userSets
    .filter(set => set.lastStudied)
    .sort((a, b) => new Date(a.lastStudied) - new Date(b.lastStudied))
    .slice(0, 3);

  // Вкладка "Мои наборы"
  const renderSetsTab = () => (
    <>
      <ControlPanel>
        <SearchInput>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по названию, описанию или тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInput>
        <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">📅 Сначала новые</option>
          <option value="name">🔤 По названию</option>
          <option value="cards">📝 По количеству</option>
        </SortSelect>
        <ButtonGroup>
          <FolderButton onClick={() => setShowCreateFolderModal(true)}>
            📁 Создать папку
          </FolderButton>
          <FolderButton onClick={() => navigate('/sets/create')}>
            ➕ Создать набор
          </FolderButton>
        </ButtonGroup>
      </ControlPanel>
      
      {/* Облако тегов */}
      {popularTags.length > 0 && !searchQuery && (
        <TagsCloud>
          <span className="label">🏷️ Теги:</span>
          {selectedTag && (
            <ClearTagButton onClick={() => setSelectedTag(null)}>
              ❌ Сбросить
            </ClearTagButton>
          )}
          {popularTags.map((tag, idx) => (
            <TagFilterButton
              key={idx}
              active={selectedTag === tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </TagFilterButton>
          ))}
        </TagsCloud>
      )}

      {sortedSets.length > 0 ? (
        <SetsGrid>
          {sortedSets.map((set) => (
            <SetCard key={set._id || set.id} onClick={() => navigate(`/sets/${set._id || set.id}`)}>
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSet(set._id || set.id);
                }}
                title="Удалить набор"
              >
                🗑️
              </DeleteButton>
              <div className="preview">
                {set.flashcards?.[0] ? (
                  <>
                    <div className="preview-term">{set.flashcards[0].term}</div>
                    <div className="preview-definition">{set.flashcards[0].definition}</div>
                  </>
                ) : (
                  <div className="preview-definition" style={{ textAlign: 'center' }}>
                    Нет карточек
                  </div>
                )}
              </div>
              <h3>{set.title}</h3>
              <div className="meta">
                <span>📝 {set.flashcards?.length || 0} терминов</span>
                <span>•</span>
                <span>{set.isPublic ? '🌍 Публичный' : '🔒 Приватный'}</span>
              </div>
              {set.tags && set.tags.length > 0 && (
                <div className="tags">
                  {set.tags.slice(0, 5).map((tag, idx) => (
                    <TagBadge 
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery(tag);
                      }}
                      title="Нажмите для фильтрации"
                    >
                      {tag}
                    </TagBadge>
                  ))}
                  {set.tags.length > 5 && (
                    <TagBadge style={{ background: '#718096' }}>
                      +{set.tags.length - 5}
                    </TagBadge>
                  )}
                </div>
              )}
              <div className="actions">
                <ActionButton 
                  className="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/learn/${set._id || set.id}`);
                  }}
                >
                  📖 Учить
                </ActionButton>
                <ActionButton
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/sets/${set._id || set.id}/edit`);
                  }}
                >
                  ✏️ Редактировать
                </ActionButton>
              </div>
            </SetCard>
          ))}
        </SetsGrid>
      ) : (
        <EmptyState>
          <div className="icon">📚</div>
          <h3>У вас пока нет наборов</h3>
          <p>Создайте свой первый набор и начните учиться</p>
          <CreateButton onClick={() => navigate('/sets/create')}>
            ➕ Создать набор
          </CreateButton>
        </EmptyState>
      )}

      {recommendedSets.length > 0 && (
        <RecommendationsSection>
          <h2>🔄 Рекомендуем повторить</h2>
          <SetsGrid style={{ marginBottom: 0 }}>
            {recommendedSets.map((set) => (
              <SetCard key={`rec-${set._id || set.id}`} onClick={() => navigate(`/sets/${set._id || set.id}`)}>
                <div className="preview">
                  {set.flashcards?.[0] ? (
                    <>
                      <div className="preview-term">{set.flashcards[0].term}</div>
                      <div className="preview-definition">{set.flashcards[0].definition}</div>
                    </>
                  ) : (
                    <div className="preview-definition" style={{ textAlign: 'center' }}>
                      Нет карточек
                    </div>
                  )}
                </div>
                <h3>{set.title}</h3>
                <div className="meta">
                  <span>📝 {set.flashcards?.length || 0} терминов</span>
                  <span>•</span>
                  <span>📅 Последнее повторение: {new Date(set.lastStudied).toLocaleDateString()}</span>
                </div>
              </SetCard>
            ))}
          </SetsGrid>
        </RecommendationsSection>
      )}
    </>
  );

  // Вкладка "Папки"
  const renderFoldersTab = () => (
    <>
      <ControlPanel>
        <SearchInput>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Поиск по папкам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInput>
        <CreateFolderButton onClick={() => setShowCreateFolderModal(true)}>
          📁 Создать папку
        </CreateFolderButton>
      </ControlPanel>

      {folders.length > 0 ? (
        <SetsGrid>
          {folders.map((folder) => (
            <FolderCard 
              key={folder._id || folder.id} 
              $color={folder.color}
              onClick={() => navigate(`/folders/${folder._id || folder.id}`)}
            >
              <div className="folder-icon" style={{ color: folder.color }}>📁</div>
              <h3>{folder.name}</h3>
              {folder.description && (
                <div className="description">{folder.description}</div>
              )}
              <div className="meta">
                <span>📚 {folder.setsCount || 0} наборов</span>
                <span>•</span>
                <span>{folder.isPublic ? '🌍 Публичная' : '🔒 Приватная'}</span>
              </div>
            </FolderCard>
          ))}
        </SetsGrid>
      ) : (
        <EmptyState>
          <div className="icon">📁</div>
          <h3>У вас пока нет папок</h3>
          <p>Создайте папку для организации ваших наборов</p>
          <CreateFolderButton onClick={() => setShowCreateFolderModal(true)}>
            📁 Создать папку
          </CreateFolderButton>
        </EmptyState>
      )}
    </>
  );

  // Модальное окно создания папки
  const renderCreateFolderModal = () => {
    if (!showCreateFolderModal) return null;
    
    return (
      <ModalOverlay onClick={() => setShowCreateFolderModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <h2>📁 Создать новую папку</h2>
          <ModalInput
            type="text"
            placeholder="Название папки"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
          <ModalTextarea
            placeholder="Описание (необязательно)"
            value={newFolderDescription}
            onChange={(e) => setNewFolderDescription(e.target.value)}
          />
          <div style={{ marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
            Выберите цвет:
          </div>
          <ColorPicker>
            {FOLDER_COLORS.map((color) => (
              <ColorOption
                key={color}
                $color={color}
                $selected={newFolderColor === color}
                onClick={() => setNewFolderColor(color)}
              />
            ))}
          </ColorPicker>
          <ModalButtons>
            <ModalButton 
              className="cancel" 
              onClick={() => setShowCreateFolderModal(false)}
            >
              Отмена
            </ModalButton>
            <ModalButton 
              className="create" 
              onClick={createFolder}
              disabled={!newFolderName.trim()}
            >
              Создать
            </ModalButton>
          </ModalButtons>
        </ModalContent>
      </ModalOverlay>
    );
  };

  // Вкладка "Игры" (только для учеников)
  const renderGamesTab = () => {
    if (userRole === 'teacher') {
      return (
        <EmptyState>
          <div className="icon">👨‍🏫</div>
          <h3>Игры доступны только для учеников</h3>
          <p>Как учитель, вы можете создавать наборы и тесты для своих учеников</p>
          <CreateButton onClick={() => navigate('/sets/create')}>
            ➕ Создать набор
          </CreateButton>
        </EmptyState>
      );
    }
    
    return (
      <SetsGrid>
        <SetCard onClick={() => navigate('/games/match')}>
          <div className="preview" style={{ background: 'linear-gradient(135deg, #ffedd5 0%, #fb923c 100%)' }}>
            <div className="preview-term" style={{ fontSize: '32px', textAlign: 'center' }}>🔗</div>
          </div>
          <h3>Подбор (Match)</h3>
          <div className="meta">
            <span>Соединяйте термины с определениями</span>
          </div>
        </SetCard>

        <SetCard onClick={() => navigate('/games/gravity')}>
          <div className="preview" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%)' }}>
            <div className="preview-term" style={{ fontSize: '32px', textAlign: 'center' }}>🌌</div>
          </div>
          <h3>Гравитация</h3>
          <div className="meta">
            <span>Ловите падающие термины</span>
          </div>
        </SetCard>

        <SetCard onClick={() => navigate('/live')}>
          <div className="preview" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #f43f5e 100%)' }}>
            <div className="preview-term" style={{ fontSize: '32px', textAlign: 'center' }}>⚡</div>
          </div>
          <h3>Live игра</h3>
          <div className="meta">
            <span>Соревнуйтесь с друзьями онлайн</span>
          </div>
        </SetCard>
      </SetsGrid>
    );
  };

  // Вкладка "Статистика"
  const renderStatsTab = () => (
    <>
      <SetsGrid>
        <SidebarCard>
          <h3>📚 Прогресс изучения</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#63b3ed' }}>
              {stats?.setsStudied || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Наборов изучено</div>
          </div>
        </SidebarCard>

        <SidebarCard>
          <h3>✅ Правильных ответов</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#22c55e' }}>
              {stats?.cardsMastered || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Карточек освоено</div>
          </div>
        </SidebarCard>

        <SidebarCard>
          <h3>🔥 Серия</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#f59e0b' }}>
              {stats?.streakDays || 0}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Дней подряд</div>
          </div>
        </SidebarCard>

        <SidebarCard>
          <h3>🎯 Точность</h3>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', fontWeight: '700', color: '#8b5cf6' }}>
              {stats?.accuracy || 0}%
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Средняя точность</div>
          </div>
        </SidebarCard>
      </SetsGrid>

      <SidebarCard>
        <h3>📈 История сессий</h3>
        {stats?.sessionHistory?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats.sessionHistory.slice(0, 10).map((session, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <span>{new Date(session.date).toLocaleDateString()}</span>
                <span style={{ color: '#22c55e', fontWeight: '600' }}>
                  {Math.round((session.correctAnswers / session.cardsAttempted) * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Пока нет данных о сессиях
          </div>
        )}
      </SidebarCard>
    </>
  );

  // Вкладка "Достижения"
  const renderAchievementsTab = () => {
    const achievements = [
      { id: 1, name: 'Новичок', desc: 'Создайте первый набор', icon: '🌱', unlocked: userSets.length > 0 },
      { id: 2, name: 'Ученик', desc: 'Изучите 10 карточек', icon: '📖', unlocked: (stats?.cardsMastered || 0) >= 10 },
      { id: 3, name: 'Эксперт', desc: 'Достигните точности 90%', icon: '🎯', unlocked: (stats?.accuracy || 0) >= 90 },
      { id: 4, name: 'Марафонец', desc: '7 дней streak', icon: '🔥', unlocked: (stats?.streakDays || 0) >= 7 },
      { id: 5, name: 'Мастер', desc: 'Изучите 100 карточек', icon: '👑', unlocked: (stats?.cardsMastered || 0) >= 100 },
      { id: 6, name: 'Библиотекарь', desc: 'Создайте 5 наборов', icon: '📚', unlocked: userSets.length >= 5 },
    ];

    return (
      <>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
          <h2 style={{ margin: 0, color: '#1a1a1a' }}>Ваши достижения</h2>
          <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>
            {achievements.filter(a => a.unlocked).length} из {achievements.length} разблокировано
          </p>
        </div>

        <SetsGrid>
          {achievements.map(achievement => (
            <AchievementBadge key={achievement.id} locked={!achievement.unlocked}>
              <span className="badge-icon">{achievement.icon}</span>
              <div className="badge-info">
                <div className="name">{achievement.name}</div>
                <div className="desc">{achievement.desc}</div>
              </div>
              {achievement.unlocked && <span>✅</span>}
            </AchievementBadge>
          ))}
        </SetsGrid>
      </>
    );
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner>
          <div className="spinner" />
        </LoadingSpinner>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      {/* Верхняя панель пользователя */}
      <UserHeader>
        <UserInfo>
          <Avatar>{avatars.find(a => a.id === avatar)?.emoji || '👤'}</Avatar>
          <UserDetails $role={userRole}>
            <h1>{user?.username || user?.name || 'Пользователь'}</h1>
            <span className="role">
              {userRole === 'teacher' ? '👨‍🏫 Учитель' : '👨‍🎓 Ученик'}
            </span>
            {user?._id && (
              <div 
                style={{ 
                  fontSize: '0.75rem', 
                  color: '#718096', 
                  fontFamily: 'monospace',
                  marginTop: '0.25rem',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigator.clipboard.writeText(user._id);
                  alert('ID скопирован: ' + user._id);
                }}
                title="Кликни чтобы скопировать"
              >
                🆔 {user._id}
              </div>
            )}
          </UserDetails>
        </UserInfo>

        <QuickStats>
          <StatItem className="streak">
            <div className="value">🔥 {stats?.streakDays || 0}</div>
            <div className="label">дней streak</div>
          </StatItem>
          <StatItem>
            <div className="value">{stats?.cardsMastered || 0}</div>
            <div className="label">карточек</div>
          </StatItem>
          <StatItem>
            <div className="value">{stats?.accuracy || 0}%</div>
            <div className="label">точность</div>
          </StatItem>
        </QuickStats>

        <ButtonGroup>
          <GamificationButton onClick={() => setShowAchievementsModal(true)}>
            🏆 Достижения
          </GamificationButton>
          <GamificationButton $variant="leaderboard" onClick={() => setShowLeaderboardModal(true)}>
            🥇 Таблица лидеров
          </GamificationButton>
          <CreateButton onClick={() => navigate('/sets/create')}>
            ➕ Создать набор
          </CreateButton>
        </ButtonGroup>
      </UserHeader>

      {/* Навигация по вкладкам */}
      <TabNavigation>
        <Tab 
          active={activeTab === 'sets'} 
          onClick={() => setActiveTab('sets')}
        >
          📚 {userRole === 'teacher' ? 'Мои наборы' : 'Мои наборы'}
        </Tab>
        <Tab 
          active={activeTab === 'folders'} 
          onClick={() => setActiveTab('folders')}
        >
          📁 Папки
        </Tab>
        {userRole === 'student' && (
          <Tab 
            active={activeTab === 'games'} 
            onClick={() => setActiveTab('games')}
          >
            🎮 Игры
          </Tab>
        )}
        {userRole === 'teacher' && (
          <Tab 
            active={activeTab === 'classes'} 
            onClick={() => setActiveTab('classes')}
          >
            🎓 Классы
          </Tab>
        )}
        <Tab 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
        >
          📊 {userRole === 'teacher' ? 'Аналитика' : 'Статистика'}
        </Tab>

        <Tab 
          active={activeTab === 'friends'} 
          onClick={() => setActiveTab('friends')}
        >
          👥 Друзья
        </Tab>
      </TabNavigation>

      {/* Основной контент */}
      <MainContent>
        <ContentArea>
          {activeTab === 'sets' && renderSetsTab()}
          {activeTab === 'folders' && renderFoldersTab()}
          {activeTab === 'games' && renderGamesTab()}
          {activeTab === 'stats' && renderStatsTab()}

          {activeTab === 'classes' && (
            <EmptyState>
              <div className="icon">👥</div>
              <h3>Управление классами</h3>
              <p>Создавайте классы и добавляйте учеников для отслеживания их прогресса</p>
              <CreateButton onClick={() => navigate('/classes/create')}>
                ➕ Создать класс
              </CreateButton>
            </EmptyState>
          )}
          {activeTab === 'friends' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <FriendsList user={user} />
              <Challenges user={user} />
            </div>
          )}
        </ContentArea>

        {/* Боковая панель */}
        <Sidebar>
          <SidebarCard>
            <h3>👤 Профиль</h3>
            <SidebarMenu>
              <SidebarItem onClick={() => navigate('/profile')}>
                <span className="icon">⚙️</span>
                Настройки
              </SidebarItem>
              <SidebarItem onClick={() => navigate('/help')}>
                <span className="icon">❓</span>
                Помощь
              </SidebarItem>
              <SidebarItem onClick={() => navigate('/library')}>
                <span className="icon">🌍</span>
                Публичная библиотека
              </SidebarItem>
              {user?.role === 'admin' && (
                <SidebarItem onClick={() => navigate('/admin')}>
                  <span className="icon">🛡️</span>
                  Админ-панель
                </SidebarItem>
              )}
            </SidebarMenu>
          </SidebarCard>

          <GamificationPanel gamificationData={gamificationData} />

          <SidebarCard>
            <h3>🎯 Быстрые действия</h3>
            <SidebarMenu>
              <SidebarItem onClick={() => navigate('/test/constructor')}>
                <span className="icon">🛠️</span>
                Создать тест
              </SidebarItem>
              {userRole === 'student' ? (
                <>
                  <SidebarItem onClick={() => navigate('/learn/study')}>
                    <span className="icon">🎓</span>
                    Режим заучивания
                  </SidebarItem>
                  <SidebarItem onClick={() => navigate('/learn/write')}>
                    <span className="icon">✍️</span>
                    Режим письма
                  </SidebarItem>
                </>
              ) : (
                <>
                  <SidebarItem onClick={() => navigate('/classes')}>
                    <span className="icon">👥</span>
                    Мои классы
                  </SidebarItem>
                  <SidebarItem onClick={() => navigate('/analytics')}>
                    <span className="icon">📈</span>
                    Аналитика учеников
                  </SidebarItem>
                </>
              )}
            </SidebarMenu>
          </SidebarCard>

          <SidebarCard>
            <h3>🏅 Последнее достижение</h3>
            {userSets.length > 0 ? (
              <AchievementBadge>
                <span className="badge-icon">🌱</span>
                <div className="badge-info">
                  <div className="name">Новичок</div>
                  <div className="desc">Создан первый набор!</div>
                </div>
              </AchievementBadge>
            ) : (
              <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                Создайте первый набор, чтобы получить достижение!
              </div>
            )}
          </SidebarCard>
        </Sidebar>
      </MainContent>

      {/* Модальное окно создания папки */}
      {renderCreateFolderModal()}
      
      {/* Gamification Modals */}
      <AchievementsModal 
        isOpen={showAchievementsModal} 
        onClose={() => setShowAchievementsModal(false)}
        gamificationData={gamificationData}
      />
      <LeaderboardModal 
        isOpen={showLeaderboardModal} 
        onClose={() => setShowLeaderboardModal(false)}
      />
    </DashboardContainer>
  );
}

export default Dashboard;
