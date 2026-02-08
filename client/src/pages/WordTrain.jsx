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
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
`;
const wagonAttach = keyframes`
  from { transform: translateX(60px) scale(0.8); opacity: 0; }
  to   { transform: translateX(0) scale(1); opacity: 1; }
`;
const wagonDetach = keyframes`
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(80px) translateY(20px) rotate(8deg); opacity: 0; }
`;
const chug = keyframes`
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
`;
const smoke = keyframes`
  0%   { transform: translateY(0) scale(0.5); opacity: 0.8; }
  100% { transform: translateY(-30px) scale(1.5); opacity: 0; }
`;
const letterPop = keyframes`
  0%   { transform: scale(0) rotate(-20deg); }
  60%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const glow = keyframes`
  0%,100% { box-shadow: 0 0 8px rgba(139,92,246,0.3); }
  50%     { box-shadow: 0 0 20px rgba(139,92,246,0.6); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 800px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #8b5cf6; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#8b5cf6'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;

/* Train */
const TrainTrack = styled.div`
  display: flex; align-items: flex-end; gap: 4px; overflow-x: auto;
  padding: 1rem 0.5rem; margin-bottom: 1rem; min-height: 80px;
  border-bottom: 4px solid #78716c;
  position: relative;
  &::-webkit-scrollbar { height: 4px; }
`;
const Locomotive = styled.div`
  font-size: 2.8rem; flex-shrink: 0; animation: ${chug} 0.6s ease infinite;
  position: relative;
`;
const SmokeCloud = styled.span`
  position: absolute; top: -14px; left: 8px; font-size: 1.2rem;
  animation: ${smoke} 1.5s ease infinite;
  animation-delay: ${p => p.$d || 0}s;
`;
const Wagon = styled.div`
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 40px; border-radius: 8px;
  background: linear-gradient(135deg, ${p => p.$color});
  color: white; font-weight: 700; font-size: 0.7rem; flex-shrink: 0;
  animation: ${p => p.$detach ? wagonDetach : wagonAttach} 0.5s ease ${p => p.$detach ? 'forwards' : 'both'};
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  position: relative;

  &::after {
    content: ''; position: absolute; bottom: -6px;
    width: 10px; height: 10px; border-radius: 50%; background: #44403c;
    box-shadow: 28px 0 0 #44403c;
  }
`;

/* Question area */
const QuestionCard = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${pop} 0.3s ease;
  ${p => p.$shake && css`animation: ${shake} 0.5s ease;`}
`;
const DefText = styled.div`
  font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 0.5rem;
  font-style: italic;
`;
const BuiltWord = styled.div`
  display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;
  min-height: 52px; margin: 1rem 0; padding: 12px;
  background: var(--bg-secondary, #f8fafc); border-radius: 14px;
  border: 2px dashed ${p => p.$wrong ? '#ef4444' : p.$correct ? '#22c55e' : '#d1d5db'};
  transition: border-color 0.3s;
  ${p => p.$correct && css`animation: ${glow} 1s ease;`}
`;
const BuiltLetter = styled.div`
  width: 38px; height: 42px; border-radius: 8px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white; font-weight: 800; font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
  animation: ${letterPop} 0.3s ease;
  cursor: pointer;
  &:hover { opacity: 0.8; }
`;
const Placeholder = styled.div`
  width: 38px; height: 42px; border-radius: 8px;
  border: 2px dashed #d1d5db; background: transparent;
`;
const LettersPool = styled.div`
  display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
  margin: 1rem 0;
`;
const LetterBtn = styled.button`
  width: 42px; height: 46px; border-radius: 10px; border: 2px solid #e5e7eb;
  background: var(--card-bg, #fff); color: var(--text-primary);
  font-size: 1.15rem; font-weight: 700; cursor: pointer;
  transition: all 0.15s; display: flex; align-items: center; justify-content: center;

  &:hover:not(:disabled) {
    border-color: #8b5cf6; transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(139,92,246,0.3);
  }
  &:disabled { opacity: 0.3; cursor: default; transform: none; }
`;
const ActionRow = styled.div`
  display: flex; gap: 10px; justify-content: center; margin-top: 1rem;
`;
const SmallBtn = styled.button`
  padding: 8px 18px; border-radius: 10px; border: 2px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary); color: var(--text-primary);
  font-weight: 600; font-size: 0.85rem; cursor: pointer;
  &:hover { border-color: #8b5cf6; }
`;
const Feedback = styled.div`
  margin-top: 1rem; padding: 10px 16px; border-radius: 12px; font-weight: 600;
  animation: ${pop} 0.3s ease;
  background: ${p => p.$ok ? '#dcfce7' : '#fee2e2'};
  color: ${p => p.$ok ? '#15803d' : '#dc2626'};
`;
const Card = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${pop} 0.4s ease;
`;
const Btn = styled.button`
  padding: 12px 28px; border-radius: 14px; border: none; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: all 0.2s;
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)'};
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
const ProgressBar = styled.div`
  width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; margin-bottom: 1rem; overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 4px; transition: width 0.3s; width: ${p => p.$pct}%;
`;
const LoadW = styled.div`text-align:center;padding:3rem;color:var(--text-secondary);`;
const ErrW = styled.div`text-align:center;padding:2rem;h3{color:#ef4444;}`;
const RulesBox = styled.div`
  text-align: left; max-width: 440px; margin: 1.5rem auto; line-height: 2;
  font-size: 1rem; color: var(--text-primary);
`;

