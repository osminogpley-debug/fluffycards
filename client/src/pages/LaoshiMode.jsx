import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_ROUTES, authFetch } from '../constants/api';
import { useTheme } from '../contexts/ThemeContext';

// ===== CONSTANTS =====
const ROUND_SIZE = 10;
const isChinese = (text) => text && /[\u4e00-\u9fff]/.test(text);

// ===== ANIMATIONS =====
const fadeIn = keyframes`from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); }`;
const popIn = keyframes`from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); }`;
const shake = keyframes`0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}`;

// ===== STYLED COMPONENTS =====
const Page = styled.div`
  min-height: 100vh;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const BackBtn = styled.button`
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: pointer;
  &:hover { border-color: var(--primary-color); }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-primary);
`;

const ProgressBar = styled.div`
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4299e1, #48bb78);
  border-radius: 8px;
  transition: width 0.4s ease;
  width: ${p => p.$pct}%;
`;

const StageLabel = styled.div`
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-weight: 600;
`;

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 4px 20px var(--shadow-color);
  border: 2px solid var(--border-color);
  overflow: hidden;
  animation: ${popIn} 0.3s ease;
`;

const FlipCard = styled.div`
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  cursor: pointer;
  user-select: none;
  text-align: center;
`;

const BigText = styled.div`
  font-size: ${p => p.$big ? '2.5rem' : '1.5rem'};
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const SubText = styled.div`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 4px;
`;

const PinyinText = styled.div`
  font-size: 1.1rem;
  color: #4299e1;
  margin-top: 4px;
`;

const HintText = styled.div`
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 16px;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
`;

const Btn = styled.button`
  padding: 12px 28px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  background: ${p => p.$color || 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const MatchGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 24px;
`;

const MatchColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MatchItem = styled.button`
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid ${p => 
    p.$matched ? '#48bb78' : 
    p.$wrong ? '#e53e3e' :
    p.$selected ? '#4299e1' : 
    'var(--border-color)'};
  background: ${p => 
    p.$matched ? 'rgba(72, 187, 120, 0.12)' : 
    p.$wrong ? 'rgba(229, 62, 62, 0.12)' :
    p.$selected ? 'rgba(66, 153, 225, 0.12)' :
    'var(--bg-secondary)'};
  color: var(--text-primary);
  animation: ${p => p.$wrong ? shake : 'none'} 0.4s ease;
  pointer-events: ${p => p.$matched ? 'none' : 'auto'};
  opacity: ${p => p.$matched ? 0.5 : 1};
  word-break: break-word;

  &:hover:not(:disabled) {
    border-color: #4299e1;
    transform: translateY(-1px);
  }
`;

const QuizCard = styled.div`
  padding: 32px 24px;
  text-align: center;
`;

const QuizOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 24px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const QuizOption = styled.button`
  padding: 14px 16px;
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  border: 2px solid ${p => 
    p.$correct ? '#48bb78' :
    p.$wrong ? '#e53e3e' :
    'var(--border-color)'};
  background: ${p =>
    p.$correct ? 'rgba(72, 187, 120, 0.12)' :
    p.$wrong ? 'rgba(229, 62, 62, 0.12)' :
    'var(--bg-secondary)'};
  color: var(--text-primary);
  cursor: ${p => p.$answered ? 'default' : 'pointer'};
  transition: all 0.2s;
  word-break: break-word;

  &:hover:not(:disabled) {
    border-color: #4299e1;
  }
`;

const HandwritingArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  gap: 10px;
`;

const HandwritingPrompt = styled.div`
  text-align: center;
  max-width: 420px;
`;

const HandwritingTarget = styled.div`
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-top: 4px;
`;

const HandwritingMeaning = styled.div`
  font-size: 0.98rem;
  color: var(--text-secondary);
  margin-top: 6px;
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 1;
  margin: 8px 0 4px;
  overflow: hidden;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.02);
`;

const GhostChar = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${p => p.$fontSize || 140}px;
  color: var(--text-muted);
  opacity: 0.14;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  line-height: 1;
`;

const DrawCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  cursor: crosshair;
  touch-action: none;
`;

const HandwritingControls = styled(BtnRow)`
  margin-top: 6px;
  flex-wrap: wrap;
`;

const ResultsCard = styled.div`
  text-align: center;
  padding: 40px 24px;
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${p => p.$pct >= 80 ? 'linear-gradient(135deg, #48bb78, #38a169)' :
    p.$pct >= 50 ? 'linear-gradient(135deg, #ecc94b, #d69e2e)' :
    'linear-gradient(135deg, #fc8181, #e53e3e)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 2rem;
  font-weight: 800;
  color: white;
`;

const RoundBadge = styled.div`
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 4px;
`;

// ===== STAGES =====
const STAGE = {
  FLASHCARDS: 'flashcards',
  MATCH: 'match',
  QUIZ: 'quiz',
  HANDWRITING: 'handwriting',
  RESULTS: 'results',
};

// ===== HELPERS =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getOptions(cards, correctDef, count = 4) {
  const others = cards.filter(c => c.definition !== correctDef).map(c => c.definition);
  const shuffled = shuffle(others).slice(0, count - 1);
  shuffled.push(correctDef);
  return shuffle(shuffled);
}

