import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from './UI/Buttons';
import { 
  getFriends, 
  searchUsers, 
  sendFriendRequest,
  getFriendRequests,
  handleFriendRequest,
  removeFriend
} from '../services/socialService';
import { FILE_BASE_URL } from '../constants/api';



const Container = styled.div`
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h3`
  font-size: 1.3rem;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
`;

const Tab = styled.button`
  background: ${props => props.$active ? '#63b3ed' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? '#4299e1' : '#e0f2fe'};
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary);
  border-radius: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--bg-hover);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const OnlineDot = styled.span`
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${p => p.$online ? '#48bb78' : '#a0aec0'};
  border: 2px solid var(--bg-secondary, #fff);
`;

const UserDetails = styled.div``;

const UserName = styled.div`
  font-weight: 600;
  color: var(--text-primary);
  
  &:hover {
    color: #63b3ed;
  }
`;

const UserMeta = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$danger ? '#fee2e2' : '#e0f2fe'};
  }
`;

const Badge = styled.span`
  background: #f56565;
  color: white;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  margin-left: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #a0aec0;
`;

const DEFAULT_AVATAR = 'https://fluffycards.com/default-avatar.png';
const resolveAvatar = (url) => {
  if (!url || url.includes('default-avatar.png') || url === DEFAULT_AVATAR) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};

const areFriendsEqual = (next, current) => {
  if (!Array.isArray(next) || !Array.isArray(current)) return false;
  if (next.length !== current.length) return false;
  for (let i = 0; i < next.length; i += 1) {
    const a = next[i];
    const b = current[i];
    if (!a || !b) return false;
    if ((a._id || a.userId) !== (b._id || b.userId)) return false;
    if (a.username !== b.username) return false;
    if (a.level !== b.level) return false;
    if (a.totalXp !== b.totalXp) return false;
    if (String(a.lastSeen || '') !== String(b.lastSeen || '')) return false;
  }
  return true;
};

const areRequestsEqual = (next, current) => {
  if (!Array.isArray(next) || !Array.isArray(current)) return false;
  if (next.length !== current.length) return false;
  for (let i = 0; i < next.length; i += 1) {
    const a = next[i];
    const b = current[i];
    if (!a || !b) return false;
    if (a._id !== b._id) return false;
    if (String(a?.from?._id || '') !== String(b?.from?._id || '')) return false;
    if (a.status !== b.status) return false;
  }
  return true;
};

function FriendsList({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isOnline = (lastSeen) => {
    if (!lastSeen) return false;
    return (Date.now() - new Date(lastSeen).getTime()) < 90 * 1000; // 90 sec
  };
  
  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const pollRef = useRef(null);

  const loadData = useCallback(async () => {
    const [friendsData, requestsData] = await Promise.all([
      getFriends(),
      getFriendRequests()
    ]);
    setFriends(prev => (areFriendsEqual(friendsData, prev) ? prev : friendsData));
    setRequests(prev => (areRequestsEqual(requestsData, prev) ? prev : requestsData));
  }, []);

  useEffect(() => {
    const startPolling = () => {
      if (pollRef.current) return;
      loadData();
      pollRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadData();
        }
      }, 30000);
    };

    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    startPolling();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadData();
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadData]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    setError(null);
    const results = await searchUsers(searchQuery);
    
    if (results?.error === 'auth') {
      setError('Ошибка авторизации. Попробуйте перезайти.');
      setSearchResults([]);
    } else if (Array.isArray(results)) {
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
    
    setLoading(false);
  };

  const handleAddFriend = async (userId) => {
    await sendFriendRequest(userId);
    setSearchResults(prev => prev.filter(u => u._id !== userId));
    loadData();
  };

  const handleRequest = async (requestId, status) => {
    await handleFriendRequest(requestId, status);
    loadData();
  };

  const handleRemove = async (friendId) => {
    if (window.confirm('Удалить из друзей?')) {
      await removeFriend(friendId);
      loadData();
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          👥 Друзья
          {requests.length > 0 && <Badge>{requests.length}</Badge>}
        </Title>
      </Header>

      <SearchBox>
        <SearchInput
          placeholder="Поиск по имени или ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
        />
        <PrimaryButton onClick={handleSearch} disabled={loading}>
          🔍
        </PrimaryButton>
      </SearchBox>

      {error && (
        <div style={{ 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: '0.75rem 1rem', 
          borderRadius: '8px',
          marginBottom: '1rem' 
        }}>
          ⚠️ {error}
        </div>
      )}

      <Tabs>
        <Tab 
          $active={activeTab === 'friends'}
          onClick={() => setActiveTab('friends')}
        >
          Друзья ({friends.length})
        </Tab>
        <Tab 
          $active={activeTab === 'requests'}
          onClick={() => setActiveTab('requests')}
        >
          Заявки {requests.length > 0 && `(${requests.length})`}
        </Tab>
        {searchResults.length > 0 && (
          <Tab 
            $active={activeTab === 'search'}
            onClick={() => setActiveTab('search')}
          >
            Поиск ({searchResults.length})
          </Tab>
        )}
      </Tabs>

      {activeTab === 'friends' && (
        <UserList>
          {friends.length === 0 ? (
            <EmptyState>
              У вас пока нет друзей.<br />
              Найдите друзей через поиск!
            </EmptyState>
          ) : (
            friends.map(friend => (
              <UserCard key={friend._id}>
                <UserInfo onClick={() => handleUserClick(friend._id || friend.userId)}>
                  <Avatar>
                    {resolveAvatar(friend.profileImage) ? <AvatarImg src={resolveAvatar(friend.profileImage)} alt="" /> : friend.username[0]}
                    <OnlineDot $online={isOnline(friend.lastSeen)} title={isOnline(friend.lastSeen) ? 'Онлайн' : 'Офлайн'} />
                  </Avatar>
                  <UserDetails>
                    <UserName>{friend.username}</UserName>
                    <UserMeta>
                      Уровень {friend.level} • {friend.totalXp} XP
                      {isOnline(friend.lastSeen) && <span style={{ color: '#48bb78', marginLeft: '6px' }}>● онлайн</span>}
                    </UserMeta>
                  </UserDetails>
                </UserInfo>
                <Actions>
                  <IconButton 
                    $danger
                    onClick={() => handleRemove(friend._id)}
                    title="Удалить"
                  >
                    🗑️
                  </IconButton>
                </Actions>
              </UserCard>
            ))
          )}
        </UserList>
      )}

      {activeTab === 'requests' && (
        <UserList>
          {requests.length === 0 ? (
            <EmptyState>Нет новых заявок</EmptyState>
          ) : (
            requests.map(request => (
              <UserCard key={request._id}>
                <UserInfo onClick={() => handleUserClick(request.from?._id)}>
                  <Avatar>
                    {resolveAvatar(request.from?.profileImage) ? <AvatarImg src={resolveAvatar(request.from?.profileImage)} alt="" /> : (request.from?.username?.[0] || '?')}
                  </Avatar>
                  <UserDetails>
                    <UserName>{request.from?.username || 'Пользователь'}</UserName>
                    <UserMeta>Хочет добавить вас в друзья</UserMeta>
                  </UserDetails>
                </UserInfo>
                <Actions>
                  <IconButton 
                    onClick={() => handleRequest(request._id, 'accepted')}
                    title="Принять"
                  >
                    ✅
                  </IconButton>
                  <IconButton 
                    $danger
                    onClick={() => handleRequest(request._id, 'rejected')}
                    title="Отклонить"
                  >
                    ❌
                  </IconButton>
                </Actions>
              </UserCard>
            ))
          )}
        </UserList>
      )}

      {activeTab === 'search' && (
        <UserList>
          {searchResults.map(result => (
            <UserCard key={result._id}>
              <UserInfo>
                <Avatar>
                  {resolveAvatar(result.profileImage) ? <AvatarImg src={resolveAvatar(result.profileImage)} alt="" /> : result.username[0]}
                </Avatar>
                <UserDetails>
                  <UserName>{result.username}</UserName>
                  <UserMeta>
                    Уровень {result.level} • {result.totalXp} XP
                  </UserMeta>
                </UserDetails>
              </UserInfo>
              <Actions>
                <IconButton 
                  onClick={() => handleAddFriend(result._id)}
                  title="Добавить в друзья"
                >
                  ➕
                </IconButton>
              </Actions>
            </UserCard>
          ))}
        </UserList>
      )}
    </Container>
  );
}

export default FriendsList;
