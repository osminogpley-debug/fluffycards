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
  20%  { transform: translateX(-6px); }
  40%  { transform: translateX(6px); }
  60%  { transform: translateX(-3px); }
  80%  { transform: translateX(3px); }
`;

const rocketLaunch = keyframes`
  0%   { transform: translateY(0); }
  50%  { transform: translateY(-12px); }
  100% { transform: translateY(0); }
`;

const flame = keyframes`
  0%, 100% { transform: scaleY(1); opacity: 0.9; }
  50%      { transform: scaleY(1.4); opacity: 1; }
`;

const stars = keyframes`
  0%   { background-position: 0 0; }
  100% { background-position: 0 200px; }
`;

const sparkle = keyframes`
  0%   { opacity: 0; transform: scale(0) rotate(0deg); }
  50%  { opacity: 1; transform: scale(1.2) rotate(180deg); }
  100% { opacity: 0; transform: scale(0) rotate(360deg); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
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
  color: #dc2626;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;
`;

const Subtitle = styled.p`
  color: var(--text-secondary, #6b7280);
  font-size: 1rem;
`;

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
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$color || '#dc2626'}; }
  .lbl { font-size: 0.7rem; color: var(--text-secondary); }
`;

/* --- launch pad --- */
const LaunchPad = styled.div`
  position: relative;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 80%, #475569 100%);
  border-radius: 24px;
  padding: 2rem 1rem 1rem;
  min-height: 400px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 1.5rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(1px 1px at 10% 20%, white, transparent),
                radial-gradient(1px 1px at 30% 50%, white, transparent),
                radial-gradient(1px 1px at 50% 10%, white, transparent),
                radial-gradient(1px 1px at 70% 80%, white, transparent),
                radial-gradient(1px 1px at 90% 30%, white, transparent),
                radial-gradient(1px 1px at 15% 70%, white, transparent),
                radial-gradient(1px 1px at 85% 55%, white, transparent),
                radial-gradient(1px 1px at 40% 90%, white, transparent),
                radial-gradient(1px 1px at 60% 40%, white, transparent);
    animation: ${stars} 8s linear infinite;
    opacity: 0.6;
  }
`;

const RocketWrapper = styled.div`
  position: relative;
  z-index: 5;
  transition: transform 1.5s ease-out;
  transform: translateY(${p => -p.$altitude}px);
  animation: ${p => p.$boosting ? css`${rocketLaunch} 0.3s ease infinite` : 'none'};
`;

const RocketBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 4rem;
  filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.5));
`;

const Flame = styled.div`
  font-size: 2rem;
  animation: ${flame} 0.3s ease infinite;
  opacity: ${p => p.$active ? 1 : 0.2};
  transition: opacity 0.3s;
`;

const AltitudeLabel = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  z-index: 10;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  span { font-size: 0.8rem; font-weight: 400; color: #94a3b8; }
`;

const FuelBar = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  text-align: right;
`;

const FuelLabel = styled.div`
  color: #94a3b8;
  font-size: 0.75rem;
  margin-bottom: 4px;
`;

const FuelTrack = styled.div`
  width: 120px;
  height: 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 7px;
  overflow: hidden;
`;

const FuelFill = styled.div`
  height: 100%;
  border-radius: 7px;
  transition: width 0.5s ease;
  width: ${p => p.$pct}%;
  background: ${p =>
    p.$pct > 60 ? 'linear-gradient(90deg, #22c55e, #4ade80)' :
    p.$pct > 30 ? 'linear-gradient(90deg, #eab308, #facc15)' :
    'linear-gradient(90deg, #ef4444, #f87171)'};
