import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';

/* ─── keyframes ─── */
const fall = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const stackUp = keyframes`
  from { transform: translateY(40px) scale(0.8); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
`;
const crumble = keyframes`
  0%   { transform: translateY(0) rotate(0); opacity: 1; }
  30%  { transform: translateY(-10px) rotate(-5deg); }
  100% { transform: translateY(60px) rotate(15deg); opacity: 0; }
`;
const sway = keyframes`
  0%,100% { transform: rotate(-1deg); }
  50%     { transform: rotate(1deg); }
`;
const pop = keyframes`
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;
const shake = keyframes`
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
`;
const sparkle = keyframes`
  0%   { transform: scale(0) rotate(0); opacity: 1; }
  100% { transform: scale(1.5) rotate(180deg); opacity: 0; }
`;
const float = keyframes`
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-6px); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 800px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #e67e22; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#e67e22'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;
const GameArea = styled.div`
  display: flex; gap: 2rem; align-items: flex-end; justify-content: center;
  min-height: 420px; position: relative;
  @media (max-width: 700px) { flex-direction: column; align-items: center; min-height: auto; gap: 1.5rem; }
`;
const TowerColumn = styled.div`
  display: flex; flex-direction: column-reverse; align-items: center;
  min-width: 120px; position: relative;
  animation: ${p => p.$shake ? shake : 'none'} 0.5s ease;
`;
const TowerBase = styled.div`
  width: 160px; height: 16px; background: linear-gradient(135deg, #92400e, #78350f);
  border-radius: 0 0 8px 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
`;
const Block = styled.div`
  width: ${p => 140 - p.$i * 2}px; height: 36px;
  background: linear-gradient(135deg, ${p => p.$color});
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: 600; color: white; padding: 0 6px;
  text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
  animation: ${stackUp} 0.5s ease;
  ${p => p.$crumble && css`animation: ${crumble} 0.8s ease forwards;`}
  margin-bottom: 2px;
`;
const QuestionPanel = styled.div`
  flex: 1; max-width: 480px;
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); border: 1px solid var(--border-color, #e5e7eb);
  animation: ${pop} 0.4s ease;
  @media (max-width: 700px) { max-width: 100%; width: 100%; }
`;
const TermText = styled.div`
  font-size: 1.6rem; font-weight: 800; text-align: center; color: var(--text-primary);
  margin: 1rem 0 1.5rem; animation: ${pop} 0.3s ease;
  @media (max-width: 600px) { font-size: 1.2rem; }
`;
const BlocksField = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
`;
const FallingBlock = styled.button`
  padding: 14px; border-radius: 14px; border: 2px solid transparent;
  background: linear-gradient(135deg, ${p => p.$color});
  color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer;
  animation: ${fall} ${p => p.$delay}s ease both;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);

  &:hover:not(:disabled) {
    transform: scale(1.05); box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    border-color: white;
  }
  &:disabled { opacity: 0.6; cursor: default; transform: none; }
  ${p => p.$correct && css`border-color: #22c55e; box-shadow: 0 0 20px rgba(34,197,94,0.5);`}
  ${p => p.$wrong && css`border-color: #ef4444; animation: ${shake} 0.4s ease;`}
