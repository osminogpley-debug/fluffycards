import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';

const Container = styled.div`
  max-width: 720px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: 'Comic Neue', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #63b3ed;
  font-size: 2.3rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

const Card = styled.div`
  background: var(--card-bg, white);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, transparent);
`;

const Field = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-size: 1rem;
  font-family: inherit;
  background: var(--card-bg, white);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 90px;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  background: var(--card-bg, white);
  color: var(--text-primary);
  
  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.2);
  }
`;

const InfoBox = styled.div`
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

function CreateClassPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    subject: '',
    description: '',
    grade: ''
  });

  const onChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Container>
      <Header>
        <Title>🏫 Создание класса</Title>
        <Subtitle>Подготовьте класс для учеников и отслеживайте прогресс</Subtitle>
      </Header>

      <Card>
        <InfoBox>
          Функция классов в разработке. Мы уже подготовили форму, чтобы скоро
          включить создание и приглашение учеников.
        </InfoBox>

        <Field>
          <Label>Название класса</Label>
          <Input
            placeholder="Например: 9А — Английский"
            value={form.name}
            onChange={onChange('name')}
          />
        </Field>

        <Field>
          <Label>Предмет</Label>
          <Input
            placeholder="Например: Английский язык"
            value={form.subject}
            onChange={onChange('subject')}
          />
        </Field>

        <Field>
          <Label>Класс/группа</Label>
          <Input
            placeholder="Например: 9 класс"
            value={form.grade}
            onChange={onChange('grade')}
          />
        </Field>

        <Field>
          <Label>Описание</Label>
          <TextArea
            placeholder="Кратко опишите цели и правила"
            value={form.description}
            onChange={onChange('description')}
          />
        </Field>

        <ButtonRow>
          <PrimaryButton disabled title="Скоро будет доступно">
            ✅ Создать класс
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/dashboard')}>
            ⬅️ Назад
          </SecondaryButton>
        </ButtonRow>
      </Card>
    </Container>
  );
}

export default CreateClassPage;
