import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

/* ───────── keyframes ───────── */
const pop = keyframes`
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-8px); }
  40%  { transform: translateX(8px); }
  60%  { transform: translateX(-4px); }
  80%  { transform: translateX(4px); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(251, 191, 36, 0.4); }
  50%      { box-shadow: 0 0 24px rgba(251, 191, 36, 0.8); }
`;

const wave = keyframes`
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const coinBounce = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  50%  { transform: translateY(-30px) scale(1.3); }
  100% { transform: translateY(-60px) scale(0.8); opacity: 0; }
`;

/* ───────── styled ───────── */
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #b45309;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

/* --- верхняя панель --- */
const TopBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const Stat = styled.div`
  background: var(--card-bg, white);
  padding: 0.6rem 1.4rem;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #e5e7eb);
  text-align: center;
  min-width: 80px;
  .val { font-size: 1.4rem; font-weight: 700; color: ${p => p.$color || '#b45309'}; }
  .lbl { font-size: 0.75rem; color: var(--text-secondary); }
`;

/* --- карта островов --- */
const MapWrapper = styled.div`
  position: relative;
  background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 30%, #0ea5e9 60%, #0284c7 100%);
  background-size: 200% 200%;
  animation: ${wave} 8s ease infinite;
  border-radius: 24px;
  padding: 2rem 1rem;
  min-height: 200px;
  box-shadow: 0 10px 40px rgba(14, 165, 233, 0.25);
  overflow: hidden;
`;

const MapPath = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  position: relative;
  z-index: 2;
`;

const IslandNode = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  cursor: ${p => p.$active ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: relative;

  background: ${p =>
    p.$completed ? 'linear-gradient(135deg, #22c55e, #16a34a)' :
    p.$active    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
    p.$lost      ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                   'linear-gradient(135deg, #e2e8f0, #cbd5e1)'};

  box-shadow: ${p =>
    p.$active ? '0 0 20px rgba(251, 191, 36, 0.6)' :
    p.$completed ? '0 0 12px rgba(34, 197, 94, 0.4)' :
    '0 4px 12px rgba(0,0,0,0.15)'};

  animation: ${p => p.$active ? css`${glow} 1.6s ease infinite` : 'none'};

  &:hover {
    transform: ${p => p.$active ? 'scale(1.15)' : 'none'};
  }
`;

const NodeLabel = styled.div`
  position: absolute;
  bottom: -20px;
  font-size: 0.65rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  white-space: nowrap;
`;

const TreasureNode = styled(IslandNode)`
  width: 76px;
  height: 76px;
  font-size: 2rem;
  background: ${p => p.$completed
    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
    : 'linear-gradient(135deg, #a78bfa, #7c3aed)'};
  animation: ${p => p.$active ? css`${glow} 1.2s ease infinite` : css`${float} 3s ease-in-out infinite`};
`;

/* --- карточка вопроса --- */
const QuestionOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const QuestionCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: ${pop} 0.35s ease;
  border: 1px solid var(--border-color, transparent);
  position: relative;
`;

const QuestionTitle = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 0.5rem;
`;

const QuestionText = styled.h2`
  text-align: center;
  font-size: 1.5rem;
  color: var(--text-primary, #1f2937);
  margin-bottom: 2rem;
  line-height: 1.5;
  word-break: break-word;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const OptionBtn = styled.button`
  padding: 1rem 1.2rem;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 500;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  border: 2px solid;
  transition: all 0.2s ease;
  text-align: left;
  word-break: break-word;
  font-family: inherit;
  animation: ${p => p.$wrong ? css`${shake} 0.4s ease` : 'none'};

  background: ${p =>
    p.$correct ? '#dcfce7' :
    p.$wrong   ? '#fee2e2' :
    'var(--bg-secondary, #f9fafb)'};

  border-color: ${p =>
    p.$correct ? '#22c55e' :
    p.$wrong   ? '#ef4444' :
    'var(--border-color, #e5e7eb)'};

  color: ${p =>
    p.$correct ? '#166534' :
    p.$wrong   ? '#991b1b' :
    'var(--text-primary, #1f2937)'};

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #f59e0b;
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
  }
