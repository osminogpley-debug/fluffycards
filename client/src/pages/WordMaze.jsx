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

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;

const playerBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
`;

const pathGlow = keyframes`
  0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.3); }
  50%      { box-shadow: 0 0 12px rgba(34, 197, 94, 0.6); }
`;

const wallShake = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
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
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: #059669;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

const TopBar = styled.div`
  display: flex; justify-content: center; gap: 1.2rem; flex-wrap: wrap; margin-bottom: 1rem;
`;

const Stat = styled.div`
  background: var(--card-bg, white);
  padding: 0.5rem 1.2rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
  border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$color || '#059669'}; }
  .lbl { font-size: 0.7rem; color: var(--text-secondary); }
`;

/* --- maze grid --- */
const MazeWrapper = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
`;

const MazeLabel = styled.div`
  text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;
`;

const MazeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(${p => p.$cols}, 1fr);
  gap: 4px;
  max-width: 500px;
  margin: 0 auto;
`;

const MazeCell = styled.div`
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${p => p.$size || '1.2rem'};
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: ${p => p.$clickable ? 'pointer' : 'default'};
  position: relative;

  background: ${p => {
    if (p.$isPlayer) return 'linear-gradient(135deg, #fbbf24, #f59e0b)';
    if (p.$isFinish) return 'linear-gradient(135deg, #a78bfa, #7c3aed)';
    if (p.$isVisited) return 'linear-gradient(135deg, #86efac, #22c55e)';
    if (p.$isWall) return 'var(--bg-tertiary, #e5e7eb)';
    if (p.$isCurrent) return 'linear-gradient(135deg, #67e8f9, #06b6d4)';
    if (p.$isPath) return 'var(--bg-secondary, #f3f4f6)';
    return 'var(--bg-secondary, #f9fafb)';
  }};

  border: 2px solid ${p => {
    if (p.$isPlayer) return '#f59e0b';
    if (p.$isFinish) return '#7c3aed';
    if (p.$isVisited) return '#22c55e';
    if (p.$isCurrent) return '#06b6d4';
    if (p.$isWall) return 'var(--border-color, #d1d5db)';
    return 'transparent';
  }};

  animation: ${p => {
    if (p.$isPlayer) return css`${playerBounce} 1s ease-in-out infinite`;
    if (p.$isCurrent) return css`${pathGlow} 1.5s ease infinite`;
    if (p.$hitWall) return css`${wallShake} 0.3s ease`;
    return 'none';
  }};

  box-shadow: ${p => p.$isPlayer ? '0 0 15px rgba(245, 158, 11, 0.5)' :
    p.$isFinish ? '0 0 10px rgba(124, 58, 237, 0.3)' : 'none'};

  &:hover {
    ${p => p.$clickable && `
      transform: scale(1.05);
      box-shadow: 0 0 12px rgba(5, 150, 105, 0.3);
    `}
  }
`;

const DirectionBtns = styled.div`
  display: grid;
  grid-template-areas:
    ". up ."
    "left . right"
    ". down .";
  gap: 0.5rem;
  max-width: 200px;
  margin: 1rem auto 0;
