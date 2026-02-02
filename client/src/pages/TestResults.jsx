import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '../components/UI/Buttons';
import { trackTestCompleted } from '../services/gamificationService';



// 🎯 Styled Components
const ResultsContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
  transition: opacity 0.3s ease;
`;

const ResultsCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 2rem;
`;

const ResultsTitle = styled.h1`
  color: #63b3ed;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  
  &::before {
    content: "🎊 ";
  }
  
  &::after {
    content: " 🎊";
  }
`;

const SetInfo = styled.div`
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  display: inline-block;
  
  h3 {
    margin: 0;
    color: #0369a1;
    font-size: 1rem;
  }
`;

const GradeCircle = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: ${({ grade }) => {
    if (grade === 'A') return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
    if (grade === 'B') return 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)';
    if (grade === 'C') return 'linear-gradient(135deg, #ecc94b 0%, #d69e2e 100%)';
    if (grade === 'D') return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
    return 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)';
  }};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 2rem auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
`;

const GradeLetter = styled.div`
  font-size: 5rem;
  font-weight: 800;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
`;

const GradeLabel = styled.div`
  font-size: 1rem;
  color: white;
  opacity: 0.9;
  margin-top: -10px;
`;

const ScoreText = styled.div`
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 0.5rem;
`;

const ScorePercentage = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${({ percentage }) => {
    if (percentage >= 90) return '#48bb78';
    if (percentage >= 80) return '#4299e1';
    if (percentage >= 70) return '#ecc94b';
    if (percentage >= 60) return '#ed8936';
    return '#f56565';
  }};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
`;

const StatCard = styled.div`
  background: ${({ color }) => {
    const colors = {
      blue: '#ebf8ff',
      green: '#f0fff4',
      yellow: '#fffff0',
      red: '#fff5f5'
    };
    return colors[color] || '#f7fafc';
  }};
  border-radius: 16px;
  padding: 1.5rem;
  text-align: center;
  border: 2px solid ${({ color }) => {
    const colors = {
      blue: '#bee3f8',
      green: '#c6f6d5',
      yellow: '#fefcbf',
      red: '#fed7d7'
    };
    return colors[color] || '#e2e8f0';
  }};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const StatIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #718096;
  margin-top: 0.25rem;
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h2`
  color: #2d3748;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MistakesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MistakeItem = styled.div`
  background: #fff5f5;
  border: 2px solid #fed7d7;
  border-radius: 16px;
  padding: 1.25rem;
  transition: opacity 0.3s ease;
  
  &:nth-child(even) {
    background: #fffaf0;
    border-color: #feebc8;
  }
`;

const MistakeQuestion = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
`;

const CardInfo = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  
  .term {
    font-weight: 600;
    color: #2b6cb0;
  }
  
  .definition {
    color: #4a5568;
    margin-top: 0.25rem;
  }
`;

const MistakeAnswer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const AnswerBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  background: ${({ type }) => type === 'correct' ? '#c6f6d5' : '#fed7d7'};
  color: ${({ type }) => type === 'correct' ? '#22543d' : '#742a2a'};
  border: 2px solid ${({ type }) => type === 'correct' ? '#9ae6b4' : '#fc8181'};
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RecommendationItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f0fff4;
  border-radius: 12px;
  border-left: 4px solid #48bb78;
  transition: opacity 0.3s ease;
  
  &:nth-child(even) {
    background: #ebf8ff;
    border-left-color: #4299e1;
  }
`;

const RecommendationIcon = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;
`;

const RecommendationText = styled.div`
  color: #2d3748;
  font-size: 1rem;
  line-height: 1.5;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const ActionButton = styled(PrimaryButton)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
`;

const PrintButton = styled(SecondaryButton)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #718096;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const EmptyStateText = styled.div`
  font-size: 1.2rem;
`;

// 🎉 Confetti Component
const ConfettiContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 1000;
`;

const ConfettiPiece = styled.div`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  background: ${({ color }) => color};
  left: ${({ left }) => left}%;

  border-radius: ${({ round }) => round ? '50%' : '0'};
`;

