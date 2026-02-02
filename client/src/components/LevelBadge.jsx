import React from 'react';
import styled from 'styled-components';



const getLevelColor = (level) => {
  if (level < 10) return { bg: '#9ca3af', gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' }; // Серый
  if (level < 20) return { bg: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }; // Зеленый
  if (level < 30) return { bg: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }; // Синий
  if (level < 40) return { bg: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }; // Фиолетовый
  if (level < 50) return { bg: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }; // Оранжевый
  if (level < 75) return { bg: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }; // Красный
  return { bg: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }; // Розовый/Золотой
};

const getSizeStyles = (size) => {
  switch (size) {
    case 'small':
      return {
        width: '32px',
        height: '32px',
        fontSize: '14px',
        borderWidth: '2px',
        shadow: '0 2px 8px',
      };
    case 'large':
      return {
        width: '72px',
        height: '72px',
        fontSize: '28px',
        borderWidth: '4px',
        shadow: '0 8px 24px',
      };
    case 'medium':
    default:
      return {
        width: '48px',
        height: '48px',
        fontSize: '20px',
        borderWidth: '3px',
        shadow: '0 4px 12px',
      };
  }
};

const BadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  color: white;
  position: relative;
  transition: all 0.3s ease;
  cursor: default;
  
  width: ${props => getSizeStyles(props.$size).width};
  height: ${props => getSizeStyles(props.$size).height};
  font-size: ${props => getSizeStyles(props.$size).fontSize};
  border: ${props => getSizeStyles(props.$size).borderWidth} solid rgba(255, 255, 255, 0.3);
  background: ${props => getLevelColor(props.$level).gradient};
  box-shadow: ${props => getSizeStyles(props.$size).shadow} ${props => getLevelColor(props.$level).bg}40;
  
  ${props => props.$animated && `
    transition: transform 0.2s ease;
  `}
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: linear-gradient(
      120deg,
      transparent 30%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 70%
    );
    background-size: 200% 100%;
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  &:hover {
    transform: scale(1.1);
    box-shadow: ${props => getSizeStyles(props.$size).shadow} ${props => getLevelColor(props.$level).bg}60;
  }
`;

const LevelLabel = styled.span`
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: white;
  color: #1a1a1a;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: ${props => props.$showLabel ? 'block' : 'none'};
`;

const StarDecoration = styled.span`
  position: absolute;
  font-size: ${props => props.$size === 'small' ? '8px' : props.$size === 'large' ? '16px' : '12px'};
  transition: transform 0.2s ease;
  animation-delay: ${props => props.$delay}s;
  
  &.top-left {
    top: -4px;
    left: -4px;
  }
  
  &.top-right {
    top: -4px;
    right: -4px;
  }
  
  &.bottom-left {
    bottom: -4px;
    left: -4px;
  }
`;

/**
 * Компонент значка уровня
 * @param {number} level - Уровень пользователя
 * @param {string} size - Размер: 'small', 'medium', 'large'
 * @param {boolean} animated - Включить анимацию
 * @param {boolean} showStars - Показать декоративные звездочки
 * @param {boolean} showLabel - Показать метку "LVL"
 */
function LevelBadge({ 
  level = 1, 
  size = 'medium', 
  animated = false, 
  showStars = false,
  showLabel = false 
}) {
  return (
    <BadgeContainer 
      $level={level} 
      $size={size} 
      $animated={animated}
      title={`Уровень ${level}`}
    >
      {level}
      {showStars && level >= 20 && (
        <>
          <StarDecoration $size={size} $delay={0} className="top-left">✨</StarDecoration>
          <StarDecoration $size={size} $delay={0.5} className="top-right">⭐</StarDecoration>
        </>
      )}
      {showStars && level >= 50 && (
        <StarDecoration $size={size} $delay={1} className="bottom-left">💫</StarDecoration>
      )}
      <LevelLabel $showLabel={showLabel}>LVL</LevelLabel>
    </BadgeContainer>
  );
}

export default LevelBadge;
