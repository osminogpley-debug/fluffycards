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

const chugChug = keyframes`
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(-2px); }
`;

const wheelSpin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const smokeRise = keyframes`
  0%   { opacity: 0.7; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(2); }
`;

const wagonAttach = keyframes`
  0%   { transform: translateX(30px) scale(0.8); opacity: 0; }
  60%  { transform: translateX(-3px) scale(1.02); }
  100% { transform: translateX(0) scale(1); opacity: 1; }
`;

const wagonDetach = keyframes`
  0%   { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(50px) translateY(10px); opacity: 0; }
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

  @media (max-width: 600px) {
    padding: 0.75rem;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: #b45309;
  font-size: 2.4rem;
  margin-bottom: 0.25rem;

  @media (max-width: 600px) {
    font-size: 2rem;
  }
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
  .val { font-size: 1.3rem; font-weight: 700; color: ${p => p.$color || '#b45309'}; }
  .lbl { font-size: 0.7rem; color: var(--text-secondary); }
`;

/* ── train area ── */
const TrainWrapper = styled.div`
  background: linear-gradient(180deg, #87CEEB 0%, #87CEEB 60%, #8B4513 60%, #228B22 65%, #228B22 100%);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
  min-height: 220px;
  position:relative;
  overflow: hidden;

  @media (max-width: 600px) {
    padding: 1.25rem 1rem;
    min-height: 180px;
  }
`;

const TrackLine = styled.div`
  position: absolute;
  bottom: 48px;
  left: 0; right: 0;
  height: 6px;
  background: repeating-linear-gradient(90deg, #654321 0px, #654321 20px, transparent 20px, transparent 30px);
`;

const RailLine = styled.div`
  position: absolute;
  bottom: 42px;
  left: 0; right: 0;
  height: 3px;
  background: #888;
`;

const TrainScroller = styled.div`
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
  padding-bottom: 56px;
  gap: 0;
  min-height: 140px;
  scroll-behavior: smooth;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }

  @media (max-width: 600px) {
    padding-bottom: 44px;
    min-height: 120px;
  }
`;

const Locomotive = styled.div`
  flex-shrink: 0;
  width: 100px;
  height: 90px;
  background: linear-gradient(135deg, #1e3a5f, #0f2744);
  border-radius: 10px 20px 4px 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.5rem;
  animation: ${chugChug} 0.4s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);

  &::before {
    content: '';
    position: absolute;
    bottom: -10px; left: 10%; right: 10%;
    height: 12px;
    background: #333;
    border-radius: 6px;
  }

  @media (max-width: 600px) {
    width: 84px;
    height: 76px;
    font-size: 2rem;
  }
`;

const Chimney = styled.div`
  position: absolute; top: -20px; left: 18px;
  width: 18px; height: 22px;
  background: #333;
  border-radius: 3px 3px 0 0;
`;

const SmokeParticle = styled.div`
  position: absolute;
  top: -42px;
  left: ${p => 14 + (p.$i % 3) * 8}px;
  width: 12px; height: 12px;
  background: rgba(200, 200, 200, 0.7);
  border-radius: 50%;
  animation: ${smokeRise} ${p => 1 + p.$i * 0.3}s ease-out infinite;
  animation-delay: ${p => p.$i * 0.35}s;
`;

const Wagon = styled.div`
  flex-shrink: 0;
  width: 72px;
  height: 52px;
  border-radius: 8px;
  position: relative;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size: 1.6rem;
  margin-left: 4px;
  animation: ${p => p.$detaching ? css`${wagonDetach} 0.5s ease forwards` : css`${wagonAttach} 0.4s ease`};
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);

  background: ${p => {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#e84393', '#00b894', '#6c5ce7', '#fd79a8', '#74b9ff'];
    return colors[p.$index % colors.length];
  }};

  &::before {
    content: '';
    position: absolute;
    bottom: -8px; left: 8%; right: 8%;
    height: 10px;
    background: #555;
    border-radius: 5px;
  }

  @media (max-width: 600px) {
    width: 60px;
    height: 46px;
    font-size: 1.4rem;
  }
`;

