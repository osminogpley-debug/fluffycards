import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../services/socialService';

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1rem;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  min-width: 22px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ReadAllButton = styled.button`
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;

  &:hover:not(:disabled) {
    color: var(--text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Item = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid ${props => props.$read ? 'var(--border-color)' : 'rgba(99, 179, 237, 0.45)'};
  background: ${props => props.$read ? 'var(--bg-secondary)' : 'rgba(99, 179, 237, 0.08)'};
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #63b3ed;
  }
`;

const ItemTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const Icon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.div`
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 3px;
`;

const Message = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.45;
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
`;

const Empty = styled.div`
  text-align: center;
  padding: 18px 10px;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const typeIconMap = {
  friend_request: '🤝',
  friend_accept: '🎉',
  follow: '👤',
  challenge_join: '🏁',
  achievement_unlocked: '🏆',
  quest_completed: '✅'
};

const formatRelativeDate = (value) => {
  const date = new Date(value);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} мин назад`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} дн назад`;
};

function NotificationCenter({ unreadCount = 0, onUnreadChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getNotifications(12);
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const intervalId = setInterval(load, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleReadAll = async () => {
    setUpdating(true);
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(item => ({ ...item, read: true })));
    if (onUnreadChange) onUnreadChange();
    setUpdating(false);
  };

  const handleOpen = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification._id);
      setNotifications(prev => prev.map(item => (
        item._id === notification._id ? { ...item, read: true } : item
      )));
      if (onUnreadChange) onUnreadChange();
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <Card>
      <Header>
        <h3>🔔 Уведомления</h3>
        <HeaderActions>
          {unreadCount > 0 && <Badge>{unreadCount > 99 ? '99+' : unreadCount}</Badge>}
          <ReadAllButton onClick={handleReadAll} disabled={updating || unreadCount === 0}>
            Прочитать все
          </ReadAllButton>
        </HeaderActions>
      </Header>

      {loading ? (
        <Empty>Загружаем уведомления...</Empty>
      ) : notifications.length === 0 ? (
        <Empty>Пока пусто. Здесь появятся новые подписки, достижения и социальные события.</Empty>
      ) : (
        <List>
          {notifications.map((notification) => (
            <Item
              key={notification._id}
              $read={notification.read}
              onClick={() => handleOpen(notification)}
            >
              <ItemTop>
                <Icon>{typeIconMap[notification.type] || '🔔'}</Icon>
                <Content>
                  <Title>{notification.title}</Title>
                  <Message>{notification.message}</Message>
                  <Meta>
                    <span>{formatRelativeDate(notification.createdAt)}</span>
                    {!notification.read && <Dot />}
                  </Meta>
                </Content>
              </ItemTop>
            </Item>
          ))}
        </List>
      )}
    </Card>
  );
}

export default NotificationCenter;