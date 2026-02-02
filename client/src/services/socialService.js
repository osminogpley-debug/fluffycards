// Service for social features
import { API_ROUTES, authFetch } from '../constants/api';

const SOCIAL_API = API_ROUTES.SOCIAL;

// ==================== FRIENDS ====================

export const getFriends = async () => {
  try {
    const response = await authFetch(`${SOCIAL_API}/friends`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
  }
  return [];
};

export const searchUsers = async (query) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/users/search?query=${encodeURIComponent(query)}`);
    
    console.log('[Search Users] Response status:', response.status);
    
    if (response.status === 401) {
      console.error('[Search Users] Unauthorized - please login again');
      return { error: 'auth', message: 'Требуется авторизация' };
    }
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      const error = await response.json();
      console.error('[Search Users] Server error:', error);
    }
  } catch (error) {
    console.error('[Search Users] Network error:', error);
  }
  return [];
};

export const sendFriendRequest = async (userId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
  return null;
};

export const getFriendRequests = async () => {
  try {
    const response = await authFetch(`${SOCIAL_API}/friends/requests`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching friend requests:', error);
  }
  return [];
};

export const handleFriendRequest = async (requestId, status) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/friends/request/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error handling friend request:', error);
  }
  return null;
};

export const removeFriend = async (friendId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/friends/${friendId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error removing friend:', error);
  }
  return null;
};

// ==================== COMMENTS ====================

export const getComments = async (setId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/comments/${setId}`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
  return [];
};

export const addComment = async (setId, text) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, text })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
  return null;
};

export const deleteComment = async (commentId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/comments/${commentId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
  return null;
};

// ==================== RATINGS ====================

export const getRating = async (setId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/ratings/${setId}`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching rating:', error);
  }
  return { average: 0, count: 0 };
};

export const rateSet = async (setId, rating) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, rating })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error rating set:', error);
  }
  return null;
};

// ==================== CHALLENGES ====================

export const getChallenges = async () => {
  try {
    const response = await authFetch(`${SOCIAL_API}/challenges`);
    if (response.ok) {
      const result = await response.json();
      return result.data;
    }
  } catch (error) {
    console.error('Error fetching challenges:', error);
  }
  return [];
};

export const createChallenge = async (challengeData) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challengeData)
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error creating challenge:', error);
  }
  return null;
};

export const joinChallenge = async (challengeId) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/challenges/${challengeId}/join`, {
      method: 'POST'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error joining challenge:', error);
  }
  return null;
};

export const updateChallengeProgress = async (challengeId, progress) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/challenges/${challengeId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error updating challenge progress:', error);
  }
  return null;
};

// ==================== SET SHARING ====================

export const shareSet = async (setId, isPublic = true) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/sets/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setId, isPublic })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error sharing set:', error);
  }
  return null;
};

export const getSharedSet = async (shareLink) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/sets/shared/${shareLink}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching shared set:', error);
  }
  return null;
};

export const copySharedSet = async (shareLink) => {
  try {
    const response = await authFetch(`${SOCIAL_API}/sets/shared/${shareLink}/copy`, {
      method: 'POST'
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error copying shared set:', error);
  }
  return null;
};
