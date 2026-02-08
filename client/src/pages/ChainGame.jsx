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
  70%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;
const shake = keyframes`
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-10px); }
  40% { transform: translateX(10px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
`;
const slideUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const glow = keyframes`
  0%,100% { box-shadow: 0 0 8px rgba(124,58,237,0.3); }
  50%     { box-shadow: 0 0 24px rgba(124,58,237,0.7); }
`;
const timerPulse = keyframes`
  0%,100% { background: #ef4444; }
  50%     { background: #dc2626; }
`;
const chainAppear = keyframes`
  from { transform: scale(0) rotate(-180deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
`;
const breakApart = keyframes`
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.3); opacity: 0.5; }
  100% { transform: scale(0) rotate(90deg); opacity: 0; }
`;
const comboFlash = keyframes`
  0%   { transform: scale(1); text-shadow: 0 0 0 transparent; }
  50%  { transform: scale(1.3); text-shadow: 0 0 20px #f59e0b; }
  100% { transform: scale(1); text-shadow: 0 0 0 transparent; }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 800px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #7c3aed; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`
  text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;
`;
const TopBar = styled.div`
  display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#7c3aed'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;
const Card = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; animation: ${pop} 0.4s ease;
  ${p => p.$shake && css`animation: ${shake} 0.5s ease;`}
`;
const TermDisplay = styled.div`
  font-size: 2rem; font-weight: 800; color: var(--text-primary);
  margin: 1.5rem 0 0.5rem; animation: ${slideUp} 0.3s ease;
  @media (max-width: 600px) { font-size: 1.4rem; }