`;

const CoinFloat = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 2rem;
  pointer-events: none;
  animation: ${coinBounce} 0.9s ease forwards;
`;

/* --- экран результата --- */
const ResultCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.1));
  border: 1px solid var(--border-color, transparent);
  animation: ${pop} 0.4s ease;
`;

const ResultTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #1f2937);
`;

const ResultText = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const StatsGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`;

const StatBox = styled.div`
  background: var(--bg-secondary, #f3f4f6);
  padding: 1.2rem 1.5rem;
  border-radius: 16px;
  min-width: 110px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#f59e0b'}; }
  .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
`;

const BtnRow = styled.div`
  display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 0.9rem 2rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  color: white;
  background: ${p => p.$variant === 'secondary'
    ? 'linear-gradient(135deg, #6b7280, #4b5563)'
    : 'linear-gradient(135deg, #f59e0b, #d97706)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary'
    ? 'rgba(107,114,128,0.4)'
    : 'rgba(245,158,11,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

/* --- служебные --- */
const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #f59e0b; border-radius: 50%; }
`;

const ErrorWrap = styled.div`
  text-align: center; padding: 3rem;
  background: var(--card-bg, #fee2e2); border-radius: 24px;
  color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

const Lives = styled.div`
  font-size: 1.6rem;
  letter-spacing: 4px;
`;

/* ───────── helpers ───────── */
const TOTAL_ISLANDS = 10;

const islandIcons = ['🌴', '🏖️', '🐚', '🦜', '🌺', '🐠', '🦀', '🐢', '🌊', '⚓'];
const islandNames = [
  'Старт', 'Коралл', 'Попугай', 'Ракушка', 'Маяк',
  'Дельфин', 'Якорь', 'Черепаха', 'Вулкан', 'Пещера'
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(correctCard, allCards) {
  const wrong = shuffleArray(allCards.filter(c => c.term !== correctCard.term))
    .slice(0, 3)
    .map(c => c.definition);

  // если неправильных вариантов < 3, дублируем с модификацией
  while (wrong.length < 3) {
    wrong.push(correctCard.definition.split('').reverse().join(''));
  }

  const options = shuffleArray([correctCard.definition, ...wrong]);
  return options;
}

/* ═══════════════════════════════════════
   КОМПОНЕНТ
   ═══════════════════════════════════════ */
function TreasureIsland() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  /* загрузка */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);

  /* игра */
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIsland, setCurrentIsland] = useState(0);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [islands, setIslands] = useState([]); // 'pending' | 'completed' | 'lost'
  const [showQuestion, setShowQuestion] = useState(false);
  const [questionCard, setQuestionCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null); // null | 'correct' | 'wrong'
  const [showCoin, setShowCoin] = useState(false);
  const [gameResult, setGameResult] = useState(null); // null | 'won' | 'lost'
  const [usedIndices, setUsedIndices] = useState([]);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);

  /* загрузка набора */
  useEffect(() => {
    if (setId) fetchSet(setId);
  }, [setId]);

  const fetchSet = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!res.ok) throw new Error('Не удалось загрузить набор');
      const data = await res.json();
      setCurrentSet(data);
      if (data.flashcards && data.flashcards.length >= 4) {
        setFlashcards(data.flashcards);
      } else {
        setError('Нужно минимум 4 карточки для этой игры');
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  /* начало игры */
  const startGame = useCallback(() => {
    setIslands(Array(TOTAL_ISLANDS).fill('pending'));
    setCurrentIsland(0);
    setLives(3);
    setCoins(0);
    setGameResult(null);
    setShowQuestion(false);
    setSelectedIdx(null);
    setAnswerResult(null);
    setUsedIndices([]);
    setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  }, []);

  /* открыть вопрос для текущего острова */
  const openQuestion = useCallback(() => {
    // выбираем карточку, которую ещё не использовали (если возможно)
    let available = flashcards.map((c, i) => i).filter(i => !usedIndices.includes(i));
    if (available.length === 0) available = flashcards.map((_, i) => i);

    const idx = available[Math.floor(Math.random() * available.length)];
    const card = flashcards[idx];

    setUsedIndices(prev => [...prev, idx]);
    setQuestionCard(card);
    setOptions(generateOptions(card, flashcards));
    setSelectedIdx(null);
    setAnswerResult(null);
    setShowCoin(false);
    setShowQuestion(true);
  }, [flashcards, usedIndices]);

  /* обработка выбора */
  const handleOptionClick = (optIdx) => {
    if (answerResult !== null) return; // уже ответили

    setSelectedIdx(optIdx);
    const isCorrect = options[optIdx] === questionCard.definition;

    if (isCorrect) {
      setAnswerResult('correct');
      setShowCoin(true);
      const reward = 10 + currentIsland * 5;
      setCoins(prev => prev + reward);

      setIslands(prev => {
        const next = [...prev];
        next[currentIsland] = 'completed';
        return next;
      });

      setTimeout(() => {
        setShowQuestion(false);
        if (currentIsland === TOTAL_ISLANDS - 1) {
          // победа!
          setGameResult('won');
          trackGameWin();
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
          setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.7 } }), 400);
        } else {
          setCurrentIsland(prev => prev + 1);
        }
      }, 1200);
    } else {
      setAnswerResult('wrong');

      setIslands(prev => {
        const next = [...prev];
        next[currentIsland] = 'lost';
        return next;
      });

      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        setShowQuestion(false);

        if (newLives <= 0) {
          setGameResult('lost');
        } else {
          // остров помечен lost, но игрок продолжает дальше
          if (currentIsland === TOTAL_ISLANDS - 1) {
            setGameResult('won');
            trackGameWin();
            confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
          } else {
            setCurrentIsland(prev => prev + 1);
          }
        }
      }, 1400);
    }
  };

  /* запись статистики */
  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      const correct = islands.filter(s => s === 'completed').length;
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'treasure-island',
          cardsCount: TOTAL_ISLANDS,
          correctCount: correct,
          timeSpent
        })
      });
    } catch (e) { console.error('Stats:', e); }
  }, [islands]);

  useEffect(() => {
    if (gameResult) recordStats();
  }, [gameResult, recordStats]);

  /* ────── RENDER ────── */
  const handleSelectSet = (set) => navigate(`/games/treasure-island?setId=${set._id || set.id}`);

  if (!setId) {
    return (
      <SetSelector
        title="🏝️ Остров сокровищ"
        subtitle="Выберите набор карточек для приключения"
        onSelectSet={handleSelectSet}
        gameMode
      />
    );
  }

  if (loading) return <Container><LoadingWrap><div className="spinner" /></LoadingWrap></Container>;
  if (error) return (
    <Container>
      <ErrorWrap>
        <h3>😕 Ошибка</h3><p>{error}</p>
        <Btn onClick={() => navigate('/games/treasure-island')} style={{ marginTop: '1rem' }}>
          Выбрать другой набор
        </Btn>
      </ErrorWrap>
    </Container>
  );

  /* ──── результат ──── */
  if (gameResult) {
    const completed = islands.filter(s => s === 'completed').length;
    const isWin = gameResult === 'won';
    return (
      <Container>
        <ResultCard>
          <ResultTitle>{isWin ? '🏆 Сокровище найдено!' : '💀 Приключение окончено'}</ResultTitle>
          <ResultText>
            {isWin
              ? `Вы прошли все ${TOTAL_ISLANDS} островов и нашли сокровище!`
              : 'Вы потеряли все жизни. Попробуйте ещё раз!'}
          </ResultText>
          <StatsGrid>
            <StatBox $color="#f59e0b">
              <div className="val">{coins}</div>
              <div className="lbl">🪙 Монет</div>
            </StatBox>
            <StatBox $color="#22c55e">
              <div className="val">{completed}/{TOTAL_ISLANDS}</div>
              <div className="lbl">✅ Островов</div>
            </StatBox>
            <StatBox $color="#ef4444">
              <div className="val">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</div>
              <div className="lbl">Жизни</div>
            </StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/treasure-island')}>
              Другой набор
            </Btn>
            <Btn $variant="secondary" onClick={() => navigate('/dashboard')}>
              ⬅️ Назад
            </Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  /* ──── стартовый экран ──── */
  if (!gameStarted) {
    return (
      <Container>
        <Header>
          <Title>🏝️ Остров сокровищ</Title>
          <Subtitle>Доберитесь до сокровища, отвечая на вопросы!</Subtitle>
        </Header>

        {currentSet && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            padding: '1rem 1.5rem',
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color, transparent)'
          }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#a16207', fontSize: '0.9rem' }}>
              {currentSet.flashcards?.length || 0} карточек
            </p>
          </div>
        )}

        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{
            textAlign: 'left',
            maxWidth: 420,
            margin: '1.5rem auto',
            lineHeight: 1.9,
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}>
            <div>🏝️ Пройдите <strong>{TOTAL_ISLANDS} островов</strong> на пути к сокровищу</div>
            <div>❓ На каждом острове — вопрос с 4 вариантами</div>
            <div>✅ Правильный ответ = монеты + продвижение</div>
            <div>❌ Неправильный = потеря жизни</div>
            <div>❤️ У вас <strong>3 жизни</strong> — берегите их!</div>
            <div>🪙 Чем дальше — тем больше монет за ответ</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Начать приключение</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/treasure-island')}>
              Другой набор
            </Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  /* ──── основной игровой экран ──── */
  return (
    <Container>
      <Header>
        <Title>🏝️ Остров сокровищ</Title>
      </Header>

      <TopBar>
        <Stat $color="#ef4444">
          <Lives className="val">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</Lives>
          <div className="lbl">Жизни</div>
        </Stat>
        <Stat $color="#f59e0b">
          <div className="val">🪙 {coins}</div>
          <div className="lbl">Монеты</div>
        </Stat>
        <Stat>
          <div className="val">{currentIsland + 1}/{TOTAL_ISLANDS}</div>
          <div className="lbl">Остров</div>
        </Stat>
      </TopBar>

      {/* карта */}
      <MapWrapper>
        <MapPath>
          {islands.map((status, i) => (
            <IslandNode
              key={i}
              $completed={status === 'completed'}
              $lost={status === 'lost'}
              $active={i === currentIsland && !showQuestion}
              onClick={() => i === currentIsland && !showQuestion ? openQuestion() : null}
            >
              {status === 'completed' ? '✅' :
               status === 'lost' ? '❌' :
               i === currentIsland ? '📍' :
               islandIcons[i]}
              <NodeLabel>{islandNames[i]}</NodeLabel>
            </IslandNode>
          ))}

          {/* финальный остров с сокровищем */}
          <TreasureNode
            $completed={gameResult === 'won'}
            $active={currentIsland === TOTAL_ISLANDS}
          >
            💎
            <NodeLabel>Сокровище</NodeLabel>
          </TreasureNode>
        </MapPath>
      </MapWrapper>

      {/* подсказка */}
      {!showQuestion && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Btn onClick={openQuestion}>
            ⚓ Высадиться на остров «{islandNames[currentIsland]}»
          </Btn>
        </div>
      )}

      {/* модальный вопрос */}
      {showQuestion && questionCard && (
        <QuestionOverlay onClick={(e) => e.target === e.currentTarget && answerResult && setShowQuestion(false)}>
          <QuestionCard>
            {showCoin && <CoinFloat>🪙</CoinFloat>}
            <QuestionTitle>
              🏝️ Остров «{islandNames[currentIsland]}» — вопрос
            </QuestionTitle>
            <QuestionText>{questionCard.term}</QuestionText>

            <OptionsGrid>
              {options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                const isCorrectOption = opt === questionCard.definition;
                return (
                  <OptionBtn
                    key={idx}
                    disabled={answerResult !== null}
                    $correct={answerResult !== null && isCorrectOption}
                    $wrong={answerResult === 'wrong' && isSelected}
                    onClick={() => handleOptionClick(idx)}
                  >
                    {opt}
                  </OptionBtn>
                );
              })}
            </OptionsGrid>
          </QuestionCard>
        </QuestionOverlay>
      )}
    </Container>
  );
}

export default TreasureIsland;
