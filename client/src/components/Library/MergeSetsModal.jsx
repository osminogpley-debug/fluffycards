import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  transition: opacity 0.3s ease;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 2px solid #bae6fd;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalSubtitle = styled.p`
  margin: 0.5rem 0 0 0;
  color: #718096;
  font-size: 0.95rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    transform: rotate(90deg) scale(1.1);
    background: #fee2e2;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 1.5rem;
`;

const SetItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.$selected ? '#e0f2fe' : '#f8fafc'};
  border: 2px solid ${props => props.$selected ? '#63b3ed' : 'transparent'};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$selected ? '#e0f2fe' : '#f1f5f9'};
    transform: translateX(5px);
  }
`;

const Checkbox = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid ${props => props.$checked ? '#63b3ed' : '#cbd5e0'};
  background: ${props => props.$checked ? '#63b3ed' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &::after {
    content: '✓';
    color: white;
    font-weight: bold;
    opacity: ${props => props.$checked ? 1 : 0};
    transform: ${props => props.$checked ? 'scale(1)' : 'scale(0)'};
    transition: all 0.2s ease;
  }
`;

const SetInfo = styled.div`
  flex: 1;
`;

const SetName = styled.div`
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
`;

const SetMeta = styled.div`
  font-size: 0.8rem;
  color: #718096;
  margin-top: 2px;
`;

const PreviewSection = styled.div`
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const PreviewTitle = styled.h4`
  margin: 0;
  color: #2d3748;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardsCount = styled.span`
  background: #63b3ed;
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const PreviewList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const PreviewItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px;
  background: white;
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PreviewTerm = styled.span`
  font-weight: 600;
  color: #2d3748;
  min-width: 120px;
`;

const PreviewDefinition = styled.span`
  color: #718096;
  flex: 1;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const InputLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }

  ${props => props.$error && `
    border-color: #f87171;
  `}
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }
`;

const TagsInput = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  min-height: 48px;

  &:focus-within {
    border-color: #63b3ed;
    box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
  }
`;

const Tag = styled.span`
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0369a1;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const RemoveTag = styled.button`
  background: none;
  border: none;
  color: #0369a1;
  cursor: pointer;
  padding: 0;
  font-size: 0.8rem;
  
  &:hover {
    color: #dc2626;
  }
`;

const TagInput = styled.input`
  border: none;
  background: none;
  outline: none;
  flex: 1;
  min-width: 100px;
  font-size: 0.9rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 2px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelButton = styled.button`
  background: #f1f5f9;
  color: #64748b;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
  }
`;

const MergeButton = styled.button`
  background: ${props => props.$loading ? '#cbd5e0' : 'linear-gradient(135deg, #63b3ed 0%, #4299e1 100%)'};
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(99, 179, 237, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 179, 237, 0.4);
  }

  ${props => props.$success && `
    background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  `}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #718096;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

