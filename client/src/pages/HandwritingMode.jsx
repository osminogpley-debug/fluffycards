import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { API_ROUTES, authFetch } from '../constants/api';
import SetSelector from '../components/SetSelector';
import { useTheme } from '../contexts/ThemeContext';
import { loadHanziWriter } from '../utils/hanziWriterLoader';

const Container = styled.div`
  max-width: 820px;
  margin: 2rem auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 1.2rem;
`;

const Title = styled.h1`
  color: #e53e3e;
  font-size: 2rem;
  margin-bottom: 0.4rem;
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
  margin-bottom: 1.1rem;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #e53e3e, #fc8181);
  border-radius: 4px;
  transition: width 0.35s ease;
  width: ${props => props.$pct}%;
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 1rem;
`;

const Stat = styled.div`
  text-align: center;
  padding: 0.8rem;
  border-radius: 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);

  span { display: block; font-size: 1.4rem; font-weight: 800; color: var(--text-primary); }
  small { color: var(--text-secondary); font-size: 0.82rem; }
`;

const Card = styled.div`
  background: var(--bg-secondary, white);
  border-radius: 20px;
  padding: 1.2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: 2px solid var(--border-color, #e2e8f0);
`;

const TargetSection = styled.div`
  text-align: center;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(66, 153, 225, 0.12);
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Pinyin = styled.div`
  font-size: 1rem;
  color: #2b6cb0;
  margin-top: 8px;
  font-weight: 700;
`;

const Definition = styled.div`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 6px;
`;

const Helper = styled.div`
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 0.85rem;
`;

const ScoreLabel = styled.div`
  text-align: center;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 1rem 0 0.8rem;
  color: ${props => props.$color || 'var(--text-primary)'};
`;

const CanvasWrapper = styled.div`
  position: relative;
  width: min(86vw, 320px);
  height: min(86vw, 320px);
  margin: 12px auto 0.8rem;
  border-radius: 16px;
  border: 3px solid ${props => props.$state === 'correct' ? '#48bb78' : props.$state === 'wrong' ? '#fc8181' : 'var(--border-color, #cbd5e0)'};
  background: var(--bg-secondary, white);
  overflow: hidden;
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;

  &::before, &::after {
    content: '';
    position: absolute;
    background: rgba(148, 163, 184, 0.26);
  }
  &::before {
    top: 50%;
    left: 7%;
    right: 7%;
    height: 1px;
  }
  &::after {
    left: 50%;
    top: 7%;
    bottom: 7%;
    width: 1px;
  }
`;

const GhostChar = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: min(48vw, 220px);
  line-height: 1;
  color: var(--text-muted);
  user-select: none;
  pointer-events: none;
`;

const WriterMount = styled.div`
  position: absolute;
  inset: 0;
`;

const StatusLine = styled.div`
  text-align: center;
  color: var(--text-muted);
  font-size: 0.84rem;
  margin-top: 4px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 0.8rem;
`;

const HintToggle = styled.button`
  background: none;
  border: 1px solid var(--border-color, #cbd5e0);
  border-radius: 12px;
  padding: 0.5rem 1rem;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.88rem;
`;

const ResultsCard = styled.div`
  background: var(--bg-secondary, white);
  border-radius: 20px;
  padding: 2rem 1.4rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  text-align: center;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.4rem;
`;

const ResultItem = styled.div`
  background: var(--bg-tertiary, #f7fafc);
  border-radius: 14px;
  padding: 1rem;
  span { display: block; font-size: 1.5rem; font-weight: 800; color: ${props => props.$color || 'var(--text-primary)'}; }
  small { color: var(--text-secondary); font-size: 0.8rem; }
`;

const CharReview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1.2rem;
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

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const isChinese = (text) => /[\u3400-\u9fff]/.test(text || '');
const extractChars = (term) => [...String(term || '')].filter(ch => /[\u3400-\u9fff]/.test(ch));

function buildQueue(flashcards = []) {
  const queue = [];
  flashcards.forEach((card) => {
    if (!isChinese(card?.term) && !card?.pinyin && !card?.isChinese) return;
    extractChars(card?.term).forEach((char) => {
      queue.push({
        char,
        pinyin: card?.pinyin || '',
        definition: card?.definition || card?.translation || '',
        term: card?.term || '',
      });
    });
  });
  return queue;
}

function scoreFromMistakes(mistakes) {
  return Math.max(40, Math.min(100, 100 - mistakes * 12));
}

