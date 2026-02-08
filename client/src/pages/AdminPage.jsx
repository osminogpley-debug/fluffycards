import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_ROUTES, authFetch } from '../constants/api';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
`;

const Title = styled.h1`
  color: #e53e3e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  
  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #63b3ed;
  }
  
  .label {
    color: #718096;
    font-size: 0.9rem;
  }
`;

const Section = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f7fafc;
    font-weight: 600;
    color: #4a5568;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &.danger {
    background: #fc8181;
    color: white;
    
    &:hover {
      background: #e53e3e;
    }
  }
  
  &.primary {
    background: #63b3ed;
    color: white;
    
    &:hover {
      background: #4299e1;
    }
  }
`;

const Select = styled.select`
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.9rem;
  min-height: 80px;
  resize: vertical;
  margin-top: 0.5rem;

  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const TicketCard = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px var(--shadow-color);
  border-left: 4px solid ${props => 
    props.$status === 'open' ? '#f59e0b' : 
    props.$status === 'in-progress' ? '#63b3ed' : 
    props.$status === 'resolved' ? '#48bb78' : '#a0aec0'};
`;

const TicketHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TicketSubject = styled.h4`
  color: var(--text-primary);
  margin: 0;
`;

const TicketMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
`;

const TicketBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch(props.$type) {
      case 'bug': return '#fed7d7';
      case 'feature': return '#c6f6d5';
      case 'question': return '#bee3f8';
      default: return '#e2e8f0';
    }
  }};
  color: ${props => {
    switch(props.$type) {
      case 'bug': return '#c53030';
      case 'feature': return '#22543d';
      case 'question': return '#2a69ac';
      default: return '#4a5568';
    }
  }};
`;

const StatusBadge = styled.span`
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch(props.$status) {
      case 'open': return '#fef3c7';
      case 'in-progress': return '#bee3f8';
      case 'resolved': return '#c6f6d5';
      case 'closed': return '#e2e8f0';
      default: return '#e2e8f0';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'open': return '#92400e';
      case 'in-progress': return '#2a69ac';
      case 'resolved': return '#22543d';
      case 'closed': return '#4a5568';
      default: return '#4a5568';
    }
  }};
`;

const TicketMessage = styled.p`
  color: var(--text-primary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0.5rem 0;
  white-space: pre-wrap;
`;

const TicketResponse = styled.div`
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 0.75rem;
  font-size: 0.9rem;

  .label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }
`;

const TicketActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  background: ${props => props.$active ? '#63b3ed' : 'var(--bg-tertiary)'};
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};
  transition: all 0.2s;

  &:hover { opacity: 0.8; }
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

function AdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sets, setSets] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [ticketFilter, setTicketFilter] = useState('all');
  const [ticketResponses, setTicketResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'support') {
      fetchTickets();
    }
  }, [activeTab, ticketFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, usersRes, setsRes] = await Promise.all([
        authFetch(`${API_ROUTES.ADMIN}/stats`),
        authFetch(`${API_ROUTES.ADMIN}/users`),
        authFetch(`${API_ROUTES.ADMIN}/sets`)
      ]);

      if (!statsRes.ok || !usersRes.ok || !setsRes.ok) {
        throw new Error('Failed to load admin data');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const setsData = await setsRes.json();

      setStats(statsData.data);
      setUsers(usersData.data);
      setSets(setsData.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await authFetch(`${API_ROUTES.ADMIN}/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы уверены что хотите удалить этого пользователя?')) return;
    
    try {
      const res = await authFetch(`${API_ROUTES.ADMIN}/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleDeleteSet = async (setId) => {
    if (!window.confirm('Вы уверены что хотите удалить этот набор?')) return;
    
    try {
      const res = await authFetch(`${API_ROUTES.ADMIN}/sets/${setId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting set:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const url = `/api/support/admin/all?status=${ticketFilter}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      const url = `/api/support/admin/${ticketId}`;
      const body = { status: newStatus };
      const responseText = ticketResponses[ticketId];
      if (responseText?.trim()) {
        body.adminResponse = responseText;
      }
      const res = await authFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setTicketResponses(prev => ({ ...prev, [ticketId]: '' }));
        fetchTickets();
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const sendTicketResponse = async (ticketId) => {
    const responseText = ticketResponses[ticketId];
    if (!responseText?.trim()) return;
    await handleTicketStatusChange(ticketId, 'resolved');
  };

  if (loading) return <Container>Загрузка...</Container>;
  if (error) return <Container><ErrorMessage>{error}</ErrorMessage></Container>;

  return (
    <Container>
      <Header>
        <Title>🛡️ Панель администратора</Title>
        <Button className="primary" onClick={() => navigate('/dashboard')}>
          ← Назад
        </Button>
      </Header>

      {stats && (
        <StatsGrid>
          <StatCard>
            <div className="value">{stats.totalUsers}</div>
            <div className="label">Всего пользователей</div>
          </StatCard>
          <StatCard>
            <div className="value">{stats.totalSets}</div>
            <div className="label">Всего наборов</div>
          </StatCard>
          <StatCard>
            <div className="value">{stats.totalTeachers}</div>
            <div className="label">Учителей</div>
          </StatCard>
          <StatCard>
            <div className="value">{stats.totalStudents}</div>
            <div className="label">Учеников</div>
          </StatCard>
        </StatsGrid>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Button 
          className={activeTab === 'users' ? 'primary' : ''}
          onClick={() => setActiveTab('users')}
        >
          👤 Пользователи
        </Button>
        <Button 
          className={activeTab === 'sets' ? 'primary' : ''}
          onClick={() => setActiveTab('sets')}
        >
          📚 Наборы
        </Button>
        <Button 
          className={activeTab === 'support' ? 'primary' : ''}
          onClick={() => setActiveTab('support')}
        >
          📨 Обращения
        </Button>
      </div>

      {activeTab === 'users' && (
        <Section>
          <SectionTitle>Пользователи</SectionTitle>
          <Table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <Select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="student">Ученик</option>
                      <option value="teacher">Учитель</option>
                      <option value="admin">Админ</option>
                    </Select>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button className="danger" onClick={() => handleDeleteUser(user._id)}>
                      🗑️ Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}

      {activeTab === 'sets' && (
        <Section>
          <SectionTitle>Наборы карточек</SectionTitle>
          <Table>
            <thead>
              <tr>
                <th>Название</th>
                <th>Автор</th>
                <th>Публичный</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {sets.map(set => (
                <tr key={set._id}>
                  <td>{set.title}</td>
                  <td>{set.owner?.username || 'Unknown'}</td>
                  <td>{set.isPublic ? '🌍 Да' : '🔒 Нет'}</td>
                  <td>{new Date(set.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Button className="danger" onClick={() => handleDeleteSet(set._id)}>
                      🗑️ Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Section>
      )}

      {activeTab === 'support' && (
        <Section>
          <SectionTitle>Обращения в поддержку</SectionTitle>
          <FilterBar>
            {['all', 'open', 'in-progress', 'resolved', 'closed'].map(f => (
              <FilterButton 
                key={f}
                $active={ticketFilter === f}
                onClick={() => setTicketFilter(f)}
              >
                {f === 'all' ? 'Все' : 
                 f === 'open' ? '🔴 Открытые' : 
                 f === 'in-progress' ? '🔵 В работе' : 
                 f === 'resolved' ? '🟢 Решённые' : '⚪ Закрытые'}
              </FilterButton>
            ))}
          </FilterBar>

          {tickets.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Нет обращений
            </p>
          ) : (
            tickets.map(ticket => (
              <TicketCard key={ticket._id} $status={ticket.status}>
                <TicketHeader>
                  <TicketSubject>{ticket.subject}</TicketSubject>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <TicketBadge $type={ticket.category}>
                      {ticket.category === 'bug' ? '🐛 Баг' : 
                       ticket.category === 'feature' ? '💡 Фича' : 
                       ticket.category === 'question' ? '❓ Вопрос' : '📌 Другое'}
                    </TicketBadge>
                    <StatusBadge $status={ticket.status}>
                      {ticket.status === 'open' ? 'Открыт' :
                       ticket.status === 'in-progress' ? 'В работе' :
                       ticket.status === 'resolved' ? 'Решён' : 'Закрыт'}
                    </StatusBadge>
                  </div>
                </TicketHeader>
                <TicketMeta>
                  <span>👤 {ticket.user?.username || 'Удалён'}</span>
                  <span>📧 {ticket.user?.email || '—'}</span>
                  <span>📅 {new Date(ticket.createdAt).toLocaleString()}</span>
                </TicketMeta>
                <TicketMessage>{ticket.message}</TicketMessage>

                {ticket.adminResponse && (
                  <TicketResponse>
                    <div className="label">💬 Ответ администратора ({ticket.respondedBy?.username}):</div>
                    <TicketMessage>{ticket.adminResponse}</TicketMessage>
                  </TicketResponse>
                )}

                <TicketActions>
                  <Select 
                    value={ticket.status}
                    onChange={e => handleTicketStatusChange(ticket._id, e.target.value)}
                  >
                    <option value="open">Открыт</option>
                    <option value="in-progress">В работе</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </Select>
                  <TextArea
                    value={ticketResponses[ticket._id] || ''}
                    onChange={e => setTicketResponses(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                    placeholder="Написать ответ..."
                  />
                  <Button 
                    className="primary"
                    onClick={() => sendTicketResponse(ticket._id)}
                    disabled={!ticketResponses[ticket._id]?.trim()}
                  >
                    📨 Ответить
                  </Button>
                </TicketActions>
              </TicketCard>
            ))
          )}
        </Section>
      )}
    </Container>
  );
}

export default AdminPage;
