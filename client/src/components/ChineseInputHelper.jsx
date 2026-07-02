import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { loadCnchar } from '../utils/cncharLoader';
import {
  extractChineseCharacters,
  numberedPinyinToToneMarks,
  stripPinyinToneMarks
} from '../utils/chineseLearning';

const HelperCard = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
  background: var(--card-bg);
`;

const HelperTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
`;

const HelperTab = styled.button`
  border: 1px solid ${({ active }) => active ? '#4299e1' : 'var(--border-color)'};
  background: ${({ active }) => active ? 'rgba(66, 153, 225, 0.14)' : 'transparent'};
  color: var(--text-primary);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  font-size: 0.9rem;
`;

const HelperText = styled.p`
  margin: 0 0 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const ButtonGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const InsertButton = styled.button`
  min-width: 44px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 0.55rem 0.75rem;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
`;

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`;

const FilterChip = styled.button`
  border: 1px solid ${({ active }) => active ? '#48bb78' : 'var(--border-color)'};
  background: ${({ active }) => active ? 'rgba(72, 187, 120, 0.16)' : 'transparent'};
  color: var(--text-primary);
  border-radius: 999px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
`;

const CharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.6rem;
`;

const CharacterCard = styled.div`
  border: 1px solid var(--border-color);
  border-radius: 14px;
  padding: 0.65rem;
  background: var(--bg-secondary);
  text-align: center;
`;

const CharacterGlyph = styled.div`
  font-size: 1.6rem;
  color: var(--text-primary);
  margin-bottom: 0.35rem;
