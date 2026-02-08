import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { API_ROUTES, authFetch } from '../constants/api';
import LevelBadge from './LevelBadge';
import { useTheme } from '../contexts/ThemeContext';

const PanelContainer = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
`;

const LevelInfo = styled.div`
  flex: 1;
`;

const LevelText = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
`;

const LevelNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
`;

const XpInfo = styled.div`
  text-align: right;
`;

const XpText = styled.div`
  font-size: 14px;
  color: var(--text-secondary);
`;

const XpNumber = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #f59e0b;
`;

const ProgressBar = styled.div`
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: 10px;
  overflow: hidden;
  margin: 12px 0;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
  border-radius: 10px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  width: ${props => props.$progress}%;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const StatBox = styled.div`
  text-align: center;
  padding: 12px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$color || 'var(--text-primary)'};
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const QuestsSection = styled.div`
  margin-top: 20px;
`;

const QuestsTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuestItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$completed 
    ? 'rgba(16, 185, 129, 0.18)'
    : 'var(--bg-tertiary)'};
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
  }
`;

const QuestIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: ${props => props.$completed ? '#10b981' : 'var(--bg-hover)'};
  transition: all 0.3s ease;
`;

const QuestInfo = styled.div`
  flex: 1;
`;

const QuestName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$completed ? '#10b981' : 'var(--text-primary)'};
`;

const QuestProgress = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
`;

const QuestReward = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #f59e0b;
  padding: 4px 8px;
  background: var(--bg-hover);
  border-radius: 6px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-light);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: var(--text-secondary);
  font-size: 14px;
`;

const isSameData = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function GamificationPanel() {
  const { themeData } = useTheme();
  const isDark = themeData?.name === 'Темная' || themeData?.name === 'Космическая';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetchData();
    
    // Автообновление каждые 10 секунд для актуальных данных
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);
      
      const res = await authFetch(API_ROUTES.GAMIFICATION);
      
      if (!res.ok) {
        throw new Error('Failed to load gamification data');
      }
      
      const result = await res.json();
      
      if (result.success && result.data) {
        setData(prev => (isSameData(prev, result.data) ? prev : result.data));
      } else {
        // If no data from server, show zeros (not demo data)
        const emptyData = {
          level: 1,
          xp: 0,
          totalXp: 0,
          xpForNextLevel: 100,
          progress: { current: 0, total: 100, percentage: 0 },
          achievements: [],
          dailyQuests: [],
          weeklyExam: null,
          streak: { current: 0, longest: 0 },
          stats: { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 }
        };
        setData(prev => (isSameData(prev, emptyData) ? prev : emptyData));
      }
    } catch (error) {
      console.error('Error loading gamification:', error);
      setError(error.message);
      // Show empty state on error
      const emptyData = {
        level: 1,
        xp: 0,
        totalXp: 0,
        xpForNextLevel: 100,
        progress: { current: 0, total: 100, percentage: 0 },
        achievements: [],
        dailyQuests: [],
        weeklyExam: null,
        streak: { current: 0, longest: 0 },
        stats: { cardsStudied: 0, testsPassed: 0, gamesWon: 0, perfectScores: 0 }
      };
      setData(prev => (isSameData(prev, emptyData) ? prev : emptyData));
    } finally {
      if (isInitialLoad.current) {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  };

  if (loading) {
    return (
      <LoadingSpinner>
        <div className="spinner" />
      </LoadingSpinner>
    );
  }

  const xpProgress = data?.progress?.percentage || 0;

  return (
    <PanelContainer $isDark={isDark}>
      <HeaderSection>
        <LevelBadge level={data?.level || 1} size="large" />
        <LevelInfo>
          <LevelText $isDark={isDark}>Уровень</LevelText>
          <LevelNumber $isDark={isDark}>{data?.level || 1}</LevelNumber>
        </LevelInfo>
        <XpInfo>
          <XpText $isDark={isDark}>XP</XpText>
          <XpNumber>{data?.xp || 0} / {data?.xpForNextLevel || 100}</XpNumber>
        </XpInfo>
      </HeaderSection>

      <ProgressBar $isDark={isDark}>
        <ProgressFill $progress={xpProgress} $isDark={isDark} />
      </ProgressBar>

      <StatsGrid>
        <StatBox $isDark={isDark}>
          <StatValue $color="#f59e0b" $isDark={isDark}>🔥 {data?.streak?.current || 0}</StatValue>
          <StatLabel $isDark={isDark}>Streak</StatLabel>
        </StatBox>
        <StatBox $isDark={isDark}>
          <StatValue $color="#3b82f6" $isDark={isDark}>{data?.stats?.cardsStudied || 0}</StatValue>
          <StatLabel $isDark={isDark}>Карточек</StatLabel>
        </StatBox>
        <StatBox $isDark={isDark}>
          <StatValue $color="#10b981" $isDark={isDark}>{data?.stats?.perfectScores || 0}</StatValue>
          <StatLabel $isDark={isDark}>Идеальных тестов</StatLabel>
        </StatBox>
      </StatsGrid>

      <QuestsSection>
        <QuestsTitle $isDark={isDark}>🎯 Ежедневные задания</QuestsTitle>
        {(data?.dailyQuests || []).length > 0 ? (
          data.dailyQuests.map(quest => (
            <QuestItem key={quest.questId} $completed={quest.completed} $isDark={isDark}>
              <QuestIcon $completed={quest.completed}>{quest.icon || '🎯'}</QuestIcon>
              <QuestInfo>
                <QuestName $completed={quest.completed} $isDark={isDark}>
                  {quest.completed ? '✅ ' : ''}{quest.name}
                </QuestName>
                <QuestProgress $isDark={isDark}>
                  {quest.current} / {quest.target}
                </QuestProgress>
              </QuestInfo>
              <QuestReward $isDark={isDark}>+{quest.reward} XP</QuestReward>
            </QuestItem>
          ))
        ) : (
          <EmptyState $isDark={isDark}>
            Нет активных заданий. Начните учиться!
          </EmptyState>
        )}
      </QuestsSection>

      <QuestsSection>
        <QuestsTitle $isDark={isDark}>🧪 Еженедельный экзамен</QuestsTitle>
        {data?.weeklyExam ? (
          <QuestItem $completed={data.weeklyExam.completed} $isDark={isDark}>
            <QuestIcon $completed={data.weeklyExam.completed}>🧪</QuestIcon>
            <QuestInfo>
              <QuestName $completed={data.weeklyExam.completed} $isDark={isDark}>
                {data.weeklyExam.completed ? '✅ ' : ''}{data.weeklyExam.name}
              </QuestName>
              <QuestProgress $isDark={isDark}>
                {data.weeklyExam.current} / {data.weeklyExam.target}
              </QuestProgress>
            </QuestInfo>
            <QuestReward $isDark={isDark}>+{data.weeklyExam.reward} XP</QuestReward>
          </QuestItem>
        ) : (
          <EmptyState $isDark={isDark}>
            Экзамен появится в начале недели
          </EmptyState>
        )}
      </QuestsSection>
    </PanelContainer>
  );
}

export default GamificationPanel;
