import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getMessages, sendMessage } from '../../services/liveService';

// Контейнер комнаты
const RoomContainer = styled.div`
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(156, 39, 176, 0.2);
  border: 3px solid #ce93d8;
`;

// Заголовок комнаты
const RoomHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const RoomTitle = styled.h2`
  color: #7b1fa2;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  
  &::before {
    content: "🚪 ";
  }
`;

const PinDisplay = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
`;

const PinLabel = styled.span`
  color: #718096;
  font-size: 0.9rem;
`;

const PinCode = styled.span`
  font-size: 2.5rem;
  font-weight: 800;
  color: #e91e63;
  letter-spacing: 0.5rem;
  font-family: 'Courier New', monospace;
`;

const CopyButton = styled.button`
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.4);
  }
`;

// Статус комнаты
const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  background: ${({ status }) => {
    switch (status) {
      case 'waiting': return '#e8f5e9';
      case 'playing': return '#e3f2fd';
      case 'finished': return '#fce4ec';
      default: return '#f5f5f5';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'waiting': return '#4caf50';
      case 'playing': return '#2196f3';
      case 'finished': return '#e91e63';
      default: return '#757575';
    }
  }};
`;

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
`;

// Список участников
const ParticipantsSection = styled.div`
  margin: 2rem 0;
`;

const SectionTitle = styled.h3`
  color: #4a5568;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ParticipantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
`;

const ParticipantCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid ${({ team }) => team || '#e2e8f0'};
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }
`;

const ParticipantEmoji = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  transition: transform 0.3s ease;
`;

const ParticipantName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
`;

const ParticipantTeam = styled.div`
  font-size: 0.8rem;
  color: #718096;
  margin-top: 0.25rem;
`;

// Чат
const ChatSection = styled.div`
  background: white;
  border-radius: 16px;
  padding: 1rem;
  margin-top: 2rem;
`;

const ChatMessages = styled.div`
  height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 1rem;
`;

const ChatMessage = styled.div`
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ChatAuthor = styled.span`
  font-weight: 600;
  color: ${({ color }) => color || '#4299e1'};
`;

const ChatText = styled.span`
  color: #4a5568;
  margin-left: 0.5rem;
`;

const ChatInput = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  
  &:focus {
    border-color: #ce93d8;
    outline: none;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #ab47bc 0%, #8e24aa 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(171, 71, 188, 0.4);
  }
`;

// Счётчик участников
const ParticipantCount = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  font-weight: 600;
  color: #4a5568;
