import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Container = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const ContactCard = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px var(--shadow-color);
  text-align: center;
`;

const ContactIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const ContactTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
`;

const ContactText = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  padding: 12px 28px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 179, 237, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }
`;

const TelegramLink = styled(ContactLink)`
  background: linear-gradient(135deg, #0088cc 0%, #0077b5 100%);
  box-shadow: 0 4px 12px rgba(0, 136, 204, 0.3);

  &:hover {
    box-shadow: 0 6px 20px rgba(0, 136, 204, 0.4);
  }
`;

const InfoSection = styled.div`
  background: var(--bg-tertiary);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const InfoTitle = styled.h4`
  color: var(--text-primary);
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoText = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
`;

const BackButton = styled.button`
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;

  &:hover {
    background: var(--bg-tertiary);
  }
`;

function ContactsPage() {
  const navigate = useNavigate();

  return (
    <Container>
      <Helmet>
        <title>Контакты — FluffyCards</title>
        <meta
          name="description"
          content="Контакты FluffyCards: Telegram, поддержка и информация о проекте."
        />
        <link rel="canonical" href="https://fluffycards.ru/contacts" />
        <meta property="og:title" content="Контакты — FluffyCards" />
        <meta property="og:description" content="Свяжитесь с командой FluffyCards удобным способом." />
        <meta property="og:url" content="https://fluffycards.ru/contacts" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://fluffycards.ru/logo192.png" />
      </Helmet>
      <Header>
        <Title>📞 Контакты</Title>
        <Subtitle>Свяжитесь с нами любым удобным способом</Subtitle>
      </Header>

      <ContactCard>
        <ContactIcon>✈️</ContactIcon>
        <ContactTitle>Telegram</ContactTitle>
        <ContactText>
          Основной способ связи. Пишите по любым вопросам — баги, предложения, сотрудничество.
        </ContactText>
        <TelegramLink href="https://t.me/Osminog123" target="_blank" rel="noopener noreferrer">
          ✈️ @Osminog123
        </TelegramLink>
      </ContactCard>

      <ContactCard>
        <ContactIcon>💬</ContactIcon>
        <ContactTitle>Обратная связь</ContactTitle>
        <ContactText>
          Вы также можете отправить обращение через систему поддержки на сайте. 
          Мы ответим в кратчайшие сроки.
        </ContactText>
        <ContactLink as="button" onClick={() => navigate('/help')} style={{ border: 'none', cursor: 'pointer' }}>
          ❓ Страница помощи
        </ContactLink>
      </ContactCard>

      <InfoSection>
        <InfoTitle>🌐 О проекте</InfoTitle>
        <InfoText>
          FluffyCards — образовательная платформа для изучения иностранных языков и запоминания информации 
          с помощью флеш-карточек. Проект разработан с любовью и постоянно развивается. 
          Мы всегда рады вашим отзывам и предложениям!
        </InfoText>
      </InfoSection>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <BackButton onClick={() => navigate(-1)}>
          ← Назад
        </BackButton>
      </div>
    </Container>
  );
}

export default ContactsPage;