// 📝 Print Styles
const PrintStyles = styled.div`
  @media print {
    body * {
      visibility: hidden;
    }
    #print-content, #print-content * {
      visibility: visible;
    }
    #print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const PrintContent = styled.div`
  display: none;
  
  @media print {
    display: block;
  }
`;

const PrintHeader = styled.div`
  text-align: center;
  border-bottom: 3px solid #63b3ed;
  padding-bottom: 20px;
  margin-bottom: 30px;
`;

const PrintTitle = styled.h1`
  color: #2d3748;
  font-size: 28px;
  margin-bottom: 10px;
`;

const PrintDate = styled.div`
  color: #718096;
  font-size: 14px;
`;

const PrintSection = styled.div`
  margin-bottom: 30px;
`;

const PrintSectionTitle = styled.h2`
  color: #2d3748;
  font-size: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const PrintStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
`;

const PrintStat = styled.div`
  text-align: center;
  padding: 15px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
`;

const PrintStatValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: #63b3ed;
`;

const PrintStatLabel = styled.div`
  font-size: 12px;
  color: #718096;
  margin-top: 5px;
`;

const PrintQuestion = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  page-break-inside: avoid;
`;

const PrintQuestionHeader = styled.div`
  font-weight: bold;
  margin-bottom: 10px;
  color: #2d3748;
`;

const PrintCardInfo = styled.div`
  background: #f7fafc;
  padding: 10px;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 14px;
  
  .term {
    font-weight: 600;
    color: #2b6cb0;
  }
`;

const PrintAnswerRow = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 14px;
`;

const PrintAnswerLabel = styled.span`
  font-weight: 600;
  color: #718096;
`;

// 🎨 Confetti colors
const confettiColors = ['#63b3ed', '#48bb78', '#ecc94b', '#ed8936', '#f687b3', '#9f7aea'];

// Helper function to format answer for display
const formatAnswer = (result, isCorrect) => {
  const answer = isCorrect ? result.question.correctAnswer : result.userAnswer;
  
  if (answer === undefined || answer === null) {
    return 'Нет ответа';
  }
  
  if (typeof answer === 'boolean') {
    return answer ? 'Верно' : 'Неверно';
  }
  
  if (typeof answer === 'number') {
    return result.question.options?.[answer] || `Вариант ${String.fromCharCode(65 + answer)}`;
  }
  
  return answer;
};

function TestResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  
  // Get results from navigation state
  const results = location.state?.results || [];
  const setId = location.state?.setId;
  const setTitle = location.state?.setTitle;
  
  // Calculate statistics
  const totalQuestions = results.length;
  const correctAnswers = results.filter(r => r.isCorrect).length;
  const wrongAnswers = totalQuestions - correctAnswers;
  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  
  // Track test completion for gamification
  useEffect(() => {
    if (totalQuestions > 0) {
      const passed = percentage >= 60;
      const perfectScore = percentage === 100;
      trackTestCompleted(passed, perfectScore);
    }
  }, [totalQuestions, percentage]);
  
  // Determine grade
  const getGrade = (pct) => {
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };
  
  const grade = getGrade(percentage);
  
  // Get grade message
  const getGradeMessage = (g) => {
    const messages = {
      A: 'Отлично! Превосходный результат! 🌟',
      B: 'Хорошая работа! Так держать! 👍',
      C: 'Неплохо! Есть куда расти! 📈',
      D: 'Потребуется ещё практика! 💪',
      F: 'Не сдавайтесь! Попробуйте ещё раз! 🔄'
    };
    return messages[g];
  };

  // Generate recommendations
  const generateRecommendations = () => {
    const recs = [];
    
    if (percentage < 60) {
      recs.push('Повторите основные концепции и попробуйте пройти тест снова');
      recs.push('Используйте режим карточек для лучшего запоминания');
    }
    if (percentage < 80) {
      recs.push('Обратите внимание на вопросы, где вы допустили ошибки');
      recs.push('Попробуйте режим написания для улучшения запоминания');
    }
    recs.push('Регулярное повторение помогает закрепить материал');
    recs.push('Попробуйте создать собственные карточки по сложным темам');
    
    return recs;
  };

  const handleRetry = () => {
    if (setId) {
      navigate(`/test?setId=${setId}`);
    } else {
      navigate('/test');
    }
  };

  const handleBackToSet = () => {
    if (setId) {
      navigate(`/sets/${setId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate confetti
  const generateConfetti = () => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 5,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      round: Math.random() > 0.5
    }));
  };

  if (results.length === 0) {
    return (
      <ResultsContainer>
        <SectionCard>
          <EmptyState>
            <EmptyStateIcon>🤔</EmptyStateIcon>
            <EmptyStateText>Нет данных о результатах</EmptyStateText>
            <ActionButton onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
              На главную 🏠
            </ActionButton>
          </EmptyState>
        </SectionCard>
      </ResultsContainer>
    );
  }

  return (
    <>
      <PrintStyles />
      
      {/* 🎉 Confetti for good grades */}
      {grade === 'A' && (
        <ConfettiContainer>
          {generateConfetti().map(c => (
            <ConfettiPiece
              key={c.id}
              left={c.left}
              size={c.size}
              color={c.color}
              duration={c.duration}
              delay={c.delay}
              round={c.round ? 1 : 0}
            />
          ))}
        </ConfettiContainer>
      )}

      <ResultsContainer>
        {/* 🏆 Main Results Card */}
        <ResultsCard>
          <ResultsTitle>Результаты теста</ResultsTitle>
          
          {setTitle && (
            <SetInfo>
              <h3>📚 {setTitle}</h3>
            </SetInfo>
          )}
          
          <GradeCircle grade={grade}>
            <GradeLetter>{grade}</GradeLetter>
            <GradeLabel>Оценка</GradeLabel>
          </GradeCircle>
          
          <ScoreText>{getGradeMessage(grade)}</ScoreText>
          <ScorePercentage percentage={percentage}>
            {percentage}%
          </ScorePercentage>
          
          <StatsGrid>
            <StatCard color="blue">
              <StatIcon>📝</StatIcon>
              <StatValue>{totalQuestions}</StatValue>
              <StatLabel>Всего вопросов</StatLabel>
            </StatCard>
            <StatCard color="green">
              <StatIcon>✅</StatIcon>
              <StatValue>{correctAnswers}</StatValue>
              <StatLabel>Правильных</StatLabel>
            </StatCard>
            <StatCard color="red">
              <StatIcon>❌</StatIcon>
              <StatValue>{wrongAnswers}</StatValue>
              <StatLabel>Ошибок</StatLabel>
            </StatCard>
            <StatCard color="yellow">
              <StatIcon>🎯</StatIcon>
              <StatValue>{percentage}%</StatValue>
              <StatLabel>Точность</StatLabel>
            </StatCard>
          </StatsGrid>
        </ResultsCard>

        {/* ❌ Mistakes Section */}
        {wrongAnswers > 0 && (
          <SectionCard>
            <SectionTitle>
              ❌ Разбор ошибок
            </SectionTitle>
            <MistakesList>
              {results.filter(r => !r.isCorrect).map((result, index) => (
                <MistakeItem key={index}>
                  <MistakeQuestion>
                    {index + 1}. {result.question.question}
                  </MistakeQuestion>
                  
                  {/* Show card info if available */}
                  {result.question.card && (
                    <CardInfo>
                      <div className="term">Термин: {result.question.card.term}</div>
                      <div className="definition">Определение: {result.question.card.definition}</div>
                    </CardInfo>
                  )}
                  
                  <MistakeAnswer>
                    {result.userAnswer !== undefined && (
                      <AnswerBadge type="wrong">
                        Ваш ответ: {formatAnswer(result, false)}
                      </AnswerBadge>
                    )}
                    <AnswerBadge type="correct">
                      Правильно: {formatAnswer(result, true)}
                    </AnswerBadge>
                  </MistakeAnswer>
                </MistakeItem>
              ))}
            </MistakesList>
          </SectionCard>
        )}

        {/* 💡 Recommendations Section */}
        <SectionCard>
          <SectionTitle>
            💡 Рекомендации
          </SectionTitle>
          <RecommendationsList>
            {generateRecommendations().map((rec, index) => (
              <RecommendationItem key={index}>
                <RecommendationIcon>💪</RecommendationIcon>
                <RecommendationText>{rec}</RecommendationText>
              </RecommendationItem>
            ))}
          </RecommendationsList>
        </SectionCard>

        {/* 🎮 Action Buttons */}
        <ButtonsContainer className="no-print">
          <ActionButton onClick={handleRetry}>
            🔄 Пройти снова
          </ActionButton>
          <PrintButton onClick={handlePrint}>
            🖨️ Версия для печати
          </PrintButton>
          <SecondaryButton onClick={handleBackToSet}>
            📚 К набору
          </SecondaryButton>
        </ButtonsContainer>
      </ResultsContainer>

      {/* 🖨️ Print Version */}
      <PrintContent id="print-content" ref={printRef}>
        <PrintHeader>
          <PrintTitle>📝 Результаты теста - FluffyCards</PrintTitle>
          {setTitle && (
            <PrintDate>Набор: {setTitle}</PrintDate>
          )}
          <PrintDate>
            Дата прохождения: {new Date().toLocaleDateString('ru-RU')}
          </PrintDate>
        </PrintHeader>

        <PrintStatGrid>
          <PrintStat>
            <PrintStatValue>{percentage}%</PrintStatValue>
            <PrintStatLabel>Результат</PrintStatLabel>
          </PrintStat>
          <PrintStat>
            <PrintStatValue>{grade}</PrintStatValue>
            <PrintStatLabel>Оценка</PrintStatLabel>
          </PrintStat>
          <PrintStat>
            <PrintStatValue>{correctAnswers}/{totalQuestions}</PrintStatValue>
            <PrintStatLabel>Правильных ответов</PrintStatLabel>
          </PrintStat>
          <PrintStat>
            <PrintStatValue>{wrongAnswers}</PrintStatValue>
            <PrintStatLabel>Ошибок</PrintStatLabel>
          </PrintStat>
        </PrintStatGrid>

        {wrongAnswers > 0 && (
          <PrintSection>
            <PrintSectionTitle>❌ Вопросы с ошибками</PrintSectionTitle>
            {results.filter(r => !r.isCorrect).map((result, index) => (
              <PrintQuestion key={index}>
                <PrintQuestionHeader>
                  Вопрос {index + 1}: {result.question.question}
                </PrintQuestionHeader>
                
                {result.question.card && (
                  <PrintCardInfo>
                    <div className="term">Термин: {result.question.card.term}</div>
                    <div>Определение: {result.question.card.definition}</div>
                  </PrintCardInfo>
                )}
                
                <PrintAnswerRow>
                  <div>
                    <PrintAnswerLabel>Ваш ответ:</PrintAnswerLabel>
                    {' '}{formatAnswer(result, false)}
                  </div>
                  <div>
                    <PrintAnswerLabel>Правильный ответ:</PrintAnswerLabel>
                    {' '}{formatAnswer(result, true)}
                  </div>
                </PrintAnswerRow>
              </PrintQuestion>
            ))}
          </PrintSection>
        )}

        <PrintSection>
          <PrintSectionTitle>💡 Рекомендации</PrintSectionTitle>
          <ul>
            {generateRecommendations().map((rec, index) => (
              <li key={index} style={{ marginBottom: '10px', lineHeight: '1.6' }}>
                {rec}
              </li>
            ))}
          </ul>
        </PrintSection>

        <div style={{ marginTop: '40px', textAlign: 'center', color: '#718096', fontSize: '12px' }}>
          Сгенерировано в FluffyCards 🎀
        </div>
      </PrintContent>
    </>
  );
}

export default TestResults;
