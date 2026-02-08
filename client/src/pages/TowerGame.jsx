import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

/* ───────── keyframes ───────── */
const pop = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%  { transform: translateX(-6px) rotate(-1deg); }
  40%  { transform: translateX(6px) rotate(1deg); }
  60%  { transform: translateX(-3px) rotate(-0.5deg); }
  80%  { transform: translateX(3px) rotate(0.5deg); }
`;

const sway = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25%  { transform: rotate(0.5deg); }
  75%  { transform: rotate(-0.5deg); }
`;

const blockDrop = keyframes`
  0%   { transform: translateY(-60px) scale(1.1); opacity: 0; }
  60%  { transform: translateY(5px) scale(0.98); }
  80%  { transform: translateY(-2px) scale(1.01); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
`;

const crumble = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  40%  { transform: translateY(-10px) scale(1.05); }
  100% { transform: translateY(60px) scale(0.6) rotate(15deg); opacity: 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
`;

const starPop = keyframes`
  0%   { transform: scale(0) rotate(0deg); opacity: 1; }
  50%  { transform: scale(1.5) rotate(180deg); }
  100% { transform: scale(0) rotate(360deg); opacity: 0; }
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
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: #0891b2;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

/* --- панель --- */
const TopBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  background: var(--card-bg, white);
  padding: 0.5rem 1.2rem;
  border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #e5e7eb);
  text-align: center;
  min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$color || '#0891b2'}; }
  .lbl { font-size: 0.7rem; color: var(--text-secondary); }
`;

/* --- башня --- */
const TowerArea = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 1.5rem 1rem 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
  min-height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  overflow: hidden;
  animation: ${p => p.$shaking ? css`${shake} 0.5s ease` : 'none'};
`;

const TowerLabel = styled.div`
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  z-index: 5;
`;

const HeightIndicator = styled.div`
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0891b2;
`;

const TowerStack = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 0;
  width: 100%;
  animation: ${p => p.$sway ? css`${sway} 2s ease-in-out infinite` : 'none'};
  transform-origin: bottom center;
`;

const TowerBlock = styled.div`
  width: ${p => Math.max(50, 90 - p.$index * 2)}%;
  min-height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: white;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
  position: relative;
  
  animation: ${p =>
    p.$removing ? css`${crumble} 0.5s ease forwards` :
    p.$new ? css`${blockDrop} 0.45s ease` :
    'none'};

  background: ${p => {
    const colors = [
      'linear-gradient(135deg, #06b6d4, #0891b2)',
      'linear-gradient(135deg, #14b8a6, #0d9488)',
      'linear-gradient(135deg, #22d3ee, #06b6d4)',
      'linear-gradient(135deg, #2dd4bf, #14b8a6)',
      'linear-gradient(135deg, #67e8f9, #22d3ee)',
      'linear-gradient(135deg, #5eead4, #2dd4bf)',
      'linear-gradient(135deg, #0ea5e9, #0284c7)',
      'linear-gradient(135deg, #38bdf8, #0ea5e9)',
      'linear-gradient(135deg, #a78bfa, #7c3aed)',
      'linear-gradient(135deg, #f472b6, #ec4899)',
    ];
    return colors[p.$index % colors.length];
  }};

  box-shadow: 0 3px 12px rgba(8, 145, 178, 0.25),
    inset 0 1px 0 rgba(255,255,255,0.2);
  
  margin-top: -2px;
