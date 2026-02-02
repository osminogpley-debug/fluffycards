import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import confetti from 'canvas-confetti';

const GameContainer = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
`;

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 2rem 0;
`;

const Card = styled.div`
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ flipped }) => flipped ? '#fff' : '#4299e1'};
  border-radius: 12px;
  cursor: pointer;
  font-size: ${({ type }) => type === 'term' ? '1.2rem' : '1rem'};
  color: ${({ flipped }) => flipped ? '#2d3748' : 'white'};
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

function MatchGame({ cards }) {
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Prepare card pairs
  const cardPairs = [...cards, ...cards]
    .map((card, index) => ({ ...card, id: index }))
    .sort(() => Math.random() - 0.5);

  const handleCardClick = (index) => {
    if (flippedCards.length === 2 || flippedCards.includes(index) || matchedPairs.includes(cardPairs[index].term))
      return;

    // Flip the card
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    setMoves(moves + 1);

    // Check for match
    if (newFlipped.length === 2) {
      const [firstIdx, secondIdx] = newFlipped;
      
      if (cardPairs[firstIdx].term === cardPairs[secondIdx].definition ||
          cardPairs[firstIdx].definition === cardPairs[secondIdx].term) {
        // Match found
        const newMatched = [...matchedPairs, cardPairs[firstIdx].term];
        setMatchedPairs(newMatched);
        
        if (newMatched.length === cards.length) {
          setGameWon(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }

      setTimeout(() => setFlippedCards([]), 1000);
    }
  };

  return (
    <GameContainer>
      <GameHeader>
        <h2>🔍 Игра "Найди пару"</h2>
        <div>Ходы: {moves}</div>
      </GameHeader>

      {gameWon ? (
        <div style={{ textAlign: 'center' }}>
          <h3>🎉 Поздравляем! Вы победили за {moves} ходов!</h3>
          <button onClick={() => window.location.reload()}>Играть снова</button>
        </div>
      ) : (
        <CardsGrid>
          {cardPairs.map((card, index) => (
            <Card
              key={index}
              onClick={() => handleCardClick(index)}
              flipped={flippedCards.includes(index) || matchedPairs.includes(card.term)}
              type={cardPairs[index]?.term ? 'term' : 'definition'}
            >
              {flippedCards.includes(index) || matchedPairs.includes(card.term)
                ? (card.term || card.definition)
                : '?'}
            </Card>
          ))}
        </CardsGrid>
      )}
    </GameContainer>
  );
}

export default MatchGame;