`;

const CharacterMeta = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const EmptyState = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const TONE_BUTTONS = ['ā', 'á', 'ǎ', 'à', 'ē', 'é', 'ě', 'è', 'ī', 'í', 'ǐ', 'ì', 'ō', 'ó', 'ǒ', 'ò', 'ū', 'ú', 'ǔ', 'ù', 'ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'];

function ChineseInputHelper({ value, onChange, disabled = false, inputRef = null, dictionaryCharacters = [] }) {
  const [activeTab, setActiveTab] = useState('tones');
  const [characterMeta, setCharacterMeta] = useState([]);
  const [selectedRadical, setSelectedRadical] = useState('');
  const [selectedStroke, setSelectedStroke] = useState('');
  const [lookupReady, setLookupReady] = useState(false);

  const uniqueCharacters = useMemo(
    () => Array.from(new Set(dictionaryCharacters.flatMap((entry) => extractChineseCharacters(entry)))),
    [dictionaryCharacters]
  );
  const radicals = Array.from(new Set(characterMeta.map((item) => item.radical).filter(Boolean))).sort();
  const strokeCounts = Array.from(new Set(characterMeta.map((item) => item.strokeCount).filter(Boolean))).sort((left, right) => left - right);

  const visibleCharacters = characterMeta.filter((item) => {
    if (activeTab === 'radicals' && selectedRadical) {
      return item.radical === selectedRadical;
    }

    if (activeTab === 'strokes' && selectedStroke) {
      return String(item.strokeCount) === String(selectedStroke);
    }

    return true;
  });

  useEffect(() => {
    let ignore = false;

    if (!uniqueCharacters.length) {
      setCharacterMeta([]);
      setLookupReady(false);
      return undefined;
    }

    loadCnchar()
      .then((cnchar) => {
        if (!cnchar || ignore) {
          return;
        }

        const radicalInfo = typeof cnchar.radical === 'function'
          ? cnchar.radical(uniqueCharacters)
          : [];

        const nextMeta = uniqueCharacters.map((char, index) => {
          const meta = Array.isArray(radicalInfo) ? radicalInfo[index] : null;
          const strokeCount = typeof cnchar.stroke === 'function' ? cnchar.stroke(char) : null;

          return {
            char,
            radical: meta?.radical || '',
            radicalCount: meta?.radicalCount || null,
            struct: meta?.struct || '',
            strokeCount: Number(strokeCount) || null
          };
        });

        if (!ignore) {
          setCharacterMeta(nextMeta);
          setLookupReady(true);
        }
      })
      .catch((error) => {
        console.error('Failed to load Chinese helper metadata:', error);
        if (!ignore) {
          setCharacterMeta([]);
          setLookupReady(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [uniqueCharacters]);

  useEffect(() => {
    setSelectedRadical('');
    setSelectedStroke('');
  }, [activeTab]);

  const updateValue = (nextValue) => {
    onChange(nextValue);
    if (inputRef?.current) {
      requestAnimationFrame(() => {
        inputRef.current.focus();
      });
    }
  };

  const insertText = (text) => {
    if (disabled) {
      return;
    }

    const input = inputRef?.current;
    if (!input || typeof input.selectionStart !== 'number') {
      updateValue(`${value}${text}`);
      return;
    }

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const nextValue = `${value.slice(0, start)}${text}${value.slice(end)}`;
    updateValue(nextValue);

    requestAnimationFrame(() => {
      const cursor = start + text.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <HelperCard>
      <HelperTabs>
        <HelperTab type="button" active={activeTab === 'tones'} onClick={() => setActiveTab('tones')}>
          Тоны
        </HelperTab>
        <HelperTab type="button" active={activeTab === 'radicals'} onClick={() => setActiveTab('radicals')}>
          Ключи
        </HelperTab>
        <HelperTab type="button" active={activeTab === 'strokes'} onClick={() => setActiveTab('strokes')}>
          По чертам
        </HelperTab>
      </HelperTabs>

      {activeTab === 'tones' && (
        <>
          <HelperText>Допустимы варианты: ni hao, ni3 hao3 и nǐ hǎo.</HelperText>
          <ButtonGrid style={{ marginBottom: '0.75rem' }}>
            <InsertButton type="button" disabled={disabled} onClick={() => updateValue(numberedPinyinToToneMarks(value))}>
              3 → tónes
            </InsertButton>
            <InsertButton type="button" disabled={disabled} onClick={() => updateValue(stripPinyinToneMarks(value))}>
              Без тонов
            </InsertButton>
          </ButtonGrid>
          <ButtonGrid>
            {TONE_BUTTONS.map((toneChar) => (
              <InsertButton key={toneChar} type="button" disabled={disabled} onClick={() => insertText(toneChar)}>
                {toneChar}
              </InsertButton>
            ))}
          </ButtonGrid>
        </>
      )}

      {activeTab === 'radicals' && (
        <>
          <HelperText>Фильтр строится по китайским символам текущего набора.</HelperText>
          {!lookupReady ? (
            <EmptyState>Подготавливаю список ключей…</EmptyState>
          ) : radicals.length === 0 ? (
            <EmptyState>В этом наборе нет китайских символов для фильтра по ключам.</EmptyState>
          ) : (
            <>
              <ChipGrid>
                {radicals.map((radical) => (
                  <FilterChip
                    key={radical}
                    type="button"
                    active={selectedRadical === radical}
                    onClick={() => setSelectedRadical((current) => current === radical ? '' : radical)}
                  >
                    {radical}
                  </FilterChip>
                ))}
              </ChipGrid>
              <CharacterGrid>
                {visibleCharacters.map((item) => (
                  <CharacterCard key={`${item.char}-${item.radical}-${item.strokeCount}`}>
                    <CharacterGlyph>{item.char}</CharacterGlyph>
                    <CharacterMeta>{item.radical || '—'} • {item.strokeCount || '—'} черт</CharacterMeta>
                    {item.struct && <CharacterMeta>{item.struct}</CharacterMeta>}
                  </CharacterCard>
                ))}
              </CharacterGrid>
            </>
          )}
        </>
      )}

      {activeTab === 'strokes' && (
        <>
          <HelperText>Выберите количество черт, чтобы быстро отфильтровать символы набора.</HelperText>
          {!lookupReady ? (
            <EmptyState>Подготавливаю фильтр по чертам…</EmptyState>
          ) : strokeCounts.length === 0 ? (
            <EmptyState>В этом наборе нет китайских символов для фильтра по чертам.</EmptyState>
          ) : (
            <>
              <ChipGrid>
                {strokeCounts.map((strokeCount) => (
                  <FilterChip
                    key={strokeCount}
                    type="button"
                    active={String(selectedStroke) === String(strokeCount)}
                    onClick={() => setSelectedStroke((current) => String(current) === String(strokeCount) ? '' : strokeCount)}
                  >
                    {strokeCount}
                  </FilterChip>
                ))}
              </ChipGrid>
              <CharacterGrid>
                {visibleCharacters.map((item) => (
                  <CharacterCard key={`${item.char}-${item.strokeCount}`}>
                    <CharacterGlyph>{item.char}</CharacterGlyph>
                    <CharacterMeta>{item.strokeCount || '—'} черт</CharacterMeta>
                    {item.radical && <CharacterMeta>Ключ: {item.radical}</CharacterMeta>}
                  </CharacterCard>
                ))}
              </CharacterGrid>
            </>
          )}
        </>
      )}
    </HelperCard>
  );
}

export default ChineseInputHelper;