`;

const Platform = styled.div`
  width: 80%;
  height: 8px;
  background: linear-gradient(90deg, #64748b, #94a3b8, #64748b);
  border-radius: 4px;
  margin-top: 0.5rem;
  z-index: 5;
`;

const SparkleEffect = styled.div`
  position: absolute;
  font-size: 1.5rem;
  animation: ${sparkle} 0.7s ease forwards;
  pointer-events: none;
  z-index: 20;
  top: ${p => p.$top}%;
  left: ${p => p.$left}%;
`;

const TargetLine = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: ${p => p.$bottom}px;
  border-top: 2px dashed rgba(255,255,255,0.2);
  z-index: 3;
  
  &::after {
    content: '${p => p.$label}';
    position: absolute;
    right: 8px;
    top: -18px;
    color: rgba(255,255,255,0.4);
    font-size: 0.65rem;
  }
`;

/* --- question --- */
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
  background: ${p => p.$correct ? '#dcfce7' : p.$wrong ? '#fee2e2' : 'var(--bg-secondary, #f9fafb)'};
  border-color: ${p => p.$correct ? '#22c55e' : p.$wrong ? '#ef4444' : 'var(--border-color, #e5e7eb)'};
  color: ${p => p.$correct ? '#166534' : p.$wrong ? '#991b1b' : 'var(--text-primary, #1f2937)'};
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: #dc2626;
    box-shadow: 0 4px 15px rgba(220, 38, 38, 0.2);
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

/* --- result --- */
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
  color: var(--text-primary);
`;

const ResultText = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const StatsGrid = styled.div`
  display: flex; justify-content: center; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem;
`;

const StatBox = styled.div`
  background: var(--bg-secondary, #f3f4f6);
  padding: 1.2rem 1.5rem; border-radius: 16px; min-width: 110px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#dc2626'}; }
  .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
`;

const BtnRow = styled.div`
  display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
`;

const Btn = styled.button`
  padding: 0.9rem 2rem; border-radius: 50px; font-size: 1rem; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.3s ease; font-family: inherit; color: white;
  background: ${p => p.$variant === 'secondary'
    ? 'linear-gradient(135deg, #6b7280, #4b5563)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary' ? 'rgba(107,114,128,0.4)' : 'rgba(220,38,38,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const ProgressBar = styled.div`
  width: 100%; height: 10px; background: var(--border-color, #e5e7eb);
  border-radius: 5px; overflow: hidden; margin-bottom: 1rem;
`;
const ProgressFill = styled.div`
  height: 100%; border-radius: 5px; transition: width 0.5s ease;
  width: ${p => p.$pct}%;
  background: linear-gradient(90deg, #f87171, #dc2626);
`;

const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #dc2626; border-radius: 50%; }
`;
const ErrorWrap = styled.div`
  text-align: center; padding: 3rem; background: var(--card-bg, #fee2e2);
  border-radius: 24px; color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── helpers ───────── */
const TOTAL_ROUNDS = 12;
const MAX_ALTITUDE = 300;
const MAX_FUEL = 100;

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
function RocketDock() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [fuel, setFuel] = useState(MAX_FUEL);
  const [altitude, setAltitude] = useState(0);
  const [boosting, setBoosting] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  const [questionsQueue, setQuestionsQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);
  const transitioning = useRef(false);

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

  const prepareQueue = useCallback(() => {
    const q = [];
    const s = shuffleArray(flashcards);
    for (let i = 0; i < TOTAL_ROUNDS; i++) q.push(s[i % s.length]);
    return q;
  }, [flashcards]);

  const startGame = useCallback(() => {
    const q = prepareQueue();
    setQuestionsQueue(q);
    setCurrentCard(q[0]);
    setOptions(generateOptions(q[0], flashcards));
    setRound(0); setScore(0); setCorrect(0);
    setFuel(MAX_FUEL); setAltitude(0);
    setBoosting(false); setSparkles([]);
    setSelectedIdx(null); setAnswerResult(null);
    setIsFinished(false); setGameWon(false);
    setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
    transitioning.current = false;
  }, [prepareQueue, flashcards]);

  const nextQuestion = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;

    const next = round + 1;
    if (next >= TOTAL_ROUNDS || fuel <= 0) {
      const won = altitude >= MAX_ALTITUDE * 0.8;
      setIsFinished(true);
      setGameWon(won);
      if (won) {
        trackGameWin();
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.4 } });
      }
      transitioning.current = false;
      return;
    }

    setRound(next);
    setCurrentCard(questionsQueue[next]);
    setOptions(generateOptions(questionsQueue[next], flashcards));
    setSelectedIdx(null); setAnswerResult(null);
    setBoosting(false);
    transitioning.current = false;
  }, [round, questionsQueue, flashcards, fuel, altitude]);

  const handleOption = (idx) => {
    if (answerResult !== null || transitioning.current) return;
    setSelectedIdx(idx);
    const isCorrect = options[idx] === currentCard.definition;

    if (isCorrect) {
      const fuelGain = 15;
      const altGain = MAX_ALTITUDE / (TOTAL_ROUNDS * 0.7);
      setFuel(prev => Math.min(MAX_FUEL, prev + fuelGain));
      setAltitude(prev => Math.min(MAX_ALTITUDE, prev + altGain));
      setScore(prev => prev + 15);
      setCorrect(prev => prev + 1);
      setBoosting(true);
      setAnswerResult('correct');

      const sp = Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() + i, top: 50 + Math.random() * 30, left: 20 + Math.random() * 60
      }));
      setSparkles(sp);
      setTimeout(() => setSparkles([]), 700);

      if (altitude + altGain >= MAX_ALTITUDE) {
        setTimeout(() => {
          setIsFinished(true); setGameWon(true);
          trackGameWin();
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        }, 800);
        return;
      }
    } else {
      const fuelLoss = 20;
      setFuel(prev => Math.max(0, prev - fuelLoss));
      setAltitude(prev => Math.max(0, prev - 15));
      setAnswerResult('wrong');

      if (fuel - fuelLoss <= 0) {
        setTimeout(() => {
          setIsFinished(true); setGameWon(false);
        }, 1200);
        return;
      }
    }

    setTimeout(nextQuestion, 1200);
  };

  useEffect(() => {
    if (isFinished && !statsRecorded.current) {
      statsRecorded.current = true;
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'rocket', cardsCount: TOTAL_ROUNDS, correctCount: correct, timeSpent })
      }).catch(e => console.error('Stats:', e));
    }
  }, [isFinished, correct]);

  const handleSelectSet = (set) => navigate(`/games/rocket?setId=${set._id || set.id}`);

  if (!setId) return <SetSelector title="🚀 Ракетный док" subtitle="Выберите набор карточек" onSelectSet={handleSelectSet} gameMode />;
  if (loading) return <Container><LoadingWrap><div className="spinner" /></LoadingWrap></Container>;
  if (error) return <Container><ErrorWrap><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/rocket')} style={{ marginTop: '1rem' }}>Другой набор</Btn></ErrorWrap></Container>;

  if (isFinished) {
    return (
      <Container>
        <ResultCard>
          <ResultTitle>{gameWon ? '🚀 Ракета в космосе!' : '💥 Топливо закончилось!'}</ResultTitle>
          <ResultText>{gameWon ? 'Вы успешно запустили ракету в космос!' : 'Ракета не достигла орбиты. Попробуйте ещё раз!'}</ResultText>
          <StatsGrid>
            <StatBox $color="#dc2626"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $color="#f59e0b"><div className="val">{Math.round(altitude / MAX_ALTITUDE * 100)}%</div><div className="lbl">🚀 Высота</div></StatBox>
            <StatBox $color="#22c55e"><div className="val">{correct}/{round + 1}</div><div className="lbl">✅ Верных</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/rocket')}>Другой набор</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Header><Title>🚀 Ракетный док</Title><Subtitle>Запустите ракету в космос!</Subtitle></Header>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef2f2, #fecaca)', padding: '1rem 1.5rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--border-color, transparent)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#991b1b' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#dc2626', fontSize: '0.9rem' }}>{currentSet.flashcards?.length || 0} карточек</p>
          </div>
        )}
        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{ textAlign: 'left', maxWidth: 420, margin: '1.5rem auto', lineHeight: 1.9, color: 'var(--text-primary)', fontSize: '1rem' }}>
            <div>🚀 Запустите ракету, отвечая на вопросы</div>
            <div>✅ Правильный ответ = топливо + высота</div>
            <div>❌ Ошибка = потеря топлива и высоты</div>
            <div>⛽ Следите за уровнем топлива!</div>
            <div>🌟 Доберитесь до орбиты за {TOTAL_ROUNDS} раундов</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Запуск!</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/rocket')}>Другой набор</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  const progress = ((round + 1) / TOTAL_ROUNDS) * 100;

  return (
    <Container>
      <Header><Title>🚀 Ракетный док</Title></Header>
      <ProgressBar><ProgressFill $pct={progress} /></ProgressBar>

      <TopBar>
        <Stat $color="#dc2626"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $color="#22c55e"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
        <Stat><div className="val">{round + 1}/{TOTAL_ROUNDS}</div><div className="lbl">Раунд</div></Stat>
      </TopBar>

      <LaunchPad>
        <AltitudeLabel>
          {Math.round(altitude / MAX_ALTITUDE * 100)}% <span>высота</span>
        </AltitudeLabel>
        <FuelBar>
          <FuelLabel>⛽ Топливо</FuelLabel>
          <FuelTrack><FuelFill $pct={fuel} /></FuelTrack>
        </FuelBar>

        <TargetLine $bottom={300} $label="🌟 Орбита" />
        <TargetLine $bottom={200} $label="☁️ Стратосфера" />
        <TargetLine $bottom={100} $label="🌤️ Тропосфера" />

        {sparkles.map(s => <SparkleEffect key={s.id} $top={s.top} $left={s.left}>✨</SparkleEffect>)}

        <RocketWrapper $altitude={altitude} $boosting={boosting}>
          <RocketBody>🚀</RocketBody>
          <Flame $active={boosting}>🔥</Flame>
        </RocketWrapper>
        <Platform />
      </LaunchPad>

      {currentCard && (
        <QuestionCard $status={answerResult}>
          <QuestionLabel>Раунд {round + 1} из {TOTAL_ROUNDS}</QuestionLabel>
          <QuestionText>{currentCard.term}</QuestionText>
          <OptionsGrid>
            {options.map((opt, idx) => (
              <OptionBtn key={idx} disabled={answerResult !== null}
                $correct={answerResult !== null && opt === currentCard.definition}
                $wrong={answerResult === 'wrong' && selectedIdx === idx}
                onClick={() => handleOption(idx)}>{opt}</OptionBtn>
            ))}
          </OptionsGrid>
          {answerResult === 'correct' && <FeedbackMsg $correct>🚀 Ускорение! +15 очков</FeedbackMsg>}
          {answerResult === 'wrong' && <FeedbackMsg>💥 Потеря топлива!</FeedbackMsg>}
        </QuestionCard>
      )}
    </Container>
  );
}

export default RocketDock;
