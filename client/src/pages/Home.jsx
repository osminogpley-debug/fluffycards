import React, { useContext } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SecondaryButton } from '../components/UI/Buttons';
import { AuthContext } from '../App';

const Page = styled.main`
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 20px 64px;
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 28px;
  padding: 44px 34px;
  background:
    radial-gradient(circle at 12% 18%, rgba(99, 179, 237, 0.22), transparent 42%),
    radial-gradient(circle at 88% 82%, rgba(72, 187, 120, 0.16), transparent 44%),
    linear-gradient(120deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);

  @media (max-width: 860px) {
    padding: 30px 20px;
    border-radius: 22px;
  }
`;

const HeroTop = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  margin-bottom: 16px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.1;
  color: var(--text-primary);
`;

const HeroAccent = styled.span`
  background: linear-gradient(135deg, #4299e1 0%, #48bb78 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroSubtitle = styled.p`
  margin: 18px 0 0;
  max-width: 760px;
  color: var(--text-secondary);
  font-size: 1.08rem;
  line-height: 1.75;
`;

const HeroActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
`;

const PrimaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 13px 20px;
  font-weight: 700;
  text-decoration: none;
  color: white;
  background: linear-gradient(135deg, #4299e1 0%, #2b6cb0 100%);
  box-shadow: 0 12px 24px rgba(66, 153, 225, 0.25);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 28px rgba(66, 153, 225, 0.32);
  }
`;

const SecondaryCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 13px 20px;
  font-weight: 700;
  text-decoration: none;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  transition: border-color 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: #4299e1;
    transform: translateY(-1px);
  }
`;

const HeroStats = styled.div`
  margin-top: 28px;
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
  gap: 12px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Stat = styled.div`
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--bg-secondary);
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
`;

const StatLabel = styled.div`
  margin-top: 2px;
  font-size: 0.82rem;
  color: var(--text-secondary);
`;

const Grid = styled.section`
  margin-top: 24px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);
`;

const Panel = styled.article`
  grid-column: span ${p => p.$span || 4};
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 20px;
  background: var(--bg-secondary);
  box-shadow: 0 8px 18px var(--shadow-color);

  @media (max-width: 980px) {
    grid-column: span 12;
  }
`;

const PanelTitle = styled.h2`
  margin: 0;
  font-size: 1.18rem;
  color: var(--text-primary);
`;

const PanelText = styled.p`
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
`;

const Steps = styled.ol`
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
`;

const Step = styled.li`
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 10px;
  align-items: start;
`;

const StepNum = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
`;

const ModesGrid = styled.div`
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 660px) {
    grid-template-columns: 1fr;
  }
`;

const ModeCard = styled(Link)`
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  background: var(--bg-tertiary);
  transition: transform 0.16s ease, border-color 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #4299e1;
  }
`;

const ModeName = styled.div`
  font-weight: 700;
  color: var(--text-primary);
`;

const ModeDesc = styled.div`
  margin-top: 3px;
  font-size: 0.84rem;
  color: var(--text-secondary);
`;

const Faq = styled.section`
  margin-top: 24px;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 20px;
  background: var(--bg-secondary);
`;

const FaqTitle = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.3rem;
`;

const FaqList = styled.div`
  margin-top: 14px;
  display: grid;
  gap: 10px;
`;

const FaqItem = styled.details`
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--bg-tertiary);

  summary {
    cursor: pointer;
    font-weight: 700;
    color: var(--text-primary);
  }

  p {
    margin: 8px 0 0;
    color: var(--text-secondary);
    line-height: 1.7;
  }
`;

const BottomCta = styled.section`
  margin-top: 24px;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--border-color);
  background:
    radial-gradient(circle at 85% 18%, rgba(66, 153, 225, 0.18), transparent 36%),
    var(--bg-secondary);
`;

const BottomTitle = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.42rem;
`;

const BottomText = styled.p`
  margin: 10px 0 0;
  color: var(--text-secondary);
  line-height: 1.7;
`;

