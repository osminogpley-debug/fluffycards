import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

/* ─── keyframes ─── */
const pop = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.08); }
  100% { transform: scale(1); opacity: 1; }
`;
const shake = keyframes`
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
`;
const hexPulse = keyframes`
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.06); }
`;
const fillAnim = keyframes`
  from { background-position: 0% 100%; }
  to   { background-position: 0% 0%; }
`;
const honeycombGlow = keyframes`
  0%,100% { box-shadow: 0 0 8px rgba(245,158,11,0.3); }
  50%     { box-shadow: 0 0 20px rgba(245,158,11,0.6); }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const buzzing = keyframes`
  0%,100% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(2px) translateY(-2px); }
  50% { transform: translateX(-2px) translateY(1px); }
  75% { transform: translateX(1px) translateY(-1px); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 800px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #d97706; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#d97706'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;

/* Hex grid */
const HexGrid = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  margin: 1.5rem auto; max-width: 500px;
`;
const HexRow = styled.div`
  display: flex; gap: 6px; justify-content: center;
  margin-left: ${p => p.$offset ? '40px' : '0'};
  @media (max-width: 500px) { margin-left: ${p => p.$offset ? '28px' : '0'}; gap: 3px; }
`;
const HexCell = styled.button`
  width: 72px; height: 72px; position: relative; cursor: pointer;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  transition: all 0.3s; border: none;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.75rem; text-align: center;
  padding: 8px; word-break: break-word; line-height: 1.1;

  ${p => p.$state === 'empty' && css`
    background: #fef3c7; color: #92400e;
    &:hover { background: #fde68a; transform: scale(1.08); }
  `}
  ${p => p.$state === 'filled' && css`
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white; animation: ${honeycombGlow} 2s ease infinite;
  `}
  ${p => p.$state === 'active' && css`
    background: #dbeafe; color: #1e40af; border: 3px solid #3b82f6;
    animation: ${hexPulse} 1s ease infinite;
  `}
  ${p => p.$state === 'wrong' && css`
    background: #fee2e2; color: #dc2626;
    animation: ${shake} 0.4s ease;
  `}

  @media (max-width: 500px) {
    width: 52px; height: 52px; font-size: 0.6rem; padding: 4px;
  }
`;
const Bee = styled.span`
  font-size: 1.4rem; animation: ${buzzing} 0.5s ease infinite;
  @media (max-width: 500px) { font-size: 1rem; }
`;

/* Question modal */
const QOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  animation: ${pop} 0.2s ease;
`;
const QCard = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  max-width: 440px; width: 100%; text-align: center;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.3s ease;
`;
const QTerm = styled.div`
  font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 1rem 0 1.5rem;
  @media (max-width: 600px) { font-size: 1.2rem; }
`;
const QInput = styled.input`
  width: 100%; padding: 14px 18px; border-radius: 14px; font-size: 1.1rem;
  border: 2px solid ${p => p.$status === 'correct' ? '#22c55e' : p.$status === 'wrong' ? '#ef4444' : '#e5e7eb'};
  background: ${p => p.$status === 'correct' ? '#f0fdf4' : p.$status === 'wrong' ? '#fef2f2' : 'var(--bg-secondary, #fff)'};
  color: var(--text-primary); outline: none; transition: border 0.2s;
  box-sizing: border-box;
  &:focus { border-color: #d97706; }
  ${p => p.$status === 'wrong' && css`animation: ${shake} 0.4s ease;`}
`;
const QSubmit = styled.button`
  margin-top: 12px; padding: 12px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
  width: 100%;
  &:hover { transform: translateY(-2px); }
  &:disabled { opacity: 0.5; cursor: default; transform: none; }
`;
const QFeedback = styled.div`
  margin-top: 1rem; padding: 10px 16px; border-radius: 12px; font-weight: 600;
  animation: ${pop} 0.3s ease;
  background: ${p => p.$ok ? '#dcfce7' : '#fee2e2'};
  color: ${p => p.$ok ? '#15803d' : '#dc2626'};
`;
const QHint = styled.div`
  font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;
  span { color: #d97706; font-weight: 600; }
`;
const Card = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${pop} 0.4s ease;
`;
const Btn = styled.button`
  padding: 12px 28px; border-radius: 14px; border: none; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: all 0.2s;
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #f59e0b, #d97706)'};
  color: ${p => p.$v === 'secondary' ? 'var(--text-primary)' : 'white'};
  border: ${p => p.$v === 'secondary' ? '2px solid var(--border-color)' : 'none'};
  &:hover { transform: translateY(-2px); }
`;
const BtnRow = styled.div`display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;`;
const StatsGrid = styled.div`display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin: 1.5rem 0;`;
const StatBox = styled.div`
  background: ${p => p.$c}11; border: 2px solid ${p => p.$c}33; border-radius: 16px;
  padding: 1rem; text-align: center;
  .val { font-size: 1.5rem; font-weight: 800; color: ${p => p.$c}; }
  .lbl { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
`;
const LoadW = styled.div`text-align:center;padding:3rem;color:var(--text-secondary);`;
const ErrW = styled.div`text-align:center;padding:2rem;h3{color:#ef4444;}`;
const RulesBox = styled.div`
  text-align: left; max-width: 440px; margin: 1.5rem auto; line-height: 2;
  font-size: 1rem; color: var(--text-primary);
`;

// Hex grid layout: 3 rows of [3, 4, 3] = 10 cells
const HEX_LAYOUT = [[3], [4], [3]];
const TOTAL_CELLS = 10;

function normalize(s) {
  return s.toLowerCase().trim().replace(/[.,!?;:"""''«»\-–—()[\]{}]/g, '').replace(/\s+/g, ' ');
}

function similarity(a, b) {
  const s1 = normalize(a), s2 = normalize(b);
  if (s1 === s2) return 1;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1;
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastVal = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) { costs[j] = j; }
      else if (j > 0) {
        let newVal = costs[j - 1];
        if (longer[i - 1] !== shorter[j - 1]) newVal = Math.min(newVal, lastVal, costs[j]) + 1;
        costs[j - 1] = lastVal;
        lastVal = newVal;
      }
    }
    if (i > 0) costs[shorter.length] = lastVal;
  }
  return (longer.length - costs[shorter.length]) / longer.length;
}

export default function HoneycombGame() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [cells, setCells] = useState([]); // { card, state: 'empty'|'filled'|'wrong' }
  const [activeCell, setActiveCell] = useState(null);
  const [answer, setAnswer] = useState('');
  const [qStatus, setQStatus] = useState(null);
  const [score, setScore] = useState(0);
  const [filled, setFilled] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const inputRef = useRef(null);
  const sessionStart = useRef(0);
  const statsRecorded = useRef(false);

  useEffect(() => {
    if (!setId) return;
    const load = async () => {
      try {
        const r = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}`);
        if (!r.ok) throw new Error('Набор не найден');
        const d = await r.json();
        const cards = (d.cards || d.flashcards || []).filter(c => c.term && c.definition);
        if (cards.length < 4) throw new Error('Нужно минимум 4 карточки');
        setFlashcards(cards);
        setCurrentSet(d);
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
  }, [setId]);

  const startGame = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const cellData = [];
    for (let i = 0; i < TOTAL_CELLS; i++) {
      cellData.push({ card: shuffled[i % shuffled.length], state: 'empty' });
    }
    setCells(cellData);
    setActiveCell(null); setAnswer(''); setQStatus(null);
    setScore(0); setFilled(0); setMistakes(0);
    setFinished(false); setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const handleCellClick = (idx) => {
    if (cells[idx].state === 'filled' || activeCell !== null) return;
    setActiveCell(idx);
    setAnswer('');
    setQStatus(null);
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (activeCell === null || qStatus || !answer.trim()) return;

    const cell = cells[activeCell];
    const sim = similarity(answer, cell.card.definition);
    const isCorrect = sim >= 0.75;

    if (isCorrect) {
      setQStatus('correct');
      const newCells = [...cells];
      newCells[activeCell] = { ...newCells[activeCell], state: 'filled' };
      setCells(newCells);
      setScore(s => s + 25);
      const newFilled = filled + 1;
      setFilled(newFilled);

      if (newFilled % 3 === 0) confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });

      setTimeout(() => {
        setActiveCell(null);
        setAnswer('');
        setQStatus(null);
        if (newFilled >= TOTAL_CELLS) {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
          setFinished(true);
        }
      }, 1000);
    } else {
      setQStatus('wrong');
      setMistakes(m => m + 1);
      const newCells = [...cells];
      newCells[activeCell] = { ...newCells[activeCell], state: 'wrong' };
      setCells(newCells);

      setTimeout(() => {
        const resetCells = [...newCells];
        resetCells[activeCell] = { ...resetCells[activeCell], state: 'empty' };
        setCells(resetCells);
        setActiveCell(null);
        setAnswer('');
        setQStatus(null);
      }, 2000);
    }
  };

  const getHint = () => {
    if (activeCell === null) return '';
    const def = cells[activeCell].card.definition;
    return `${def.charAt(0)}${'·'.repeat(def.length - 1)} (${def.length})`;
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'honeycomb', cardsCount: TOTAL_CELLS, correctCount: filled, timeSpent: t })
      });
      if (filled >= TOTAL_CELLS * 0.7) trackGameWin();
    } catch {}
  }, [filled]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  // Build hex grid indices
  const renderGrid = () => {
    let idx = 0;
    return HEX_LAYOUT.map((row, rowIndex) => (
      <HexRow key={rowIndex} $offset={rowIndex % 2 === 1}>
        {Array.from({ length: row[0] }).map((_, colIndex) => {
          const cellIdx = idx++;
          if (cellIdx >= cells.length) return null;
          const cell = cells[cellIdx];
          return (
            <HexCell
              key={cellIdx}
              $state={activeCell === cellIdx ? 'active' : cell.state}
              onClick={() => handleCellClick(cellIdx)}
            >
              {cell.state === 'filled'
                ? <Bee>🍯</Bee>
                : cell.state === 'wrong'
                  ? '💔'
                  : <span style={{ fontSize: '0.7rem' }}>{cell.card.term.length > 8 ? cell.card.term.slice(0, 7) + '…' : cell.card.term}</span>
              }
            </HexCell>
          );
        })}
      </HexRow>
    ));
  };

  if (!setId) return <SetSelector title="🍯 Соты" subtitle="Заполните соты мёдом, отвечая правильно!" onSelectSet={s => navigate(`/games/honeycomb?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/honeycomb')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    return (
      <Container>
        <Card>
          <Title>🍯 Все соты заполнены!</Title>
          <Sub>Вы отлично справились — все ячейки полны мёда!</Sub>
          <StatsGrid>
            <StatBox $c="#d97706"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{filled}/{TOTAL_CELLS}</div><div className="lbl">🍯 Заполнено</div></StatBox>
            <StatBox $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">❌ Ошибок</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/honeycomb')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🍯 Соты</Title>
        <Sub>Нажимайте на ячейки и вписывайте определения!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#d97706', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐝</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>🍯 На экране сетка из {TOTAL_CELLS} сот-ячеек</div>
            <div>👆 Нажмите на ячейку — увидите <strong>термин</strong></div>
            <div>⌨️ Впишите <strong>определение</strong> этого термина</div>
            <div>✅ Верно = ячейка заполняется мёдом 🍯</div>
            <div>❌ Ошибка = ячейка остаётся пустой</div>
            <div>🏆 Заполните все соты!</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🐝 Начать!</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/honeycomb')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🍯 Соты</Title>

      <TopBar>
        <Stat $c="#d97706"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $c="#22c55e"><div className="val">🍯 {filled}/{TOTAL_CELLS}</div><div className="lbl">Заполнено</div></Stat>
        <Stat $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">Ошибок</div></Stat>
      </TopBar>

      <HexGrid>
        {renderGrid()}
      </HexGrid>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {activeCell === null ? 'Нажмите на ячейку, чтобы открыть вопрос 🐝' : ''}
      </div>

      {activeCell !== null && (
        <QOverlay onClick={(e) => { if (e.target === e.currentTarget && !qStatus) { setActiveCell(null); } }}>
          <QCard>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐝</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Впишите определение для термина:
            </div>
            <QTerm>{cells[activeCell]?.card.term}</QTerm>
            <QHint>💡 Подсказка: <span>{getHint()}</span></QHint>

            <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
              <QInput
                ref={inputRef}
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Введите определение..."
                $status={qStatus}
                disabled={!!qStatus}
                autoComplete="off"
                autoFocus
              />
              <QSubmit type="submit" disabled={!!qStatus || !answer.trim()}>
                Ответить
              </QSubmit>
            </form>

            {qStatus === 'correct' && <QFeedback $ok>✅ Верно! Ячейка заполнена мёдом!</QFeedback>}
            {qStatus === 'wrong' && (
              <QFeedback>
                ❌ Неверно! Правильно: <strong>{cells[activeCell]?.card.definition}</strong>
              </QFeedback>
            )}
          </QCard>
        </QOverlay>
      )}
    </Container>
  );
}