function MergeSetsModal({ isOpen, onClose, userSets = [], onMerge }) {
  const [selectedSets, setSelectedSets] = useState([]);
  const [mergedName, setMergedName] = useState('');
  const [mergedDescription, setMergedDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSets([]);
      setMergedName('');
      setMergedDescription('');
      setTags([]);
      setTagInput('');
      setMergeSuccess(false);
      setNameError(false);
    }
  }, [isOpen]);

  const toggleSetSelection = (setId) => {
    setSelectedSets(prev => 
      prev.includes(setId) 
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const getMergedPreview = () => {
    const selected = userSets.filter(set => selectedSets.includes(set.id));
    let allCards = [];
    selected.forEach(set => {
      if (set.cards) {
        allCards = [...allCards, ...set.cards];
      }
    });
    return allCards.slice(0, 5);
  };

  const getTotalCards = () => {
    const selected = userSets.filter(set => selectedSets.includes(set.id));
    return selected.reduce((total, set) => total + (set.cardCount || set.cards?.length || 0), 0);
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMerge = async () => {
    if (!mergedName.trim()) {
      setNameError(true);
      setTimeout(() => setNameError(false), 500);
      return;
    }

    setIsLoading(true);
    
    // Имитация API вызова
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const selected = userSets.filter(set => selectedSets.includes(set.id));
    const mergedData = {
      name: mergedName,
      description: mergedDescription,
      tags,
      sets: selected,
      totalCards: getTotalCards()
    };
    
    onMerge?.(mergedData);
    
    setIsLoading(false);
    setMergeSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  const previewCards = getMergedPreview();
  const totalCards = getTotalCards();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader style={{ position: 'relative' }}>
          <ModalTitle>
            🔀 Объединить наборы
          </ModalTitle>
          <ModalSubtitle>
            Выберите наборы для создания супер-набора! ✨
          </ModalSubtitle>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <SectionTitle>
            📚 Ваши наборы ({selectedSets.length} выбрано)
          </SectionTitle>
          
          {userSets.length === 0 ? (
            <EmptyState>
              <EmptyIcon>📭</EmptyIcon>
              <p>У вас пока нет наборов для объединения</p>
            </EmptyState>
          ) : (
            <SetsList>
              {userSets.map(set => (
                <SetItem 
                  key={set.id}
                  $selected={selectedSets.includes(set.id)}
                  onClick={() => toggleSetSelection(set.id)}
                >
                  <Checkbox $checked={selectedSets.includes(set.id)} />
                  <SetInfo>
                    <SetName>{set.title}</SetName>
                    <SetMeta>
                      📝 {set.cardCount || set.cards?.length || 0} карточек
                    </SetMeta>
                  </SetInfo>
                </SetItem>
              ))}
            </SetsList>
          )}

          {selectedSets.length > 0 && (
            <>
              <PreviewSection>
                <PreviewHeader>
                  <PreviewTitle>
                    👀 Предпросмотр объединения
                  </PreviewTitle>
                  <CardsCount>{totalCards} карточек</CardsCount>
                </PreviewHeader>
                <PreviewList>
                  {previewCards.map((card, index) => (
                    <PreviewItem key={index}>
                      <PreviewTerm>{card.term}</PreviewTerm>
                      <PreviewDefinition>{card.definition}</PreviewDefinition>
                    </PreviewItem>
                  ))}
                  {totalCards > 5 && (
                    <div style={{ textAlign: 'center', color: '#63b3ed', fontSize: '0.85rem', marginTop: '8px' }}>
                      +{totalCards - 5} ещё карточек... 🌟
                    </div>
                  )}
                </PreviewList>
              </PreviewSection>

              <InputGroup>
                <InputLabel>
                  🏷️ Название нового набора *
                </InputLabel>
                <TextInput
                  type="text"
                  value={mergedName}
                  onChange={(e) => setMergedName(e.target.value)}
                  placeholder="Например: Мега-набор для экзамена 🎯"
                  $error={nameError}
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>
                  📝 Описание
                </InputLabel>
                <TextArea
                  value={mergedDescription}
                  onChange={(e) => setMergedDescription(e.target.value)}
                  placeholder="Опишите, что включает этот объединённый набор..."
                />
              </InputGroup>

              <InputGroup>
                <InputLabel>
                  🏷️ Теги (нажмите Enter для добавления)
                </InputLabel>
                <TagsInput>
                  {tags.map((tag, index) => (
                    <Tag key={index}>
                      {tag}
                      <RemoveTag onClick={() => removeTag(tag)}>✕</RemoveTag>
                    </Tag>
                  ))}
                  <TagInput
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Добавьте теги..." : ""}
                  />
                </TagsInput>
              </InputGroup>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>
            Отмена
          </CancelButton>
          <MergeButton 
            onClick={handleMerge}
            disabled={selectedSets.length === 0 || isLoading}
            $loading={isLoading}
            $success={mergeSuccess}
          >
            {isLoading ? (
              <>⏳ Объединяем...</>
            ) : mergeSuccess ? (
              <>✨ Готово!</>
            ) : (
              <>
                🔀 Объединить ({selectedSets.length})
              </>
            )}
          </MergeButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

export default MergeSetsModal;
