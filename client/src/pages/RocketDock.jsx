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
const rocketLaunch = keyframes`
  0%   { transform: translateY(0); }
  30%  { transform: translateY(5px); }
  100% { transform: translateY(-400px) scale(0.3); opacity: 0; }
`;
const flame = keyframes`
  0%,100% { transform: scaleY(1); opacity: 0.8; }
  50%     { transform: scaleY(1.4); opacity: 1; }
`;
const fuelFill = keyframes`
  from { height: 0%; }
  to   { height: var(--fuel-pct); }
`;
const sparkle = keyframes`
  0%   { opacity: 0; transform: scale(0); }
  50%  { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(0); }
`;
const slideIn = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`;
const slideInR = keyframes`
  from { transform: translateX(20px); opacity: 0; }
  to   { transform: translateX(0); opacity: 1; }
`;
const matchPulse = keyframes`
  0%   { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50%  { transform: scale(1.05); box-shadow: 0 0 20px 4px rgba(34,197,94,0.3); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34,197,94,0); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 900px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #2563eb; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;`;
const StatBadge = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#2563eb'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;
const GameLayout = styled.div`
  display: flex; gap: 1.5rem; align-items: flex-start;
  @media (max-width: 700px) { flex-direction: column; }
`;
const MatchArea = styled.div`
  flex: 1; display: flex; gap: 1rem;
  @media (max-width: 500px) { flex-direction: column; }
`;
const Column = styled.div`
  flex: 1; display: flex; flex-direction: column; gap: 10px;
`;
const ColumnLabel = styled.div`
  text-align: center; font-size: 0.8rem; font-weight: 700;
  color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px;
`;
const ItemCard = styled.button`
  width: 100%; padding: 14px 12px; border-radius: 14px; font-size: 0.9rem;
  font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;
  border: 2px solid transparent; word-break: break-word;
  animation: ${p => p.$side === 'left' ? slideIn : slideInR} 0.4s ease both;
  animation-delay: ${p => p.$idx * 0.08}s;

  background: ${p =>
    p.$matched ? '#dcfce7' :
    p.$selected ? '#dbeafe' :
    p.$wrong ? '#fee2e2' :
    'var(--card-bg, #fff)'};
  color: ${p =>
    p.$matched ? '#15803d' :
    p.$wrong ? '#dc2626' :
    'var(--text-primary)'};
  border-color: ${p =>
    p.$matched ? '#22c55e' :
    p.$selected ? '#3b82f6' :
    p.$wrong ? '#ef4444' :
    'var(--border-color, #e5e7eb)'};
  box-shadow: ${p => p.$selected ? '0 0 16px rgba(59,130,246,0.3)' : '0 2px 8px rgba(0,0,0,0.05)'};

  ${p => p.$matched && css`animation: ${matchPulse} 0.6s ease; pointer-events: none;`}
  ${p => p.$wrong && css`animation: ${shake} 0.4s ease;`}

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
  &:disabled { cursor: default; }
`;
const RocketPanel = styled.div`
  width: 120px; text-align: center; flex-shrink: 0;
  @media (max-width: 700px) { width: 100%; display: flex; align-items: center; gap: 1rem; justify-content: center; }
`;
const RocketBody = styled.div`
  font-size: 4rem; margin-bottom: 8px;
  ${p => p.$launching && css`animation: ${rocketLaunch} 2s ease forwards;`}
`;
const FuelGauge = styled.div`
  width: 40px; height: 200px; border-radius: 20px; margin: 0 auto;
  background: #1e293b; border: 3px solid #334155; position: relative; overflow: hidden;
  @media (max-width: 700px) { width: 200px; height: 30px; border-radius: 15px; }
`;
const FuelLevel = styled.div`
  position: absolute; bottom: 0; left: 0; right: 0;
  height: ${p => p.$pct}%;
  background: linear-gradient(to top, #f97316, #fbbf24);
  border-radius: 0 0 17px 17px; transition: height 0.5s ease;
  @media (max-width: 700px) {
    height: 100%; width: ${p => p.$pct}%; border-radius: 12px 0 0 12px;
    top: 0; bottom: 0;
  }
`;
const FuelLabel = styled.div`
  font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-top: 8px;
`;
const Card = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${pop} 0.4s ease;
`;
const Btn = styled.button`
  padding: 12px 28px; border-radius: 14px; border: none; font-weight: 700;
  font-size: 1rem; cursor: pointer; transition: all 0.2s;
  background: ${p => p.$v === 'secondary' ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'};
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
const RoundLabel = styled.div`
  text-align: center; font-size: 0.9rem; color: var(--text-secondary);
  margin-bottom: 1rem; font-weight: 600;
`;
const LoadW = styled.div`text-align:center;padding:3rem;color:var(--text-secondary);`;
const ErrW = styled.div`text-align:center;padding:2rem;h3{color:#ef4444;}`;
const RulesBox = styled.div`
  text-align: left; max-width: 440px; margin: 1.5rem auto; line-height: 2;
  font-size: 1rem; color: var(--text-primary);
`;

const PAIRS_PER_ROUND = 4;
const TOTAL_ROUNDS = 3;

export default function RocketDock() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [roundIdx, setRoundIdx] = useState(0);
  const [roundCards, setRoundCards] = useState([]);
  const [terms, setTerms] = useState([]);
  const [defs, setDefs] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [wrongPair, setWrongPair] = useState(null);
  const [score, setScore] = useState(0);
  const [totalMatched, setTotalMatched] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [launching, setLaunching] = useState(false);

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

  const setupRound = useCallback((cards, rIdx) => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const pick = shuffled.slice(rIdx * PAIRS_PER_ROUND, rIdx * PAIRS_PER_ROUND + PAIRS_PER_ROUND);
    const used = pick.length >= PAIRS_PER_ROUND ? pick : shuffled.slice(0, PAIRS_PER_ROUND);
    setRoundCards(used);
    setTerms([...used].sort(() => Math.random() - 0.5));
    setDefs([...used].sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setSelectedTerm(null);
    setSelectedDef(null);
    setWrongPair(null);
  }, []);

  const startGame = () => {
    setScore(0); setTotalMatched(0); setMistakes(0); setRoundIdx(0);
    setFinished(false); setGameStarted(true); setLaunching(false);
    setupRound(flashcards, 0);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const tryMatch = useCallback((termIdx, defIdx) => {
    if (termIdx === null || defIdx === null) return;
    const term = terms[termIdx];
    const def = defs[defIdx];

    if (term.definition === def.definition) {
      // Match!
      const newMatched = new Set(matched);
      newMatched.add(term.term);
      setMatched(newMatched);
      setScore(s => s + 20);
      setTotalMatched(t => t + 1);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (newMatched.size === PAIRS_PER_ROUND) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        setTimeout(() => {
          if (roundIdx + 1 >= TOTAL_ROUNDS) {
            setLaunching(true);
            confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
            setTimeout(() => setFinished(true), 2000);
          } else {
            setRoundIdx(r => r + 1);
            setupRound(flashcards, roundIdx + 1);
          }
        }, 800);
      }
    } else {
      setWrongPair({ t: termIdx, d: defIdx });
      setMistakes(m => m + 1);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 600);
    }
  }, [terms, defs, matched, roundIdx, flashcards, setupRound]);

  const handleTermClick = (idx) => {
    if (matched.has(terms[idx].term) || wrongPair) return;
    setSelectedTerm(idx);
    if (selectedDef !== null) tryMatch(idx, selectedDef);
  };

  const handleDefClick = (idx) => {
    if (matched.has(defs[idx].term) || wrongPair) return;
    setSelectedDef(idx);
    if (selectedTerm !== null) tryMatch(selectedTerm, idx);
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'rocket-dock', cardsCount: PAIRS_PER_ROUND * TOTAL_ROUNDS, correctCount: totalMatched, timeSpent: t })
      });
      if (totalMatched >= PAIRS_PER_ROUND * TOTAL_ROUNDS * 0.7) trackGameWin();
    } catch {}
  }, [totalMatched]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  const fuelPct = (totalMatched / (PAIRS_PER_ROUND * TOTAL_ROUNDS)) * 100;

  if (!setId) return <SetSelector title="🚀 Ракета" subtitle="Соединяйте пары терминов — заправьте ракету!" onSelectSet={s => navigate(`/games/rocket-dock?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/rocket-dock')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    const acc = TOTAL_ROUNDS * PAIRS_PER_ROUND > 0 ? Math.round((totalMatched / (TOTAL_ROUNDS * PAIRS_PER_ROUND)) * 100) : 0;
    return (
      <Container>
        <Card>
          <Title>🚀 Ракета запущена!</Title>
          <Sub>Вы успешно заправили ракету и отправили её в космос!</Sub>
          <StatsGrid>
            <StatBox $c="#2563eb"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{totalMatched}</div><div className="lbl">🔗 Пар</div></StatBox>
            <StatBox $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">❌ Ошибок</div></StatBox>
            <StatBox $c="#f59e0b"><div className="val">{acc}%</div><div className="lbl">⛽ Топливо</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/rocket-dock')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🚀 Ракета</Title>
        <Sub>Соединяйте термины с определениями — заправьте ракету!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#1e40af' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#2563eb', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>👆 Нажмите на <strong>термин</strong> слева</div>
            <div>👆 Затем на <strong>определение</strong> справа</div>
            <div>✅ Совпадение = топливо для ракеты</div>
            <div>❌ Ошибка = пара подсвечивается красным</div>
            <div>⛽ Заполните бак полностью для запуска!</div>
            <div>🚀 {TOTAL_ROUNDS} раунда по {PAIRS_PER_ROUND} пары</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>🚀 Запустить миссию</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/rocket-dock')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🚀 Ракета</Title>
      <RoundLabel>Раунд {roundIdx + 1} из {TOTAL_ROUNDS} — Найдите {PAIRS_PER_ROUND} пары</RoundLabel>

      <TopBar>
        <StatBadge $c="#2563eb"><div className="val">{score}</div><div className="lbl">Очки</div></StatBadge>
        <StatBadge $c="#22c55e"><div className="val">{totalMatched}</div><div className="lbl">Пар</div></StatBadge>
        <StatBadge $c="#ef4444"><div className="val">{mistakes}</div><div className="lbl">Ошибок</div></StatBadge>
      </TopBar>

      <GameLayout>
        <MatchArea>
          <Column>
            <ColumnLabel>📝 Термины</ColumnLabel>
            {terms.map((card, idx) => (
              <ItemCard
                key={card.term + idx}
                $side="left"
                $idx={idx}
                $selected={selectedTerm === idx}
                $matched={matched.has(card.term)}
                $wrong={wrongPair?.t === idx}
                onClick={() => handleTermClick(idx)}
                disabled={matched.has(card.term)}
              >
                {card.term}
              </ItemCard>
            ))}
          </Column>
          <Column>
            <ColumnLabel>📖 Определения</ColumnLabel>
            {defs.map((card, idx) => (
              <ItemCard
                key={card.definition + idx}
                $side="right"
                $idx={idx}
                $selected={selectedDef === idx}
                $matched={matched.has(card.term)}
                $wrong={wrongPair?.d === idx}
                onClick={() => handleDefClick(idx)}
                disabled={matched.has(card.term)}
              >
                {card.definition}
              </ItemCard>
            ))}
          </Column>
        </MatchArea>

        <RocketPanel>
          <RocketBody $launching={launching}>🚀</RocketBody>
          <FuelGauge><FuelLevel $pct={fuelPct} /></FuelGauge>
          <FuelLabel>⛽ {Math.round(fuelPct)}%</FuelLabel>
        </RocketPanel>
      </GameLayout>
    </Container>
  );
}
