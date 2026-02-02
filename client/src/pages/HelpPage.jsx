import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { SecondaryButton } from '../components/UI/Buttons';



const Container = styled.div`
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #63b3ed;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #718096;
  font-size: 1.1rem;
`;

const HelpSection = styled.div`
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
`;

const SectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  padding: 0.5rem 0;
  
  &:hover {
    color: #63b3ed;
  }
`;

const SectionIcon = styled.span`
  font-size: 1.5rem;
  margin-right: 0.75rem;
`;

const SectionTitle = styled.span`
  flex: 1;
  text-align: left;
  display: flex;
  align-items: center;
`;

const Arrow = styled.span`
  transition: transform 0.3s ease;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0)'}};
`;

const SectionContent = styled.div`
  max-height: ${props => props.$isOpen ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
  padding-top: ${props => props.$isOpen ? '1rem' : '0'};
`;

const FAQItem = styled.div`
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f7fafc;
  border-radius: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Question = styled.h4`
  color: #2d3748;
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const Answer = styled.p`
  color: #718096;
  line-height: 1.6;
  margin: 0;
`;

const TipCard = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const TipIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const TipContent = styled.div`
  flex: 1;
`;

const TipTitle = styled.h4`
  color: #0369a1;
  margin-bottom: 0.5rem;
`;

const TipText = styled.p`
  color: #4a5568;
  margin: 0;
  line-height: 1.5;
`;

const ContactSection = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  margin-top: 2rem;
`;

const ContactTitle = styled.h3`
  color: #92400e;
  margin-bottom: 1rem;
`;

const ContactText = styled.p`
  color: #78350f;
  margin-bottom: 1.5rem;
`;

const helpSections = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Начало работы',
    faqs: [
      {
        question: 'Как создать новый набор карточек?',
        answer: 'Перейдите в раздел "Мои наборы" и нажмите кнопку "Создать набор". Введите название, описание и добавьте карточки с терминами и определениями.'
      },
      {
        question: 'Как начать учить карточки?',
        answer: 'Откройте набор и нажмите "Все режимы" для выбора способа обучения. Доступны карточки, заучивание, письмо, тесты и игры.'
      },
      {
        question: 'Можно ли импортировать карточки из Excel?',
        answer: 'Да! При создании набора используйте функцию импорта. Скопируйте данные из Excel (колонки разделены TAB) и вставьте в поле импорта.'
      }
    ]
  },
  {
    id: 'learning',
    icon: '📚',
    title: 'Режимы обучения',
    faqs: [
      {
        question: 'Какой режим обучения выбрать?',
        answer: 'Карточки - для первого знакомства. Заучивание - для распределения по уровню знания. Письмо - для лучшего запоминания. Тест - для проверки знаний.'
      },
      {
        question: 'Что такое интервальное повторение?',
        answer: 'Это умная система, которая показывает карточки в оптимальные моменты для лучшего запоминания. Чем хуже вы знаете карточку, тем чаще она появляется.'
      },
      {
        question: 'Как работают игры?',
        answer: 'Игры (Подбор, Гравитация) делают обучение увлекательным. Зарабатывайте очки и соревнуйтесь с другими учениками!'
      }
    ]
  },
  {
    id: 'gamification',
    icon: '🏆',
    title: 'Уровни и достижения',
    faqs: [
      {
        question: 'Как получать XP?',
        answer: 'Изучайте карточки, проходите тесты, выигрывайте в играх. Выполняйте ежедневные задания для бонусных очков!'
      },
      {
        question: 'Что дают уровни?',
        answer: 'Уровни показывают ваш прогресс. С каждым уровнем требуется больше XP, но вы можете соревноваться с друзьями в таблице лидеров.'
      },
      {
        question: 'Как работает серия дней?',
        answer: 'Занимайтесь каждый день, чтобы поддерживать серию. Чем дольше серия, тем больше бонусов!'
      }
    ]
  },
  {
    id: 'teacher',
    icon: '👨‍🏫',
    title: 'Для учителей',
    faqs: [
      {
        question: 'Как создать тест для учеников?',
        answer: 'Откройте набор и нажмите "Создать тест". Выберите типы вопросов и настройки. Тест будет доступен вашим ученикам.'
      },
      {
        question: 'Можно ли сделать набор публичным?',
        answer: 'Да! При создании набора включите опцию "Сделать публичным". Тогда другие пользователи смогут найти и использовать ваш набор.'
      },
      {
        question: 'Как отслеживать прогресс учеников?',
        answer: 'Функция в разработке. Скоро вы сможете видеть статистику по каждому ученику и классу.'
      }
    ]
  }
];

const tips = [
  {
    icon: '💡',
    title: 'Быстрый импорт',
    text: 'Копируйте данные прямо из Excel или Google Sheets. Просто выделите ячейки, скопируйте (Ctrl+C) и вставьте в поле импорта (Ctrl+V).'
  },
  {
    icon: '🔊',
    title: 'Аудио поддержка',
    text: 'Для китайских слов автоматически добавляется пиньинь и произношение. Нажмите на кнопку динамика, чтобы услышать термин.'
  },
  {
    icon: '⏰',
    title: 'Ежедневные задания',
    text: 'Выполняйте ежедневные задания для получения бонусного XP. Задания обновляются каждый день в полночь.'
  }
];

function HelpPage() {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(['getting-started']);

  const toggleSection = (id) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <Container>
      <Header>
        <Title>❓ Помощь</Title>
        <Subtitle>Ответы на часто задаваемые вопросы</Subtitle>
      </Header>

      {helpSections.map(section => (
        <HelpSection key={section.id}>
          <SectionHeader onClick={() => toggleSection(section.id)}>
            <SectionTitle>
              <SectionIcon>{section.icon}</SectionIcon>
              {section.title}
            </SectionTitle>
            <Arrow $isOpen={openSections.includes(section.id)}>▼</Arrow>
          </SectionHeader>
          
          <SectionContent $isOpen={openSections.includes(section.id)}>
            {section.faqs.map((faq, idx) => (
              <FAQItem key={idx}>
                <Question>{faq.question}</Question>
                <Answer>{faq.answer}</Answer>
              </FAQItem>
            ))}
          </SectionContent>
        </HelpSection>
      ))}

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '1rem' }}>💡 Полезные советы</h2>
        {tips.map((tip, idx) => (
          <TipCard key={idx}>
            <TipIcon>{tip.icon}</TipIcon>
            <TipContent>
              <TipTitle>{tip.title}</TipTitle>
              <TipText>{tip.text}</TipText>
            </TipContent>
          </TipCard>
        ))}
      </div>

      <ContactSection>
        <ContactTitle>📧 Нужна помощь?</ContactTitle>
        <ContactText>
          Если вы не нашли ответ на свой вопрос, свяжитесь с нами.
        </ContactText>
        <SecondaryButton onClick={() => navigate('/dashboard')}>
          ← Вернуться на главную
        </SecondaryButton>
      </ContactSection>
    </Container>
  );
}

export default HelpPage;