const TOTAL = 10;
const WAGON_COLORS = [
  '#ef4444,#dc2626', '#f59e0b,#d97706', '#22c55e,#16a34a', '#3b82f6,#2563eb',
  '#8b5cf6,#7c3aed', '#ec4899,#db2777', '#14b8a6,#0d9488', '#f97316,#ea580c',
  '#6366f1,#4f46e5', '#84cc16,#65a30d'
];

export default function WordTrain() {
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
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wagons, setWagons] = useState([]);
  const [built, setBuilt] = useState([]);
  const [pool, setPool] = useState([]);
  const [used, setUsed] = useState(new Set());
  const [result, setResult] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [detaching, setDetaching] = useState(false);

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

  const setupRound = useCallback((card) => {
    const letters = card.term.split('');
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    // Ensure shuffled is not identical to original
    if (shuffled.join('') === letters.join('') && letters.length > 1) {
      const i = Math.floor(Math.random() * (letters.length - 1));
      [shuffled[i], shuffled[i + 1]] = [shuffled[i + 1], shuffled[i]];
    }
    setPool(shuffled.map((l, i) => ({ letter: l, id: i })));
    setBuilt([]);
    setUsed(new Set());
    setResult(null);
    setShaking(false);
  }, []);

  const startGame = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const q = [];
    for (let i = 0; i < TOTAL; i++) q.push(shuffled[i % shuffled.length]);
    setQueue(q);
    setRound(0); setScore(0); setCorrect(0); setWagons([]); setDetaching(false);
    setFinished(false); setGameStarted(true);
    setupRound(q[0]);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const handleLetterClick = (idx) => {
    if (result || used.has(idx)) return;
    const newBuilt = [...built, pool[idx]];
    setBuilt(newBuilt);
    setUsed(new Set([...used, idx]));

    // Check if word is complete
    const card = queue[round];
    if (newBuilt.length === card.term.length) {
      const builtWord = newBuilt.map(l => l.letter).join('');
      if (builtWord === card.term) {
        setResult('correct');
        setScore(s => s + 20);
        setCorrect(c => c + 1);
        setWagons(w => [...w, { label: card.term, color: WAGON_COLORS[round % WAGON_COLORS.length] }]);
        if ((correct + 1) % 3 === 0) confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
        setTimeout(() => nextRound(), 1200);
      } else {
        setResult('wrong');
        setShaking(true);
        setDetaching(true);
        setTimeout(() => {
          if (wagons.length > 0) setWagons(w => w.slice(0, -1));
          setDetaching(false);
          setTimeout(() => nextRound(), 300);
        }, 800);
      }
    }
  };

  const handleBuiltClick = (idx) => {
    if (result) return;
    const letter = built[idx];
    const newBuilt = built.filter((_, i) => i !== idx);
    setBuilt(newBuilt);
    const newUsed = new Set(used);
    newUsed.delete(letter.id);
    setUsed(newUsed);
  };

  const clearBuilt = () => {
    if (result) return;
    setBuilt([]);
    setUsed(new Set());
  };

  const nextRound = () => {
    if (round + 1 >= TOTAL) {
      setFinished(true);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      return;
    }
    const next = round + 1;
    setRound(next);
    setupRound(queue[next]);
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'word-train', cardsCount: TOTAL, correctCount: correct, timeSpent: t })
      });
      if (correct / TOTAL >= 0.7) trackGameWin();
    } catch {}
  }, [correct]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  if (!setId) return <SetSelector title="🚂 Поезд слов" subtitle="Собирайте слова из букв — стройте поезд!" onSelectSet={s => navigate(`/games/word-train?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/word-train')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    const acc = Math.round((correct / TOTAL) * 100);
    return (
      <Container>
        <Card>
          <Title>{acc >= 70 ? '🏆 Поезд прибыл!' : '🚂 Конец пути'}</Title>
          <Sub>{acc >= 90 ? 'Великолепный состав!' : acc >= 70 ? 'Хорошая поездка!' : 'Попробуйте ещё!'}</Sub>
          <TrainTrack>
            <Locomotive>🚂<SmokeCloud>💨</SmokeCloud></Locomotive>
            {wagons.map((w, i) => <Wagon key={i} $color={w.color}>{w.label.slice(0, 4)}</Wagon>)}
          </TrainTrack>
          <StatsGrid>
            <StatBox $c="#8b5cf6"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#f59e0b"><div className="val">{wagons.length}</div><div className="lbl">🚃 Вагонов</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{acc}%</div><div className="lbl">🎯 Точность</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/word-train')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🚂 Поезд слов</Title>
        <Sub>Собирайте слова из букв — каждое верное слово = новый вагон!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#5b21b6' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#7c3aed', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚂</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>📖 Вы видите <strong>определение</strong> карточки</div>
            <div>🔤 Буквы термина перемешаны внизу</div>
            <div>👆 Нажимайте буквы в правильном порядке</div>
            <div>✅ Верное слово = новый вагон в поезде</div>
            <div>❌ Ошибка = последний вагон отцепляется</div>
            <div>🚂 Соберите состав из {TOTAL} вагонов!</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🚀 В путь!</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/word-train')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  const card = queue[round];

  return (
    <Container>
      <Title>🚂 Поезд слов</Title>
      <ProgressBar><ProgressFill $pct={((round + 1) / TOTAL) * 100} /></ProgressBar>

      <TopBar>
        <Stat $c="#8b5cf6"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $c="#f59e0b"><div className="val">🚃 {wagons.length}</div><div className="lbl">Вагонов</div></Stat>
        <Stat><div className="val">{round + 1}/{TOTAL}</div><div className="lbl">Раунд</div></Stat>
      </TopBar>

      <TrainTrack>
        <Locomotive>🚂<SmokeCloud>💨</SmokeCloud><SmokeCloud $d={0.5}>💨</SmokeCloud></Locomotive>
        {wagons.map((w, i) => (
          <Wagon key={i} $color={w.color} $detach={detaching && i === wagons.length - 1}>
            {w.label.slice(0, 4)}
          </Wagon>
        ))}
      </TrainTrack>

      <QuestionCard $shake={shaking}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Раунд {round + 1} из {TOTAL}</div>
        <DefText>📖 {card?.definition}</DefText>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          Соберите слово из букв ({card?.term.length} букв)
        </div>

        <BuiltWord $wrong={result === 'wrong'} $correct={result === 'correct'}>
          {built.map((l, i) => (
            <BuiltLetter key={`${l.id}-${i}`} onClick={() => handleBuiltClick(i)}>
              {l.letter}
            </BuiltLetter>
          ))}
          {Array.from({ length: Math.max(0, (card?.term.length || 0) - built.length) }).map((_, i) => (
            <Placeholder key={`ph-${i}`} />
          ))}
        </BuiltWord>

        <LettersPool>
          {pool.map((l, idx) => (
            <LetterBtn
              key={l.id}
              onClick={() => handleLetterClick(idx)}
              disabled={used.has(idx) || !!result}
            >
              {l.letter}
            </LetterBtn>
          ))}
        </LettersPool>

        <ActionRow>
          <SmallBtn onClick={clearBuilt} disabled={!!result || built.length === 0}>
            🔄 Сбросить
          </SmallBtn>
        </ActionRow>

        {result === 'correct' && <Feedback $ok>✅ Верно! Вагон прицеплен!</Feedback>}
        {result === 'wrong' && <Feedback>❌ Неверно! Правильно: <strong>{card?.term}</strong></Feedback>}
      </QuestionCard>
    </Container>
  );
}
