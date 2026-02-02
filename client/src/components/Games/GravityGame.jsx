import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import confetti from 'canvas-confetti';

const GameContainer = styled.div`
  position: relative;
  width: 100%;
  height: 80vh;
  margin: 2rem auto;
  background: linear-gradient(to bottom, #e0f2fe 0%, #f8fafc 100%);
  border-radius: 20px;
  overflow: hidden;
`;

const Planet = styled.div`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  left: ${({ left }) => left}%;
  background: ${({ color }) => color};
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform ${({ duration }) => duration}s linear, top ${({ duration }) => duration}s linear;

  &:hover {
    transform: scale(1.1);
  }
`;

const InputContainer = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 10;
`;

const Input = styled.input`
  padding: 12px 24px;
  font-size: 1.2rem;
  border-radius: 50px;
  border: none;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  width: 300px;
  text-align: center;
  outline: none;
  
  &:focus {
    box-shadow: 0 5px 15px rgba(66, 153, 225, 0.3);
  }
`;

const ScoreDisplay = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  background: rgba(255,255,255,0.8);
  border-radius: 50px;
  font-weight: bold;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
`;

function GravityGame({ cards }) {
  const [currentTerm, setCurrentTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [planetQueue, setPlanetQueue] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef(null);

  const colors = ['#f56565', '#4299e1', '#48bb78', '#ed8936', '#9f7aea'];

  useEffect(() => {
    // Start with first planet
    spawnPlanet();
  }, []);

  const spawnPlanet = () => {
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    const newDuration = Math.max(3, 10 - speed * 0.5);
    const newPlanet = {
      term: randomCard.term,
      size: 30 + Math.random() * 20,
      left: 20 + Math.random() * 60,
      duration: newDuration,
      color: colors[Math.floor(Math.random() * colors.length)],
      definition: randomCard.definition
    };
    
    setCurrentTerm(newPlanet.term);
    setPlanetQueue([newPlanet]);
    
    // Game over if planet isn't destroyed in time
    const timeout = setTimeout(() => {
      if (!gameOver) {
        setGameOver(true);
      }
    }, newDuration * 1000 - 1000);

    return () => clearTimeout(timeout);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const isCorrect = planetQueue.some(planet => 
      inputValue.toLowerCase() === planet.definition.toLowerCase()
    );

    if (isCorrect) {
      // Correct answer
      setScore(score + 100);
      setSpeed(Math.min(10, speed + 0.5));
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 }
      });
      
      // Spawn next planet
      spawnPlanet();
    } else {
      // Wrong answer
      setScore(Math.max(0, score - 50));
    }

    setInputValue('');
    inputRef.current.focus();
  };

  if (gameOver) {
    return (
      <GameContainer>
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '2rem',
          borderRadius: '20px'
        }}>
          <h2>🚀 Конец игры!</h2>
          <p>Ваш счет: {score}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Играть снова
          </button>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      <ScoreDisplay>Счет: {score}</ScoreDisplay>

      {planetQueue.map((planet, idx) => (
        <Planet
          key={idx}
          size={planet.size}
          left={planet.left}
          duration={planet.duration}
          color={planet.color}
        >
          {planet.term}
        </Planet>
      ))}

      <InputContainer>
        <form onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Определение для "${currentTerm}"`}
            autoFocus
          />
        </form>
      </InputContainer>
    </GameContainer>
  );
}

export default GravityGame;
