import { API_ROUTES, authFetch } from '../constants/api';

const LIVE_API = API_ROUTES.LIVE;

export const createRoom = async (questions = []) => {
  try {
    console.log('[Live Service] Creating room...', `${LIVE_API}/rooms`);
    const response = await authFetch(`${LIVE_API}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions })
    });
    
    console.log('[Live Service] Response:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('[Live Service] Room created:', result);
      return result.data;
    } else {
      const error = await response.text();
      console.error('[Live Service] Server error:', error);
    }
  } catch (error) {
    console.error('[Live Service] Error creating room:', error);
  }
  return null;
};

export const getRoom = async (pin) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}`);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error getting room:', error);
  }
  return null;
};

export const joinRoom = async (pin, teamId) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error joining room:', error);
  }
  return null;
};

export const startGame = async (pin) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/start`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error starting game:', error);
  }
  return null;
};

export const updateScore = async (pin, points) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error updating score:', error);
  }
  return null;
};

export const nextQuestion = async (pin) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/next`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error next question:', error);
  }
  return null;
};

export const endGame = async (pin) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/end`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error ending game:', error);
  }
  return null;
};

// Отправить сообщение в чат
export const sendMessage = async (pin, text, color) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, color })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error sending message:', error);
  }
  return null;
};

// Получить сообщения чата
export const getMessages = async (pin) => {
  try {
    const response = await authFetch(`${LIVE_API}/rooms/${pin}/messages`);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('[Live Service] Error fetching messages:', error);
  }
  return [];
};
