import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #e53e3e;
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: var(--bg-tertiary, #e2e8f0);
  border-radius: 4px;
  margin-bottom: 1.5rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #e53e3e, #fc8181);
  border-radius: 4px;
  transition: width 0.4s ease;
  width: ${props => props.$pct}%;
`;

const Stats = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const Stat = styled.div`
  text-align: center;
  span { display: block; font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
  small { color: var(--text-secondary); font-size: 0.85rem; }
`;

const Card = styled.div`
  background: var(--bg-secondary, white);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 2px solid var(--border-color, #e2e8f0);
  margin-bottom: 1.5rem;
`;

const TargetSection = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
`;

const TargetChar = styled.div`
  font-size: 5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
  margin-bottom: 0.5rem;
`;

const Pinyin = styled.div`
  font-size: 1.3rem;
  color: #e53e3e;
  margin-bottom: 0.25rem;
`;

const Definition = styled.div`
  font-size: 1.1rem;
  color: var(--text-secondary);
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: 320px;
  height: 320px;
  margin: 0 auto 1.5rem;
  border-radius: 16px;
  border: 3px solid ${props => props.$state === 'correct' ? '#48bb78' : props.$state === 'wrong' ? '#fc8181' : 'var(--border-color, #cbd5e0)'};
  background: ${props => props.$state === 'correct' ? 'rgba(72,187,120,0.06)' : props.$state === 'wrong' ? 'rgba(252,129,129,0.06)' : 'var(--bg-secondary, white)'};
  transition: border-color 0.3s, background 0.3s;
  overflow: hidden;
  touch-action: none;

  @media (max-width: 480px) {
    width: 280px;
    height: 280px;
  }
`;

const Canvas = styled.canvas`
  display: block;
  cursor: crosshair;
`;

const GridOverlay = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  
  &::before, &::after {
    content: '';
    position: absolute;
    background: rgba(200, 200, 200, 0.3);
  }
  &::before {
    top: 50%;
    left: 5%;
    right: 5%;
    height: 1px;
  }
  &::after {
    left: 50%;
    top: 5%;
    bottom: 5%;
    width: 1px;
  }
`;

const GhostChar = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: ${props => props.$size || 220}px;
  color: rgba(200, 200, 200, ${props => props.$opacity || 0.18});
  pointer-events: none;
  user-select: none;
  line-height: 1;
  font-weight: 400;

  @media (max-width: 480px) {
    font-size: ${props => (props.$size || 220) * 0.875}px;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ScoreLabel = styled.div`
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: ${props => props.$color || 'var(--text-primary)'};
`;

const HintToggle = styled.button`
  background: none;
  border: 1px solid var(--border-color, #cbd5e0);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover { border-color: #e53e3e; color: #e53e3e; }
`;

const ResultsCard = styled.div`
  background: var(--bg-secondary, white);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  text-align: center;

  h2 { color: var(--text-primary); margin-bottom: 0.5rem; }
  p { color: var(--text-secondary); margin-bottom: 1.5rem; }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ResultItem = styled.div`
  background: var(--bg-tertiary, #f7fafc);
  border-radius: 14px;
  padding: 1rem;
  span { display: block; font-size: 1.6rem; font-weight: 700; color: ${props => props.$color || 'var(--text-primary)'}; }
  small { color: var(--text-secondary); font-size: 0.8rem; }
`;

const CharReview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const ReviewChip = styled.span`
  font-size: 1.8rem;
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: ${props => props.$correct ? 'rgba(72,187,120,0.15)' : 'rgba(229,62,62,0.15)'};
  border: 2px solid ${props => props.$correct ? '#48bb78' : '#e53e3e'};
`;

/* ========= helpers ========= */

const isChinese = (text) => {
  if (!text) return false;
  return /[\u4e00-\u9fff]/.test(text);
};

// Extract individual characters from a term (e.g. "你好" → ["你","好"])
const extractChars = (term) => {
  if (!term) return [];
  return [...term].filter(ch => /[\u4e00-\u9fff]/.test(ch));
};

// Compute a simple structural similarity score (0–100) between user drawing and reference
function computeSimilarity(userCanvas, refChar, canvasSize) {
  // Create an off-screen canvas for reference
  const offscreen = document.createElement('canvas');
  offscreen.width = canvasSize;
  offscreen.height = canvasSize;
  const offCtx = offscreen.getContext('2d');

  // Draw reference character
  offCtx.fillStyle = 'white';
  offCtx.fillRect(0, 0, canvasSize, canvasSize);
  offCtx.fillStyle = 'black';
  offCtx.font = `${canvasSize * 0.7}px serif`;
  offCtx.textAlign = 'center';
  offCtx.textBaseline = 'middle';
  offCtx.fillText(refChar, canvasSize / 2, canvasSize / 2);

  const refData = offCtx.getImageData(0, 0, canvasSize, canvasSize).data;
  const userCtx = userCanvas.getContext('2d');
  const userData = userCtx.getImageData(0, 0, canvasSize, canvasSize).data;

  // Downsample to grid cells for comparison
  const gridSize = 16;
  const cellW = canvasSize / gridSize;
  const cellH = canvasSize / gridSize;

  const refGrid = [];
  const userGrid = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let refInk = 0, userInk = 0, count = 0;
      const startX = Math.floor(gx * cellW);
      const startY = Math.floor(gy * cellH);
      const endX = Math.floor((gx + 1) * cellW);
      const endY = Math.floor((gy + 1) * cellH);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * canvasSize + x) * 4;
          // Reference: black text on white → ink if dark
          if (refData[idx] < 128) refInk++;
          // User: drawn strokes → check alpha or dark pixels
          if (userData[idx + 3] > 30 && userData[idx] < 128) userInk++;
          count++;
        }
      }
      refGrid.push(refInk / count);
      userGrid.push(userInk / count);
    }
  }

  // Compute correlation-like score
  let totalCells = refGrid.length;
  let matchScore = 0;
  let refTotal = 0;
  let userTotal = 0;

  for (let i = 0; i < totalCells; i++) {
    const r = refGrid[i] > 0.05 ? 1 : 0;
    const u = userGrid[i] > 0.05 ? 1 : 0;
    if (r === 1 && u === 1) matchScore += 2;    // hit
    else if (r === 0 && u === 0) matchScore += 0.5; // both empty
    else matchScore -= 0.5;                       // miss
    refTotal += r;
    userTotal += u;
  }

  // Penalize if the user drew too little or too much
  const coverage = refTotal > 0 ? Math.min(userTotal / refTotal, refTotal / Math.max(userTotal, 1)) : 0;
  const raw = Math.max(0, matchScore) / (totalCells * 0.8);
  const score = Math.round(Math.min(100, raw * coverage * 100));
  return score;
}