`;

const Foundation = styled.div`
  width: 95%;
  height: 12px;
  background: linear-gradient(135deg, #78716c, #57534e);
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
`;

const StarEffect = styled.div`
  position: absolute;
  font-size: 1.5rem;
  animation: ${starPop} 0.6s ease forwards;
  pointer-events: none;
  top: ${p => p.$top}%;
  left: ${p => p.$left}%;
`;

const EmptyTower = styled.div`
  text-align: center;
  color: var(--text-secondary);
  padding: 2rem 0;
  font-size: 1rem;
  animation: ${float} 2s ease-in-out infinite;
`;

/* --- вопрос --- */
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
  color: var(--text-secondary, #6b7280);
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
    border-color: #0891b2;
    box-shadow: 0 4px 15px rgba(8, 145, 178, 0.2);
  }
`;

const FeedbackMsg = styled.div`
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
  margin-top: 1rem;
  animation: ${pop} 0.3s ease;
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
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#0891b2'}; }
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
    : 'linear-gradient(135deg, #06b6d4, #0891b2)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary'
    ? 'rgba(107,114,128,0.4)' : 'rgba(8,145,178,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 10px;
  background: var(--border-color, #e5e7eb);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, #22d3ee, #0891b2);
`;

/* --- утилиты --- */
const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #0891b2; border-radius: 50%; }
`;

const ErrorWrap = styled.div`
  text-align: center; padding: 3rem;
  background: var(--card-bg, #fee2e2); border-radius: 24px;
  color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── helpers ───────── */
const MAX_HEIGHT = 10; // блоков до победы
const TOTAL_QUESTIONS = 15; // всего вопросов

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

/* ═══════════════════════════════════════
   КОМПОНЕНТ
   ═══════════════════════════════════════ */
function TowerGame() {
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
  const [correct, setCorrect] = useState(0);

  // башня — массив блоков: { term, definition, id }
  const [tower, setTower] = useState([]);
  const [newBlockId, setNewBlockId] = useState(null);
  const [removingBlockId, setRemovingBlockId] = useState(null);
  const [shaking, setShaking] = useState(false);

  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [stars, setStars] = useState([]);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);
  const transitioning = useRef(false);
  const blockIdCounter = useRef(0);

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

  /* подготовка вопросов */
  const prepareQueue = useCallback(() => {
    const queue = [];
    const shuffled = shuffleArray(flashcards);
    for (let i = 0; i < TOTAL_QUESTIONS; i++) {
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
    setCorrect(0);
    setTower([]);
    setNewBlockId(null);
    setRemovingBlockId(null);
    setShaking(false);
    setSelectedIdx(null);
    setAnswerResult(null);
    setIsFinished(false);
    setGameWon(false);
    setGameStarted(true);
    setStars([]);
    blockIdCounter.current = 0;
    sessionStart.current = Date.now();
    statsRecorded.current = false;
    transitioning.current = false;
  }, [prepareQueue, flashcards]);

  /* следующий вопрос */
  const nextQuestion = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;

    const nextRound = round + 1;

    // проверяем победу
    if (tower.length >= MAX_HEIGHT) {
      setIsFinished(true);
      setGameWon(true);
      trackGameWin();
      confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
      setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.3 } }), 500);
      transitioning.current = false;
      return;
    }

    if (nextRound >= TOTAL_QUESTIONS) {
      setIsFinished(true);
      setGameWon(tower.length >= MAX_HEIGHT);
      if (tower.length >= MAX_HEIGHT) {
        trackGameWin();
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
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
    setNewBlockId(null);
    setRemovingBlockId(null);
    transitioning.current = false;
  }, [round, questionsQueue, flashcards, tower]);

  /* ответ */
  const handleOption = (idx) => {
    if (answerResult !== null || transitioning.current) return;

    setSelectedIdx(idx);
    const isCorrect = options[idx] === currentCard.definition;

    if (isCorrect) {
      blockIdCounter.current += 1;
      const newId = blockIdCounter.current;
      const newBlock = {
        id: newId,
        term: currentCard.term,
      };

      const pts = 10 + tower.length * 5; // чем выше башня, тем больше очков
      setScore(prev => prev + pts);
      setCorrect(prev => prev + 1);
      setTower(prev => [...prev, newBlock]);
      setNewBlockId(newId);
      setAnswerResult('correct');

      // звёздочки при каждом 3-м блоке
      if ((tower.length + 1) % 3 === 0) {
        const newStars = Array.from({ length: 3 }).map((_, i) => ({
          id: Date.now() + i,
          top: 20 + Math.random() * 60,
          left: 10 + Math.random() * 80,
        }));
        setStars(newStars);
        setTimeout(() => setStars([]), 700);
        confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } });
      }

      // победа?
      if (tower.length + 1 >= MAX_HEIGHT) {
        setTimeout(() => {
          setIsFinished(true);
          setGameWon(true);
          trackGameWin();
          confetti({ particleCount: 200, spread: 90, origin: { y: 0.4 } });
          setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } }), 400);
        }, 800);
        return;
      }

      setTimeout(nextQuestion, 1000);
    } else {
      setAnswerResult('wrong');
      setShaking(true);

      // убираем верхний блок
      if (tower.length > 0) {
        const topBlock = tower[tower.length - 1];
        setRemovingBlockId(topBlock.id);
        setTimeout(() => {
          setTower(prev => prev.slice(0, -1));
          setRemovingBlockId(null);
          setShaking(false);
        }, 500);
      } else {
        setTimeout(() => setShaking(false), 500);
      }

      setTimeout(nextQuestion, 1400);
    }
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
          mode: 'tower',
          cardsCount: TOTAL_QUESTIONS,
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
  const handleSelectSet = (set) => navigate(`/games/tower?setId=${set._id || set.id}`);

  if (!setId) {
    return (
      <SetSelector
        title="🏗️ Башня знаний"
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
        <Btn onClick={() => navigate('/games/tower')} style={{ marginTop: '1rem' }}>
          Выбрать другой набор
        </Btn>
      </ErrorWrap>
    </Container>
  );

  /* ──── результат ──── */
  if (isFinished) {
    const maxReached = Math.min(tower.length, MAX_HEIGHT);
    return (
      <Container>
        <ResultCard>
          <ResultTitle>
            {gameWon ? '🏆 Башня построена!' : '🏗️ Время вышло!'}
          </ResultTitle>
          <ResultText>
            {gameWon
              ? `Великолепно! Вы построили башню из ${MAX_HEIGHT} блоков!`
              : `Вопросы закончились. Ваша башня: ${maxReached} из ${MAX_HEIGHT} блоков.`}
          </ResultText>
          <StatsGrid>
            <StatBox $color="#0891b2">
              <div className="val">{score}</div>
              <div className="lbl">🏅 Очков</div>
            </StatBox>
            <StatBox $color="#f59e0b">
              <div className="val">{maxReached}/{MAX_HEIGHT}</div>
              <div className="lbl">🏗️ Высота</div>
            </StatBox>
            <StatBox $color="#22c55e">
              <div className="val">{correct}/{round + 1}</div>
              <div className="lbl">✅ Верных</div>
            </StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/tower')}>
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
          <Title>🏗️ Башня знаний</Title>
          <Subtitle>Стройте башню из правильных ответов!</Subtitle>
        </Header>

        {currentSet && (
          <div style={{
            background: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
            padding: '1rem 1.5rem',
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color, transparent)'
          }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#155e75' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#0891b2', fontSize: '0.9rem' }}>
              {currentSet.flashcards?.length || 0} карточек
            </p>
          </div>
        )}

        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏗️</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{
            textAlign: 'left',
            maxWidth: 420,
            margin: '1.5rem auto',
            lineHeight: 1.9,
            color: 'var(--text-primary)',
            fontSize: '1rem'
          }}>
            <div>🧱 Постройте башню из <strong>{MAX_HEIGHT} блоков</strong></div>
            <div>✅ Правильный ответ = новый блок на вершине</div>
            <div>❌ Ошибка = верхний блок падает!</div>
            <div>📝 У вас <strong>{TOTAL_QUESTIONS} вопросов</strong> — используйте мудро</div>
            <div>⬆️ Чем выше башня, тем больше очков за блок</div>
            <div>🏆 Цель — достроить башню до конца!</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Начать строить</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/tower')}>
              Другой набор
            </Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  /* ──── основная игра ──── */
  const progress = ((round + 1) / TOTAL_QUESTIONS) * 100;

  return (
    <Container>
      <Header>
        <Title>🏗️ Башня знаний</Title>
      </Header>

      <ProgressBar>
        <ProgressFill $pct={progress} />
      </ProgressBar>

      <TopBar>
        <Stat $color="#0891b2">
          <div className="val">{score}</div>
          <div className="lbl">Очки</div>
        </Stat>
        <Stat $color="#f59e0b">
          <div className="val">🧱 {tower.length}/{MAX_HEIGHT}</div>
          <div className="lbl">Башня</div>
        </Stat>
        <Stat $color="#22c55e">
          <div className="val">{correct}</div>
          <div className="lbl">Верных</div>
        </Stat>
        <Stat>
          <div className="val">{round + 1}/{TOTAL_QUESTIONS}</div>
          <div className="lbl">Вопрос</div>
        </Stat>
      </TopBar>

      {/* башня */}
      <TowerArea $shaking={shaking}>
        <TowerLabel>Ваша башня</TowerLabel>
        <HeightIndicator>{tower.length}/{MAX_HEIGHT} 🧱</HeightIndicator>

        {stars.map(s => (
          <StarEffect key={s.id} $top={s.top} $left={s.left}>⭐</StarEffect>
        ))}

        {tower.length === 0 ? (
          <EmptyTower>
            🏗️ Ответьте правильно, чтобы положить первый блок!
          </EmptyTower>
        ) : (
          <TowerStack $sway={tower.length >= 5}>
            {tower.map((block, i) => (
              <TowerBlock
                key={block.id}
                $index={i}
                $new={block.id === newBlockId}
                $removing={block.id === removingBlockId}
              >
                {block.term}
              </TowerBlock>
            ))}
          </TowerStack>
        )}
        <Foundation />
      </TowerArea>

      {/* вопрос */}
      {currentCard && !isFinished && (
        <QuestionCard $status={answerResult}>
          <QuestionLabel>
            Вопрос {round + 1} из {TOTAL_QUESTIONS}
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

          {answerResult === 'correct' && (
            <FeedbackMsg $correct>
              ✅ Новый блок добавлен! +{10 + (tower.length - 1) * 5} очков
            </FeedbackMsg>
          )}
          {answerResult === 'wrong' && (
            <FeedbackMsg>
              💥 {tower.length > 0 ? 'Верхний блок упал!' : 'Неправильно!'}
            </FeedbackMsg>
          )}
        </QuestionCard>
      )}
    </Container>
  );
}

export default TowerGame;
