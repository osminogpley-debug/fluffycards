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
  border-bottom: 2px solid #e2e8f0;
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
  background: white;
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
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const SectionTitle = styled.h2`
  margin-bottom: 1rem;
  color: #2d3748;
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
  border: 1px solid #e2e8f0;
  background: white;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    fetchData();
  }, []);

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
    </Container>
  );
}

export default AdminPage;
