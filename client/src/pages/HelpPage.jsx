import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Helmet } from 'react-helmet-async';
import { SecondaryButton } from '../components/UI/Buttons';
import { AuthContext } from '../App';
import { authFetch } from '../constants/api';



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
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const HelpSection = styled.div`
  background: var(--bg-secondary);
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
  color: var(--text-primary);
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
  background: var(--bg-tertiary);
  border-radius: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Question = styled.h4`
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const Answer = styled.p`
  color: var(--text-secondary);
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
  color: var(--text-secondary);
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

const SupportFormSection = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  padding: 2rem;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px var(--shadow-color);
`;

const SupportFormTitle = styled.h3`
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormRow = styled.div`
  margin-bottom: 1rem;
`;

const FormLabel = styled.label`
  display: block;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  background: var(--bg-secondary);
  color: var(--text-primary);

  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const FormSelect = styled.select`
  padding: 10px 14px;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #63b3ed;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  background: linear-gradient(135deg, #c6f6d5 0%, #9ae6b4 100%);
  color: #22543d;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-weight: 500;
`;

const ErrorMessageBox = styled.div`
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  color: #c53030;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1rem;
  font-weight: 500;
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
  const { authState } = useContext(AuthContext);
  const [openSections, setOpenSections] = useState(['getting-started']);
  const [supportForm, setSupportForm] = useState({ subject: '', message: '', category: 'question' });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState('');
  const [supportError, setSupportError] = useState('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Как создать набор карточек?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Откройте личный кабинет и нажмите «Создать набор». Заполните термины и определения и сохраните набор.'
        }
      },
      {
        '@type': 'Question',
        name: 'Как добавить друга?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Перейдите во вкладку «Друзья», найдите пользователя и отправьте запрос в друзья.'
        }
      },
      {
        '@type': 'Question',
        name: 'Где посмотреть публичные наборы?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Откройте раздел «Публичная библиотека» и выберите интересующий набор.'
        }
      }
    ]
  };

  const toggleSection = (id) => {
    setOpenSections(prev => 
      prev.includes(id) 
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      setSupportError('Заполните тему и сообщение');
      return;
    }
    setSupportLoading(true);
    setSupportError('');
    setSupportSuccess('');
    try {
      const url = `http://${window.location.hostname}:5001/api/support`;
      const response = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supportForm)
      });
      const data = await response.json();
      if (response.ok) {
        setSupportSuccess('Обращение успешно отправлено! Мы ответим в ближайшее время.');
        setSupportForm({ subject: '', message: '', category: 'question' });
      } else {
        setSupportError(data.message || 'Ошибка при отправке');
      }
    } catch (err) {
      setSupportError('Ошибка сети');
    } finally {
      setSupportLoading(false);
    }
  };

  return (
    <Container>
      <Helmet>
        <title>Помощь и поддержка — FluffyCards</title>
        <meta
          name="description"
          content="Ответы на популярные вопросы, советы по обучению и форма поддержки FluffyCards."
        />
        <link rel="canonical" href="https://fluffycards.ru/help" />
        <meta property="og:title" content="Помощь и поддержка — FluffyCards" />
        <meta property="og:description" content="FAQ, советы и поддержка пользователей FluffyCards." />
        <meta property="og:url" content="https://fluffycards.ru/help" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://fluffycards.ru/logo192.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
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
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>💡 Полезные советы</h2>
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
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <SecondaryButton 
            as="a" 
            href="https://t.me/Osminog123" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            ✈️ Telegram: @Osminog123
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/contacts')}>
            📞 Все контакты
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/dashboard')}>
            ← Вернуться на главную
          </SecondaryButton>
        </div>
      </ContactSection>

      {authState?.isAuthenticated && (
        <SupportFormSection>
          <SupportFormTitle>📝 Отправить обращение в поддержку</SupportFormTitle>
          <form onSubmit={handleSupportSubmit}>
            <FormRow>
              <FormLabel>Категория</FormLabel>
              <FormSelect 
                value={supportForm.category}
                onChange={e => setSupportForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="question">❓ Вопрос</option>
                <option value="bug">🐛 Баг / Ошибка</option>
                <option value="feature">💡 Предложение</option>
                <option value="other">📌 Другое</option>
              </FormSelect>
            </FormRow>
            <FormRow>
              <FormLabel>Тема</FormLabel>
              <FormInput 
                value={supportForm.subject}
                onChange={e => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Кратко опишите проблему"
                maxLength={200}
              />
            </FormRow>
            <FormRow>
              <FormLabel>Сообщение</FormLabel>
              <FormTextarea 
                value={supportForm.message}
                onChange={e => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Подробно опишите вашу проблему или предложение..."
                maxLength={2000}
              />
            </FormRow>
            <SubmitButton type="submit" disabled={supportLoading}>
              {supportLoading ? '⏳ Отправка...' : '📨 Отправить'}
            </SubmitButton>
          </form>
          {supportSuccess && <SuccessMessage>{supportSuccess}</SuccessMessage>}
          {supportError && <ErrorMessageBox>{supportError}</ErrorMessageBox>}
        </SupportFormSection>
      )}
    </Container>
  );
}

export default HelpPage;
