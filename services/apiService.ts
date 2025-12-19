
import { GameEvent, RaidState } from "../types";

// Base URL pro backend API.
const BASE_API_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://nexus-backend-m492.onrender.com/api'; 

const ADMIN_TOKEN_KEY = 'nexus_admin_token';
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

const fetchData = async <T>(url: string, options: RequestInit = {}, silent: boolean = false): Promise<T> => {
  try {
    const adminToken = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    if (adminToken) headers.set('x-admin-key', adminToken);
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (!silent) console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

// --- SYSTEM ---
export const checkHealth = async (): Promise<boolean> => {
    try { await fetchData(`${BASE_API_URL}/health`, undefined, true); return true; } catch { return false; }
};

// --- AUTH & INVENTORY ---
export const loginUser = async (email: string, password?: string): Promise<{ email: string; isNewUser: boolean }> => {
  const url = `${BASE_API_URL}/auth/login`;
  if (password && email === ADMIN_EMAIL) sessionStorage.setItem(ADMIN_TOKEN_KEY, password);
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  return fetchData<{ email: string; isNewUser: boolean }>(url, { method: 'POST', body: JSON.stringify({ email, password }) });
};

export const getInventory = async (userEmail: string): Promise<GameEvent[]> => {
  if (!userEmail) return [];
  return fetchData<GameEvent[]>(`${BASE_API_URL}/inventory/${userEmail}`);
};

// Získat celý master katalog pro offline použití
export const getMasterCatalog = async (): Promise<GameEvent[]> => {
    return fetchData<GameEvent[]>(`${BASE_API_URL}/inventory/${ADMIN_EMAIL}`);
};

export const restoreInventory = async (userEmail: string, items: GameEvent[]): Promise<void> => {
  if (!userEmail || !items || items.length === 0) return;
  await fetchData(`${BASE_API_URL}/inventory/${userEmail}/restore`, { method: 'POST', body: JSON.stringify({ items }) });
};

export const getCardById = async (userEmail: string, cardId: string): Promise<GameEvent | null> => {
  if (!userEmail || !cardId) return null;
  try { return await fetchData<GameEvent>(`${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`, undefined, true); } catch { return null; }
};

export const saveCard = async (userEmail: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail) throw new Error("Email required");
  return fetchData<GameEvent>(`${BASE_API_URL}/inventory/${userEmail}`, { method: 'POST', body: JSON.stringify(event) });
};

export const updateCard = async (userEmail: string, cardId: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail || !cardId) throw new Error("Details required");
  return fetchData<GameEvent>(`${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`, { method: 'PUT', body: JSON.stringify(event) });
};

