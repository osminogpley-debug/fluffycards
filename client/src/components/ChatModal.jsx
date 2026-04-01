import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { authFetch, FILE_BASE_URL } from '../constants/api';

const isSameData = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ChatOverlay = styled.div`
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

const ChatContainer = styled.div`
  background: var(--bg-secondary);
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  height: 70vh;
  display: flex;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 260px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background: var(--bg-tertiary);

  @media (max-width: 600px) {
    display: ${props => props.$showChat ? 'none' : 'flex'};
    width: 100%;
  }
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;

  &:hover { color: var(--text-primary); }
`;

const ConversationList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
  background: ${props => props.$active ? 'var(--bg-secondary)' : 'transparent'};
  border-left: 3px solid ${props => props.$active ? '#63b3ed' : 'transparent'};

  &:hover {
    background: var(--bg-secondary);
  }
`;

const ConvAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ConvInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ConvName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
`;

const ConvLastMsg = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadBadge = styled.span`
  background: #e53e3e;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (max-width: 600px) {
    display: ${props => props.$showChat ? 'flex' : 'none'};
  }
`;

const ChatHeader = styled.div`
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 12px;

  h4 {
    margin: 0;
    color: var(--text-primary);
  }
`;

const BackBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: var(--text-secondary);
  display: none;

  @media (max-width: 600px) {
    display: block;
  }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
  align-self: ${props => props.$mine ? 'flex-end' : 'flex-start'};
  background: ${props => props.$mine 
    ? 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)' 
    : 'var(--bg-tertiary)'};
  color: ${props => props.$mine ? 'white' : 'var(--text-primary)'};
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: ${props => props.$mine ? 'right' : 'left'};
  margin-top: 2px;
`;

const SetShareCard = styled.div`
  max-width: 250px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s;
  align-self: ${p => p.$mine ? 'flex-end' : 'flex-start'};
  background: ${p => p.$mine ? 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)' : 'var(--bg-tertiary)'};
  border: 1px solid ${p => p.$mine ? 'transparent' : 'var(--border-color)'};
  &:hover { transform: scale(1.02); }
`;

const SetShareBody = styled.div`
  padding: 12px 14px;
`;

const SetShareIcon = styled.div`
  font-size: 1.6rem;
  margin-bottom: 6px;
`;

const SetShareTitle = styled.div`
  font-weight: 700;
  font-size: 0.88rem;
  color: ${p => p.$mine ? 'white' : 'var(--text-primary)'};
  margin-bottom: 4px;
  line-height: 1.3;
`;

const SetShareMeta = styled.div`
  font-size: 0.75rem;
  color: ${p => p.$mine ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'};
`;

const SetShareBtn = styled.div`
  padding: 8px 14px;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: ${p => p.$mine ? 'rgba(255,255,255,0.9)' : '#4299e1'};
  border-top: 1px solid ${p => p.$mine ? 'rgba(255,255,255,0.15)' : 'var(--border-color)'};
`;

const InputArea = styled.form`
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
  position: relative;
`;

const EmojiButton = styled.button`
  background: var(--bg-tertiary);
  border: 2px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    border-color: #63b3ed;
  }
`;

const EmojiPicker = styled.div`
  position: absolute;
  bottom: 60px;
  left: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  box-shadow: 0 8px 24px var(--shadow-color);
  z-index: 2;
`;

const EmojiItem = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;

  &:hover {
    background: var(--bg-tertiary);
  }
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  font-size: 0.9rem;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  outline: none;

  &:focus {
    border-color: #63b3ed;
  }
`;

const SendButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  flex-shrink: 0;

  &:hover { transform: scale(1.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 1rem;

  .icon { font-size: 3rem; margin-bottom: 1rem; }
`;

const DEFAULT_AVATAR = 'https://fluffycards.com/default-avatar.png';
const resolveAvatar = (url) => {
  if (!url || url.includes('default-avatar.png') || url === DEFAULT_AVATAR) return '';
  if (url.startsWith('/uploads/')) return `${FILE_BASE_URL}${url}`;
  return url;
};

