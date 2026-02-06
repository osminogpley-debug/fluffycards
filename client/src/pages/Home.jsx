import React, { useContext } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SecondaryButton } from '../components/UI/Buttons';
import { AuthContext } from '../App';

const HomeContainer = styled.section`
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  color: #63b3ed;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  &::before {
    content: "📚 ";
  }
`;

const HeroSubtitle = styled.h2`
  font-size: 1.8rem;
  color: #4a5568;
  margin-bottom: 2rem;
  font-weight: 500;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(99, 179, 237, 0.15);
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.4rem;
  color: #4299e1;
  margin-bottom: 1rem;
`;

const FeatureText = styled.p`
  color: #718096;
  line-height: 1.8;
`;

const CtaButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  padding: 16px 32px;
  border-radius: 24px;
  font-size: 1.2rem;
  font-weight: 600;
  text-decoration: none;
  margin-top: 2rem;
  box-shadow: 0 6px 20px rgba(99, 179, 237, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(99, 179, 237, 0.4);
  }
`;

function Home() {
  const { authState, logout } = useContext(AuthContext);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FluffyCards',
    url: 'https://fluffycards.ru/',
    description: 'Образовательная платформа с флеш-карточками, играми и режимами обучения.'
  };

  return (
    <HomeContainer>
      <Helmet>
        <title>FluffyCards — умные флеш-карточки и обучение</title>
        <meta
          name="description"
          content="FluffyCards — платформа с флеш-карточками, играми и режимами обучения для учеников и учителей."
        />
        <link rel="canonical" href="https://fluffycards.ru/" />
        <meta property="og:title" content="FluffyCards — умные флеш-карточки и обучение" />
        <meta property="og:description" content="Флеш-карточки, игры и режимы обучения для эффективного изучения." />
        <meta property="og:url" content="https://fluffycards.ru/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://fluffycards.ru/logo192.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="FluffyCards — умные флеш-карточки" />
        <meta name="twitter:description" content="Флеш-карточки, игры и режимы обучения." />
        <meta name="twitter:image" content="https://fluffycards.ru/logo192.png" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <HeroTitle>
        {authState.isAuthenticated ? `Добро пожаловать, ${authState.user?.username}!` : 'Изучайте всё легко'}
      </HeroTitle>
      
      <HeroSubtitle>
        {authState.isAuthenticated ? 
          'Продолжайте своё обучение с милыми карточками ✨' : 
          'Сделайте учёбу радостной с нашими очаровательными карточками'
        }
      </HeroSubtitle>

      {/* Кнопки навигации вверху */}
      {authState.loading ? (
        <div>Загрузка...</div>
      ) : authState.isAuthenticated ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '3rem' }}>
          <CtaButton to="/dashboard">Мои наборы 🎴</CtaButton>
          <CtaButton to="/library" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
            📚 Публичная библиотека
          </CtaButton>
          <SecondaryButton onClick={logout}>
            Выйти
          </SecondaryButton>
        </div>
      ) : (
        <div style={{ marginBottom: '3rem' }}>
          <CtaButton to="/register">Начать бесплатно 🚀</CtaButton>
          <div style={{ marginTop: '1rem' }}>
            <CtaButton to="/library" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', fontSize: '1rem', padding: '12px 24px' }}>
              📚 Смотреть библиотеку
            </CtaButton>
          </div>
        </div>
      )}

      <FeaturesGrid>
        <FeatureCard as={Link} to="/learn/study" style={{ textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}>
          <FeatureIcon>🔄</FeatureIcon>
          <FeatureTitle>Умное обучение</FeatureTitle>
          <FeatureText>
            Наш адаптивный алгоритм помогает сосредоточиться на том, что вы ещё не знаете.
          </FeatureText>
        </FeatureCard>

        <FeatureCard as={Link} to="/games/match" style={{ textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}>
          <FeatureIcon>🎮</FeatureIcon>
          <FeatureTitle>Весёлые игры</FeatureTitle>
          <FeatureText>
            Учитесь через интерактивные игры, которые делают учёбу похожей на игру.
          </FeatureText>
        </FeatureCard>

        <FeatureCard as={Link} to="/dashboard" style={{ textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}>
          <FeatureIcon>📊</FeatureIcon>
          <FeatureTitle>Детальная статистика</FeatureTitle>
          <FeatureText>
            Отслеживайте прогресс с милыми визуализациями и знайте, когда вы готовы.
          </FeatureText>
        </FeatureCard>

        <FeatureCard as={Link} to="/live" style={{ textDecoration: 'none', cursor: 'pointer', color: 'inherit' }}>
          <FeatureIcon>⚡</FeatureIcon>
          <FeatureTitle>Live Режим</FeatureTitle>
          <FeatureText>
            Играйте в реальном времени с классом! Создавайте комнаты, выбирайте милых талисманов и соревнуйтесь.
          </FeatureText>
        </FeatureCard>
      </FeaturesGrid>
    </HomeContainer>
  );
}

export default Home;
