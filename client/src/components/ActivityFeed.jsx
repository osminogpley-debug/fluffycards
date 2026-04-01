import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FILE_BASE_URL } from '../constants/api';
import { getActivityFeed } from '../services/socialService';

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 1px solid var(--border-color);
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0 0 14px;
  color: var(--text-primary);
  font-size: 1rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Item = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;

  &:hover {
    border-color: #63b3ed;
    transform: translateY(-1px);
  }
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Body = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.div`
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 3px;
`;

const ItemMessage = styled.div`
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.45;
`;

const Meta = styled.div`
  color: var(--text-muted);
  font-size: 0.74rem;
  margin-top: 7px;
`;

const Empty = styled.div`
  color: var(--text-secondary);
  font-size: 0.88rem;
  text-align: center;
  padding: 12px 6px;
`;

const relativeTime = (value) => {
  const date = new Date(value);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  return `${Math.round(diffHours / 24)} дн назад`;
};

function ActivityFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getActivityFeed();
      setItems(data);
      setLoading(false);
    };

    load();
    const intervalId = setInterval(load, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card>
      <Title>🌊 Лента активности</Title>
      {loading ? (
        <Empty>Загружаем события...</Empty>
      ) : items.length === 0 ? (
        <Empty>Подпишитесь на авторов или добавьте друзей, чтобы видеть их активность здесь.</Empty>
      ) : (
        <List>
          {items.slice(0, 3).map((item) => {
            const actorImage = item.actor?.profileImage?.startsWith('/uploads/')
              ? `${FILE_BASE_URL}${item.actor.profileImage}`
              : item.actor?.profileImage;

            return (
              <Item key={item._id} onClick={() => item.link && navigate(item.link)}>
                <Row>
                  <Avatar>
                    {actorImage ? (
                      <img src={actorImage} alt="avatar" />
                    ) : (
                      item.actor?.username?.[0]?.toUpperCase() || '👤'
                    )}
                  </Avatar>
                  <Body>
                    <ItemTitle>{item.title}</ItemTitle>
                    <ItemMessage>{item.message}</ItemMessage>
                    <Meta>{relativeTime(item.createdAt)}</Meta>
                  </Body>
                </Row>
              </Item>
            );
          })}
        </List>
      )}
    </Card>
  );
}

export default ActivityFeed;