function Home() {
  const { authState, logout } = useContext(AuthContext);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'FluffyCards подходит только для языков?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Нет. Платформа подходит для терминов по любым предметам: языки, медицина, право, история, биология и другие дисциплины.'
        }
      },
      {
        '@type': 'Question',
        name: 'Можно ли учиться с телефона?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да. Веб-версия адаптирована под мобильные экраны, а также есть мобильное приложение для регулярной практики.'
        }
      },
      {
        '@type': 'Question',
        name: 'Есть ли общий доступ к наборам?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да. Наборы можно публиковать, делиться ссылкой и отправлять в личные сообщения внутри платформы.'
        }
      }
    ]
  };

  return (
    <Page>
      <Helmet>
        <title>FluffyCards — карточки, игры и режимы заучивания</title>
        <meta
          name="description"
          content="FluffyCards — платформа для изучения через карточки, игры и тренажёры. Создавайте наборы, делитесь ими, отслеживайте прогресс и учитесь быстрее."
        />
        <meta
          name="keywords"
          content="карточки для запоминания, флешкарты, изучение китайского, режим заучивания, тесты, обучение онлайн"
        />
        <link rel="canonical" href="https://fluffycards.ru/" />
        <meta property="og:title" content="FluffyCards — карточки, игры и режимы заучивания" />
        <meta
          property="og:description"
          content="Создавайте учебные наборы, тренируйтесь в режимах и играх, контролируйте прогресс и делитесь материалами."
        />
        <meta property="og:url" content="https://fluffycards.ru/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://fluffycards.ru/logo192.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FluffyCards — карточки и тренажёры" />
        <meta name="twitter:description" content="Карточки, интерактивные режимы, аналитика прогресса и удобный обмен наборами." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Hero>
        <HeroTop>Учебная платформа • карточки • практика • прогресс</HeroTop>
        <HeroTitle>
          Учёба в ритме дня, а не
          <br />
          в режиме <HeroAccent>стресса перед дедлайном</HeroAccent>
        </HeroTitle>
        <HeroSubtitle>
          FluffyCards помогает разложить материал по шагам: от первичного знакомства до уверенного воспроизведения.
          Создавайте свои наборы, тренируйтесь в интерактивных режимах и закрепляйте результат без перегруза.
        </HeroSubtitle>

        <HeroActions>
          {authState.loading ? null : authState.isAuthenticated ? (
            <>
              <PrimaryCta to="/dashboard">Открыть личный кабинет</PrimaryCta>
              <SecondaryCta to="/library">Перейти в публичную библиотеку</SecondaryCta>
              <SecondaryButton onClick={logout}>Выйти</SecondaryButton>
            </>
          ) : (
            <>
              <PrimaryCta to="/register">Создать аккаунт бесплатно</PrimaryCta>
              <SecondaryCta to="/library">Посмотреть библиотеку наборов</SecondaryCta>
            </>
          )}
        </HeroActions>

        <HeroStats>
          <Stat>
            <StatValue>3 шага</StatValue>
            <StatLabel>создать набор и начать практику</StatLabel>
          </Stat>
          <Stat>
            <StatValue>10+ режимов</StatValue>
            <StatLabel>карточки, матчинг, тесты, письмо</StatLabel>
          </Stat>
          <Stat>
            <StatValue>1 платформа</StatValue>
            <StatLabel>ученики, учителя, друзья и общий контент</StatLabel>
          </Stat>
        </HeroStats>
      </Hero>

      <Grid>
        <Panel $span={5}>
          <PanelTitle>Как это работает</PanelTitle>
          <PanelText>
            Система построена вокруг коротких циклов практики, чтобы знания закреплялись постепенно, без выгорания.
          </PanelText>
          <Steps>
            <Step>
              <StepNum>1</StepNum>
              <div>
                <ModeName>Соберите материал</ModeName>
                <ModeDesc>Добавьте термины вручную, импортом или из готовых наборов.</ModeDesc>
              </div>
            </Step>
            <Step>
              <StepNum>2</StepNum>
              <div>
                <ModeName>Тренируйтесь в разных форматах</ModeName>
                <ModeDesc>Карточки, заучивание, тест, игровые режимы и письменная практика.</ModeDesc>
              </div>
            </Step>
            <Step>
              <StepNum>3</StepNum>
              <div>
                <ModeName>Следите за прогрессом</ModeName>
                <ModeDesc>Проверяйте точность, повторяйте слабые места и повышайте стабильность ответа.</ModeDesc>
              </div>
            </Step>
          </Steps>
        </Panel>

        <Panel $span={7}>
          <PanelTitle>Режимы, которые реально помогают учить</PanelTitle>
          <PanelText>
            Каждый режим решает свою задачу: распознавание, вспоминание, скорость ответа и закрепление в памяти.
          </PanelText>
          <ModesGrid>
            <ModeCard to="/learn/flashcards">
              <ModeName>🎴 Карточки</ModeName>
              <ModeDesc>Базовый режим повторения и быстрого обзора.</ModeDesc>
            </ModeCard>
            <ModeCard to="/learn/study">
              <ModeName>🎯 Заучивание</ModeName>
              <ModeDesc>Два раунда проверки с адаптацией по ответам.</ModeDesc>
            </ModeCard>
            <ModeCard to="/games/match">
              <ModeName>🔗 Подбор</ModeName>
              <ModeDesc>Связка терминов и определений в динамике.</ModeDesc>
            </ModeCard>
            <ModeCard to="/learn/laoshi">
              <ModeName>🐼 Лаоши</ModeName>
              <ModeDesc>Комбинированный режим: карточки, тест и письмо.</ModeDesc>
            </ModeCard>
          </ModesGrid>
        </Panel>
      </Grid>

      <Faq>
        <FaqTitle>Частые вопросы</FaqTitle>
        <FaqList>
          <FaqItem>
            <summary>Подойдёт ли платформа для преподавателя?</summary>
            <p>Да. Можно создавать тематические наборы, делиться ими с учениками и отслеживать прогресс по результатам занятий.</p>
          </FaqItem>
          <FaqItem>
            <summary>Можно ли использовать уже готовые наборы?</summary>
            <p>Да. В публичной библиотеке доступны чужие наборы: их можно открыть, сохранить и изучать в своих режимах.</p>
          </FaqItem>
          <FaqItem>
            <summary>Есть ли поддержка китайского языка и иероглифов?</summary>
            <p>Да. В карточках поддерживаются пиньинь/перевод, а в обучении есть отдельный тренажёр письменной практики.</p>
          </FaqItem>
        </FaqList>
      </Faq>

      <BottomCta>
        <BottomTitle>Начните с малого, чтобы дойти до уверенного результата</BottomTitle>
        <BottomText>
          Сформируйте первый набор на 15-20 карточек, пройдите режим заучивания и тест в один день.
          Уже через 2-3 короткие сессии заметите, что вспоминать материал стало легче и быстрее.
        </BottomText>
        <HeroActions>
          {authState.loading ? null : authState.isAuthenticated ? (
            <PrimaryCta to="/dashboard">Продолжить обучение</PrimaryCta>
          ) : (
            <PrimaryCta to="/register">Начать сейчас</PrimaryCta>
          )}
          <SecondaryCta to="/contacts">Связаться с командой</SecondaryCta>
        </HeroActions>
      </BottomCta>
    </Page>
  );
}

export default Home;
