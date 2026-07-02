import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { API_ROUTES, authFetch } from '../constants/api';
import { trackGameWin } from '../services/gamificationService';
import SetSelector from '../components/SetSelector';
import ChineseInputHelper from '../components/ChineseInputHelper';
import { getPinyinAnswers, matchesPinyinAnswer } from '../utils/chineseLearning';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  color: var(--text-primary);
`;

const StatRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const StatChip = styled.div`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
`;

const Stage = styled.div`
  background: var(--card-bg);
  border-radius: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 30px var(--shadow-color);
  padding: 24px;
`;

const TextBoard = styled.div`
  background: var(--bg-tertiary);
  border-radius: 18px;
  padding: 24px;
  min-height: 240px;
  line-height: 2.1;
  font-size: 1.1rem;
  color: var(--text-primary);
  white-space: pre-wrap;
`;

const BlankBox = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  padding: 6px 10px;
  margin: 0 6px;
  border-radius: 12px;
  border: 2px dashed ${props => props.$status === 'correct' ? '#22c55e' : props.$status === 'wrong' ? '#ef4444' : '#94a3b8'};
  background: ${props => props.$status === 'correct' ? 'rgba(34, 197, 94, 0.16)' : props.$status === 'wrong' ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-secondary)'};
  transition: all 0.2s ease;
  ${props => props.$active && css`
    animation: ${pulse} 1.2s ease infinite;
    border-color: #f59e0b;
  `}
`;

const BlankInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  text-align: center;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  outline: none;

  &::placeholder {
    color: var(--text-muted);
  }
`;

const WordBank = styled.div`
  margin-top: 24px;
  background: var(--bg-secondary);
  border-radius: 18px;
  padding: 16px;
  border: 1px dashed var(--border-color);
`;

const BankTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 12px;
`;

const BankGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const WordChip = styled.button`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #63b3ed;
  }

  &:active {
    cursor: grabbing;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
`;

const PrimaryButton = styled.button`
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #63b3ed 0%, #4299e1 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  padding: 12px 20px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 700;
  cursor: pointer;
`;

const InfoBox = styled.div`
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 0.95rem;
`;