/* ========= component ========= */

function HandwritingMode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setId = searchParams.get('setId');

  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [charQueue, setCharQueue] = useState([]);  // [{char, pinyin, definition, term}]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);       // [{char, score, correct}]
  const [phase, setPhase] = useState('loading');     // loading | select | practice | graded | finished
  const [lastScore, setLastScore] = useState(null);
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.18);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  const canvasSize = 320;

  // Load set
  useEffect(() => {
    if (!setId) { setPhase('select'); return; }
    (async () => {
      try {
        const res = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}`);
        if (res.ok) {
          const data = await res.json();
          const s = data.data || data;
          setSet(s);
          const allCards = s.flashcards || s.cards || [];
          const chineseCards = allCards.filter(c => isChinese(c.term) || c.pinyin || c.isChinese);
          if (chineseCards.length === 0) {
            setCards([]);
            setCharQueue([]);
            setPhase('practice');
            return;
          }
          setCards(chineseCards);
          // Build char queue
          const queue = [];
          chineseCards.forEach(card => {
            const chars = extractChars(card.term);
            chars.forEach(ch => {
              queue.push({
                char: ch,
                pinyin: card.pinyin || '',
                definition: card.definition || card.translation || '',
                term: card.term
              });
            });
          });
          setCharQueue(queue);
          setPhase('practice');
        }
      } catch (err) { console.error(err); }
    })();
  }, [setId]);

  // Setup canvas
  useEffect(() => {
    if (phase !== 'practice' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    canvas.style.width = canvasSize + 'px';
    canvas.style.height = canvasSize + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    clearCanvas();
  }, [phase, currentIndex]);

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasSize, canvasSize);
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a202c';
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleGrade = () => {
    if (!canvasRef.current || charQueue.length === 0) return;
    const current = charQueue[currentIndex];
    const score = computeSimilarity(canvasRef.current, current.char, canvasSize);
    const correct = score >= 40;
    setLastScore(score);
    setResults(prev => [...prev, { char: current.char, score, correct }]);
    setPhase('graded');
  };

  const handleNext = () => {
    setLastScore(null);
    if (currentIndex + 1 >= charQueue.length) {
      setPhase('finished');
    } else {
      setCurrentIndex(prev => prev + 1);
      setPhase('practice');
    }
  };

  const handleRetry = () => {
    setLastScore(null);
    setResults(prev => prev.slice(0, -1));
    clearCanvas();
    setPhase('practice');
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setLastScore(null);
    setPhase('practice');
  };

  const handleSetSelect = (selectedSetId) => {
    navigate(`/learn/handwriting?setId=${selectedSetId}`);
  };

  // Phase: select set
  if (phase === 'select') {
    return (
      <Container>
        <Header>
          <Title>✍️ Написание иероглифов</Title>
          <Subtitle>Выберите набор с китайскими карточками</Subtitle>
        </Header>
        <SetSelector onSelect={handleSetSelect} />
      </Container>
    );
  }

  if (phase === 'loading') {
    return (
      <Container>
        <Header>
          <Title>✍️ Написание иероглифов</Title>
          <Subtitle>Загрузка...</Subtitle>
        </Header>
      </Container>
    );
  }

  // Phase: no Chinese cards
  if (phase === 'practice' && charQueue.length === 0) {
    return (
      <Container>
        <Header>
          <Title>✍️ Написание иероглифов</Title>
          <Subtitle>В этом наборе нет китайских иероглифов.</Subtitle>
        </Header>
        <Card style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🈚</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Этот режим работает только с карточками, содержащими китайские иероглифы.
            Создайте набор с иероглифами или выберите другой набор.
          </p>
          <Actions>
            <SecondaryButton onClick={() => navigate(-1)}>← Назад</SecondaryButton>
            <PrimaryButton onClick={() => { setPhase('select'); }}>Выбрать другой набор</PrimaryButton>
          </Actions>
        </Card>
      </Container>
    );
  }

  // Phase: finished
  if (phase === 'finished') {
    const totalChars = results.length;
    const correctCount = results.filter(r => r.correct).length;
    const avgScore = totalChars > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalChars) : 0;
    const pct = totalChars > 0 ? Math.round((correctCount / totalChars) * 100) : 0;

    return (
      <Container>
        <Header>
          <Title>✍️ Результаты</Title>
        </Header>
        <ResultsCard>
          <h2>{pct >= 80 ? '🎉 Отлично!' : pct >= 50 ? '👍 Хорошо!' : '💪 Нужно практиковаться'}</h2>
          <p>Вы написали {totalChars} иероглиф{totalChars === 1 ? '' : totalChars < 5 ? 'а' : 'ов'}</p>

          <ResultsGrid>
            <ResultItem $color="#48bb78">
              <span>{correctCount}</span>
              <small>Правильно</small>
            </ResultItem>
            <ResultItem $color="#e53e3e">
              <span>{totalChars - correctCount}</span>
              <small>Ошибки</small>
            </ResultItem>
            <ResultItem $color="#63b3ed">
              <span>{avgScore}%</span>
              <small>Средняя точность</small>
            </ResultItem>
          </ResultsGrid>

          <CharReview>
            {results.map((r, i) => (
              <ReviewChip key={i} $correct={r.correct} title={`${r.char}: ${r.score}%`}>
                {r.char}
              </ReviewChip>
            ))}
          </CharReview>

          <Actions>
            <SecondaryButton onClick={() => navigate(-1)}>← Назад</SecondaryButton>
            <PrimaryButton onClick={handleRestart}>🔄 Ещё раз</PrimaryButton>
          </Actions>
        </ResultsCard>
      </Container>
    );
  }

  // Phase: practice / graded
  const current = charQueue[currentIndex];
  const progress = charQueue.length > 0 ? ((currentIndex + (phase === 'graded' ? 1 : 0)) / charQueue.length) * 100 : 0;
  const gradeState = phase === 'graded' ? (lastScore >= 40 ? 'correct' : 'wrong') : null;

  return (
    <Container>
      <Header>
        <Title>✍️ Написание иероглифов</Title>
        <Subtitle>{set?.title || 'Практика написания'}</Subtitle>
      </Header>

      <ProgressBar><ProgressFill $pct={progress} /></ProgressBar>

      <Stats>
        <Stat>
          <span>{currentIndex + 1}/{charQueue.length}</span>
          <small>Иероглиф</small>
        </Stat>
        <Stat>
          <span>{results.filter(r => r.correct).length}</span>
          <small>Правильно</small>
        </Stat>
        <Stat>
          <span>{results.filter(r => !r.correct).length}</span>
          <small>Ошибки</small>
        </Stat>
      </Stats>

      <Card>
        <TargetSection>
          <TargetChar>{current.char}</TargetChar>
          {current.pinyin && <Pinyin>🔊 {current.pinyin}</Pinyin>}
          <Definition>📖 {current.definition}</Definition>
          {current.term.length > 1 && (
            <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Из слова: {current.term}
            </div>
          )}
        </TargetSection>

        {phase === 'graded' && (
          <ScoreLabel $color={lastScore >= 40 ? '#48bb78' : '#e53e3e'}>
            {lastScore >= 80 ? '🎉 Отлично!' : lastScore >= 40 ? '✅ Принято' : '❌ Попробуйте ещё'}
            {' '}— Точность: {lastScore}%
          </ScoreLabel>
        )}

        <CanvasWrapper ref={wrapperRef} $state={gradeState}>
          {showGhost && phase === 'practice' && (
            <GhostChar $opacity={ghostOpacity}>{current.char}</GhostChar>
          )}
          <GridOverlay />
          <Canvas
            ref={canvasRef}
            onMouseDown={phase === 'practice' ? startDraw : undefined}
            onMouseMove={phase === 'practice' ? draw : undefined}
            onMouseUp={phase === 'practice' ? endDraw : undefined}
            onMouseLeave={phase === 'practice' ? endDraw : undefined}
            onTouchStart={phase === 'practice' ? startDraw : undefined}
            onTouchMove={phase === 'practice' ? draw : undefined}
            onTouchEnd={phase === 'practice' ? endDraw : undefined}
          />
        </CanvasWrapper>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <HintToggle onClick={() => setShowGhost(g => !g)}>
            {showGhost ? '🙈 Скрыть подсказку' : '👁️ Показать подсказку'}
          </HintToggle>
          {showGhost && (
            <HintToggle onClick={() => setGhostOpacity(o => o >= 0.3 ? 0.08 : o + 0.08)}>
              Прозрачность: {Math.round(ghostOpacity * 100)}%
            </HintToggle>
          )}
        </div>

        <Actions>
          {phase === 'practice' && (
            <>
              <SecondaryButton onClick={clearCanvas}>🗑️ Очистить</SecondaryButton>
              <PrimaryButton onClick={handleGrade}>✅ Проверить</PrimaryButton>
            </>
          )}
          {phase === 'graded' && (
            <>
              <SecondaryButton onClick={handleRetry}>🔄 Повторить</SecondaryButton>
              <PrimaryButton onClick={handleNext}>
                {currentIndex + 1 >= charQueue.length ? '🏁 Завершить' : '➡️ Далее'}
              </PrimaryButton>
            </>
          )}
        </Actions>
      </Card>
    </Container>
  );
}

export default HandwritingMode;
