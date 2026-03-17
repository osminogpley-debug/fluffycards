import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.14) 0%, rgba(72, 187, 120, 0.08) 100%);
  border-radius: 18px;
  padding: 22px;
  border: 1px solid rgba(99, 179, 237, 0.22);
  margin-bottom: 18px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const TextWrap = styled.div`
  h2 {
    margin: 0 0 6px;
    font-size: 1.2rem;
    color: var(--text-primary);
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.5;
    font-size: 0.92rem;
  }
`;

const Accent = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const Tile = styled.div`
  background: var(--card-bg);
  border-radius: 14px;
  border: 1px solid var(--border-color);
  padding: 14px;
`;

const TileTitle = styled.div`
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
`;

const TileValue = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  background: ${props => props.$secondary ? 'var(--card-bg)' : 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
  color: ${props => props.$secondary ? 'var(--text-primary)' : 'white'};
  border: ${props => props.$secondary ? '1px solid var(--border-color)' : 'none'};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
  }
`;

function SmartStudyPanel({
  userRole,
  stats,
  gamificationData,
  discoveryFeed,
  onOpenSet,
  onOpenLibrary,
  onCreateSet,
  onOpenGames,
  onOpenClasses
}) {
  const gamification = gamificationData?.data || gamificationData || {};
  const dailyQuests = gamification.dailyQuests || [];
  const pendingQuests = dailyQuests.filter((quest) => !quest.completed);
  const reviewQueue = discoveryFeed?.reviewQueue || [];
  const nextSet = reviewQueue[0] || discoveryFeed?.continueLearning?.[0] || null;
  const cardsMastered = stats?.cardsMastered || 0;
  const streakDays = stats?.streakDays || gamification?.streak?.current || 0;

  const headline = userRole === 'teacher'
    ? 'Управляйте классами без лишних шагов'
    : pendingQuests.length > 0
      ? 'У вас есть простой следующий шаг на сегодня'
      : nextSet
        ? 'Самое время закрепить уже знакомый материал'
        : 'Подготовил для вас быстрый вход в учебный ритм';

  const description = userRole === 'teacher'
    ? 'Сначала создайте класс или набор, затем уже раздавайте задания. Так путь для преподавателя получается короче и понятнее.'
    : pendingQuests.length > 0
      ? `Осталось ${pendingQuests.length} незавершенных заданий на сегодня. Закройте их, чтобы не потерять темп.`
      : nextSet
        ? `Лучший кандидат на повторение сейчас: «${nextSet.title}». Он уже знаком, значит вход в сессию будет быстрым.`
        : 'Если хотите быстрее войти в привычку, начните с короткой сессии: 1 набор, 1 режим, 5 минут без переключений.';

  return (
    <Card>
      <Header>
        <TextWrap>
          <h2>✨ Фокус на сегодня</h2>
          <p>{headline}. {description}</p>
        </TextWrap>
        <Accent>{userRole === 'teacher' ? '👨‍🏫' : '🎯'}</Accent>
      </Header>

      <Grid>
        <Tile>
          <TileTitle>{userRole === 'teacher' ? 'Следующее действие' : 'Лучший следующий шаг'}</TileTitle>
          <TileValue>
            {userRole === 'teacher'
              ? 'Создать класс или набор'
              : nextSet
                ? `Повторить «${nextSet.title}»`
                : 'Запустить короткую учебную сессию'}
          </TileValue>
        </Tile>
        <Tile>
          <TileTitle>{userRole === 'teacher' ? 'Активность' : 'Серия'}</TileTitle>
          <TileValue>
            {userRole === 'teacher' ? `${stats?.setsStudied || 0} активных наборов` : `${streakDays} дней подряд`}
          </TileValue>
        </Tile>
        <Tile>
          <TileTitle>{userRole === 'teacher' ? 'Подсказка' : 'Прогресс'}</TileTitle>
          <TileValue>
            {userRole === 'teacher' ? 'Дайте ученикам 1 понятный маршрут' : `${cardsMastered} карточек уже освоено`}
          </TileValue>
        </Tile>
      </Grid>

      <ActionRow>
        {userRole === 'teacher' ? (
          <>
            <ActionButton onClick={onCreateSet}>➕ Создать набор</ActionButton>
            <ActionButton $secondary onClick={onOpenClasses}>🎓 Открыть классы</ActionButton>
          </>
        ) : (
          <>
            {nextSet ? (
              <ActionButton onClick={() => onOpenSet(nextSet._id || nextSet.id)}>📖 Продолжить</ActionButton>
            ) : (
              <ActionButton onClick={onOpenLibrary}>🌍 Найти набор</ActionButton>
            )}
            <ActionButton $secondary onClick={onOpenGames}>🎮 Перейти в игры</ActionButton>
            <ActionButton $secondary onClick={onCreateSet}>➕ Создать свой набор</ActionButton>
          </>
        )}
      </ActionRow>
    </Card>
  );
}

export default SmartStudyPanel;