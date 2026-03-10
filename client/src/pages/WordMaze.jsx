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
const playerBounce = keyframes`
  0%,100% { transform: scale(1); }
  50%     { transform: scale(1.15); }
`;
const pathGlow = keyframes`
  0%,100% { box-shadow: inset 0 0 8px rgba(34,197,94,0.2); }
  50%     { box-shadow: inset 0 0 16px rgba(34,197,94,0.4); }
`;
const wallReveal = keyframes`
  from { background: var(--card-bg, #e5e7eb); }
  to   { background: #1e293b; }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const cellPop = keyframes`
  0% { transform: scale(0.7); }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 800px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #059669; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#059669'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;
const MazeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols}, 1fr);
  gap: 4px;
  max-width: 500px;
  margin: 0 auto 1.5rem;
  @media (max-width: 500px) { gap: 2px; }
`;
const Cell = styled.button`
  aspect-ratio: 1; border-radius: 10px; border: 2px solid transparent;
  font-size: 1.4rem; display: flex; align-items: center; justify-content: center;
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s; position: relative;

  ${p => p.$type === 'wall' && css`
    background: #1e293b; color: #475569;
    animation: ${wallReveal} 0.3s ease;
  `}
  ${p => p.$type === 'path' && css`
    background: #dcfce7; border-color: #86efac;
    animation: ${pathGlow} 2s ease infinite;
  `}
  ${p => p.$type === 'visited' && css`
    background: #d1fae5; border-color: #6ee7b7;
  `}
  ${p => p.$type === 'player' && css`
    background: #bbf7d0; border-color: #22c55e; border-width: 3px;
    animation: ${playerBounce} 1s ease infinite;
    box-shadow: 0 0 16px rgba(34,197,94,0.4);
  `}
  ${p => p.$type === 'unknown' && css`
    background: var(--bg-secondary, #f1f5f9); border-color: var(--border-color, #e5e7eb);
    &:hover { border-color: #059669; transform: scale(1.05); }
  `}
  ${p => p.$type === 'goal' && css`
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-color: #f59e0b;
    border-width: 3px;
    animation: ${playerBounce} 1s ease infinite;
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
    font-size: 1.6rem;
  `}
  ${p => p.$type === 'start' && css`
    background: #dbeafe; border-color: #93c5fd;
  `}
  ${p => p.$wrong && css`animation: ${shake} 0.4s ease;`}

  @media (max-width: 500px) {
    border-radius: 6px; font-size: 1.1rem;
  }
`;
const QuestionOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; align-items: center; justify-content: center; padding: 1rem;
  animation: ${pop} 0.2s ease;
`;
const QuestionCard = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  max-width: 440px; width: 100%; text-align: center;
  box-shadow: 0 16px 48px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.3s ease;
`;
const QuestionTerm = styled.div`
  font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 1rem 0 1.5rem;
  @media (max-width: 600px) { font-size: 1.2rem; }