const normalize = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"'«»\-–—()[\]{}]/g, '')
    .replace(/\s+/g, ' ');
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export default function FillBlanksGame() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setId = params.get('setId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setData, setSetData] = useState(null);
  const [placed, setPlaced] = useState([]);
  const [placedIds, setPlacedIds] = useState([]);
  const [bank, setBank] = useState([]);
  const [results, setResults] = useState(null);
  const [activeBlankIndex, setActiveBlankIndex] = useState(null);
  const blankInputRefs = useRef([]);

  const blanks = useMemo(() => {
    const raw = setData?.clozeBlanks || [];
    return [...raw].sort((a, b) => a.start - b.start);
  }, [setData]);

  const answerItems = useMemo(() => {
    return blanks.map((blank, index) => ({ id: `blank-${index}`, text: blank.answer }));
  }, [blanks]);

  const itemsMap = useMemo(() => {
    const map = new Map();
    answerItems.forEach(item => map.set(item.id, item));
    return map;
  }, [answerItems]);

  const segments = useMemo(() => {
    const text = setData?.clozeText || '';
    if (!text || blanks.length === 0) return [];
    const segmentsList = [];
    let cursor = 0;
    blanks.forEach((blank, idx) => {
      if (blank.start > cursor) {
        segmentsList.push({ type: 'text', value: text.slice(cursor, blank.start) });
      }
      segmentsList.push({ type: 'blank', index: idx });
      cursor = blank.end;
    });
    if (cursor < text.length) {
      segmentsList.push({ type: 'text', value: text.slice(cursor) });
    }
    return segmentsList;
  }, [setData, blanks]);

  const chineseDictionaryEntries = useMemo(
    () => [setData?.clozeText || '', ...blanks.map((blank) => blank.answer)],
    [setData, blanks]
  );

  const activeBlank = activeBlankIndex !== null ? blanks[activeBlankIndex] : null;
  const activeBlankPinyinAnswers = getPinyinAnswers(activeBlank?.answer);
  const activeBlankRequiresPinyin = activeBlankPinyinAnswers.length > 0;

  const isBlankCorrect = (userValue, blank) => {
    const pinyinAnswers = getPinyinAnswers(blank?.answer);
    if (pinyinAnswers.length > 0) {
      return matchesPinyinAnswer(userValue, pinyinAnswers);
    }

    return normalize(userValue || '') === normalize(blank?.answer || '');
  };

  useEffect(() => {
    if (!setId) return;
    const load = async () => {
      try {
        const res = await authFetch(`${API_ROUTES.DATA.SETS}/${setId}`);
        if (!res.ok) throw new Error('Не удалось загрузить набор');
        const data = await res.json();
        setSetData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setId]);

  useEffect(() => {
    if (!setData) return;
    const initialPlaced = blanks.map(() => '');
    const initialIds = blanks.map(() => null);
    setPlaced(initialPlaced);
    setPlacedIds(initialIds);
    setBank(shuffle(answerItems));
    setResults(null);
  }, [setData, blanks, answerItems]);

  if (!setId) {
    return (
      <SetSelector
        title="🧩 Пропуски в тексте"
        subtitle="Выберите набор с текстом и пропусками"
        onSelectSet={(set) => navigate(`/games/fill-blanks?setId=${set._id}`)}
        gameMode
      />
    );
  }

  if (loading) {
    return <Container>Загрузка...</Container>;
  }

  if (error) {
    return (
      <Container>
        <InfoBox>Ошибка: {error}</InfoBox>
      </Container>
    );
  }

  if (!setData?.clozeText || blanks.length === 0) {
    return (
      <Container>
        <Header>
          <Title>🧩 Пропуски в тексте</Title>
        </Header>
        <InfoBox>
          В этом наборе нет текста с пропусками. Добавьте его в конструкторе набора.
        </InfoBox>
        <Actions>
          <PrimaryButton onClick={() => navigate(`/sets/${setId}/edit`)}>
            ✏️ Открыть конструктор
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/dashboard')}>
            Назад
          </SecondaryButton>
        </Actions>
      </Container>
    );
  }

  const handleDropOnBlank = (index, payload) => {
    if (!payload?.itemId) return;
    const incoming = itemsMap.get(payload.itemId);
    if (!incoming) return;

    setPlaced(prev => {
      const next = [...prev];
      next[index] = incoming.text;
      return next;
    });

    setPlacedIds(prev => {
      const next = [...prev];
      const targetPrev = next[index];
      next[index] = payload.itemId;

      if (payload.sourceIndex !== null && payload.sourceIndex !== undefined) {
        const sourceIndex = payload.sourceIndex;
        const sourcePrev = next[sourceIndex];
        next[sourceIndex] = null;

        if (targetPrev) {
          next[sourceIndex] = targetPrev;
          setPlaced(prevPlaced => {
            const updated = [...prevPlaced];
            updated[sourceIndex] = itemsMap.get(targetPrev)?.text || '';
            return updated;
          });
        }
      } else if (targetPrev) {
        setBank(prevBank => [...prevBank, itemsMap.get(targetPrev)]);
      }

      return next;
    });

    if (payload.sourceIndex === null || payload.sourceIndex === undefined) {
      setBank(prevBank => prevBank.filter(item => item.id !== payload.itemId));
    }
    setResults(null);
  };

  const handleBankDrop = (payload) => {
    if (!payload?.itemId) return;
    if (payload.sourceIndex === null || payload.sourceIndex === undefined) return;

    setPlaced(prev => {
      const next = [...prev];
      next[payload.sourceIndex] = '';
      return next;
    });

    setPlacedIds(prev => {
      const next = [...prev];
      next[payload.sourceIndex] = null;
      return next;
    });

    const item = itemsMap.get(payload.itemId);
    if (item) {
      setBank(prev => [...prev, item]);
    }
    setResults(null);
  };

  const handleCheck = () => {
    const nextResults = blanks.map((blank, index) => {
      return isBlankCorrect(placed[index] || '', blank);
    });
    setResults(nextResults);

    if (nextResults.every(Boolean)) {
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      trackGameWin();
    }
  };

  const handleReset = () => {
    setPlaced(blanks.map(() => ''));
    setPlacedIds(blanks.map(() => null));
    setBank(shuffle(answerItems));
    setResults(null);
  };

  const handleType = (index, value) => {
    setPlaced(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    setPlacedIds(prev => {
      const next = [...prev];
      const existingId = next[index];
      if (existingId) {
        const item = itemsMap.get(existingId);
        if (item) setBank(prevBank => [...prevBank, item]);
        next[index] = null;
      }
      return next;
    });
    setResults(null);
  };

  const filledCount = placed.filter(value => value && value.trim()).length;

  return (
    <Container>
      <Header>
        <div>
          <Title>🧩 Пропуски в тексте</Title>
        </div>
        <StatRow>
          <StatChip>Заполнено: {filledCount}/{blanks.length}</StatChip>
          {results && (
            <StatChip>
              Верно: {results.filter(Boolean).length}/{results.length}
            </StatChip>
          )}
        </StatRow>
      </Header>

      <Stage>
        <TextBoard>
          {segments.map((segment, idx) => {
            if (segment.type === 'text') {
              return <span key={`text-${idx}`}>{segment.value}</span>;
            }

            const blankIndex = segment.index;
            const status = results
              ? (results[blankIndex] ? 'correct' : 'wrong')
              : 'idle';

            const handleDrop = (event) => {
              event.preventDefault();
              const raw = event.dataTransfer.getData('text/plain');
              if (!raw) return;
              const payload = JSON.parse(raw);
              handleDropOnBlank(blankIndex, payload);
            };

            const handleDragOver = (event) => event.preventDefault();

            return (
              <BlankBox
                key={`blank-${idx}`}
                $status={status}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <BlankInput
                  ref={(element) => {
                    blankInputRefs.current[blankIndex] = element;
                  }}
                  value={placed[blankIndex] || ''}
                  placeholder={getPinyinAnswers(blanks[blankIndex]?.answer).length > 0 ? 'пиньинь...' : '...'}
                  onChange={(e) => handleType(blankIndex, e.target.value)}
                  onFocus={() => setActiveBlankIndex(blankIndex)}
                  onDragStart={(event) => {
                    if (!placedIds[blankIndex]) return;
                    event.dataTransfer.setData('text/plain', JSON.stringify({
                      itemId: placedIds[blankIndex],
                      sourceIndex: blankIndex
                    }));
                  }}
                  draggable={Boolean(placedIds[blankIndex])}
                />
              </BlankBox>
            );
          })}
        </TextBoard>

        <WordBank
          onDrop={(event) => {
            event.preventDefault();
            const raw = event.dataTransfer.getData('text/plain');
            if (!raw) return;
            handleBankDrop(JSON.parse(raw));
          }}
          onDragOver={(event) => event.preventDefault()}
        >
          <BankTitle>Слова для вставки</BankTitle>
          <BankGrid>
            {bank.map(item => (
              <WordChip
                key={item.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', JSON.stringify({
                    itemId: item.id,
                    sourceIndex: null
                  }));
                }}
                onClick={() => {
                  const emptyIndex = placed.findIndex(value => !value);
                  if (emptyIndex >= 0) {
                    handleDropOnBlank(emptyIndex, { itemId: item.id, sourceIndex: null });
                  }
                }}
              >
                {item.text}
              </WordChip>
            ))}
          </BankGrid>
        </WordBank>

        {activeBlankRequiresPinyin && (
          <div style={{ marginTop: '16px' }}>
            <ChineseInputHelper
              value={placed[activeBlankIndex] || ''}
              onChange={(nextValue) => handleType(activeBlankIndex, nextValue)}
              inputRef={{ current: blankInputRefs.current[activeBlankIndex] }}
              dictionaryCharacters={chineseDictionaryEntries}
            />
          </div>
        )}

        <Actions>
          <PrimaryButton onClick={handleCheck}>Проверить</PrimaryButton>
          <SecondaryButton onClick={handleReset}>Сбросить</SecondaryButton>
          <SecondaryButton onClick={() => navigate(`/sets/${setId}`)}>К набору</SecondaryButton>
        </Actions>
      </Stage>
    </Container>
  );
}
