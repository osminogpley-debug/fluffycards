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
const wave = keyframes`
  0%,100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-4px) rotate(-3deg); }
  75% { transform: translateY(4px) rotate(3deg); }
`;
const dig = keyframes`
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-20deg); }
  50%  { transform: rotate(20deg); }
  75%  { transform: rotate(-10deg); }
  100% { transform: rotate(0deg); }
`;
const coinBounce = keyframes`
  0%   { transform: translateY(0) scale(1); opacity: 1; }
  50%  { transform: translateY(-30px) scale(1.3); }
  100% { transform: translateY(-50px) scale(1); opacity: 0; }
`;
const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
`;
const sparkle = keyframes`
  0%   { opacity: 0; }
  50%  { opacity: 1; }
  100% { opacity: 0; }
`;
const float = keyframes`
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-8px); }
`;
const shipSail = keyframes`
  0%,100% { transform: translateX(0) rotate(-1deg); }
  50%     { transform: translateX(8px) rotate(1deg); }
`;

/* ─── styled ─── */
const Container = styled.div`
  max-width: 850px; margin: 0 auto; padding: 1.5rem;
  font-family: 'Segoe UI', sans-serif;
  @media (max-width: 600px) { padding: 0.75rem; }
`;
const Title = styled.h1`
  text-align: center; color: #b45309; font-size: 2.2rem; margin-bottom: 0.5rem;
  @media (max-width: 600px) { font-size: 1.6rem; }
`;
const Sub = styled.p`text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;`;
const TopBar = styled.div`display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem;`;
const Stat = styled.div`
  background: var(--card-bg, #fff); padding: 0.5rem 1rem; border-radius: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06); border: 1px solid var(--border-color, #e5e7eb);
  text-align: center; min-width: 80px;
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$c || '#b45309'}; }
  .lbl { font-size: 0.72rem; color: var(--text-secondary); }
`;

/* Map */
const MapArea = styled.div`
  background: linear-gradient(180deg, #7dd3fc 0%, #38bdf8 30%, #0ea5e9 100%);
  border-radius: 20px; padding: 1.5rem; position: relative; overflow: hidden;
  min-height: 200px; margin-bottom: 1.5rem;
`;
const WaveBg = styled.div`
  position: absolute; bottom: 0; left: 0; right: 0; height: 30px;
  background: repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px);
  animation: ${wave} 3s ease infinite;
`;
const IslandRow = styled.div`
  display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; position: relative; z-index: 1;
`;
const Island = styled.button`
  width: 72px; height: 72px; border-radius: 50%; border: 3px solid transparent;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 1.8rem; cursor: pointer; transition: all 0.3s; position: relative;

  ${p => p.$state === 'locked' && css`
    background: #94a3b8; border-color: #64748b; opacity: 0.5; cursor: default;
  `}
  ${p => p.$state === 'current' && css`
    background: #fef3c7; border-color: #f59e0b;
    animation: ${float} 1.5s ease infinite;
    box-shadow: 0 0 20px rgba(245,158,11,0.5);
  `}
  ${p => p.$state === 'completed' && css`
    background: #dcfce7; border-color: #22c55e;
  `}
  ${p => p.$state === 'failed' && css`
    background: #fee2e2; border-color: #ef4444;
  `}
  ${p => p.$state === 'treasure' && css`
    background: linear-gradient(135deg, #fef3c7, #fde68a);
    border-color: #f59e0b; animation: ${float} 1s ease infinite;
    box-shadow: 0 0 24px rgba(245,158,11,0.6);
  `}

  @media (max-width: 500px) { width: 56px; height: 56px; font-size: 1.4rem; }
`;
const IslandLabel = styled.span`
  font-size: 0.55rem; font-weight: 700; color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5); margin-top: 2px;
`;
const Ship = styled.div`
  font-size: 2.2rem; animation: ${shipSail} 2s ease infinite;
  position: absolute; z-index: 2;
`;
const CoinFloat = styled.div`
  position: absolute; top: -20px; left: 50%; transform: translateX(-50%);
  font-size: 1.5rem; animation: ${coinBounce} 1s ease forwards; pointer-events: none;