`;

const DirBtn = styled.button`
  width: 56px; height: 56px;
  border-radius: 14px;
  border: 2px solid var(--border-color, #e5e7eb);
  background: var(--card-bg, white);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  grid-area: ${p => p.$area};
  justify-self: center;
  
  &:hover {
    background: linear-gradient(135deg, #d1fae5, #a7f3d0);
    border-color: #059669;
    transform: scale(1.08);
  }
  &:active { transform: scale(0.95); }
`;

/* --- question overlay --- */
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
  &:hover:not(:disabled) { transform: translateY(-2px); border-color: #059669; }
`;

/* --- result --- */
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
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#059669'}; }
  .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
`;

const BtnRow = styled.div`display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;`;
const Btn = styled.button`
  padding: 0.9rem 2rem; border-radius: 50px; font-size: 1rem; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.3s ease; font-family: inherit; color: white;
  background: ${p => p.$variant === 'secondary' ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #10b981, #059669)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary' ? 'rgba(107,114,128,0.4)' : 'rgba(5,150,105,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #059669; border-radius: 50%; }
`;
const ErrorWrap = styled.div`
  text-align: center; padding: 3rem; background: var(--card-bg, #fee2e2);
  border-radius: 24px; color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── maze generation ───────── */
const MAZE_SIZE = 7;

function generateMaze(size) {
  // Simple maze with a guaranteed path using DFS
  const grid = Array(size).fill(null).map(() => Array(size).fill('wall'));
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));

  const directions = [
    [0, -2], [0, 2], [-2, 0], [2, 0]
  ];

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function carve(r, c) {
    visited[r][c] = true;
    grid[r][c] = 'path';

    const dirs = shuffle([...directions]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]) {
        // carve wall between
        grid[r + dr / 2][c + dc / 2] = 'path';
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);
  grid[0][0] = 'path';
  grid[size - 1][size - 1] = 'path';

  return grid;
}

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

/* ═══════════════════════════════════════ */
function WordMaze() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [maze, setMaze] = useState([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [visitedCells, setVisitedCells] = useState(new Set(['0,0']));
  const [steps, setSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const [showQuestion, setShowQuestion] = useState(false);
  const [pendingMove, setPendingMove] = useState(null);
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
    try {
      setLoading(true); setError(null);
      const res = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!res.ok) throw new Error('Не удалось загрузить набор');
      const data = await res.json();
      setCurrentSet(data);
      if (data.flashcards?.length >= 4) setFlashcards(data.flashcards);
      else setError('Нужно минимум 4 карточки');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const startGame = useCallback(() => {
    const m = generateMaze(MAZE_SIZE);
    setMaze(m);
    setPlayerPos({ r: 0, c: 0 });
    setVisitedCells(new Set(['0,0']));
    setSteps(0); setScore(0); setCorrect(0); setTotalQuestions(0);
    setShowQuestion(false); setPendingMove(null);
    setSelectedIdx(null); setAnswerResult(null);
    setIsFinished(false); setGameStarted(true);
    usedCards.current = [];
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  }, []);

  const getRandomCard = useCallback(() => {
    let available = flashcards.filter((_, i) => !usedCards.current.includes(i));
    if (available.length === 0) {
      usedCards.current = [];
      available = flashcards;
    }
    const idx = Math.floor(Math.random() * available.length);
    const origIdx = flashcards.indexOf(available[idx]);
    usedCards.current.push(origIdx);
    return available[idx];
  }, [flashcards]);

  const tryMove = useCallback((dr, dc) => {
    if (showQuestion || isFinished) return;
    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;

    if (nr < 0 || nr >= MAZE_SIZE || nc < 0 || nc >= MAZE_SIZE) return;
    if (maze[nr][nc] === 'wall') return;

    const key = `${nr},${nc}`;
    if (visitedCells.has(key)) {
      // free move to visited cell
      setPlayerPos({ r: nr, c: nc });
      setSteps(s => s + 1);
      return;
    }

    // new cell — ask question
    const card = getRandomCard();
    setQuestionCard(card);
    setOptions(generateOptions(card, flashcards));
    setSelectedIdx(null);
    setAnswerResult(null);
    setPendingMove({ r: nr, c: nc });
    setShowQuestion(true);
    setTotalQuestions(prev => prev + 1);
  }, [showQuestion, isFinished, playerPos, maze, visitedCells, flashcards, getRandomCard]);

  // keyboard
  useEffect(() => {
    const handler = (e) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': case 'ц': case 'Ц': tryMove(-1, 0); break;
        case 'ArrowDown': case 's': case 'S': case 'ы': case 'Ы': tryMove(1, 0); break;
        case 'ArrowLeft': case 'a': case 'A': case 'ф': case 'Ф': tryMove(0, -1); break;
        case 'ArrowRight': case 'd': case 'D': case 'в': case 'В': tryMove(0, 1); break;
        default: break;
      }
    };
    if (gameStarted && !isFinished) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameStarted, isFinished, tryMove]);

  const handleOption = (idx) => {
    if (answerResult !== null) return;
    setSelectedIdx(idx);
    const isCorrect = options[idx] === questionCard.definition;

    if (isCorrect) {
      setAnswerResult('correct');
      setCorrect(prev => prev + 1);
      setScore(prev => prev + 15);

      setTimeout(() => {
        const { r, c } = pendingMove;
        setPlayerPos({ r, c });
        setVisitedCells(prev => new Set([...prev, `${r},${c}`]));
        setSteps(s => s + 1);
        setShowQuestion(false);

        // check finish
        if (r === MAZE_SIZE - 1 && c === MAZE_SIZE - 1) {
          setIsFinished(true);
          trackGameWin();
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 } });
        }
      }, 800);
    } else {
      setAnswerResult('wrong');
      setTimeout(() => {
        setShowQuestion(false);
      }, 1200);
    }
  };

  useEffect(() => {
    if (isFinished && !statsRecorded.current) {
      statsRecorded.current = true;
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'maze', cardsCount: totalQuestions, correctCount: correct, timeSpent })
      }).catch(e => console.error('Stats:', e));
    }
  }, [isFinished, correct, totalQuestions]);

  const handleSelectSet = (set) => navigate(`/games/maze?setId=${set._id || set.id}`);

  if (!setId) return <SetSelector title="🌀 Лабиринт слов" subtitle="Выберите набор карточек" onSelectSet={handleSelectSet} gameMode />;
  if (loading) return <Container><LoadingWrap><div className="spinner" /></LoadingWrap></Container>;
  if (error) return <Container><ErrorWrap><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/maze')} style={{ marginTop: '1rem' }}>Другой набор</Btn></ErrorWrap></Container>;

  if (isFinished) {
    return (
      <Container>
        <ResultCard>
          <ResultTitle>🏆 Лабиринт пройден!</ResultTitle>
          <ResultText>Вы нашли выход из лабиринта за {steps} шагов!</ResultText>
          <StatsGrid>
            <StatBox $color="#059669"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $color="#f59e0b"><div className="val">{steps}</div><div className="lbl">👣 Шагов</div></StatBox>
            <StatBox $color="#22c55e"><div className="val">{correct}/{totalQuestions}</div><div className="lbl">✅ Верных</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/maze')}>Другой набор</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Header><Title>🌀 Лабиринт слов</Title><Subtitle>Пройдите лабиринт, отвечая на вопросы!</Subtitle></Header>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', padding: '1rem 1.5rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--border-color, transparent)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#065f46' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>{currentSet.flashcards?.length || 0} карточек</p>
          </div>
        )}
        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌀</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{ textAlign: 'left', maxWidth: 420, margin: '1.5rem auto', lineHeight: 1.9, color: 'var(--text-primary)' }}>
            <div>🗺️ Найдите путь от 📍 старта до 💎 выхода</div>
            <div>⬆️⬇️⬅️➡️ Двигайтесь стрелками или WASD</div>
            <div>❓ На каждой новой клетке — вопрос</div>
            <div>✅ Правильный ответ = вы проходите</div>
            <div>❌ Неправильный = остаётесь на месте</div>
            <div>👣 Чем меньше шагов — тем лучше!</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Войти в лабиринт</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/maze')}>Другой набор</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  return (
    <Container>
      <Header><Title>🌀 Лабиринт слов</Title></Header>

      <TopBar>
        <Stat $color="#059669"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $color="#f59e0b"><div className="val">👣 {steps}</div><div className="lbl">Шаги</div></Stat>
        <Stat $color="#22c55e"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
      </TopBar>

      <MazeWrapper>
        <MazeLabel>Найдите путь к 💎</MazeLabel>
        <MazeGrid $cols={MAZE_SIZE}>
          {maze.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPos.r === r && playerPos.c === c;
              const isFinishCell = r === MAZE_SIZE - 1 && c === MAZE_SIZE - 1;
              const key = `${r},${c}`;
              const isVisited = visitedCells.has(key);
              const isWall = cell === 'wall';

              return (
                <MazeCell
                  key={key}
                  $isPlayer={isPlayer}
                  $isFinish={isFinishCell && !isPlayer}
                  $isVisited={isVisited && !isPlayer && !isFinishCell}
                  $isWall={isWall}
                  $isPath={!isWall && !isVisited && !isPlayer && !isFinishCell}
                  $size={isPlayer || isFinishCell ? '1.4rem' : '0.8rem'}
                >
                  {isPlayer ? '📍' :
                   isFinishCell ? '💎' :
                   isWall ? '' :
                   isVisited ? '✓' : ''}
                </MazeCell>
              );
            })
          )}
        </MazeGrid>

        <DirectionBtns>
          <DirBtn $area="up" onClick={() => tryMove(-1, 0)}>⬆️</DirBtn>
          <DirBtn $area="left" onClick={() => tryMove(0, -1)}>⬅️</DirBtn>
          <DirBtn $area="right" onClick={() => tryMove(0, 1)}>➡️</DirBtn>
          <DirBtn $area="down" onClick={() => tryMove(1, 0)}>⬇️</DirBtn>
        </DirectionBtns>
      </MazeWrapper>

      {showQuestion && questionCard && (
        <QuestionOverlay>
          <QuestionCard>
            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              🌀 Ответьте, чтобы пройти
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
                ✅ Путь открыт!
              </div>
            )}
            {answerResult === 'wrong' && (
              <div style={{ textAlign: 'center', marginTop: '1rem', color: '#dc2626', fontWeight: 700, fontSize: '1.1rem' }}>
                🚧 Путь заблокирован!
              </div>
            )}
          </QuestionCard>
        </QuestionOverlay>
      )}
    </Container>
  );
}

export default WordMaze;