// ===== COMPONENT =====
function LaoshiMode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const setId = searchParams.get('setId');

  const [allCards, setAllCards] = useState([]);
  const [setTitle, setSetTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rounds
  const [currentRound, setCurrentRound] = useState(0);
  const [roundCards, setRoundCards] = useState([]);
  const totalRounds = useRef(0);

  // Stage
  const [stage, setStage] = useState(STAGE.FLASHCARDS);

  // Flashcard stage
  const [fcIndex, setFcIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Match stage
  const [matchTerms, setMatchTerms] = useState([]);
  const [matchDefs, setMatchDefs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState({});
  const [wrongPair, setWrongPair] = useState(null);

  // Quiz stage
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // Handwriting stage
  const [hwIndex, setHwIndex] = useState(0);
  const [hwCompleted, setHwCompleted] = useState(0);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  // Results
  const [roundScores, setRoundScores] = useState([]);

  const hasChinese = roundCards.some(c => isChinese(c.term));
  const drawColor = ['dark', 'cosmic', 'forest', 'neon'].includes(theme) ? '#f8fafc' : '#111827';

  // ===== FETCH =====
  useEffect(() => {
    if (!setId) { setError('Не указан набор'); setLoading(false); return; }
    const fetchSet = async () => {
      try {
        const res = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}`);
        if (!res.ok) throw new Error('Набор не найден');
        const data = await res.json();
        const cards = data.flashcards || data.cards || [];
        if (cards.length < 2) throw new Error('Нужно минимум 2 карточки');
        setAllCards(cards);
        setSetTitle(data.title || 'Набор');
        totalRounds.current = Math.ceil(cards.length / ROUND_SIZE);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchSet();
  }, [setId]);

  // ===== INIT ROUND =====
  const initRound = useCallback((roundIdx) => {
    const start = roundIdx * ROUND_SIZE;
    const end = Math.min(start + ROUND_SIZE, allCards.length);
    const cards = allCards.slice(start, end);
    setRoundCards(cards);
    setCurrentRound(roundIdx);
    setStage(STAGE.FLASHCARDS);
    setFcIndex(0);
    setFlipped(false);
  }, [allCards]);

  useEffect(() => {
    if (allCards.length > 0) {
      initRound(0);
    }
  }, [allCards, initRound]);

  // ===== INIT MATCH =====
  const initMatch = useCallback(() => {
    setMatchTerms(shuffle(roundCards));
    setMatchDefs(shuffle(roundCards));
    setSelectedTerm(null);
    setSelectedDef(null);
    setMatchedPairs({});
    setWrongPair(null);
    setStage(STAGE.MATCH);
  }, [roundCards]);

  // ===== INIT QUIZ =====
  const initQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizAnswer(null);
    setQuizScore(0);
    if (roundCards.length > 0) {
      setQuizOptions(getOptions(allCards, roundCards[0].definition));
    }
    setStage(STAGE.QUIZ);
  }, [roundCards, allCards]);

  // ===== INIT HANDWRITING =====
  const initHandwriting = useCallback(() => {
    setHwIndex(0);
    setHwCompleted(0);
    setStage(STAGE.HANDWRITING);
  }, []);

  // ===== CANVAS DRAWING =====
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (stage !== STAGE.HANDWRITING) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = 320;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    clearCanvas();
  }, [stage, hwIndex, clearCanvas]);

  useEffect(() => {
    if (stage !== STAGE.HANDWRITING) return;
    clearCanvas();
  }, [stage, hwIndex, clearCanvas]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const ratio = canvas.width / rect.width;
    if (e.touches) {
      return { x: (e.touches[0].clientX - rect.left) * ratio, y: (e.touches[0].clientY - rect.top) * ratio };
    }
    return { x: (e.clientX - rect.left) * ratio, y: (e.clientY - rect.top) * ratio };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
  };

  const endDraw = () => { drawingRef.current = false; lastPointRef.current = null; };

  // ===== STAGE PROGRESSION =====
  const nextStage = useCallback(() => {
    if (stage === STAGE.FLASHCARDS) {
      initMatch();
    } else if (stage === STAGE.MATCH) {
      initQuiz();
    } else if (stage === STAGE.QUIZ) {
      const chineseCards = roundCards.filter(c => isChinese(c.term));
      if (chineseCards.length > 0) {
        initHandwriting();
      } else {
        // Go to results
        setStage(STAGE.RESULTS);
      }
    } else if (stage === STAGE.HANDWRITING) {
      setStage(STAGE.RESULTS);
    }
  }, [stage, roundCards, initMatch, initQuiz, initHandwriting]);

  // ===== MATCH LOGIC =====
  useEffect(() => {
    if (!selectedTerm || !selectedDef) return;
    const termCard = selectedTerm;
    const defCard = selectedDef;
    const termId = termCard._id || termCard.term;
    const defId = defCard._id || defCard.term;

    if (termId === defId) {
      // Correct match
      setMatchedPairs(prev => ({ ...prev, [termId]: true }));
      setSelectedTerm(null);
      setSelectedDef(null);
    } else {
      // Wrong
      setWrongPair({ term: termId, def: defCard._id || defCard.definition });
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 600);
    }
  }, [selectedTerm, selectedDef]);

  // Auto-advance when all matched
  useEffect(() => {
    if (stage === STAGE.MATCH && Object.keys(matchedPairs).length === roundCards.length && roundCards.length > 0) {
      setTimeout(() => nextStage(), 800);
    }
  }, [matchedPairs, roundCards, stage, nextStage]);

  // ===== QUIZ LOGIC =====
  const handleQuizAnswer = (answer) => {
    if (quizAnswer !== null) return;
    const correct = roundCards[quizIndex].definition;
    setQuizAnswer(answer);
    if (answer === correct) setQuizScore(prev => prev + 1);
    setTimeout(() => {
      const nextIdx = quizIndex + 1;
      if (nextIdx < roundCards.length) {
        setQuizIndex(nextIdx);
        setQuizOptions(getOptions(allCards, roundCards[nextIdx].definition));
        setQuizAnswer(null);
      } else {
        // Save score
        setRoundScores(prev => [...prev, { round: currentRound, score: quizScore + (answer === correct ? 1 : 0), total: roundCards.length }]);
        nextStage();
      }
    }, 900);
  };

  // ===== NEXT ROUND =====
  const nextRound = () => {
    const next = currentRound + 1;
    if (next < totalRounds.current) {
      initRound(next);
    } else {
      // All done
      setStage(STAGE.RESULTS);
    }
  };

  // ===== RENDER =====
  if (loading) return <Page><Title>⏳ Загрузка...</Title></Page>;
  if (error) return (
    <Page>
      <Card>
        <FlipCard>
          <BigText>😕</BigText>
          <SubText>{error}</SubText>
          <BtnRow><Btn onClick={() => navigate(-1)}>← Назад</Btn></BtnRow>
        </FlipCard>
      </Card>
    </Page>
  );

  const totalSteps = hasChinese ? 4 : 3;
  const stageIdx = stage === STAGE.FLASHCARDS ? 0 : stage === STAGE.MATCH ? 1 : stage === STAGE.QUIZ ? 2 : stage === STAGE.HANDWRITING ? 3 : totalSteps;
  const progressPct = Math.min(100, (stageIdx / totalSteps) * 100);
  const stageNames = { [STAGE.FLASHCARDS]: '📖 Карточки', [STAGE.MATCH]: '🔗 Соединение', [STAGE.QUIZ]: '🧠 Тест', [STAGE.HANDWRITING]: '✍️ Написание', [STAGE.RESULTS]: '🏆 Результат' };

  return (
    <Page>
      <TopBar>
        <BackBtn onClick={() => navigate(-1)}>← Назад</BackBtn>
        <Title>🐼 {setTitle}</Title>
        <RoundBadge>Раунд {currentRound + 1}/{totalRounds.current}</RoundBadge>
      </TopBar>

      <ProgressBar><ProgressFill $pct={progressPct} /></ProgressBar>
      <StageLabel>{stageNames[stage]} · {roundCards.length} карточек</StageLabel>

      {/* ===== FLASHCARDS STAGE ===== */}
      {stage === STAGE.FLASHCARDS && roundCards[fcIndex] && (
        <Card>
          <FlipCard onClick={() => setFlipped(!flipped)}>
            {!flipped ? (
              <>
                <BigText $big={isChinese(roundCards[fcIndex].term)}>{roundCards[fcIndex].term}</BigText>
                {roundCards[fcIndex].pinyin && <PinyinText>{roundCards[fcIndex].pinyin}</PinyinText>}
                <HintText>Нажмите, чтобы перевернуть</HintText>
              </>
            ) : (
              <>
                <BigText>{roundCards[fcIndex].definition}</BigText>
                {roundCards[fcIndex].translation && <SubText>{roundCards[fcIndex].translation}</SubText>}
                <HintText>Нажмите, чтобы вернуть</HintText>
              </>
            )}
          </FlipCard>
          <BtnRow style={{ padding: '0 24px 24px' }}>
            <Btn
              $color="linear-gradient(135deg, #a0aec0, #718096)"
              onClick={() => { setFcIndex(Math.max(0, fcIndex - 1)); setFlipped(false); }}
              disabled={fcIndex === 0}
            >
              ← Назад
            </Btn>
            <SubText style={{ alignSelf: 'center', minWidth: 60, textAlign: 'center' }}>{fcIndex + 1}/{roundCards.length}</SubText>
            {fcIndex < roundCards.length - 1 ? (
              <Btn onClick={() => { setFcIndex(fcIndex + 1); setFlipped(false); }}>Далее →</Btn>
            ) : (
              <Btn $color="linear-gradient(135deg, #48bb78, #38a169)" onClick={nextStage}>К тесту →</Btn>
            )}
          </BtnRow>
        </Card>
      )}

      {/* ===== MATCH STAGE ===== */}
      {stage === STAGE.MATCH && (
        <Card>
          <MatchGrid>
            <MatchColumn>
              {matchTerms.map((card) => {
                const cid = card._id || card.term;
                return (
                  <MatchItem
                    key={`t-${cid}`}
                    $selected={selectedTerm && (selectedTerm._id || selectedTerm.term) === cid}
                    $matched={matchedPairs[cid]}
                    $wrong={wrongPair?.term === cid}
                    onClick={() => !matchedPairs[cid] && setSelectedTerm(card)}
                  >
                    {card.term}
                    {card.pinyin && <div style={{ fontSize: '0.75rem', color: '#4299e1', marginTop: 2 }}>{card.pinyin}</div>}
                  </MatchItem>
                );
              })}
            </MatchColumn>
            <MatchColumn>
              {matchDefs.map((card) => {
                const cid = card._id || card.term;
                return (
                  <MatchItem
                    key={`d-${cid}`}
                    $selected={selectedDef && (selectedDef._id || selectedDef.term) === cid}
                    $matched={matchedPairs[cid]}
                    $wrong={wrongPair?.def === (card._id || card.definition)}
                    onClick={() => !matchedPairs[cid] && setSelectedDef(card)}
                  >
                    {card.definition}
                  </MatchItem>
                );
              })}
            </MatchColumn>
          </MatchGrid>
        </Card>
      )}

      {/* ===== QUIZ STAGE ===== */}
      {stage === STAGE.QUIZ && roundCards[quizIndex] && (
        <Card>
          <QuizCard>
            <SubText style={{ marginBottom: 4 }}>Выберите правильный перевод:</SubText>
            <BigText $big={isChinese(roundCards[quizIndex].term)}>
              {roundCards[quizIndex].term}
            </BigText>
            {roundCards[quizIndex].pinyin && <PinyinText>{roundCards[quizIndex].pinyin}</PinyinText>}
            <QuizOptions>
              {quizOptions.map((opt, i) => {
                const isCorrect = opt === roundCards[quizIndex].definition;
                return (
                  <QuizOption
                    key={i}
                    $answered={quizAnswer !== null}
                    $correct={quizAnswer !== null && isCorrect}
                    $wrong={quizAnswer === opt && !isCorrect}
                    onClick={() => handleQuizAnswer(opt)}
                  >
                    {opt}
                  </QuizOption>
                );
              })}
            </QuizOptions>
            <SubText style={{ marginTop: 16 }}>{quizIndex + 1}/{roundCards.length}</SubText>
          </QuizCard>
        </Card>
      )}

      {/* ===== HANDWRITING STAGE ===== */}
      {stage === STAGE.HANDWRITING && (() => {
        const chineseCards = roundCards.filter(c => isChinese(c.term));
        const card = chineseCards[hwIndex];
        if (!card) return null;
        const ghostFontSize = card.term.length <= 1 ? 168 : card.term.length === 2 ? 138 : 108;
        return (
          <Card>
            <HandwritingArea>
              <HandwritingPrompt>
                <SubText>Напишите иероглифы:</SubText>
                <HandwritingTarget>{card.term}</HandwritingTarget>
                {card.pinyin && <PinyinText>{card.pinyin}</PinyinText>}
                <HandwritingMeaning>{card.translation || card.definition}</HandwritingMeaning>
              </HandwritingPrompt>
              <CanvasWrapper>
                <GhostChar $fontSize={ghostFontSize}>{card.term}</GhostChar>
                <DrawCanvas
                  ref={canvasRef}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                  onTouchCancel={endDraw}
                />
              </CanvasWrapper>
              <HandwritingControls>
                <Btn $color="linear-gradient(135deg, #a0aec0, #718096)" onClick={clearCanvas}>↻ Очистить</Btn>
                {hwIndex < chineseCards.length - 1 ? (
                  <Btn onClick={() => { setHwIndex(hwIndex + 1); }}>
                    Далее →
                  </Btn>
                ) : (
                  <Btn $color="linear-gradient(135deg, #48bb78, #38a169)" onClick={() => {
                    setHwCompleted(chineseCards.length);
                    nextStage();
                  }}>
                    Завершить →
                  </Btn>
                )}
              </HandwritingControls>
              <SubText style={{ marginTop: 8 }}>{hwIndex + 1}/{chineseCards.length}</SubText>
            </HandwritingArea>
          </Card>
        );
      })()}

      {/* ===== RESULTS STAGE ===== */}
      {stage === STAGE.RESULTS && (
        <Card>
          <ResultsCard>
            {(() => {
              const lastScore = roundScores[roundScores.length - 1];
              const pct = lastScore ? Math.round((lastScore.score / lastScore.total) * 100) : 100;
              return (
                <>
                  <ScoreCircle $pct={pct}>{pct}%</ScoreCircle>
                  <BigText style={{ fontSize: '1.3rem' }}>
                    {pct >= 80 ? '🎉 Отлично!' : pct >= 50 ? '👍 Хорошо!' : '💪 Продолжай!'}
                  </BigText>
                  {lastScore && (
                    <SubText>
                      Тест: {lastScore.score}/{lastScore.total} правильных
                    </SubText>
                  )}
                  {hwCompleted > 0 && (
                    <SubText style={{ marginTop: 4 }}>
                      Написание: {hwCompleted} иероглифов ✍️
                    </SubText>
                  )}
                  <BtnRow style={{ marginTop: 24 }}>
                    {currentRound + 1 < totalRounds.current ? (
                      <Btn $color="linear-gradient(135deg, #48bb78, #38a169)" onClick={nextRound}>
                        Раунд {currentRound + 2} →
                      </Btn>
                    ) : (
                      <>
                        <Btn $color="linear-gradient(135deg, #a0aec0, #718096)" onClick={() => initRound(0)}>
                          ↻ Заново
                        </Btn>
                        <Btn onClick={() => navigate(`/sets/${setId}`)}>
                          К набору
                        </Btn>
                      </>
                    )}
                  </BtnRow>
                </>
              );
            })()}
          </ResultsCard>
        </Card>
      )}
    </Page>
  );
}

export default LaoshiMode;
