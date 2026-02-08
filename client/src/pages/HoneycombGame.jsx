import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
`;

const hexPulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(245, 158, 11, 0); }
  50%      { transform: scale(1.04); box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
`;

const fillAnim = keyframes`
  0%   { transform: scale(0.7) rotate(-10deg); opacity: 0; }
  60%  { transform: scale(1.1) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const crackAnim = keyframes`
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.05); }
  100% { transform: scale(0.95); opacity: 0.6; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;

const honeycombGlow = keyframes`
  0%, 100% { filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.3)); }
  50%      { filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.7)); }
`;

/* ───────── styled ───────── */
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
  font-family: 'Segoe UI', sans-serif;
`;

const Header = styled.div`text-align: center; margin-bottom: 1rem;`;
const Title = styled.h1`color: #b45309; font-size: 2.4rem; margin-bottom: 0.25rem;`;
const Subtitle = styled.p`color: var(--text-secondary, #6b7280); font-size: 1rem;`;

const TopBar = styled.div`
  display: flex; justify-content: center; gap: 1.2rem; flex-wrap: wrap; margin-bottom: 1rem;
`;
const Stat = styled.div`
  background: var(--card-bg, white);
  padding: 0.5rem 1.2rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$color || '#b45309'}; }
  .lbl { font-size: 0.7rem; color: var(--text-secondary); }
`;

/* ── honeycomb grid ── */
const HoneycombWrapper = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
`;

const HoneycombLabel = styled.div`
  text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;
`;

const HexGrid = styled.div`
  max-width: 500px;
  margin: 0 auto;
  position: relative;
`;

const HexRow = styled.div`
  display: flex;
  justify-content: center;
  margin-top: -12px;
  &:first-child { margin-top: 0; }
`;

const HexCell = styled.div`
  width: 72px;
  height: 80px;
  position: relative;
  margin: 0 4px;
  cursor: ${p => (p.$clickable ? 'pointer' : 'default')};
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 68px;
    height: 78px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: ${p => {
      if (p.$filled) return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
      if (p.$active) return 'linear-gradient(135deg, #67e8f9, #06b6d4)';
      if (p.$cracked) return 'linear-gradient(135deg, #fca5a5, #ef4444)';
      return 'linear-gradient(135deg, #fef3c7, #fde68a)';
    }};
    border: 3px solid ${p => {
      if (p.$filled) return '#d97706';
      if (p.$active) return '#0891b2';
      if (p.$cracked) return '#dc2626';
      return '#f59e0b';
    }};
    transition: all 0.3s ease;
  }

  animation: ${p => {
    if (p.$active) return css`${hexPulse} 1.5s ease infinite`;
    if (p.$justFilled) return css`${fillAnim} 0.4s ease`;
    if (p.$cracked) return css`${crackAnim} 0.5s ease`;
    return 'none';
  }};

  ${p => p.$clickable && `
    &:hover::before {
      background: linear-gradient(135deg, #a7f3d0, #6ee7b7);
      border-color: #059669;
    }
    &:hover { transform: scale(1.08); }
  `}
`;

const HexContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${p => p.$size || '1.5rem'};
  font-weight: 600;
  z-index: 1;
  text-align: center;
  pointer-events: none;
  color: ${p => p.$filled ? 'white' : 'var(--text-primary, #92400e)'};
  text-shadow: ${p => p.$filled ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'};
`;

const ProgressBar = styled.div`
  max-width: 400px;
  margin: 1rem auto 0;
  height: 10px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 5px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  border-radius: 5px;
  transition: width 0.5s ease;
  width: ${p => p.$pct}%;
`;

/* ── question ── */
const QuestionOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;
`;

const QuestionCard = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  max-width: 560px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: ${pop} 0.35s ease;
  border: 1px solid var(--border-color, transparent);
`;

const QuestionText = styled.h2`
  text-align: center; font-size: 1.5rem; color: var(--text-primary, #1f2937);
  margin-bottom: 2rem; line-height: 1.5; word-break: break-word;
`;

const OptionsGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const OptionBtn = styled.button`
  padding: 1rem; border-radius: 14px; font-size: 1rem; font-weight: 500;
  cursor: ${p => p.disabled ? 'not-allowed' : 'pointer'};
  border: 2px solid; transition: all 0.2s ease; text-align: left;
  word-break: break-word; font-family: inherit;
  animation: ${p => p.$wrong ? css`${shake} 0.4s ease` : 'none'};
  background: ${p => p.$correct ? '#dcfce7' : p.$wrong ? '#fee2e2' : 'var(--bg-secondary, #f9fafb)'};
  border-color: ${p => p.$correct ? '#22c55e' : p.$wrong ? '#ef4444' : 'var(--border-color, #e5e7eb)'};
  color: ${p => p.$correct ? '#166534' : p.$wrong ? '#991b1b' : 'var(--text-primary, #1f2937)'};
  &:hover:not(:disabled) { transform: translateY(-2px); border-color: #f59e0b; }
`;

/* ── result ── */
const ResultCard = styled.div`
  background: var(--card-bg, white); border-radius: 24px; padding: 3rem 2rem;
  text-align: center; box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.1));
  border: 1px solid var(--border-color, transparent); animation: ${pop} 0.4s ease;
`;

const ResultTitle = styled.h2`font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--text-primary);`;
const ResultText = styled.p`color: var(--text-secondary); font-size: 1.1rem; margin-bottom: 2rem; line-height: 1.6;`;

const StatsGrid = styled.div`
  display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem;
`;
const StatBox = styled.div`
  background: var(--bg-secondary, #f3f4f6); padding: 1.2rem 1.5rem;
  border-radius: 16px; min-width: 110px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#b45309'}; }
  .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
`;

const BtnRow = styled.div`display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;`;
const Btn = styled.button`
  padding: 0.9rem 2rem; border-radius: 50px; font-size: 1rem; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.3s ease; font-family: inherit; color: white;
  background: ${p => p.$variant === 'secondary' ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #fbbf24, #d97706)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary' ? 'rgba(107,114,128,0.4)' : 'rgba(217,119,6,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #f59e0b; border-radius: 50%;
    animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const ErrorWrap = styled.div`
  text-align: center; padding: 3rem; background: var(--card-bg, #fee2e2);
  border-radius: 24px; color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── helpers ───────── */
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
    .slice(0, 3).map(c => c.definition);
  while (wrong.length < 3) wrong.push(card.definition.split('').reverse().join(''));
  return shuffleArray([card.definition, ...wrong]);
}

/* ── hex grid layout: offset coords ── */
// 4 rows: 3-4-3-4 = 14 cells
const HEX_LAYOUT = [
  { row: 0, count: 3, offset: false },
  { row: 1, count: 4, offset: true },
  { row: 2, count: 3, offset: false },
  { row: 3, count: 4, offset: true },
];

const TOTAL_CELLS = HEX_LAYOUT.reduce((s, r) => s + r.count, 0); // 14

const cellEmojis = ['🍯', '🐝', '🌸', '🌻', '🌺', '🌼', '🦋', '🐞', '🍀', '🌿', '💐', '🪻', '🌹', '🌷'];

