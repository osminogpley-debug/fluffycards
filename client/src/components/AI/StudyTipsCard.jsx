import React, { useState } from 'react';
import styled from 'styled-components';
import { PrimaryButton } from '../UI/Buttons';

const Container = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  
  &::before {
    content: '💡';
    font-size: 1.5rem;
    margin-right: 0.5rem;
  }
`;

const TipsContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  line-height: 1.6;
`;

const Loading = styled.div`
  padding: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
`;

function StudyTipsCard({ cards }) {
  const [tips, setTips] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudyTips = async () => {
    if (!cards || cards.length === 0) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/ai/study-tips', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cards })
      });
      
      const { tips: studyTips } = await response.json();
      setTips(studyTips);
    } catch (error) {
      console.error('Study tips error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <h3>Персональные советы по обучению</h3>
      </Header>
      
      {loading ? (
        <Loading>🤖 AI анализирует ваши карточки...</Loading>
      ) : tips ? (
        <TipsContent>
          <p>{tips}</p>
        </TipsContent>
      ) : (
        <div>
          <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
            Получите персонализированные советы по эффективному изучению ваших карточек
          </p>
          <PrimaryButton 
            onClick={fetchStudyTips}
            disabled={!cards || cards.length === 0}
            style={{ 
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            Получить советы
          </PrimaryButton>
        </div>
      )}
    </Container>
  );
}

export default StudyTipsCard;
