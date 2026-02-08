import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

/* ───────── keyframes ───────── */
const pop = keyframes`
  0%   { transform: scale(0.7); opacity: 0; }
  60%  { transform: scale(1.06); }
  100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-8px); }
  40%  { transform: translateX(8px); }
  60%  { transform: translateX(-4px); }
  80%  { transform: translateX(4px); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const linkGrow = keyframes`
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
`;

/* ───────── styled ───────── */
const Container = styled.div`
  max-width: 850px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  color: #7c3aed;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

/* --- панель статистики --- */
const TopBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const Stat = styled.div`
  background: var(--card-bg, white);
  padding: 0.6rem 1.2rem;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #e5e7eb);
  text-align: center;
  min-width: 85px;
  .val { font-size: 1.4rem; font-weight: 700; color: ${p => p.$color || '#7c3aed'}; }
  .lbl { font-size: 0.75rem; color: var(--text-secondary); }
`;

/* --- визуализация цепочки --- */
const ChainContainer = styled.div`
  position: relative;
  background: var(--card-bg, white);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
  overflow: hidden;
`;

const ChainLabel = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
`;

const ChainTrack = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
  min-height: 50px;
  padding: 0.5rem 0;
`;

const ChainLink = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: white;
  animation: ${pop} 0.3s ease;
  position: relative;
  flex-shrink: 0;
  background: ${p => {
    const colors = [
      'linear-gradient(135deg, #a78bfa, #7c3aed)',
      'linear-gradient(135deg, #818cf8, #4f46e5)',
      'linear-gradient(135deg, #c084fc, #9333ea)',
      'linear-gradient(135deg, #f0abfc, #d946ef)',
      'linear-gradient(135deg, #a78bfa, #6d28d9)',
    ];
    return colors[p.$index % colors.length];
  }};
  box-shadow: 0 3px 10px rgba(124, 58, 237, 0.3);
`;

const ChainConnector = styled.div`
  width: 20px;
  height: 4px;
  background: linear-gradient(90deg, #a78bfa, #7c3aed);
  border-radius: 2px;
  animation: ${linkGrow} 0.2s ease;
  transform-origin: left;
  flex-shrink: 0;
`;

const ChainBreak = styled.div`
  font-size: 1.5rem;
  animation: ${shake} 0.5s ease;
  margin: 0 0.25rem;
`;

const EmptyChain = styled.div`
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.95rem;
  padding: 0.5rem;
`;

/* --- combo multiplier --- */
const ComboDisplay = styled.div`
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  animation: ${p => p.$active ? css`${pulse} 0.6s ease` : 'none'};
  color: ${p => {
    if (p.$combo >= 5) return '#dc2626';
    if (p.$combo >= 3) return '#f59e0b';
    return '#7c3aed';
  }};
`;

const MultiplierBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.7rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  margin-left: 0.5rem;
  background: ${p => {
    if (p.$combo >= 5) return 'linear-gradient(135deg, #ef4444, #dc2626)';
    if (p.$combo >= 3) return 'linear-gradient(135deg, #f59e0b, #d97706)';
    return 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
  }};
  background-size: 200% 100%;
  animation: ${p => p.$combo >= 5 ? css`${shimmer} 2s linear infinite` : 'none'};
`;

/* --- карточка вопроса --- */
const QuestionCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.1));
  border: 2px solid ${p =>
    p.$status === 'correct' ? '#22c55e' :
    p.$status === 'wrong' ? '#ef4444' :
    'var(--border-color, transparent)'};
  animation: ${slideUp} 0.3s ease;
  transition: border-color 0.3s ease;
`;

const QuestionLabel = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.4rem;
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
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const OptionBtn = styled.button`
  padding: 1rem;
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
    border-color: #7c3aed;
    box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
  }
`;

const PointsPopup = styled.div`
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1rem;
  animation: ${pop} 0.35s ease;
  color: ${p => p.$correct ? '#16a34a' : '#dc2626'};
`;

/* --- результат --- */
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
  color: var(--text-secondary);
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
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#7c3aed'}; }
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
    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary'
    ? 'rgba(107,114,128,0.4)' : 'rgba(124,58,237,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: var(--border-color, #e5e7eb);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, #a78bfa, #7c3aed);
`;