/* ═══════════════════════════════════════ */
function HoneycombGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [cells, setCells] = useState([]); // { id, filled, justFilled, cracked }
  const [activeCellIdx, setActiveCellIdx] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [streak, setStreak] = useState(0);

  const [showQuestion, setShowQuestion] = useState(false);
  const [questionCard, setQuestionCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);
  const usedCards = useRef([]);

  useEffect(() => { if (setId) fetchSet(setId); }, [setId]);

  const fetchSet = async (id) => {
    try { setLoading(true); setError(null);
      const res = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!res.ok) throw new Error('Не удалось загрузить набор');
      const data = await res.json(); setCurrentSet(data);
      if (data.flashcards?.length >= 4) setFlashcards(data.flashcards);
      else setError('Нужно минимум 4 карточки');
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  const startGame = useCallback(() => {
    const initial = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
      id: i, filled: false, justFilled: false, cracked: false, emoji: cellEmojis[i % cellEmojis.length]
    }));
    setCells(initial);
    setActiveCellIdx(null);
    setScore(0); setCorrect(0); setTotalQuestions(0); setStreak(0);
    setShowQuestion(false); setSelectedIdx(null); setAnswerResult(null);
    setIsFinished(false); setGameStarted(true);
    usedCards.current = [];
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  }, []);

  const getRandomCard = useCallback(() => {
    let available = flashcards.filter((_, i) => !usedCards.current.includes(i));
    if (available.length === 0) { usedCards.current = []; available = flashcards; }
    const idx = Math.floor(Math.random() * available.length);
    const origIdx = flashcards.indexOf(available[idx]);
    usedCards.current.push(origIdx);
    return available[idx];
  }, [flashcards]);

  const handleCellClick = useCallback((cellIdx) => {
    if (showQuestion || isFinished) return;
    if (cells[cellIdx].filled) return;

    setActiveCellIdx(cellIdx);
    const card = getRandomCard();
    setQuestionCard(card);
    setOptions(generateOptions(card, flashcards));
    setSelectedIdx(null);
    setAnswerResult(null);
    setShowQuestion(true);
    setTotalQuestions(prev => prev + 1);
  }, [showQuestion, isFinished, cells, flashcards, getRandomCard]);

  const handleOption = (idx) => {
    if (answerResult !== null) return;
    setSelectedIdx(idx);
    const isCorrect = options[idx] === questionCard.definition;

    if (isCorrect) {
      setAnswerResult('correct');
      const newStreak = streak + 1;
      setStreak(newStreak);
      setCorrect(prev => prev + 1);
      const bonus = 10 + (newStreak >= 3 ? newStreak * 5 : 0);
      setScore(prev => prev + bonus);

      setTimeout(() => {
        setCells(prev => {
          const updated = prev.map((c, i) => {
            if (i === activeCellIdx) return { ...c, filled: true, justFilled: true, cracked: false };
            return { ...c, justFilled: false };
          });

          // check if all filled
          const allFilled = updated.every(c => c.filled);
          if (allFilled) {
            setIsFinished(true); setGameStarted(false);
            trackGameWin();
            confetti({ particleCount: 220, spread: 100, origin: { y: 0.5 } });
          }

          return updated;
        });
        setShowQuestion(false);
        setActiveCellIdx(null);
      }, 800);
    } else {
      setAnswerResult('wrong');
      setStreak(0);

      setTimeout(() => {
        // crack a random filled cell
        setCells(prev => {
          const filledIndexes = prev.map((c, i) => c.filled ? i : -1).filter(i => i >= 0);
          if (filledIndexes.length > 0) {
            const crackIdx = filledIndexes[Math.floor(Math.random() * filledIndexes.length)];
            return prev.map((c, i) => {
              if (i === crackIdx) return { ...c, filled: false, cracked: true, justFilled: false };
              return { ...c, justFilled: false, cracked: false };
            });
          }
          return prev.map(c => ({ ...c, justFilled: false, cracked: false }));
        });
        setShowQuestion(false);
        setActiveCellIdx(null);
      }, 1200);
    }
  };

  const filledCount = cells.filter(c => c.filled).length;
  const fillPct = Math.round((filledCount / TOTAL_CELLS) * 100);

  useEffect(() => {
    if (isFinished && !statsRecorded.current) {
      statsRecorded.current = true;
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'honeycomb', cardsCount: totalQuestions, correctCount: correct, timeSpent })
      }).catch(e => console.error('Stats:', e));
    }
  }, [isFinished, correct, totalQuestions]);

  const handleSelectSet = (set) => navigate(`/games/honeycomb?setId=${set._id || set.id}`);

  /* ── renders ── */
  if (!setId) return <SetSelector title="🍯 Соты" subtitle="Выберите набор карточек" onSelectSet={handleSelectSet} gameMode />;
  if (loading) return <Container><LoadingWrap><div className="spinner" /></LoadingWrap></Container>;
  if (error) return <Container><ErrorWrap><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/honeycomb')} style={{ marginTop: '1rem' }}>Другой набор</Btn></ErrorWrap></Container>;

  if (isFinished) {
    const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return (
      <Container>
        <ResultCard>
          <ResultTitle>🍯 Соты заполнены!</ResultTitle>
          <ResultText>Вы собрали все {TOTAL_CELLS} сот! Отличная работа!</ResultText>
          <StatsGrid>
            <StatBox $color="#d97706"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $color="#22c55e"><div className="val">{correct}/{totalQuestions}</div><div className="lbl">✅ Верных</div></StatBox>
            <StatBox $color="#2563eb"><div className="val">{pct}%</div><div className="lbl">📊 Точность</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/honeycomb')}>Другой набор</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Header><Title>🍯 Соты</Title><Subtitle>Заполните все соты правильными ответами!</Subtitle></Header>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '1rem 1.5rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--border-color, transparent)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem' }}>{currentSet.flashcards?.length || 0} карточек</p>
          </div>
        )}
        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍯</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{ textAlign: 'left', maxWidth: 420, margin: '1.5rem auto', lineHeight: 1.9, color: 'var(--text-primary)' }}>
            <div>🐝 Заполните все {TOTAL_CELLS} сот</div>
            <div>👆 Нажмите на пустую соту — появится вопрос</div>
            <div>✅ Правильный ответ = сота заполняется мёдом</div>
            <div>❌ Неправильный = одна заполненная сота ломается</div>
            <div>🔥 Серия ответов даёт бонусные очки</div>
            <div>🏆 Заполните все соты, чтобы победить!</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🐝 Начать сбор</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/honeycomb')}>Другой набор</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  // Render hex grid from layout
  let cellIndex = 0;

  return (
    <Container>
      <Header><Title>🍯 Соты</Title></Header>

      <TopBar>
        <Stat $color="#d97706"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $color="#22c55e"><div className="val">{filledCount}/{TOTAL_CELLS}</div><div className="lbl">Заполнено</div></Stat>
        <Stat $color="#7c3aed"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
        {streak >= 2 && <Stat $color="#ef4444"><div className="val">🔥 {streak}</div><div className="lbl">Серия</div></Stat>}
      </TopBar>

      <HoneycombWrapper>
        <HoneycombLabel>Нажмите на пустую соту, чтобы ответить</HoneycombLabel>
        <HexGrid>
          {HEX_LAYOUT.map((rowDef, ri) => {
            const rowCells = [];
            for (let ci = 0; ci < rowDef.count; ci++) {
              const idx = cellIndex++;
              const cell = cells[idx];
              if (!cell) continue;
              rowCells.push(
                <HexCell
                  key={cell.id}
                  $filled={cell.filled}
                  $active={activeCellIdx === idx}
                  $justFilled={cell.justFilled}
                  $cracked={cell.cracked}
                  $clickable={!cell.filled && !showQuestion}
                  onClick={() => handleCellClick(idx)}
                >
                  <HexContent $filled={cell.filled} $size={cell.filled ? '1.5rem' : '1.2rem'}>
                    {cell.filled ? cell.emoji : (activeCellIdx === idx ? '❓' : '')}
                  </HexContent>
                </HexCell>
              );
            }
            return <HexRow key={ri}>{rowCells}</HexRow>;
          })}
        </HexGrid>

        <ProgressBar>
          <ProgressFill $pct={fillPct} />
        </ProgressBar>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          {fillPct}% заполнено
        </div>
      </HoneycombWrapper>

      {showQuestion && questionCard && (
        <QuestionOverlay>
          <QuestionCard>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              🐝 Ответьте, чтобы заполнить соту{streak >= 2 ? ` • 🔥 Серия: ${streak}` : ''}
            </div>
            <QuestionText>{questionCard.term}</QuestionText>
            <OptionsGrid>
              {options.map((opt, idx) => (
                <OptionBtn key={idx} disabled={answerResult !== null}
                  $correct={answerResult !== null && opt === questionCard.definition}
                  $wrong={answerResult === 'wrong' && selectedIdx === idx}
                  onClick={() => handleOption(idx)}>{opt}</OptionBtn>
              ))}
            </OptionsGrid>
            {answerResult === 'correct' && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 700, fontSize: '1.1rem' }}>
                🍯 Сота заполнена мёдом!
              </div>
            )}
            {answerResult === 'wrong' && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>
                💔 Сота разрушена!
              </div>
            )}
          </QuestionCard>
        </QuestionOverlay>
      )}
    </Container>
  );
}

export default HoneycombGame;
