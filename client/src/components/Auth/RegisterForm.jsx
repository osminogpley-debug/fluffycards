import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../../components/UI/Buttons';

const RegisterContainer = styled.div`
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

const FormTitle = styled.h2`
  text-align: center;
  color: #4299e1;
  margin-bottom: 1.5rem;

  &::before {
    content: "✍️ ";
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const ErrorMessage = styled.p`
  color: #e53e3e;
  margin-top: 0.5rem;
  font-size: 14px;
`;

const SuccessMessage = styled.p`
  color: #38a169;
  margin-top: 1rem;
  text-align: center;
`;

const RoleSection = styled.div`
  margin-bottom: 1.5rem;
`;

const RoleLabel = styled.label`
  display: block;
  margin-bottom: 0.75rem;
  color: #4a5568;
  font-weight: 600;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

const RoleCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  border: 3px solid ${({ selected }) => selected ? '#4299e1' : '#e2e8f0'};
  border-radius: 16px;
  background: ${({ selected }) => selected ? 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)' : 'white'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #4299e1;
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(66, 153, 225, 0.2);
  }

  .role-icon {
    font-size: 3rem;
    margin-bottom: 12px;
  }

  .role-title {
    font-weight: 700;
    font-size: 16px;
    color: ${({ selected }) => selected ? '#2b6cb0' : '#2d3748'};
    margin-bottom: 6px;
  }

  .role-subtitle {
    font-size: 13px;
    color: #718096;
  }
`;

const RoleFeatures = styled.div`
  padding: 16px;
  background: ${({ role }) => role === 'student' ? '#f0fff4' : '#ebf8ff'};
  border-radius: 12px;
  border-left: 4px solid ${({ role }) => role === 'student' ? '#48bb78' : '#4299e1'};

  .features-title {
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 10px;
    font-size: 14px;
  }

  .features-list {
    margin: 0;
    padding-left: 20px;
    font-size: 13px;
    color: #4a5568;

    li {
      margin-bottom: 6px;
    }
  }
`;

function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '', 
    password: '',
    confirmPassword: '',
    role: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username) {
      newErrors.username = 'Введите имя пользователя';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя слишком короткое (минимум 3 символа)';
    }

    if (!formData.email) {
      newErrors.email = 'Введите email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Введите пароль';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль слишком короткий (минимум 6 символов)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!formData.role) {
      newErrors.role = 'Выберите роль';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    
    try {
      const apiUrl = `http://${window.location.hostname}:5001/api/auth/register`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка регистрации');
      }

      setSuccessMessage(data.message);
      setTimeout(() => navigate('/'), 2000);
      
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <FormTitle>Регистрация</FormTitle>
      
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Имя пользователя</Label>
          <Input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Придумайте логин"
          />
          {errors.username && <ErrorMessage>{errors.username}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Email</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ваш email"
          />
          {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Пароль</Label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Придумайте пароль"
          />
          {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
        </FormGroup>

        <FormGroup>
          <Label>Подтвердите пароль</Label>
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Повторите пароль"
          />
          {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
        </FormGroup>

        <RoleSection>
          <RoleLabel>Выберите вашу роль ✨</RoleLabel>
          <RoleGrid>
            <RoleCard
              type="button"
              selected={formData.role === 'student'}
              onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
            >
              <span className="role-icon">🎓</span>
              <span className="role-title">Ученик</span>
              <span className="role-subtitle">Учусь и развиваюсь</span>
            </RoleCard>
            <RoleCard
              type="button"
              selected={formData.role === 'teacher'}
              onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
            >
              <span className="role-icon">👨‍🏫</span>
              <span className="role-title">Учитель</span>
              <span className="role-subtitle">Создаю и обучаю</span>
            </RoleCard>
          </RoleGrid>
          
          {formData.role && (
            <RoleFeatures role={formData.role}>
              <div className="features-title">
                {formData.role === 'student' ? '🎓 Возможности ученика:' : '👨‍🏫 Возможности учителя:'}
              </div>
              <ul className="features-list">
                {formData.role === 'student' ? (
                  <>
                    <li>🎮 Играть в обучающие игры (Match, Gravity, Live)</li>
                    <li>⭐ Копить баллы и открывать достижения</li>
                    <li>📚 Изучать наборы карточек в разных режимах</li>
                    <li>🏆 Соревноваться с другими учениками</li>
                    <li>📊 Отслеживать свой прогресс обучения</li>
                  </>
                ) : (
                  <>
                    <li>📝 Создавать и редактировать наборы карточек</li>
                    <li>🎮 Создавать игры и тесты для учеников</li>
                    <li>👥 Управлять классами и группами</li>
                    <li>📈 Отслеживать прогресс учеников</li>
                    <li>🎯 Создавать задания и проверять работы</li>
                  </>
                )}
              </ul>
            </RoleFeatures>
          )}
          {errors.role && <ErrorMessage>{errors.role}</ErrorMessage>}
        </RoleSection>

        {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
        {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}

        <PrimaryButton type="submit" disabled={isLoading}>
          {isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
        </PrimaryButton>
      </form>
    </RegisterContainer>
  );
}

export default RegisterForm;