function HandwritingMode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const setId = searchParams.get('setId');

  const [set, setSet] = useState(null);
  const [queue, setQueue] = useState([]);
  const [phase, setPhase] = useState('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [lastScore, setLastScore] = useState(null);
  const [lastMistakes, setLastMistakes] = useState(0);
  const [lastStroke, setLastStroke] = useState(0);
  const [statusLine, setStatusLine] = useState('Ведите пальцем по штрихам');
  const [showGhost, setShowGhost] = useState(true);
  const [ghostOpacity, setGhostOpacity] = useState(0.16);

  const writerHostRef = useRef(null);
  const writerRef = useRef(null);

  const current = queue[currentIndex] || null;
  const drawColor = ['dark', 'cosmic', 'forest', 'neon'].includes(theme) ? '#f8fafc' : '#111827';

  const teardownWriter = useCallback(() => {
    if (writerRef.current?.cancelQuiz) {
      try { writerRef.current.cancelQuiz(); } catch {}
    }
    writerRef.current = null;
    if (writerHostRef.current) writerHostRef.current.innerHTML = '';
  }, []);

  const startQuiz = useCallback((writer, item) => {
    if (!writer || !item) return;
    setLastMistakes(0);
    setLastStroke(0);
    setStatusLine('Ведите пальцем по штрихам');

    writer.quiz({
      leniency: 1.45,
      onMistake: (strokeData) => {
        const mistakes = Number(strokeData?.totalMistakes || 0);
        setLastMistakes(mistakes);
        setStatusLine('Есть неточность, попробуйте штрих снова');
      },
      onCorrectStroke: (strokeData) => {
        const stroke = Number(strokeData?.strokeNum || 0) + 1;
        setLastStroke(stroke);
        setStatusLine(`Штрих ${stroke} принят`);
      },
      onComplete: (summaryData) => {
        const mistakes = Number(summaryData?.totalMistakes || 0);
        const score = scoreFromMistakes(mistakes);
        setLastMistakes(mistakes);
        setLastScore(score);
        setResults(prev => [...prev, { char: item.char, score, mistakes, correct: score >= 40 }]);
        setPhase('graded');
      },
    });
  }, []);

  const initWriter = useCallback(async (item) => {
    if (!writerHostRef.current || !item) return;
    teardownWriter();

    const HanziWriter = await loadHanziWriter();
    if (!writerHostRef.current || !HanziWriter) return;

    const writer = HanziWriter.create(writerHostRef.current, item.char, {
      width: 320,
      height: 320,
      padding: 10,
      showOutline: true,
      showCharacter: false,
      strokeColor: drawColor,
      drawingColor: drawColor,
      radicalColor: '#4299e1',
      outlineColor: 'rgba(148,163,184,0.3)',
    });

    writerRef.current = writer;
    startQuiz(writer, item);
  }, [drawColor, startQuiz, teardownWriter]);

  const clearCanvas = useCallback(() => {
    const writer = writerRef.current;
    if (!writer || !current) return;
    writer.cancelQuiz();
    writer.hideCharacter();
    setStatusLine('Поле очищено. Пишите снова по штрихам.');
    startQuiz(writer, current);
  }, [current, startQuiz]);

  useEffect(() => {
    if (!setId) { setPhase('select'); return; }
    (async () => {
      try {
        const res = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}`);
        if (!res.ok) throw new Error('Набор не найден');
        const data = await res.json();
        const s = data.data || data;
        setSet(s);
        const allCards = s.flashcards || s.cards || [];
        setQueue(buildQueue(allCards));
        setPhase('practice');
      } catch {
        setPhase('select');
      }
    })();
  }, [setId]);

  useEffect(() => {
    if (phase !== 'practice' || !current) return;
    let cancelled = false;
    (async () => {
      try {
        await initWriter(current);
      } catch {
        if (!cancelled) setStatusLine('Не удалось загрузить тренажер иероглифов');
      }
    })();
    return () => {
      cancelled = true;
      teardownWriter();
    };
  }, [current, currentIndex, initWriter, phase, teardownWriter]);

  useEffect(() => () => teardownWriter(), [teardownWriter]);

  const progress = useMemo(() => {
    if (!queue.length) return 0;
    return ((currentIndex + (phase === 'graded' ? 1 : 0)) / queue.length) * 100;
  }, [currentIndex, phase, queue.length]);

  const handleRetry = () => {
    setResults(prev => prev.slice(0, -1));
    setLastScore(null);
    setLastMistakes(0);
    setLastStroke(0);
    setPhase('practice');
  };

  const handleNext = () => {
    setLastScore(null);
    setLastMistakes(0);
    setLastStroke(0);
    if (currentIndex + 1 >= queue.length) setPhase('finished');
    else {
      setCurrentIndex(prev => prev + 1);
      setPhase('practice');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setResults([]);
    setLastScore(null);
    setLastMistakes(0);
    setLastStroke(0);
    setPhase('practice');
  };

  if (phase === 'select') {
    return (
      <Container>
        <Header>
          <Title>汉字 Тренажер иероглифов</Title>
          <Subtitle>Выберите набор с китайскими карточками</Subtitle>
        </Header>
        <SetSelector onSelect={(selectedSetId) => navigate(`/learn/handwriting?setId=${selectedSetId}`)} />
      </Container>
    );
  }

  if (phase === 'loading') {
    return (
      <Container>
        <Header>
          <Title>汉字 Тренажер иероглифов</Title>
          <Subtitle>Загрузка...</Subtitle>
        </Header>
      </Container>
    );
  }

  if (phase === 'practice' && queue.length === 0) {
    return (
      <Container>
        <Header>
          <Title>汉字 Тренажер иероглифов</Title>
          <Subtitle>В этом наборе нет китайских иероглифов</Subtitle>
        </Header>
      </Container>
    );
  }

  if (phase === 'finished') {
    const totalChars = results.length;
    const correctCount = results.filter(r => r.correct).length;
    const avgScore = totalChars > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / totalChars) : 0;
    const pct = totalChars > 0 ? Math.round((correctCount / totalChars) * 100) : 0;

    return (
      <Container>
        <Header><Title>汉字 Результаты</Title></Header>
        <ResultsCard>
          <h2>{pct >= 80 ? '🎉 Отлично!' : pct >= 50 ? '👍 Хорошо!' : '💪 Нужно практиковаться'}</h2>
          <p>Вы написали {totalChars} иероглиф{totalChars === 1 ? '' : totalChars < 5 ? 'а' : 'ов'}</p>
          <ResultsGrid>
            <ResultItem $color="#48bb78"><span>{correctCount}</span><small>Правильно</small></ResultItem>
            <ResultItem $color="#e53e3e"><span>{totalChars - correctCount}</span><small>Ошибки</small></ResultItem>
            <ResultItem $color="#4299e1"><span>{avgScore}%</span><small>Средняя точность</small></ResultItem>
          </ResultsGrid>
          <CharReview>
            {results.map((r, i) => (
              <ReviewChip key={i} $correct={r.correct} title={`${r.char}: ${r.score}%`}>{r.char}</ReviewChip>
            ))}
          </CharReview>
          <Actions>
            <SecondaryButton onClick={() => navigate(-1)}>← Назад</SecondaryButton>
            <PrimaryButton onClick={handleRestart}>🔄 Еще раз</PrimaryButton>
          </Actions>
        </ResultsCard>
      </Container>
    );
  }

  const gradeState = phase === 'graded' ? (lastScore >= 40 ? 'correct' : 'wrong') : null;

  return (
    <Container>
      <Header>
        <Title>汉字 Тренажер иероглифов</Title>
        <Subtitle>{set?.title || 'Практика написания'}</Subtitle>
      </Header>

      <ProgressBar><ProgressFill $pct={progress} /></ProgressBar>

      <Stats>
        <Stat><span>{currentIndex + 1}/{queue.length}</span><small>Символ</small></Stat>
        <Stat><span>{results.filter(r => r.correct).length}</span><small>Верно</small></Stat>
        <Stat><span>{results.filter(r => !r.correct).length}</span><small>Ошибки</small></Stat>
      </Stats>

      <Card>
        <TargetSection>
          <Eyebrow>Режим письма</Eyebrow>
          {current?.pinyin && <Pinyin>🔊 {current.pinyin}</Pinyin>}
          <Definition>📖 {current?.definition || 'Без перевода'}</Definition>
          <Helper>Пишите строго по порядку штрихов</Helper>
        </TargetSection>

        {phase === 'graded' && (
          <ScoreLabel $color={lastScore >= 40 ? '#48bb78' : '#e53e3e'}>
            {lastScore >= 80 ? '🎯 Отлично' : lastScore >= 40 ? '✅ Принято' : '❌ Попробуйте еще'} · {lastScore}% · ошибок: {lastMistakes}
          </ScoreLabel>
        )}

        <CanvasWrapper $state={gradeState}>
          {showGhost && current?.char && (
            <GhostChar style={{ opacity: ghostOpacity }}>{current.char}</GhostChar>
          )}
          <GridOverlay />
          <WriterMount ref={writerHostRef} />
        </CanvasWrapper>

        <StatusLine>{phase === 'practice' ? `Штрихов: ${lastStroke} · ${statusLine}` : statusLine}</StatusLine>

        {phase === 'practice' && (
          <Controls>
            <SecondaryButton onClick={clearCanvas}>🗑️ Очистить</SecondaryButton>
            <HintToggle onClick={() => setShowGhost(v => !v)}>
              {showGhost ? '🙈 Скрыть подсказку' : '👁️ Показать подсказку'}
            </HintToggle>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, opacity: showGhost ? 1 : 0.55 }}>
              ◐
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                disabled={!showGhost}
                value={Math.round(ghostOpacity * 100)}
                onChange={e => setGhostOpacity(Number(e.target.value) / 100)}
                style={{ accentColor: '#4299e1' }}
              />
              {Math.round(ghostOpacity * 100)}%
            </label>
          </Controls>
        )}

        {phase === 'graded' && (
          <Actions style={{ marginTop: 12 }}>
            <SecondaryButton onClick={handleRetry}>🔄 Повторить</SecondaryButton>
            <PrimaryButton onClick={handleNext}>{currentIndex + 1 >= queue.length ? '🏁 Завершить' : '➡️ Далее'}</PrimaryButton>
          </Actions>
        )}
      </Card>
    </Container>
  );
}

export default HandwritingMode;