const WagonNumber = styled.div`
  position: absolute;
  top: 2px; right: 4px;
  font-size: 0.55rem;
  color: rgba(255,255,255,0.7);
  font-weight: 700;
`;

/* ── question ── */
const QuestionArea = styled.div`
  background: var(--card-bg, white);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0,0,0,0.08));
  border: 1px solid var(--border-color, transparent);
  animation: ${slideUp} 0.3s ease;
  margin-bottom: 1.5rem;

  @media (max-width: 600px) {
    padding: 1.4rem 1.2rem;
  }
`;

const RoundLabel = styled.div`
  text-align: center; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;
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
  &:hover:not(:disabled) { transform: translateY(-2px); border-color: #b45309; }
`;

/* ── result ── */
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
  .val { font-size: 2rem; font-weight: 700; color: ${p => p.$color || '#b45309'}; }
  .lbl { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; }
`;

const BtnRow = styled.div`display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;`;
const Btn = styled.button`
  padding: 0.9rem 2rem; border-radius: 50px; font-size: 1rem; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.3s ease; font-family: inherit; color: white;
  background: ${p => p.$variant === 'secondary' ? 'linear-gradient(135deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #f59e0b, #b45309)'};
  box-shadow: 0 4px 15px ${p => p.$variant === 'secondary' ? 'rgba(107,114,128,0.4)' : 'rgba(180,83,9,0.4)'};
  &:hover { transform: translateY(-3px); }
`;

const LoadingWrap = styled.div`
  display: flex; justify-content: center; padding: 80px;
  .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3;
    border-top: 4px solid #b45309; border-radius: 50%;
    animation: ${wheelSpin} 1s linear infinite; }