`;

/* Question */
const QCard = styled.div`
  background: var(--card-bg, #fff); border-radius: 20px; padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08); text-align: center;
  border: 1px solid var(--border-color, #e5e7eb); animation: ${slideUp} 0.3s ease;
  position: relative;
  ${p => p.$shake && css`animation: ${shake} 0.5s ease;`}
`;
const DiggingAnim = styled.div`
  font-size: 3rem; margin-bottom: 1rem;
  animation: ${dig} 0.8s ease;
`;
const QType = styled.div`
  display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem;
  font-weight: 700; margin-bottom: 0.5rem;
  background: ${p => p.$type === 'type' ? '#ede9fe' : '#dbeafe'};
  color: ${p => p.$type === 'type' ? '#7c3aed' : '#2563eb'};
`;
const QTerm = styled.div`
  font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin: 0.5rem 0 1.5rem;
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
  &:hover:not(:disabled) { border-color: #f59e0b; transform: translateY(-2px); }
  &:disabled { cursor: default; }
`;
const TypeInput = styled.input`
  width: 100%; padding: 14px 18px; border-radius: 14px; font-size: 1.1rem;
  border: 2px solid ${p => p.$s === 'correct' ? '#22c55e' : p.$s === 'wrong' ? '#ef4444' : '#e5e7eb'};
  background: ${p => p.$s === 'correct' ? '#f0fdf4' : p.$s === 'wrong' ? '#fef2f2' : 'var(--bg-secondary, #fff)'};
  color: var(--text-primary); outline: none; box-sizing: border-box;
  &:focus { border-color: #f59e0b; }
  ${p => p.$s === 'wrong' && css`animation: ${shake} 0.4s ease;`}
`;
const TypeSubmit = styled.button`
  margin-top: 10px; padding: 12px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white; font-weight: 700; cursor: pointer; width: 100%;
  &:disabled { opacity: 0.5; cursor: default; }
`;
const TypeHint = styled.div`
  font-size: 0.8rem; color: var(--text-secondary); margin: 8px 0;
  span { color: #b45309; font-weight: 600; }
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

const TOTAL_ISLANDS = 8;
const islandEmojis = ['🏝️', '🌴', '⛰️', '🏜️', '🌋', '🗿', '🏰', '💎'];
const islandNames = ['Пальма', 'Лагуна', 'Скала', 'Пустыня', 'Вулкан', 'Руины', 'Замок', 'Сокровище'];

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

export default function TreasureIsland() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);

  const [gameStarted, setGameStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [islands, setIslands] = useState([]); // 'locked'|'current'|'completed'|'failed'
  const [currentIsland, setCurrentIsland] = useState(0);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [digging, setDigging] = useState(false);
  const [questionCard, setQuestionCard] = useState(null);
  const [questionType, setQuestionType] = useState('mcq'); // 'mcq' or 'type'
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [typeAnswer, setTypeAnswer] = useState('');
  const [showCoin, setShowCoin] = useState(false);
  const [qIdx, setQIdx] = useState(0);

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

  const genOptions = (card) => {
    const wrong = flashcards.filter(c => c.definition !== card.definition)
      .sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.definition);
    return [card.definition, ...wrong].sort(() => Math.random() - 0.5);
  };

  const startGame = () => {
    setIslands(Array(TOTAL_ISLANDS).fill('locked').map((_, i) => i === 0 ? 'current' : 'locked'));
    setCurrentIsland(0); setLives(3); setCoins(0); setQIdx(0);
    setShowQuestion(false); setDigging(false); setFinished(false); setGameResult(null);
    setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
  };

  const openQuestion = () => {
    setDigging(true);
    setTimeout(() => {
      setDigging(false);
      const card = flashcards[qIdx % flashcards.length];
      setQuestionCard(card);
      // Alternate between MCQ and typing
      const type = currentIsland % 2 === 0 ? 'mcq' : 'type';
      setQuestionType(type);
      if (type === 'mcq') setOptions(genOptions(card));
      setSelected(null); setResult(null); setTypeAnswer('');
      setShowQuestion(true);
      if (type === 'type') setTimeout(() => inputRef.current?.focus(), 200);
    }, 800);
  };

  const handleCorrect = () => {
    setResult('correct');
    const coinReward = 10 + currentIsland * 5;
    setCoins(c => c + coinReward);
    setShowCoin(true);
    setTimeout(() => setShowCoin(false), 1000);
    setQIdx(q => q + 1);

    setTimeout(() => {
      const newIslands = [...islands];
      newIslands[currentIsland] = 'completed';

      if (currentIsland + 1 >= TOTAL_ISLANDS) {
        setIslands(newIslands);
        setGameResult('won');
        setFinished(true);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
        trackGameWin();
      } else {
        newIslands[currentIsland + 1] = 'current';
        setIslands(newIslands);
        setCurrentIsland(c => c + 1);
      }
      setShowQuestion(false);
    }, 1200);
  };

  const handleWrong = () => {
    setResult('wrong');
    setQIdx(q => q + 1);
    const newLives = lives - 1;
    setLives(newLives);

    setTimeout(() => {
      if (newLives <= 0) {
        const newIslands = [...islands];
        newIslands[currentIsland] = 'failed';
        setIslands(newIslands);
        setGameResult('lost');
        setFinished(true);
      }
      setShowQuestion(false);
    }, 2000);
  };

  const handleMCQAnswer = (idx) => {
    if (result) return;
    setSelected(idx);
    if (options[idx] === questionCard.definition) handleCorrect();
    else handleWrong();
  };

  const handleTypeSubmit = (e) => {
    e?.preventDefault();
    if (result || !typeAnswer.trim()) return;
    const sim = similarity(typeAnswer, questionCard.definition);
    if (sim >= 0.75) handleCorrect();
    else handleWrong();
  };

  const recordStats = useCallback(async () => {
    if (statsRecorded.current) return;
    statsRecorded.current = true;
    try {
      const t = Math.round((Date.now() - sessionStart.current) / 1000);
      const c = islands.filter(s => s === 'completed').length;
      await authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'treasure-island', cardsCount: TOTAL_ISLANDS, correctCount: c, timeSpent: t })
      });
    } catch {}
  }, [islands]);

  useEffect(() => { if (finished) recordStats(); }, [finished, recordStats]);

  if (!setId) return <SetSelector title="🏝️ Остров сокровищ" subtitle="Доберитесь до сокровища!" onSelectSet={s => navigate(`/games/treasure-island?setId=${s._id || s.id}`)} gameMode />;
  if (loading) return <Container><LoadW>⏳ Загрузка...</LoadW></Container>;
  if (error) return <Container><ErrW><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/treasure-island')}>Другой набор</Btn></ErrW></Container>;

  if (finished) {
    const completed = islands.filter(s => s === 'completed').length;
    const isWin = gameResult === 'won';
    return (
      <Container>
        <Card>
          <Title>{isWin ? '🏆 Сокровище найдено!' : '💀 Приключение окончено'}</Title>
          <Sub>{isWin ? 'Вы прошли все острова!' : 'Вы потеряли все жизни'}</Sub>
          <StatsGrid>
            <StatBox $c="#f59e0b"><div className="val">{coins}</div><div className="lbl">🪙 Монет</div></StatBox>
            <StatBox $c="#22c55e"><div className="val">{completed}/{TOTAL_ISLANDS}</div><div className="lbl">🏝️ Островов</div></StatBox>
            <StatBox $c="#ef4444"><div className="val">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</div><div className="lbl">Жизни</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/treasure-island')}>Другой набор</Btn>
            <Btn $v="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Title>🏝️ Остров сокровищ</Title>
        <Sub>Проплывите через острова к сокровищу!</Sub>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '1rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: '4px 0 0', color: '#a16207', fontSize: '0.9rem' }}>{flashcards.length} карточек</p>
          </div>
        )}
        <Card>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗺️</div>
          <h2>Правила</h2>
          <RulesBox>
            <div>🏝️ Пройдите <strong>{TOTAL_ISLANDS} островов</strong> на пути к сокровищу</div>
            <div>⛏️ Нажмите «Копать» чтобы найти вопрос</div>
            <div>📝 Вопросы чередуются: выбор ответа и ввод текста</div>
            <div>✅ Правильно = монеты + следующий остров</div>
            <div>❌ Ошибка = потеря жизни</div>
            <div>❤️ У вас <strong>3 жизни</strong> — берегите!</div>
          </RulesBox>
          <BtnRow>
            <Btn onClick={startGame}>⚓ Отплыть!</Btn>
            <Btn $v="secondary" onClick={() => navigate('/games/treasure-island')}>Другой набор</Btn>
          </BtnRow>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏝️ Остров сокровищ</Title>

      <TopBar>
        <Stat $c="#ef4444"><div className="val">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</div><div className="lbl">Жизни</div></Stat>
        <Stat $c="#f59e0b"><div className="val">🪙 {coins}</div><div className="lbl">Монеты</div></Stat>
        <Stat><div className="val">{currentIsland + 1}/{TOTAL_ISLANDS}</div><div className="lbl">Остров</div></Stat>
      </TopBar>

      <MapArea>
        <WaveBg />
        <IslandRow>
          {islands.map((state, i) => (
            <Island key={i} $state={i < TOTAL_ISLANDS - 1 ? state : (state === 'current' ? 'treasure' : state)}>
              {state === 'completed' ? '✅' : state === 'failed' ? '❌' : islandEmojis[i]}
              <IslandLabel>{islandNames[i]}</IslandLabel>
              {state === 'current' && showCoin && <CoinFloat>🪙</CoinFloat>}
            </Island>
          ))}
        </IslandRow>
      </MapArea>

      {!showQuestion && !digging && (
        <div style={{ textAlign: 'center' }}>
          <Btn onClick={openQuestion}>
            ⛏️ Копать на острове «{islandNames[currentIsland]}»
          </Btn>
        </div>
      )}

      {digging && (
        <QCard>
          <DiggingAnim>⛏️</DiggingAnim>
          <p style={{ color: 'var(--text-secondary)' }}>Копаем на острове...</p>
        </QCard>
      )}

      {showQuestion && questionCard && (
        <QCard $shake={result === 'wrong'}>
          <QType $type={questionType}>
            {questionType === 'mcq' ? '📝 Выберите ответ' : '⌨️ Впишите ответ'}
          </QType>
          <QTerm>{questionCard.term}</QTerm>

          {questionType === 'mcq' ? (
            <OptionsGrid>
              {options.map((opt, idx) => {
                const isCorrectOpt = opt === questionCard.definition;
                return (
                  <OptionBtn
                    key={idx}
                    $correct={result && isCorrectOpt}
                    $wrong={result === 'wrong' && selected === idx}
                    disabled={result !== null}
                    onClick={() => handleMCQAnswer(idx)}
                  >
                    {opt}
                  </OptionBtn>
                );
              })}
            </OptionsGrid>
          ) : (
            <form onSubmit={handleTypeSubmit}>
              <TypeHint>💡 <span>{questionCard.definition.charAt(0)}{'·'.repeat(questionCard.definition.length - 1)} ({questionCard.definition.length})</span></TypeHint>
              <TypeInput
                ref={inputRef}
                value={typeAnswer}
                onChange={e => setTypeAnswer(e.target.value)}
                placeholder="Введите определение..."
                $s={result}
                disabled={!!result}
                autoComplete="off"
              />
              <TypeSubmit type="submit" disabled={!!result || !typeAnswer.trim()}>
                Ответить
              </TypeSubmit>
            </form>
          )}

          {result === 'correct' && <Feedback $ok>✅ Верно! +{10 + currentIsland * 5} монет!</Feedback>}
          {result === 'wrong' && (
            <Feedback>
              ❌ Неверно! Правильно: <strong>{questionCard.definition}</strong>
            </Feedback>
          )}
        </QCard>
      )}
    </Container>
  );
}
