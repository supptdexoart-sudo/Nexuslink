
import { GameEvent } from "../types";

// Base URL for your backend API.
const BASE_API_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://nexus-backend-m492.onrender.com/api'; 

const ADMIN_TOKEN_KEY = 'nexus_admin_token';

const fetchData = async <T>(url: string, options: RequestInit = {}, silent: boolean = false): Promise<T> => {
  try {
    if (!silent) console.log(`Fetching: ${url}`);
    
    // --- SECURITY INJECTION ---
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    
    const headers = new Headers(options.headers || {});
    if (adminToken) {
        headers.set('x-admin-key', adminToken);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      if (response.status === 403) {
          throw new Error("⛔ SECURITY: Odmítnuto. Chybí oprávnění pro zápis.");
      }
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    if (!silent) console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

const getLocalMessages = (roomId: string): any[] => {
    try { return JSON.parse(localStorage.getItem(`nexus_room_${roomId}`) || '[]'); } catch { return []; }
};

const saveLocalMessage = (roomId: string, msg: any) => {
    const current = getLocalMessages(roomId);
    localStorage.setItem(`nexus_room_${roomId}`, JSON.stringify([...current, msg]));
};

// --- SYSTEM ---

// Check if server is reachable
export const checkHealth = async (): Promise<boolean> => {
    try {
        await fetchData(`${BASE_API_URL}/health`, undefined, true);
        return true;
    } catch {
        return false;
    }
};

// --- AUTH & INVENTORY ---
export const loginUser = async (email: string, password?: string): Promise<{ email: string; isNewUser: boolean }> => {
  const url = `${BASE_API_URL}/auth/login`;
  
  if (password && email === 'zbynekbal97@gmail.com') {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, password);
  } else {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  return fetchData<{ email: string; isNewUser: boolean }>(url, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const getInventory = async (userEmail: string): Promise<GameEvent[]> => {
  if (!userEmail) return [];
  const url = `${BASE_API_URL}/inventory/${userEmail}`;
  return fetchData<GameEvent[]>(url);
};

export const restoreInventory = async (userEmail: string, items: GameEvent[]): Promise<void> => {
  if (!userEmail || !items || items.length === 0) return;
  const url = `${BASE_API_URL}/inventory/${userEmail}/restore`;
  await fetchData(url, {
      method: 'POST',
      body: JSON.stringify({ items })
  });
};

export const getCardById = async (userEmail: string, cardId: string): Promise<GameEvent | null> => {
  if (!userEmail || !cardId) return null;
  const url = `${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`;
  try {
    return await fetchData<GameEvent>(url, undefined, true);
  } catch (error: any) {
    return null;
  }
};

export const saveCard = async (userEmail: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail) throw new Error("Email required");
  const url = `${BASE_API_URL}/inventory/${userEmail}`;
  return fetchData<GameEvent>(url, {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

export const updateCard = async (userEmail: string, cardId: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail || !cardId) throw new Error("Details required");
  const url = `${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`;
  return fetchData<GameEvent>(url, {
    method: 'PUT',
    body: JSON.stringify(event),
  });
};

export const deleteCard = async (userEmail: string, cardId: string): Promise<void> => {
  if (!userEmail || !cardId) throw new Error("Details required");
  // FIX: Encode URI component for cardId to handle spaces/special chars
  const url = `${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`;
  await fetchData<void>(url, { method: 'DELETE' });
};

export const interpretCode = async (code: string): Promise<GameEvent> => {
  const url = `${BASE_API_URL}/gemini/interpret-code`;
  return fetchData<GameEvent>(url, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

// --- USER PROFILE ---
export const getNickname = async (userEmail: string): Promise<string | null> => {
    if (!userEmail) return null;
    const url = `${BASE_API_URL}/users/${userEmail}/nickname`;
    try {
        const data = await fetchData<{ nickname: string }>(url, undefined, true);
        return data.nickname;
    } catch (e) {
        return localStorage.getItem(`nexus_nickname_${userEmail}`);
    }
};

export const saveNickname = async (userEmail: string, nickname: string): Promise<void> => {
    localStorage.setItem(`nexus_nickname_${userEmail}`, nickname);
    if (!userEmail) throw new Error("Email required");
    const url = `${BASE_API_URL}/users/${userEmail}/nickname`;
    fetchData(url, {
        method: 'POST',
        body: JSON.stringify({ nickname })
    }, true).catch(() => {});
};

// --- FRIENDS ---
export interface FriendRequest {
    fromEmail: string;
    timestamp: number;
}

export const sendFriendRequest = async (userEmail: string, targetEmail: string): Promise<void> => {
    if (userEmail === targetEmail) throw new Error("Self-request not allowed");
    const url = `${BASE_API_URL}/users/${userEmail}/friends/request`;
    try {
        await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ targetEmail })
        });
    } catch (e) { console.warn("Friend request backend failed"); throw e; }
};

export const getFriendRequests = async (userEmail: string): Promise<FriendRequest[]> => {
     const url = `${BASE_API_URL}/users/${userEmail}/friends/requests`;
     try { return await fetchData<FriendRequest[]>(url, undefined, true); } catch(e) { return []; }
};

export const respondToFriendRequest = async (userEmail: string, targetEmail: string, accept: boolean): Promise<void> => {
    const url = `${BASE_API_URL}/users/${userEmail}/friends/respond`;
    try {
        await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ targetEmail, accept })
        }, true);
    } catch (e) { }
};