function ChatModal({ onClose, userId }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);

  const emojiList = ['😀', '😃', '😄', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😭', '😡', '👍', '👎', '🙏', '🔥', '🎉', '💯', '⭐', '⚡', '❤️', '💙', '💚'];

  const baseUrl = `/api/chat`;

  const fetchConversations = useCallback(async () => {
    try {
      const res = await authFetch(`${baseUrl}/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(prev => (isSameData(prev, data) ? prev : data));
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [baseUrl]);

  const fetchMessages = useCallback(async (friendId) => {
    try {
      const res = await authFetch(`${baseUrl}/${friendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => (isSameData(prev, data) ? prev : data));
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id);
      // Poll for new messages every 3 seconds
      pollingRef.current = setInterval(() => {
        fetchMessages(activeChat._id);
        fetchConversations();
      }, 3000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChat, fetchMessages, fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    setLoading(true);
    try {
      const res = await authFetch(`${baseUrl}/${activeChat._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim() })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        setShowEmojiPicker(false);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + 
           ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ChatContainer>
        <Sidebar $showChat={!!activeChat}>
          <SidebarHeader>
            <h3>💬 Чат</h3>
            <CloseButton onClick={onClose}>✕</CloseButton>
          </SidebarHeader>
          <ConversationList>
            {conversations.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Добавьте друзей, чтобы начать общение
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationItem 
                  key={conv.friend._id}
                  $active={activeChat?._id === conv.friend._id}
                  onClick={() => setActiveChat(conv.friend)}
                >
                  <ConvAvatar>
                    {resolveAvatar(conv.friend.profileImage) ? <img src={resolveAvatar(conv.friend.profileImage)} alt="" /> : (conv.friend.username?.[0]?.toUpperCase() || '?')}
                  </ConvAvatar>
                  <ConvInfo>
                    <ConvName>{conv.friend.username}</ConvName>
                    <ConvLastMsg>
                      {conv.lastMessage?.text || 'Начните общение'}
                    </ConvLastMsg>
                  </ConvInfo>
                  {conv.unreadCount > 0 && (
                    <UnreadBadge>{conv.unreadCount}</UnreadBadge>
                  )}
                </ConversationItem>
              ))
            )}
          </ConversationList>
        </Sidebar>

        <ChatArea $showChat={!!activeChat}>
          {activeChat ? (
            <>
              <ChatHeader>
                <BackBtn onClick={() => setActiveChat(null)}>←</BackBtn>
                <ConvAvatar style={{ width: 32, height: 32, fontSize: 14 }}>
                  {resolveAvatar(activeChat.profileImage) ? <img src={resolveAvatar(activeChat.profileImage)} alt="" /> : (activeChat.username?.[0]?.toUpperCase() || '?')}
                </ConvAvatar>
                <h4>{activeChat.username}</h4>
              </ChatHeader>
              <MessagesArea>
                {messages.map((msg, i) => {
                  const mine = msg.from?._id === userId || msg.from === userId;

                  if (msg.type === 'set_share' && msg.set) {
                    return (
                      <div key={msg._id || i}>
                        <SetShareCard
                          $mine={mine}
                          onClick={() => {
                            onClose();
                            navigate(`/sets/${msg.set._id}`);
                          }}
                        >
                          <SetShareBody>
                            <SetShareIcon>📚</SetShareIcon>
                            <SetShareTitle $mine={mine}>{msg.set.title}</SetShareTitle>
                            <SetShareMeta $mine={mine}>
                              {msg.set.cardCount} {msg.set.cardCount === 1 ? 'карточка' : msg.set.cardCount < 5 ? 'карточки' : 'карточек'}
                              {msg.set.owner?.username ? ` · ${msg.set.owner.username}` : ''}
                            </SetShareMeta>
                          </SetShareBody>
                          <SetShareBtn $mine={mine}>Открыть набор →</SetShareBtn>
                        </SetShareCard>
                        <MessageTime $mine={mine}>{formatTime(msg.createdAt)}</MessageTime>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id || i}>
                      <MessageBubble $mine={mine}>
                        {msg.text}
                      </MessageBubble>
                      <MessageTime $mine={mine}>
                        {formatTime(msg.createdAt)}
                      </MessageTime>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </MessagesArea>
              <InputArea onSubmit={handleSend}>
                <EmojiButton type="button" onClick={() => setShowEmojiPicker(prev => !prev)}>
                  😊
                </EmojiButton>
                {showEmojiPicker && (
                  <EmojiPicker>
                    {emojiList.map(emoji => (
                      <EmojiItem
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText(prev => prev + emoji);
                          setShowEmojiPicker(false);
                          inputRef.current?.focus();
                        }}
                      >
                        {emoji}
                      </EmojiItem>
                    ))}
                  </EmojiPicker>
                )}
                <MessageInput 
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Написать сообщение..."
                  maxLength={1000}
                  autoFocus
                />
                <SendButton type="submit" disabled={!inputText.trim() || loading}>
                  ➤
                </SendButton>
              </InputArea>
            </>
          ) : (
            <EmptyChat>
              <div className="icon">💬</div>
              Выберите чат, чтобы начать общение
            </EmptyChat>
          )}
        </ChatArea>
      </ChatContainer>
    </ChatOverlay>
  );
}

export default ChatModal;