/* --- утилиты --- */
const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #7c3aed; border-radius: 50%; }
`;

const ErrorWrap = styled.div`
  text-align: center; padding: 3rem;
  background: var(--card-bg, #fee2e2); border-radius: 24px;
  color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── helpers ───────── */
const TOTAL_ROUNDS = 15;

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(card, allCards) {
  const wrong = shuffleArray(allCards.filter(c => c.term !== card.term))
    .slice(0, 3)
    .map(c => c.definition);
  while (wrong.length < 3) {
    wrong.push(card.definition.split('').reverse().join(''));
  }
  return shuffleArray([card.definition, ...wrong]);
}

function getMultiplier(chain) {
  if (chain >= 10) return 5;
  if (chain >= 7) return 4;
  if (chain >= 5) return 3;
  if (chain >= 3) return 2;
  return 1;
}

function getComboLabel(chain) {
  if (chain >= 10) return '🔥 НЕВЕРОЯТНО!';
  if (chain >= 7) return '🔥 СУПЕР!';
  if (chain >= 5) return '⚡ ОТЛИЧНО!';
  if (chain >= 3) return '✨ КОМБО!';
  return '';
}

/* ═══════════════════════════════════════
   КОМПОНЕНТ
   ═══════════════════════════════════════ */
function ChainGame() {
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
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [chain, setChain] = useState(0);
  const [maxChain, setMaxChain] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [chainHistory, setChainHistory] = useState([]); // [{result: 'correct'|'wrong', index: n}]
  const [isFinished, setIsFinished] = useState(false);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);
  const transitioning = useRef(false);

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

  /* подготовка очереди */
  const prepareQueue = useCallback(() => {
    const queue = [];
    const shuffled = shuffleArray(flashcards);
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      queue.push(shuffled[i % shuffled.length]);
    }
    return queue;
  }, [flashcards]);

  /* старт */
  const startGame = useCallback(() => {
    const queue = prepareQueue();
    setQuestionsQueue(queue);
    setCurrentCard(queue[0]);
    setOptions(generateOptions(queue[0], flashcards));
    setRound(0);
    setScore(0);
    setChain(0);
    setMaxChain(0);
    setCorrect(0);
    setSelectedIdx(null);
    setAnswerResult(null);
    setPointsEarned(0);
    setChainHistory([]);
    setIsFinished(false);
    setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
    transitioning.current = false;
  }, [prepareQueue, flashcards]);

  /* переход к следующему вопросу */
  const nextQuestion = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;

    const nextRound = round + 1;
    if (nextRound >= TOTAL_ROUNDS) {
      setIsFinished(true);
      if (correct > TOTAL_ROUNDS * 0.7) {
        trackGameWin();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }
      transitioning.current = false;
      return;
    }

    setRound(nextRound);
    const nextCard = questionsQueue[nextRound];
    setCurrentCard(nextCard);
    setOptions(generateOptions(nextCard, flashcards));
    setSelectedIdx(null);
    setAnswerResult(null);
    setPointsEarned(0);
    transitioning.current = false;
  }, [round, questionsQueue, flashcards, correct]);

  /* обработка ответа */
  const handleOption = (idx) => {
    if (answerResult !== null || transitioning.current) return;

    setSelectedIdx(idx);
    const isCorrect = options[idx] === currentCard.definition;

    if (isCorrect) {
      const newChain = chain + 1;
      const mult = getMultiplier(newChain);
      const pts = 10 * mult;
      setChain(newChain);
      setMaxChain(prev => Math.max(prev, newChain));
      setScore(prev => prev + pts);
      setCorrect(prev => prev + 1);
      setPointsEarned(pts);
      setAnswerResult('correct');
      setChainHistory(prev => [...prev, { result: 'correct', index: newChain }]);

      if (newChain % 5 === 0) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
      }
    } else {
      setChain(0);
      setPointsEarned(0);
      setAnswerResult('wrong');
      setChainHistory(prev => [...prev, { result: 'wrong', index: 0 }]);
    }

    setTimeout(nextQuestion, 1300);
  };

  /* статистика */
  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chain',
          cardsCount: TOTAL_ROUNDS,
          correctCount: correct,
          timeSpent
        })
      });
    } catch (e) { console.error('Stats:', e); }
  }, [correct]);

  useEffect(() => {
    if (isFinished) recordStats();
  }, [isFinished, recordStats]);

  /* ────── RENDER ────── */
  const handleSelectSet = (set) => navigate(`/games/chain?setId=${set._id || set.id}`);

  if (!setId) {
    return (
      <SetSelector
        title="🔗 Цепочка"
        subtitle="Выберите набор карточек"
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
        <Btn onClick={() => navigate('/games/chain')} style={{ marginTop: '1rem' }}>
          Выбрать другой набор
        </Btn>
      </ErrorWrap>
    </Container>
  );

  /* ──── результат ──── */
  if (isFinished) {
    const accuracy = TOTAL_ROUNDS > 0 ? Math.round((correct / TOTAL_ROUNDS) * 100) : 0;
    return (
      <Container>
        <ResultCard>
          <ResultTitle>{accuracy >= 70 ? '🏆 Отличная цепочка!' : '🔗 Игра окончена'}</ResultTitle>
          <ResultText>
            {accuracy >= 90 ? 'Невероятный результат! Вы мастер цепочек!' :
             accuracy >= 70 ? 'Отличная работа! Цепочка была впечатляющей!' :
             'Неплохо! Тренируйтесь, чтобы построить более длинную цепочку!'}
          </ResultText>
          <StatsGrid>
            <StatBox $color="#7c3aed">
              <div className="val">{score}</div>
              <div className="lbl">🏅 Очков</div>
            </StatBox>
            <StatBox $color="#f59e0b">
              <div className="val">{maxChain}</div>
              <div className="lbl">🔗 Макс. цепь</div>
            </StatBox>
            <StatBox $color="#22c55e">
              <div className="val">{accuracy}%</div>
              <div className="lbl">🎯 Точность</div>
            </StatBox>
            <StatBox $color="#3b82f6">
              <div className="val">{correct}/{TOTAL_ROUNDS}</div>
              <div className="lbl">✅ Верных</div>
            </StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/chain')}>
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
          <Title>🔗 Цепочка</Title>
          <Subtitle>Создайте самую длинную цепь правильных ответов!</Subtitle>
        </Header>

        {currentSet && (
          <div style={{
            background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
            padding: '1rem 1.5rem',
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color, transparent)'
          }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#5b21b6' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#7c3aed', fontSize: '0.9rem' }}>
              {currentSet.flashcards?.length || 0} карточек
            </p>
          </div>
        )}

        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛓️</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{
            textAlign: 'left',
            maxWidth: 420,
            margin: '1.5rem auto',
            lineHeight: 1.9,
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}>
            <div>📝 <strong>{TOTAL_ROUNDS} раундов</strong> с вопросами</div>
            <div>✅ Правильный ответ добавляет звено в цепь</div>
            <div>❌ Ошибка разрывает цепь — начинайте заново</div>
            <div>⚡ <strong>Комбо-множитель</strong> растёт с длиной цепи</div>
            <div>🔗 3 подряд = x2, 5 = x3, 7 = x4, 10 = x5!</div>
            <div>🏆 Цель — набрать максимум очков</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Начать игру</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/chain')}>
              Другой набор
            </Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  /* ──── основная игра ──── */
  const progress = ((round + 1) / TOTAL_ROUNDS) * 100;
  const mult = getMultiplier(chain);
  const comboLabel = getComboLabel(chain);

  return (
    <Container>
      <Header>
        <Title>🔗 Цепочка</Title>
      </Header>

      <ProgressBar>
        <ProgressFill $pct={progress} />
      </ProgressBar>

      <TopBar>
        <Stat $color="#7c3aed">
          <div className="val">{score}</div>
          <div className="lbl">Очки</div>
        </Stat>
        <Stat $color="#f59e0b">
          <div className="val">🔗 {chain}</div>
          <div className="lbl">Цепь</div>
        </Stat>
        <Stat $color="#22c55e">
          <div className="val">{correct}</div>
          <div className="lbl">Верных</div>
        </Stat>
        <Stat>
          <div className="val">{round + 1}/{TOTAL_ROUNDS}</div>
          <div className="lbl">Раунд</div>
        </Stat>
      </TopBar>

      {/* визуализация цепочки */}
      <ChainContainer>
        <ChainLabel>Текущая цепочка</ChainLabel>

        {chain > 0 && comboLabel && (
          <ComboDisplay $active $combo={chain}>
            {comboLabel}
            <MultiplierBadge $combo={chain}>x{mult}</MultiplierBadge>
          </ComboDisplay>
        )}

        <ChainTrack>
          {chain === 0 && chainHistory.length > 0 && (
            <EmptyChain>Цепь разорвана! Начните новую 💪</EmptyChain>
          )}
          {chain === 0 && chainHistory.length === 0 && (
            <EmptyChain>Ответьте правильно, чтобы начать цепь</EmptyChain>
          )}
          {Array.from({ length: Math.min(chain, 15) }).map((_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChainConnector />}
              <ChainLink $index={i}>
                {i + 1}
              </ChainLink>
            </React.Fragment>
          ))}
          {chain > 15 && (
            <span style={{ marginLeft: 8, color: 'var(--text-secondary)', fontWeight: 600 }}>
              +{chain - 15}…
            </span>
          )}
        </ChainTrack>
      </ChainContainer>

      {/* вопрос */}
      {currentCard && (
        <QuestionCard $status={answerResult}>
          <QuestionLabel>
            Раунд {round + 1} из {TOTAL_ROUNDS}
          </QuestionLabel>
          <QuestionText>{currentCard.term}</QuestionText>

          <OptionsGrid>
            {options.map((opt, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectOption = opt === currentCard.definition;
              return (
                <OptionBtn
                  key={idx}
                  disabled={answerResult !== null}
                  $correct={answerResult !== null && isCorrectOption}
                  $wrong={answerResult === 'wrong' && isSelected}
                  onClick={() => handleOption(idx)}
                >
                  {opt}
                </OptionBtn>
              );
            })}
          </OptionsGrid>

          {answerResult === 'correct' && pointsEarned > 0 && (
            <PointsPopup $correct>
              +{pointsEarned} очков!
              {mult > 1 && ` (x${mult})`}
            </PointsPopup>
          )}
          {answerResult === 'wrong' && (
            <PointsPopup>
              💔 Цепь разорвана!
            </PointsPopup>
          )}
        </QuestionCard>
      )}
    </Container>
  );
}

export default ChainGame;
