// Service for tracking user activity and updating gamification data
import { API_ROUTES, authFetch } from '../constants/api';

/**
 * Track card study activity
 * @param {number} cardsCount - Number of cards studied
 */
export const trackCardsStudied = async (cardsCount) => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardsStudied: cardsCount })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error tracking cards studied:', error);
  }
  return null;
};

/**
 * Track test completion
 * @param {boolean} passed - Whether test was passed
 * @param {boolean} perfectScore - Whether score was 100%
 */
export const trackTestCompleted = async (passed, perfectScore = false) => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        testsPassed: passed ? 1 : 0,
        perfectScore 
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error tracking test completion:', error);
  }
  return null;
};

/**
 * Track game win
 */
export const trackGameWin = async () => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gamesWon: 1 })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error tracking game win:', error);
  }
  return null;
};

/**
 * Add XP directly (for custom actions)
 * @param {number} amount - XP amount
 * @param {string} action - Action description
 */
export const addXp = async (amount, action) => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, action })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error adding XP:', error);
  }
  return null;
};

/**
 * Get user gamification data
 */
export const getGamificationData = async () => {
  try {
    const response = await authFetch(API_ROUTES.GAMIFICATION);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching gamification data:', error);
  }
  return null;
};

/**
 * Get user achievements
 */
export const getAchievements = async () => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/achievements`);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching achievements:', error);
  }
  return null;
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async () => {
  try {
    const response = await authFetch(`${API_ROUTES.GAMIFICATION}/leaderboard`);
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
  }
  return [];
};