export const deleteCard = async (userEmail: string, cardId: string): Promise<void> => {
  if (!userEmail || !cardId) throw new Error("Details required");
  await fetchData<void>(`${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
};

export const interpretCode = async (code: string): Promise<GameEvent> => {
  return fetchData<GameEvent>(`${BASE_API_URL}/gemini/interpret-code`, { method: 'POST', body: JSON.stringify({ code }) });
};

// --- USER PROFILE ---
export const getNickname = async (userEmail: string): Promise<string | null> => {
    if (!userEmail) return null;
    try { const data = await fetchData<{ nickname: string }>(`${BASE_API_URL}/users/${userEmail}/nickname`, undefined, true); return data.nickname; } catch (e) { return localStorage.getItem(`nexus_nickname_${userEmail}`); }
};

export const saveNickname = async (userEmail: string, nickname: string): Promise<void> => {
    localStorage.setItem(`nexus_nickname_${userEmail}`, nickname);
    fetchData(`${BASE_API_URL}/users/${userEmail}/nickname`, { method: 'POST', body: JSON.stringify({ nickname }) }, true).catch(() => {});
};

// --- FRIENDS ---
export interface FriendRequest { fromEmail: string; timestamp: number; }
export const sendFriendRequest = async (userEmail: string, targetEmail: string): Promise<void> => {
    await fetchData(`${BASE_API_URL}/users/${userEmail}/friends/request`, { method: 'POST', body: JSON.stringify({ targetEmail }) });
};
export const getFriendRequests = async (userEmail: string): Promise<FriendRequest[]> => {
     try { return await fetchData<FriendRequest[]>(`${BASE_API_URL}/users/${userEmail}/friends/requests`, undefined, true); } catch(e) { return []; }
};
export const respondToFriendRequest = async (userEmail: string, targetEmail: string, accept: boolean): Promise<void> => {
    await fetchData(`${BASE_API_URL}/users/${userEmail}/friends/respond`, { method: 'POST', body: JSON.stringify({ targetEmail, accept }) }, true);
};
export const getFriends = async (userEmail: string): Promise<string[]> => {
    try { const data = await fetchData<{ friends: string[] }>(`${BASE_API_URL}/users/${userEmail}/friends`, undefined, true); return (data.friends || []).filter(email => email !== userEmail); } catch (e) { return []; }
};

// --- ROOMS / CHAT / STATUS ---
export const createRoom = async (roomId: string, hostName: string, password?: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms`, { method: 'POST', body: JSON.stringify({ roomId, hostName, password }) }, true);
};
export const joinRoom = async (roomId: string, userName: string, hp?: number, password?: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms/${roomId}/join`, { method: 'POST', body: JSON.stringify({ userName, hp: hp || 100, password }) }, true);
};
export const updatePlayerStatus = async (roomId: string, userName: string, hp: number): Promise<void> => {
    fetchData(`${BASE_API_URL}/rooms/${roomId}/status`, { method: 'POST', body: JSON.stringify({ userName, hp }) }, true).catch(() => {});
};
export const getRoomMembers = async (roomId: string): Promise<{name: string, hp: number, lastSeen: number}[]> => {
    try { return await fetchData( `${BASE_API_URL}/rooms/${roomId}/members`, undefined, true); } catch (e) { return []; }
};

export const getRoomStatus = async (roomId: string): Promise<{members: any[], turnIndex: number}> => {
    try { return await fetchData(`${BASE_API_URL}/rooms/${roomId}/status`, undefined, true); } catch (e) { return { members: [], turnIndex: 0 }; }
};

export const nextTurn = async (roomId: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms/${roomId}/next-turn`, { method: 'POST' });
};

export const leaveRoom = async (roomId: string, userName: string): Promise<void> => {
    fetchData(`${BASE_API_URL}/rooms/${roomId}/leave`, { method: 'POST', body: JSON.stringify({ userName }) }, true).catch(() => {});
};
export const sendMessage = async (roomId: string, sender: string, text: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ sender, text }) }, true);
};
export const getRoomMessages = async (roomId: string): Promise<any[]> => {
    try { return await fetchData<any[]>(`${BASE_API_URL}/rooms/${roomId}/messages`, undefined, true); } catch (e) { return []; }
};

// --- RAID BOSS API ---
export const getRaidState = async (roomId: string): Promise<RaidState> => {
    try { return await fetchData<RaidState>(`${BASE_API_URL}/rooms/${roomId}/boss`, undefined, true); } catch (e) { return { isActive: false } as RaidState; }
};
export const startRaid = async (roomId: string, bossName: string, bossId: string, maxHp: number): Promise<RaidState> => {
    return fetchData<RaidState>(`${BASE_API_URL}/rooms/${roomId}/boss/start`, { method: 'POST', body: JSON.stringify({ bossName, bossId, maxHp }) });
};
export const attackRaidBoss = async (roomId: string, damage: number, playerName: string): Promise<RaidState> => {
    return fetchData<RaidState>(`${BASE_API_URL}/rooms/${roomId}/boss/attack`, { method: 'POST', body: JSON.stringify({ damage, playerName }) });
};
export const endRaid = async (roomId: string): Promise<void> => {
    await fetchData(`${BASE_API_URL}/rooms/${roomId}/boss/end`, { method: 'POST' });
};