`;
const Feedback = styled.div`
  margin-top: 1rem; padding: 10px 16px; border-radius: 12px; font-weight: 600; text-align: center;
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
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #e67e22, #d35400)'};
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
  height: 100%; background: linear-gradient(90deg, #e67e22, #f59e0b);
  border-radius: 4px; transition: width 0.3s; width: ${p => p.$pct}%;
`;
const LoadW = styled.div`text-align:center;padding:3rem;color:var(--text-secondary);`;
const ErrW = styled.div`text-align:center;padding:2rem;h3{color:#ef4444;}`;
const RulesBox = styled.div`
  text-align: left; max-width: 440px; margin: 1.5rem auto; line-height: 2;
  font-size: 1rem; color: var(--text-primary);
`;

const TOTAL = 12;
const BLOCK_COLORS = [
  '#e67e22, #d35400', '#3b82f6, #2563eb', '#22c55e, #16a34a',
  '#ef4444, #dc2626', '#8b5cf6, #7c3aed', '#ec4899, #db2777',
  '#14b8a6, #0d9488', '#f59e0b, #d97706', '#6366f1, #4f46e5',
  '#84cc16, #65a30d', '#f97316, #ea580c', '#06b6d4, #0891b2'
];

export default function TowerGame() {
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
  const [tower, setTower] = useState([]);
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [towerShake, setTowerShake] = useState(false);
  const [crumbling, setCrumbling] = useState(false);

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

  const genOptions = useCallback((card, cards) => {
    const wrong = cards.filter(c => c.definition !== card.definition)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.definition);
    return [card.definition, ...wrong].sort(() => Math.random() - 0.5);
  }, []);

  const startGame = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    const q = [];
    for (let i = 0; i < TOTAL; i++) q.push(shuffled[i % shuffled.length]);
    setQueue(q);
    setRound(0); setScore(0); setCorrect(0); setTower([]); setCrumbling(false);
    setSelected(null); setResult(null); setFinished(false); setGameStarted(true);
    setOptions(genOptions(q[0], flashcards));
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const handlePick = (idx) => {
    if (result !== null) return;
    setSelected(idx);
    const card = queue[round];
    const isCorrect = options[idx] === card.definition;

    if (isCorrect) {
      setResult('correct');
      setScore(s => s + 15);
      setCorrect(c => c + 1);
      setTower(t => [...t, { label: card.term, color: BLOCK_COLORS[round % BLOCK_COLORS.length] }]);
      if ((correct + 1) % 4 === 0) confetti({ particleCount: 50, spread: 50, origin: { y: 0.65 } });
    } else {
      setResult('wrong');
      setTowerShake(true);
      setCrumbling(true);
      setTimeout(() => {
        setTowerShake(false);
        if (tower.length > 0) setTower(t => t.slice(0, -1));
        setCrumbling(false);
      }, 800);
    }

    setTimeout(() => {
      if (round + 1 >= TOTAL) { setFinished(true); return; }
      const next = round + 1;
      setRound(next);
      setOptions(genOptions(queue[next], flashcards));
      setSelected(null);
      setResult(null);
    }, 1500);
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'tower', cardsCount: TOTAL, correctCount: correct, timeSpent: t })
      });
      if (correct / TOTAL >= 0.7) trackGameWin();
    } catch {}
  }, [correct]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  if (!setId) return <SetSelector title="🏗️ Башня" subtitle="Стройте башню из правильных ответов!" onSelectSet={s => navigate(`/games/tower?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/tower')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    const acc = Math.round((correct / TOTAL) * 100);
    return (
      <Container>
        <Card>
          <Title>{acc >= 70 ? '🏆 Башня построена!' : '🏗️ Игра окончена'}</Title>
          <Sub>{acc >= 90 ? 'Великолепная башня!' : acc >= 70 ? 'Отличная работа!' : 'Попробуйте ещё раз!'}</Sub>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <TowerColumn>
              <TowerBase />
              {tower.map((b, i) => <Block key={i} $i={i} $color={b.color}>{b.label}</Block>)}
            </TowerColumn>
          </div>
          <StatsGrid>
            <StatBox $c="#e67e22"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#3b82f6"><div className="val">{tower.length}</div><div className="lbl">🧱 Этажей</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{acc}%</div><div className="lbl">🎯 Точность</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/tower')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🏗️ Башня</Title>
        <Sub>Выбирайте правильные блоки — стройте башню!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#a16207', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏗️</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>🧱 Каждый правильный ответ — новый блок в башне</div>
            <div>💥 Ошибка — верхний блок разрушается</div>
            <div>🎯 Блоки «падают» — выберите верный!</div>
            <div>🏆 Постройте максимально высокую башню</div>
            <div>📝 {TOTAL} раундов — удачи!</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Начать стройку</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/tower')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏗️ Башня</Title>
      <ProgressBar><ProgressFill $pct={((round + 1) / TOTAL) * 100} /></ProgressBar>

      <TopBar>
        <Stat $c="#e67e22"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $c="#3b82f6"><div className="val">🧱 {tower.length}</div><div className="lbl">Этажей</div></Stat>
        <Stat><div className="val">{round + 1}/{TOTAL}</div><div className="lbl">Раунд</div></Stat>
      </TopBar>

      <GameArea>
        <TowerColumn $shake={towerShake}>
          <TowerBase />
          {tower.map((b, i) => (
            <Block key={i} $i={i} $color={b.color} $crumble={crumbling && i === tower.length - 1}>
              {b.label}
            </Block>
          ))}
        </TowerColumn>

        <QuestionPanel>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Раунд {round + 1} из {TOTAL}</div>
          <TermText key={round}>{queue[round]?.term}</TermText>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Выберите правильный блок ⬇️</div>

          <BlocksField>
            {options.map((opt, idx) => {
              const isCorrectOpt = opt === queue[round]?.definition;
              return (
                <FallingBlock
                  key={idx}
                  $color={BLOCK_COLORS[(round * 4 + idx) % BLOCK_COLORS.length]}
                  $delay={0.1 + idx * 0.15}
                  $correct={result && isCorrectOpt}
                  $wrong={result === 'wrong' && selected === idx}
                  disabled={result !== null}
                  onClick={() => handlePick(idx)}
                >
                  {opt}
                </FallingBlock>
              );
            })}
          </BlocksField>

          {result === 'correct' && <Feedback $ok>✅ Верно! Блок добавлен!</Feedback>}
          {result === 'wrong' && <Feedback>💥 Неверно! Блок разрушен!</Feedback>}
        </QuestionPanel>
      </GameArea>
    </Container>
  );
}
