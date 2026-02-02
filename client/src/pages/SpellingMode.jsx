import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import TextToSpeech from '../components/TextToSpeech';

const SpellingContainer = styled.div`
  max-width: 600px;
  margin: 2rem auto;
  text-align: center;
`;

const TermText = styled.h2`
  font-size: 2rem;
  color: #2d3748;
  margin-bottom: 2rem;
`;

const InputField = styled.input`
  padding: 12px 20px;
  font-size: 1.2rem;
  border-radius: 8px;
  border: 2px solid #cbd5e0;
  width: 100%;
  max-width: 400px;
  margin-bottom: 1.5rem;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
  }
`;

const FeedbackText = styled.p`
  font-size: 1.2rem;
  margin: 1.5rem 0;
  color: ${({ correct }) => correct ? '#38a169' : '#e53e3e'};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
`;

function SpellingMode() {
  const [currentFlashcard, setCurrentFlashcard] = useState({
    term: "JavaScript",
    definition: "Язык программирования",
    id: 1
  });
  
  const [userInput, setUserInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    TextToSpeech.init();
  }, []);

  const handleCheckSpelling = () => {
    setLoading(true);
    const trimmedInput = userInput.trim();
    const correct = trimmedInput.toLowerCase() === currentFlashcard.term.toLowerCase();
    
    setIsCorrect(correct);
    setShowFeedback(true);
    setLoading(false);
    
    if (!correct) setTimeout(() => speakTerm(), 1000);
  };

  const speakTerm = () => {
    TextToSpeech.speak(currentFlashcard.term);
  };

  const nextFlashcard = () => {
    setUserInput('');
    setShowFeedback(false);
    // В реальном приложении здесь будет переход к следующей карточке
    speakTerm();
  };

  return (
    <SpellingContainer>
      <TermText>Введите услышанный термин</TermText>
      
      <SecondaryButton onClick={speakTerm}>🔊 Произнести термин</SecondaryButton>
      
      <div style={{ margin: '2rem 0' }}>
        <InputField
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Что вы услышали?"
        />
      </div>
      
      {showFeedback ? (
        <>
          <FeedbackText correct={isCorrect}>
            {isCorrect ? '✅ Правильно!' : '❌ Попробуйте еще раз'}
          </FeedbackText>
          <ButtonGroup>
            {!isCorrect && (
              <SecondaryButton onClick={() => { setUserInput(currentFlashcard.term); setIsCorrect(true); }}>
                Показать ответ
              </SecondaryButton>
            )}
            <PrimaryButton onClick={nextFlashcard}>
              Следующая карточка
            </PrimaryButton>
          </ButtonGroup>
        </>
      ) : (
        <PrimaryButton onClick={handleCheckSpelling} disabled={!userInput.trim() || loading}>
          {loading ? 'Проверка...' : 'Проверить'}
        </PrimaryButton>
      )}
    </SpellingContainer>
  );
}

export default SpellingMode;