`;
const HintText = styled.div`
  font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;
  span { color: #7c3aed; font-weight: 600; }
`;
const InputRow = styled.div`
  display: flex; gap: 10px; max-width: 500px; margin: 0 auto;
  @media (max-width: 600px) { flex-direction: column; }
`;
const Input = styled.input`
  flex: 1; padding: 14px 18px; border-radius: 14px; font-size: 1.1rem;
  border: 2px solid ${p => p.$status === 'correct' ? '#22c55e' : p.$status === 'wrong' ? '#ef4444' : '#e5e7eb'};
  background: ${p => p.$status === 'correct' ? '#f0fdf4' : p.$status === 'wrong' ? '#fef2f2' : 'var(--bg-secondary, #fff)'};
  color: var(--text-primary); outline: none; transition: border 0.2s;
  &:focus { border-color: #7c3aed; }
  ${p => p.$status === 'wrong' && css`animation: ${shake} 0.4s ease;`}
`;
const SubmitBtn = styled.button`
  padding: 14px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white; font-weight: 700; font-size: 1rem; cursor: pointer;
  transition: transform 0.15s; white-space: nowrap;
  &:hover { transform: translateY(-2px); }
  &:disabled { opacity: 0.5; cursor: default; transform: none; }
`;
const TimerBar = styled.div`
  width: 100%; height: 6px; background: #e5e7eb; border-radius: 3px;
  margin: 1rem 0; overflow: hidden;
`;
const TimerFill = styled.div`
  height: 100%; border-radius: 3px; transition: width 0.1s linear;
  width: ${p => p.$pct}%;
  background: ${p => p.$pct > 50 ? '#22c55e' : p.$pct > 25 ? '#f59e0b' : '#ef4444'};
  ${p => p.$pct <= 15 && css`animation: ${timerPulse} 0.5s ease infinite;`}
`;
const ChainViz = styled.div`
  display: flex; align-items: center; justify-content: center; gap: 4px;
  flex-wrap: wrap; margin: 1.5rem 0; min-height: 50px;
`;
const Link = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 0.8rem;
  animation: ${chainAppear} 0.4s ease;
  ${p => p.$breaking && css`animation: ${breakApart} 0.6s ease forwards;`}
`;
const Connector = styled.div`
  width: 16px; height: 3px; background: linear-gradient(90deg, #a78bfa, #7c3aed); border-radius: 2px;
`;
const ComboLabel = styled.div`
  font-size: 1.5rem; font-weight: 800; color: #f59e0b; margin-bottom: 0.5rem;
  animation: ${comboFlash} 0.6s ease;
`;
const Feedback = styled.div`
  margin-top: 1rem; padding: 12px 20px; border-radius: 12px; font-weight: 600;
  animation: ${pop} 0.3s ease;
  background: ${p => p.$correct ? '#dcfce7' : '#fee2e2'};
  color: ${p => p.$correct ? '#15803d' : '#dc2626'};
`;
const Btn = styled.button`
  padding: 12px 28px; border-radius: 14px; border: none; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: all 0.2s;
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)'};
  color: ${p => p.$v === 'secondary' ? 'var(--text-primary)' : 'white'};
  border: ${p => p.$v === 'secondary' ? '2px solid var(--border-color)' : 'none'};
  &:hover { transform: translateY(-2px); }
`;
const BtnRow = styled.div`
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;
`;
const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px; margin: 1.5rem 0;
`;
const StatBox = styled.div`
  background: ${p => p.$c}11; border: 2px solid ${p => p.$c}33; border-radius: 16px;
  padding: 1rem; text-align: center;
  .val { font-size: 1.5rem; font-weight: 800; color: ${p => p.$c}; }
  .lbl { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
`;
const ProgressBar = styled.div`
  width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; margin-bottom: 1rem;
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%; background: linear-gradient(90deg, #7c3aed, #a78bfa);
  border-radius: 4px; transition: width 0.3s ease; width: ${p => p.$pct}%;
`;
const LoadW = styled.div`text-align:center;padding:3rem;color:var(--text-secondary);`;
const ErrW = styled.div`text-align:center;padding:2rem;h3{color:#ef4444;}`;
const RulesBox = styled.div`
  text-align: left; max-width: 440px; margin: 1.5rem auto; line-height: 2;
  font-size: 1rem; color: var(--text-primary);
`;

const TOTAL = 15;
const TIME_LIMIT = 15; // seconds per word

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

export default function ChainGame() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [queue, setQueue] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);
  const [chain, setChain] = useState(0);
  const [maxChain, setMaxChain] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState(null); // 'correct' | 'wrong'
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [breaking, setBreaking] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const sessionStart = useRef(0);
  const statsRecorded = useRef(false);

  /* fetch flashcards */
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

  const buildQueue = useCallback(() => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const q = [];
    for (let i = 0; i < TOTAL; i++) q.push(shuffled[i % shuffled.length]);
    return q;
  }, [flashcards]);

  const startGame = () => {
    const q = buildQueue();
    setQueue(q);
    setRound(0); setChain(0); setMaxChain(0); setScore(0); setCorrect(0);
    setAnswer(''); setStatus(null); setCorrectAnswer(''); setBreaking(false);
    setTimeLeft(TIME_LIMIT); setFinished(false); setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  /* timer */
  useEffect(() => {
    if (!gameStarted || finished || status) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return Math.max(0, t - 0.1);
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [gameStarted, finished, round, status]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    setStatus('wrong');
    setCorrectAnswer(queue[round]?.definition || '');
    setBreaking(true);
    setChain(0);
    setTimeout(() => { setBreaking(false); nextRound(); }, 2000);
  };

  const getMultiplier = (c) => c >= 10 ? 5 : c >= 7 ? 4 : c >= 5 ? 3 : c >= 3 ? 2 : 1;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (status || !answer.trim()) return;
    clearInterval(timerRef.current);

    const card = queue[round];
    const sim = similarity(answer, card.definition);
    const isCorrect = sim >= 0.75;

    if (isCorrect) {
      const newChain = chain + 1;
      const mult = getMultiplier(newChain);
      const speedBonus = Math.round(timeLeft * 2);
      const pts = (10 + speedBonus) * mult;
      setChain(newChain);
      setMaxChain(m => Math.max(m, newChain));
      setScore(s => s + pts);
      setCorrect(c => c + 1);
      setStatus('correct');
      if (newChain % 5 === 0) confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      setStatus('wrong');
      setCorrectAnswer(card.definition);
      setBreaking(true);
      setChain(0);
    }
    setTimeout(() => { setBreaking(false); nextRound(); }, isCorrect ? 1000 : 2500);
  };

  const nextRound = () => {
    if (round + 1 >= TOTAL) {
      setFinished(true);
      return;
    }
    setRound(r => r + 1);
    setAnswer('');
    setStatus(null);
    setCorrectAnswer('');
    setTimeLeft(TIME_LIMIT);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const getHint = () => {
    if (!queue[round]) return '';
    const def = queue[round].definition;
    const first = def.charAt(0);
    const len = def.length;
    return `${first}${'·'.repeat(len - 1)} (${len} букв)`;
  };

  /* stats */
  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chain', cardsCount: TOTAL, correctCount: correct, timeSpent: t })
      });
      if (correct / TOTAL >= 0.7) trackGameWin();
    } catch {}
  }, [correct]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  /* render */
  if (!setId) return <SetSelector title="⛓️ Цепочка" subtitle="Печатайте определения на скорость!" onSelectSet={s => navigate(`/games/chain?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/chain')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    const acc = Math.round((correct / TOTAL) * 100);
    return (
      <Container>
        <Card>
          <Title>{acc >= 70 ? '🏆 Отличная цепочка!' : '⛓️ Игра окончена'}</Title>
          <Sub>{acc >= 90 ? 'Невероятная скорость и точность!' : acc >= 70 ? 'Отличная работа!' : 'Продолжайте тренироваться!'}</Sub>
          <StatsGrid>
            <StatBox $c="#7c3aed"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#f59e0b"><div className="val">{maxChain}</div><div className="lbl">⛓️ Макс. цепь</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{acc}%</div><div className="lbl">🎯 Точность</div></StatBox>
            <StatBox $c="#3b82f6"><div className="val">{correct}/{TOTAL}</div><div className="lbl">✅ Верных</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/chain')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>⛓️ Цепочка</Title>
        <Sub>Печатайте определения на скорость — стройте цепочку!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#5b21b6' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#7c3aed', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⛓️</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>⌨️ <strong>Печатайте</strong> определение для каждого термина</div>
            <div>⏱️ <strong>{TIME_LIMIT} секунд</strong> на каждый ответ</div>
            <div>⛓️ Правильные ответы подряд = цепочка</div>
            <div>⚡ Цепь 3+ = x2, 5+ = x3, 7+ = x4, 10+ = x5</div>
            <div>🚀 Чем быстрее — тем больше бонусных очков</div>
            <div>💡 Подсказка: первая буква и длина слова</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Начать игру</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/chain')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  const pct = (timeLeft / TIME_LIMIT) * 100;
  const progress = ((round + 1) / TOTAL) * 100;
  const mult = getMultiplier(chain);

  return (
    <Container>
      <Title>⛓️ Цепочка</Title>
      <ProgressBar><ProgressFill $pct={progress} /></ProgressBar>

      <TopBar>
        <Stat $c="#7c3aed"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $c="#f59e0b"><div className="val">⛓️ {chain}</div><div className="lbl">Цепь {mult > 1 ? `x${mult}` : ''}</div></Stat>
        <Stat $c="#22c55e"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
        <Stat><div className="val">{round + 1}/{TOTAL}</div><div className="lbl">Раунд</div></Stat>
      </TopBar>

      <ChainViz>
        {chain === 0 && !breaking && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Начните цепь правильным ответом!</span>}
        {Array.from({ length: Math.min(chain, 12) }).map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Connector />}
            <Link $breaking={breaking}>{i + 1}</Link>
          </React.Fragment>
        ))}
        {chain > 12 && <span style={{ fontWeight: 700, color: '#7c3aed', marginLeft: 6 }}>+{chain - 12}</span>}
      </ChainViz>

      {chain >= 3 && <ComboLabel key={chain}>🔥 x{mult} Комбо!</ComboLabel>}

      <Card $shake={status === 'wrong'}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Раунд {round + 1} из {TOTAL}</div>
        <TermDisplay key={round}>{queue[round]?.term}</TermDisplay>
        <HintText>💡 Подсказка: <span>{getHint()}</span></HintText>

        <TimerBar><TimerFill $pct={pct} /></TimerBar>

        <form onSubmit={handleSubmit}>
          <InputRow>
            <Input
              ref={inputRef}
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Введите определение..."
              $status={status}
              disabled={!!status}
              autoComplete="off"
              autoFocus
            />
            <SubmitBtn type="submit" disabled={!!status || !answer.trim()}>
              Ответить
            </SubmitBtn>
          </InputRow>
        </form>

        {status === 'correct' && <Feedback $correct>✅ Верно! +{Math.round(timeLeft * 2) + 10} очков</Feedback>}
        {status === 'wrong' && (
          <Feedback>
            ❌ Неверно! Правильный ответ: <strong>{correctAnswer}</strong>
          </Feedback>
        )}
      </Card>
    </Container>
  );
}