export const getFriends = async (userEmail: string): Promise<string[]> => {
    const url = `${BASE_API_URL}/users/${userEmail}/friends`;
    try {
        const data = await fetchData<{ friends: string[] }>(url, undefined, true);
        const serverFriends = data.friends || [];
        return serverFriends.filter(email => email !== userEmail);
    } catch (e) { return []; }
};

export const sendGift = async (fromEmail: string, cardId: string): Promise<GameEvent> => {
    const url = `${BASE_API_URL}/inventory/send-gift`;
    const response = await fetchData<{ success: boolean, item: GameEvent }>(url, {
        method: 'POST',
        body: JSON.stringify({ fromEmail, cardId })
    });
    return response.item;
};

// --- ROOMS / CHAT / STATUS (UPDATED) ---

export const createRoom = async (roomId: string, hostName: string): Promise<any> => {
    const url = `${BASE_API_URL}/rooms`;
    try {
        return await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ roomId, hostName })
        }, true);
    } catch (e) { return { success: true, mode: 'offline' }; }
};

export const joinRoom = async (roomId: string, userName: string, hp?: number): Promise<any> => {
    const url = `${BASE_API_URL}/rooms/${roomId}/join`;
    try {
        return await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ userName, hp: hp || 100 })
        }, true);
    } catch (e) { return { success: true }; }
};

export const updatePlayerStatus = async (roomId: string, userName: string, hp: number): Promise<void> => {
    const url = `${BASE_API_URL}/rooms/${roomId}/status`;
    try {
        await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ userName, hp })
        }, true);
    } catch (e) { /* silent */ }
};

export const getRoomMembers = async (roomId: string): Promise<{name: string, hp: number, lastSeen: number}[]> => {
    const url = `${BASE_API_URL}/rooms/${roomId}/members`;
    try {
        return await fetchData(url, undefined, true);
    } catch (e) { return []; }
};

export const leaveRoom = async (roomId: string, userName: string): Promise<void> => {
    const url = `${BASE_API_URL}/rooms/${roomId}/leave`;
    fetchData(url, {
        method: 'POST',
        body: JSON.stringify({ userName })
    }, true).catch(() => {});
};

export const sendMessage = async (roomId: string, sender: string, text: string): Promise<any> => {
    const newMsg = { id: Date.now().toString(), sender, text, timestamp: Date.now() };
    saveLocalMessage(roomId, newMsg);
    const url = `${BASE_API_URL}/rooms/${roomId}/messages`;
    try {
        return await fetchData(url, {
            method: 'POST',
            body: JSON.stringify({ sender, text })
        }, true);
    } catch(e) { return newMsg; }
};

export const getRoomMessages = async (roomId: string): Promise<any[]> => {
    const url = `${BASE_API_URL}/rooms/${roomId}/messages`;
    try {
        const serverMsgs = await fetchData<any[]>(url, undefined, true);
        const localMsgs = getLocalMessages(roomId);
        if (serverMsgs && serverMsgs.length > 0) return serverMsgs;
        return localMsgs;
    } catch (e) { return getLocalMessages(roomId); }
};
