import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Контейнер лидерборда
const LeaderboardContainer = styled.div`
  background: var(--card-bg, linear-gradient(135deg, #fff5f7 0%, #ffe4ec 100%));
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px var(--shadow-color, rgba(255, 182, 193, 0.3));
  border: 1px solid var(--border-color, #ffcdd2);
`;

const Title = styled.h2`
  text-align: center;
  color: var(--text-primary, #e91e63);
  font-size: 2rem;
  margin-bottom: 1.5rem;
  
  &::before {
    content: "🏆 ";
  }
  
  &::after {
    content: " 🏆";
  }
`;

// Трасса гонки
const RaceTrack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
`;

// Дорожка для каждой команды
const TrackLane = styled.div`
  background: var(--bg-secondary, linear-gradient(90deg, #f8f9fa 0%, #e9ecef 100%));
  border-radius: 16px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color, #dee2e6);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #ffb6c1;
    box-shadow: 0 4px 15px var(--shadow-color, rgba(255, 182, 193, 0.3));
  }
`;

// Информация о команде
const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
`;

const TeamEmoji = styled.span`
  font-size: 2.5rem;
  transition: transform 0.3s ease;
`;

const TeamName = styled.span`
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--text-primary, #2d3748);
`;

const TeamScore = styled.span`
  margin-left: auto;
  background: linear-gradient(135deg, #ff6b9d 0%, #e91e63 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 1.1rem;
`;

// Прогресс бар
const ProgressContainer = styled.div`
  background: var(--bg-tertiary, #e2e8f0);
  border-radius: 12px;
  height: 24px;
  overflow: hidden;
  position: relative;
`;

const ProgressBar = styled.div`
  background: linear-gradient(90deg, ${({ color }) => color} 0%, ${({ color }) => color}dd 100%);
  height: 100%;
  border-radius: 12px;
  width: ${({ progress }) => progress}%;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  
  &::after {
    content: "${({ emoji }) => emoji}";
    position: absolute;
    right: -15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.5rem;
  }
`;

// Позиция в гонке
const Position = styled.div`
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ position }) => {
    if (position === 1) return 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)';
    if (position === 2) return 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)';
    if (position === 3) return 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)';
    return '#718096';
  }};
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
`;

// Звёзды для победителя
const WinnerStars = styled.div`
  position: absolute;
  top: -20px;
  right: 20px;
  font-size: 1.5rem;
`;

// Медаль
const Medal = styled.span`
  font-size: 1.5rem;
  margin-left: 0.5rem;
`;

// Топ 3 пьедестал
const PodiumContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1rem;
  margin: 2rem 0;
  height: 150px;
`;

const PodiumPlace = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background: linear-gradient(180deg, ${({ color }) => color} 0%, ${({ color }) => color}dd 100%);
  border-radius: 12px 12px 0 0;
  padding: 1rem;
  width: ${({ width }) => width}px;
  height: ${({ height }) => height}px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.6s ease;
`;

const PodiumEmoji = styled.span`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
`;

const PodiumScore = styled.span`
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
`;

// Компонент лидерборда
const LiveLeaderboard = ({ teams, totalQuestions, showPodium = false }) => {
  // Сортируем команды по очкам
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...teams.map(t => t.score), 1);
  
  // Цвета для команд
  const teamColors = {
    fox: '#ff8a65',
    rabbit: '#81c784',
    bear: '#a1887f',
    cat: '#ffd54f',
    panda: '#e0e0e0',
    dog: '#4fc3f7',
    owl: '#9575cd',
    penguin: '#4dd0e1'
  };
  
  const getMedal = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  };
  
  if (showPodium && sortedTeams.length >= 3) {
    const top3 = sortedTeams.slice(0, 3);
    // Переупорядочиваем для пьедестала: 2, 1, 3
    const podiumOrder = [top3[1], top3[0], top3[2]];
    const heights = [100, 150, 80];
    const widths = [100, 120, 100];
    const colors = ['#c0c0c0', '#ffd700', '#cd7f32'];
    
    return (
      <LeaderboardContainer>
        <Title>Результаты гонки!</Title>
        <PodiumContainer>
          {podiumOrder.map((team, index) => (
            <PodiumPlace 
              key={team.id}
              height={heights[index]}
              width={widths[index]}
              color={colors[index]}
            >
              <PodiumEmoji>{team.emoji}</PodiumEmoji>
              <PodiumScore>{team.score}</PodiumScore>
            </PodiumPlace>
          ))}
        </PodiumContainer>
        <div style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--text-primary)' }}>
          <h3>🎉 {top3[0].name} побеждают! 🎉</h3>
        </div>
      </LeaderboardContainer>
    );
  }
  
  return (
    <LeaderboardContainer>
      <Title>Гонка знаний</Title>
      
      <RaceTrack>
        {sortedTeams.map((team, index) => {
          const progress = (team.score / (totalQuestions * 10)) * 100;
          const position = index + 1;
          const color = teamColors[team.mascot] || '#63b3ed';
          
          return (
            <TrackLane key={team.id}>
              {position === 1 && team.score > 0 && (
                <WinnerStars>⭐ ⭐ ⭐</WinnerStars>
              )}
              
              <TeamInfo>
                <Position position={position}>{position}</Position>
                <TeamEmoji delay={index * 0.2}>{team.emoji}</TeamEmoji>
                <TeamName>
                  {team.name}
                  <Medal>{getMedal(position)}</Medal>
                </TeamName>
                <TeamScore>{team.score} очков</TeamScore>
              </TeamInfo>
              
              <ProgressContainer>
                <ProgressBar 
                  progress={Math.min(progress, 100)} 
                  color={color}
                  emoji={team.emoji}
                />
              </ProgressContainer>
            </TrackLane>
          );
        })}
      </RaceTrack>
      
      <div style={{ 
        textAlign: 'center', 
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '12px',
        fontSize: '0.9rem',
        color: '#718096'
      }}>
        🎯 Максимум: {totalQuestions * 10} очков | 🏃 Первая команда до финиша побеждает!
      </div>
    </LeaderboardContainer>
  );
};

export default LiveLeaderboard;