`;
const OptionsGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  @media (max-width: 400px) { grid-template-columns: 1fr; }
`;
const OptionBtn = styled.button`
  padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; word-break: break-word;
  border: 2px solid var(--border-color, #e5e7eb);
  background: var(--card-bg, #fff); color: var(--text-primary);
  ${p => p.$correct && css`border-color: #22c55e; background: #dcfce7; color: #15803d;`}
  ${p => p.$wrong && css`border-color: #ef4444; background: #fee2e2; color: #dc2626; animation: ${shake} 0.4s ease;`}
  &:hover:not(:disabled) { border-color: #059669; transform: translateY(-2px); }
  &:disabled { cursor: default; }
`;
const Card = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${pop} 0.4s ease;
`;
const Btn = styled.button`
  padding: 12px 28px; border-radius: 14px; border: none; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: all 0.2s;
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #059669, #047857)'};
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

const SIZE = 5;

function generateMaze(size) {
  // Simple maze: always a valid path from (0,0) to (size-1,size-1)
  const grid = Array.from({ length: size }, () => Array(size).fill('unknown'));

  // Create a random path
  const path = [];
  let r = 0, c = 0;
  path.push([0, 0]);
  grid[0][0] = 'start';

  while (r < size - 1 || c < size - 1) {
    const moves = [];
    if (r < size - 1) moves.push([r + 1, c]);
    if (c < size - 1) moves.push([r, c + 1]);
    // Occasional backtrack-like lateral moves
    if (r > 0 && Math.random() < 0.2) moves.push([r - 1, c]);
    if (c > 0 && Math.random() < 0.2) moves.push([r, c - 1]);

    const [nr, nc] = moves[Math.floor(Math.random() * moves.length)];
    if (grid[nr][nc] === 'unknown') {
      grid[nr][nc] = 'path';
      path.push([nr, nc]);
    }
    r = nr; c = nc;
  }
  grid[size - 1][size - 1] = 'goal';

  return { grid, path };
}

export default function WordMaze() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [maze, setMaze] = useState(null);
  const [playerPos, setPlayerPos] = useState([0, 0]);
  const [revealed, setRevealed] = useState({});
  const [question, setQuestion] = useState(null);
  const [qOptions, setQOptions] = useState([]);
  const [qResult, setQResult] = useState(null);
  const [qSelected, setQSelected] = useState(null);
  const [targetCell, setTargetCell] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [steps, setSteps] = useState(0);
  const [wrongCell, setWrongCell] = useState(null);
  const [qIdx, setQIdx] = useState(0);

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
    const m = generateMaze(SIZE);
    setMaze(m.grid);
    setPlayerPos([0, 0]);
    // Reveal start and goal from the beginning
    const initRevealed = { '0,0': true };
    initRevealed[`${SIZE - 1},${SIZE - 1}`] = true;
    setRevealed(initRevealed);
    setScore(0); setCorrect(0); setMistakes(0); setSteps(0);
    setQuestion(null); setFinished(false); setGameStarted(true); setQIdx(0);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const isAdjacent = (r1, c1, r2, c2) => {
    return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
  };

  const genOptions = (card) => {
    const wrong = flashcards.filter(c => c.definition !== card.definition)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.definition);
    return [card.definition, ...wrong].sort(() => Math.random() - 0.5);
  };

  const handleCellClick = (r, c) => {
    if (question || finished) return;
    if (!isAdjacent(playerPos[0], playerPos[1], r, c)) return;

    // Allow moving through already-revealed path/start/goal cells without a question
    if (revealed[`${r},${c}`]) {
      const cellType = maze[r][c];
      if (cellType === 'path' || cellType === 'start' || cellType === 'goal') {
        setSteps(s => s + 1);
        setPlayerPos([r, c]);
        if (cellType === 'goal') {
          confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
          setFinished(true);
        }
      }
      return;
    }

    // Open question for unrevealed cell
    if (flashcards.length === 0) return;
    const card = flashcards[qIdx % flashcards.length];
    setQuestion(card);
    setQOptions(genOptions(card));
    setQResult(null); setQSelected(null);
    setTargetCell([r, c]);
  };

  const handleAnswer = (idx) => {
    if (qResult) return;
    setQSelected(idx);
    const isCorrect = qOptions[idx] === question.definition;

    if (isCorrect) {
      setQResult('correct');
      setCorrect(c => c + 1);
      setScore(s => s + 20);
      setQIdx(q => q + 1);

      setTimeout(() => {
        const [r, c] = targetCell;
        const cellType = maze[r][c];

        setRevealed(prev => ({ ...prev, [`${r},${c}`]: true }));
        setSteps(s => s + 1);

        if (cellType === 'goal' || cellType === 'path' || cellType === 'start') {
          setPlayerPos([r, c]);
          if (cellType === 'goal') {
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
            setFinished(true);
          }
        }

        setQuestion(null);
      }, 800);
    } else {
      setQResult('wrong');
      setMistakes(m => m + 1);
      setQIdx(q => q + 1);

      setTimeout(() => {
        const [r, c] = targetCell;
        // Reveal as wall
        setRevealed(prev => ({ ...prev, [`${r},${c}`]: true }));

        // If the cell was actually a path, it becomes blocked for this game
        const newMaze = maze.map(row => [...row]);
        if (newMaze[r][c] !== 'goal') {
          newMaze[r][c] = 'wall';
        }
        setMaze(newMaze);
        setWrongCell(`${r},${c}`);
        setTimeout(() => setWrongCell(null), 500);

        setQuestion(null);
      }, 1200);
    }
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'word-maze', cardsCount: steps, correctCount: correct, timeSpent: t })
      });
      if (correct > 0) trackGameWin();
    } catch {}
  }, [correct, steps]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  const getCellType = (r, c) => {
    const key = `${r},${c}`;
    if (r === playerPos[0] && c === playerPos[1]) return 'player';
    if (!revealed[key]) return 'unknown';
    return maze[r][c];
  };

  const getCellEmoji = (type, r, c) => {
    if (type === 'player') return '🧭';
    if (type === 'goal') return '🏆';
    if (type === 'start') return '🏁';
    if (type === 'wall') return '🧱';
    if (type === 'path' || type === 'visited') return '✅';
    if (type === 'unknown') {
      // Show question mark if adjacent to player
      if (isAdjacent(playerPos[0], playerPos[1], r, c)) return '❓';
      return '·';
    }
    return '';
  };

  if (!setId) return <SetSelector title="🌿 Лабиринт слов" subtitle="Пройдите лабиринт, отвечая на вопросы!" onSelectSet={s => navigate(`/games/word-maze?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/word-maze')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    return (
      <Container>
        <Card>
          <Title>🏆 Лабиринт пройден!</Title>
          <Sub>Вы нашли путь через лабиринт!</Sub>
          <StatsGrid>
            <StatBox $c="#059669"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#3b82f6"><div className="val">{steps}</div><div className="lbl">👣 Шагов</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{correct}</div><div className="lbl">✅ Верных</div></StatBox>
            <StatBox $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">🧱 Стен</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/word-maze')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🌿 Лабиринт слов</Title>
        <Sub>Найдите путь через лабиринт, отвечая на вопросы!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#065f46' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#059669', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>🧭 Вы начинаете в левом верхнем углу</div>
            <div>🏆 Цель — добраться до правого нижнего</div>
            <div>❓ Нажмите на соседнюю клетку для вопроса</div>
            <div>✅ Правильный ответ = путь открыт</div>
            <div>❌ Ошибка = клетка становится стеной</div>
            <div>🧱 Будьте осторожны — не заблокируйте путь!</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Войти в лабиринт</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/word-maze')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🌿 Лабиринт слов</Title>

      <TopBar>
        <Stat $c="#059669"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $c="#3b82f6"><div className="val">{steps}</div><div className="lbl">Шагов</div></Stat>
        <Stat $c="#22c55e"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
        <Stat $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">Стен</div></Stat>
      </TopBar>

      <MazeGrid $cols={SIZE}>
        {maze && maze.map((row, r) =>
          row.map((_, c) => {
            const type = getCellType(r, c);
            const isAdj = isAdjacent(playerPos[0], playerPos[1], r, c);
            const isRevealedPath = revealed[`${r},${c}`] && (maze[r][c] === 'path' || maze[r][c] === 'start' || maze[r][c] === 'goal');
            const clickable = isAdj && (type === 'unknown' || isRevealedPath) && type !== 'player';
            return (
              <Cell
                key={`${r},${c}`}
                $type={type}
                $clickable={clickable}
                $wrong={wrongCell === `${r},${c}`}
                onClick={() => clickable && handleCellClick(r, c)}
              >
                {getCellEmoji(type, r, c)}
              </Cell>
            );
          })
        )}
      </MazeGrid>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <span>🧭 Вы</span>
        <span>🏆 Финиш</span>
        <span>❓ Путь</span>
        <span>🧱 Стена</span>
        <span>✅ Открыто</span>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        Нажмите на ❓ рядом с 🧭 чтобы продвинуться
      </div>

      {question && (
        <QuestionOverlay>
          <QuestionCard>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ответьте правильно, чтобы пройти!</div>
            <QuestionTerm>{question.term}</QuestionTerm>
            <OptionsGrid>
              {qOptions.map((opt, idx) => {
                const isCorrectOpt = opt === question.definition;
                return (
                  <OptionBtn
                    key={idx}
                    $correct={qResult && isCorrectOpt}
                    $wrong={qResult === 'wrong' && qSelected === idx}
                    disabled={qResult !== null}
                    onClick={() => handleAnswer(idx)}
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