`;
const ErrorWrap = styled.div`
  text-align: center; padding: 3rem; background: var(--card-bg, #fee2e2);
  border-radius: 24px; color: var(--text-primary, #991b1b); margin: 2rem 0;
  border: 1px solid var(--border-color, #fca5a5);
`;

/* ───────── helpers ───────── */
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

const MAX_WAGONS = 10;
const TOTAL_ROUNDS = 15;

/* ═══════════════════════════════════════ */
function WordTrain() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setId = searchParams.get('setId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSet, setCurrentSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);

  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [wagons, setWagons] = useState([]);
  const [maxWagonsReached, setMaxWagonsReached] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [detachingWagon, setDetachingWagon] = useState(false);

  const [questionCard, setQuestionCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const sessionStart = useRef(Date.now());
  const statsRecorded = useRef(false);
  const scrollRef = useRef(null);

  useEffect(() => { if (setId) fetchSet(setId); }, [setId]);

  const fetchSet = async (id) => {
    try { setLoading(true); setError(null);
      const res = await authFetch(`${API_ROUTES.DATA.SETS}/${id}`);
      if (!res.ok) throw new Error('Не удалось загрузить набор');
      const data = await res.json(); setCurrentSet(data);
      if (data.flashcards?.length >= 4) setFlashcards(data.flashcards);
      else setError('Нужно минимум 4 карточки');
    } catch(e){ setError(e.message); } finally { setLoading(false); }
  };

  const prepareQuestion = useCallback((deck, rnd) => {
    const card = deck[rnd % deck.length];
    setQuestionCard(card);
    setOptions(generateOptions(card, deck));
    setSelectedIdx(null);
    setAnswerResult(null);
  }, []);

  const startGame = useCallback(() => {
    const deck = shuffleArray(flashcards);
    setWagons([]); setScore(0); setCorrect(0); setRound(0);
    setMaxWagonsReached(0); setDetachingWagon(false);
    setIsFinished(false); setGameStarted(true);
    sessionStart.current = Date.now();
    statsRecorded.current = false;
    prepareQuestion(deck, 0);
  }, [flashcards, prepareQuestion]);

  const wagonEmojis = ['📦', '🎁', '🧳', '📫', '🛢️', '🪵', '💎', '🏗️', '🎪', '🏠'];

  // scroll train to the right when wagons are added
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
  }, [wagons]);

  const handleOption = (idx) => {
    if (answerResult !== null) return;
    setSelectedIdx(idx);
    const isCorrect = options[idx] === questionCard.definition;
    const nextRound = round + 1;

    if (isCorrect) {
      setAnswerResult('correct');
      setCorrect(prev => prev + 1);
      const added = wagons.length < MAX_WAGONS;
      const bonus = (wagons.length + 1) * 10;
      setScore(prev => prev + bonus);

      setTimeout(() => {
        if (added) {
          const newWagons = [...wagons, { id: Date.now(), emoji: wagonEmojis[wagons.length % wagonEmojis.length] }];
          setWagons(newWagons);
          setMaxWagonsReached(prev => Math.max(prev, newWagons.length));

          // check win
          if (newWagons.length >= MAX_WAGONS) {
            setIsFinished(true); setGameStarted(false);
            trackGameWin();
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.5 } });
            return;
          }
        }

        if (nextRound >= TOTAL_ROUNDS) {
          setIsFinished(true); setGameStarted(false);
          if (wagons.length + (added ? 1 : 0) >= MAX_WAGONS) {
            trackGameWin();
            confetti({ particleCount: 130, spread: 80, origin: { y: 0.5 } });
          }
          return;
        }

        setRound(nextRound);
        prepareQuestion(shuffleArray(flashcards), nextRound);
      }, 900);
    } else {
      setAnswerResult('wrong');
      setTimeout(() => {
        if (wagons.length > 0) {
          setDetachingWagon(true);
          setTimeout(() => {
            setWagons(prev => prev.slice(0, -1));
            setDetachingWagon(false);
          }, 500);
        }

        if (nextRound >= TOTAL_ROUNDS) {
          setIsFinished(true); setGameStarted(false);
          return;
        }

        setRound(nextRound);
        prepareQuestion(shuffleArray(flashcards), nextRound);
      }, 1000);
    }
  };

  useEffect(() => {
    if (isFinished && !statsRecorded.current) {
      statsRecorded.current = true;
      const timeSpent = Math.round((Date.now() - sessionStart.current) / 1000);
      authFetch(API_ROUTES.DATA.STATS_SESSION, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'train', cardsCount: round + 1, correctCount: correct, timeSpent })
      }).catch(e => console.error('Stats:', e));
    }
  }, [isFinished, correct, round]);

  const handleSelectSet = (set) => navigate(`/games/train?setId=${set._id || set.id}`);

  if (!setId) return <SetSelector title="🚂 Поезд слов" subtitle="Выберите набор карточек" onSelectSet={handleSelectSet} gameMode />;
  if (loading) return <Container><LoadingWrap><div className="spinner" /></LoadingWrap></Container>;
  if (error) return <Container><ErrorWrap><h3>😕 Ошибка</h3><p>{error}</p><Btn onClick={() => navigate('/games/train')} style={{ marginTop: '1rem' }}>Другой набор</Btn></ErrorWrap></Container>;

  if (isFinished) {
    const won = wagons.length >= MAX_WAGONS;
    const pct = Math.round((correct / (round + 1)) * 100);
    return (
      <Container>
        <ResultCard>
          <ResultTitle>{won ? '🏆 Поезд укомплектован!' : '🚂 Поездка окончена!'}</ResultTitle>
          <ResultText>{won ? `Великолепно! Все ${MAX_WAGONS} вагонов прицеплены!` : `Вам удалось прицепить ${maxWagonsReached} из ${MAX_WAGONS} вагонов`}</ResultText>
          <StatsGrid>
            <StatBox $color="#b45309"><div className="val">{score}</div><div className="lbl">🏅 Очков</div></StatBox>
            <StatBox $color="#22c55e"><div className="val">{correct}/{round + 1}</div><div className="lbl">✅ Верных</div></StatBox>
            <StatBox $color="#2563eb"><div className="val">{pct}%</div><div className="lbl">📊 Точность</div></StatBox>
            <StatBox $color="#059669"><div className="val">{maxWagonsReached}/{MAX_WAGONS}</div><div className="lbl">🚃 Вагонов</div></StatBox>
          </StatsGrid>
          <BtnRow>
            <Btn onClick={startGame}>Играть снова 🔄</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/train')}>Другой набор</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/dashboard')}>⬅️ Назад</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  if (!gameStarted) {
    return (
      <Container>
        <Header><Title>🚂 Поезд слов</Title><Subtitle>Собери самый длинный поезд!</Subtitle></Header>
        {currentSet && (
          <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '1rem 1.5rem', borderRadius: 12, textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--border-color, transparent)' }}>
            <h3 style={{ margin: '0 0 0.25rem', color: '#92400e' }}>📚 {currentSet.title}</h3>
            <p style={{ margin: 0, color: '#b45309', fontSize: '0.9rem' }}>{currentSet.flashcards?.length || 0} карточек</p>
          </div>
        )}
        <ResultCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚂</div>
          <ResultTitle style={{ fontSize: '2rem' }}>Правила</ResultTitle>
          <div style={{ textAlign: 'left', maxWidth: 420, margin: '1.5rem auto', lineHeight: 1.9, color: 'var(--text-primary)' }}>
            <div>🚃 Собери поезд из {MAX_WAGONS} вагонов</div>
            <div>❓ Каждый правильный ответ = +1 вагон</div>
            <div>❌ Неправильный = отцепляется последний вагон</div>
            <div>🔄 У вас {TOTAL_ROUNDS} раундов на сборку</div>
            <div>🏆 Соберите все {MAX_WAGONS} вагонов чтобы победить!</div>
            <div>💰 Чем больше вагонов — тем больше очков</div>
          </div>
          <BtnRow>
            <Btn onClick={startGame}>🚀 В путь!</Btn>
            <Btn $variant="secondary" onClick={() => navigate('/games/train')}>Другой набор</Btn>
          </BtnRow>
        </ResultCard>
      </Container>
    );
  }

  return (
    <Container>
      <Header><Title>🚂 Поезд слов</Title></Header>

      <TopBar>
        <Stat $color="#b45309"><div className="val">{score}</div><div className="lbl">Очки</div></Stat>
        <Stat $color="#22c55e"><div className="val">{wagons.length}/{MAX_WAGONS}</div><div className="lbl">Вагонов</div></Stat>
        <Stat $color="#2563eb"><div className="val">{round + 1}/{TOTAL_ROUNDS}</div><div className="lbl">Раунд</div></Stat>
        <Stat $color="#7c3aed"><div className="val">{correct}</div><div className="lbl">Верных</div></Stat>
      </TopBar>

      <TrainWrapper>
        <TrackLine />
        <RailLine />
        <TrainScroller ref={scrollRef}>
          <Locomotive>
            <Chimney>
              {[0, 1, 2].map(i => <SmokeParticle key={i} $i={i} />)}
            </Chimney>
            🚂
          </Locomotive>
          {wagons.map((w, i) => (
            <Wagon key={w.id} $index={i} $detaching={detachingWagon && i === wagons.length - 1}>
              {w.emoji}
              <WagonNumber>#{i + 1}</WagonNumber>
            </Wagon>
          ))}
        </TrainScroller>
      </TrainWrapper>

      {questionCard && (
        <QuestionArea>
          <RoundLabel>Раунд {round + 1} из {TOTAL_ROUNDS} • {answerResult === 'correct' ? '✅ Вагон прицеплен!' : answerResult === 'wrong' ? '❌ Вагон отцеплен!' : 'Ответьте правильно — прицепите вагон!'}</RoundLabel>
          <QuestionText>{questionCard.term}</QuestionText>
          <OptionsGrid>
            {options.map((opt, idx) => (
              <OptionBtn key={idx} disabled={answerResult !== null}
                $correct={answerResult !== null && opt === questionCard.definition}
                $wrong={answerResult === 'wrong' && selectedIdx === idx}
                onClick={() => handleOption(idx)}>{opt}</OptionBtn>
            ))}
          </OptionsGrid>
        </QuestionArea>
      )}
    </Container>
  );
}

export default WordTrain;