`;

// Компонент комнаты
const LiveRoom = ({ 
  roomData, 
  isHost = false, 
  currentUser = null,
  onStartGame,
  onCloseRoom 
}) => {
  const [chatMessages, setChatMessages] = useState([
    { _id: 1, author: 'Система', text: 'Добро пожаловать в игровую комнату! 🎮', color: '#e91e63' },
    { _id: 2, author: 'Система', text: 'Используйте PIN для приглашения друзей 📌', color: '#e91e63' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);
  
  const { pin, status, participants = [], teams = [] } = roomData;

  const areMessagesEqual = (next, current) => JSON.stringify(next) === JSON.stringify(current);
  
  // Polling для синхронизации чата
  useEffect(() => {
    if (!pin) return;
    
    const fetchMessages = async () => {
      const messages = await getMessages(pin);
      if (messages && messages.length > 0) {
        // Добавляем системные сообщения если их еще нет
        const systemMessages = [
          { _id: 'sys1', author: 'Система', text: 'Добро пожаловать в игровую комнату! 🎮', color: '#e91e63' },
          { _id: 'sys2', author: 'Система', text: 'Используйте PIN для приглашения друзей 📌', color: '#e91e63' }
        ];
        
        // Фильтруем дубликаты системных сообщений
        const userMessages = messages.filter(m => m.author !== 'Система');
        const nextMessages = [...systemMessages, ...userMessages];
        setChatMessages(prev => (areMessagesEqual(nextMessages, prev) ? prev : nextMessages));
      }
    };
    
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); // Обновляем каждые 2 секунды
    return () => clearInterval(interval);
  }, [pin]);
  
  // Цвета для команд
  const teamColors = {
    fox: '#ff8a65',
    rabbit: '#81c784',
    bear: '#a1887f',
    cat: '#ffd54f',
    panda: '#bdbdbd',
    dog: '#4fc3f7',
    owl: '#9575cd',
    penguin: '#4dd0e1'
  };
  
  // Автопрокрутка чата
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Добавление системных сообщений при изменении состояния
  useEffect(() => {
    if (status === 'playing') {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        author: 'Система',
        text: 'Игра началась! Удачи! 🎮',
        color: '#4caf50'
      }]);
    }
  }, [status]);
  
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      // Отправляем на сервер
      await sendMessage(pin, newMessage, '#4299e1');
      
      // Очищаем поле ввода
      setNewMessage('');
      
      // Сразу обновляем локально для быстрой обратной связи
      setChatMessages(prev => [...prev, {
        _id: Date.now(),
        author: currentUser?.username || currentUser?.name || 'Вы',
        text: newMessage,
        color: '#4299e1'
      }]);
    }
  };
  
  const copyPin = () => {
    navigator.clipboard.writeText(pin);
    alert('PIN скопирован! 📋');
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'waiting': return 'Ожидание игроков';
      case 'playing': return 'Игра в процессе';
      case 'finished': return 'Игра завершена';
      default: return 'Неизвестно';
    }
  };
  
  return (
    <RoomContainer>
      <RoomHeader>
        <RoomTitle>Игровая комната</RoomTitle>
        
        <PinDisplay>
          <div>
            <PinLabel>🔐 PIN для входа</PinLabel>
            <PinCode>{pin}</PinCode>
          </div>
          <CopyButton onClick={copyPin}>📋 Копировать</CopyButton>
        </PinDisplay>
        
        <StatusBadge status={status}>
          <StatusDot />
          {getStatusText(status)}
        </StatusBadge>
      </RoomHeader>
      
      <ParticipantsSection>
        <SectionTitle>
          👥 Участники ({participants.length})
        </SectionTitle>
        
        <ParticipantsGrid>
          {participants.map((participant, index) => {
            const team = teams.find(t => t.id === participant.teamId);
            return (
              <ParticipantCard 
                key={participant.id}
                team={teamColors[team?.mascot]}
              >
                <ParticipantEmoji delay={index * 0.1}>
                  {participant.emoji || '👤'}
                </ParticipantEmoji>
                <ParticipantName>{participant.username || participant.name || 'Игрок'}</ParticipantName>
                {team && (
                  <ParticipantTeam>
                    {team.emoji} {team.name}
                  </ParticipantTeam>
                )}
              </ParticipantCard>
            );
          })}
        </ParticipantsGrid>
        
        <ParticipantCount>
          <span>🎮</span>
          <span>{participants.length} игроков в комнате</span>
          {participants.length >= 2 && <span>✅ Готово к старту!</span>}
        </ParticipantCount>
      </ParticipantsSection>
      
      <ChatSection>
        <SectionTitle>💬 Чат комнаты</SectionTitle>
        
        <ChatMessages>
          {chatMessages.map((msg, idx) => (
            <ChatMessage key={msg._id || idx}>
              <ChatAuthor color={msg.color}>{msg.author}:</ChatAuthor>
              <ChatText>{msg.text}</ChatText>
            </ChatMessage>
          ))}
          <div ref={chatEndRef} />
        </ChatMessages>
        
        <ChatInput>
          <Input 
            type="text"
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <SendButton onClick={handleSendMessage}>
            Отправить 🚀
          </SendButton>
        </ChatInput>
      </ChatSection>
      
      {isHost && status === 'waiting' && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={onStartGame}
            disabled={participants.length < 2}
            style={{
              background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
              color: 'white',
              border: 'none',
              padding: '1rem 3rem',
              borderRadius: '16px',
              fontSize: '1.2rem',
              fontWeight: '700',
              cursor: participants.length < 2 ? 'not-allowed' : 'pointer',
              opacity: participants.length < 2 ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Начать игру!
          </button>
          {participants.length < 2 && (
            <p style={{ marginTop: '0.5rem', color: '#718096', fontSize: '0.9rem' }}>
              Нужно минимум 2 игрока для старта
            </p>
          )}
        </div>
      )}
    </RoomContainer>
  );
};

export default LiveRoom;
