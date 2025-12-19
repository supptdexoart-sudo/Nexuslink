
import { GameEvent } from "../types";

const BASE_API_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://nexus-backend-m492.onrender.com/api'; 

const ADMIN_TOKEN_KEY = 'nexus_admin_token';
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

export interface FriendRequest {
  fromEmail: string;
  timestamp: number;
}

const fetchData = async <T>(url: string, options: RequestInit = {}, silent: boolean = false): Promise<T> => {
  if (!navigator.onLine) throw new Error("OFFLINE_MODE");
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

export const checkHealth = async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try { 
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${BASE_API_URL}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      return res.ok;
    } catch { return false; }
};

export const transferCard = async (fromEmail: string, toEmail: string, itemId: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/inventory/transfer`, {
        method: 'POST',
        body: JSON.stringify({ fromEmail, toEmail, itemId })
    });
};

export const swapItems = async (player1Email: string, player2Email: string, item1Id: string, item2Id: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/inventory/swap`, {
        method: 'POST',
        body: JSON.stringify({ player1Email, player2Email, item1Id, item2Id })
    });
};

export const startGame = async (roomId: string): Promise<void> => { await fetchData(`${BASE_API_URL}/rooms/${roomId}/start-game`, { method: 'POST' }); };
export const acknowledgeRoundEnd = async (roomId: string, userName: string): Promise<void> => { await fetchData(`${BASE_API_URL}/rooms/${roomId}/acknowledge-round`, { method: 'POST', body: JSON.stringify({ userName }) }); };
export const loginUser = async (email: string, password?: string): Promise<{ email: string; isNewUser: boolean }> => {
  const url = `${BASE_API_URL}/auth/login`;
  if (password && email === ADMIN_EMAIL) sessionStorage.setItem(ADMIN_TOKEN_KEY, password);
  return fetchData<{ email: string; isNewUser: boolean }>(url, { method: 'POST', body: JSON.stringify({ email, password }) });
};
export const getInventory = async (userEmail: string): Promise<GameEvent[]> => fetchData<GameEvent[]>(`${BASE_API_URL}/inventory/${userEmail}`);
export const saveCard = async (userEmail: string, event: GameEvent): Promise<GameEvent> => fetchData<GameEvent>(`${BASE_API_URL}/inventory/${userEmail}`, { method: 'POST', body: JSON.stringify(event) });
export const deleteCard = async (userEmail: string, cardId: string): Promise<void> => fetchData<void>(`${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`, { method: 'DELETE' });
export const getMasterCatalog = async (): Promise<GameEvent[]> => fetchData<GameEvent[]>(`${BASE_API_URL}/inventory/zbynekbal97@gmail.com`);
export const getCardById = async (userEmail: string, cardId: string): Promise<GameEvent | null> => { try { return await fetchData<GameEvent>(`${BASE_API_URL}/inventory/${userEmail}/${encodeURIComponent(cardId)}`, undefined, true); } catch { return null; } };
export const getRoomStatus = async (roomId: string): Promise<any> => fetchData(`${BASE_API_URL}/rooms/${roomId}/status`);
export const updatePlayerStatus = async (roomId: string, userName: string, hp: number): Promise<void> => { fetchData(`${BASE_API_URL}/rooms/${roomId}/status`, { method: 'POST', body: JSON.stringify({ userName, hp }) }, true).catch(() => {}); };
export const nextTurn = async (roomId: string): Promise<any> => fetchData(`${BASE_API_URL}/rooms/${roomId}/next-turn`, { method: 'POST' });
export const leaveRoom = async (roomId: string, userName: string): Promise<void> => { fetchData(`${BASE_API_URL}/rooms/${roomId}/leave`, { method: 'POST', body: JSON.stringify({ userName }) }, true).catch(() => {}); };
export const sendMessage = async (roomId: string, sender: string, text: string): Promise<any> => fetchData(`${BASE_API_URL}/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ sender, text }) }, true);
export const getRoomMessages = async (roomId: string): Promise<any[]> => fetchData<any[]>(`${BASE_API_URL}/rooms/${roomId}/messages`);
export const createRoom = async (roomId: string, hostName: string, password?: string): Promise<any> => fetchData(`${BASE_API_URL}/rooms`, { method: 'POST', body: JSON.stringify({ roomId, hostName, password }) });
export const joinRoom = async (roomId: string, userName: string, hp?: number, password?: string, email?: string): Promise<any> => fetchData(`${BASE_API_URL}/rooms/${roomId}/join`, { method: 'POST', body: JSON.stringify({ userName, email, hp: hp || 100, password }) });

export const attackRaidBoss = async (roomId: string, damage: number, userName: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms/${roomId}/attack-boss`, {
        method: 'POST',
        body: JSON.stringify({ damage, userName })
    });
};

export const endRaid = async (roomId: string): Promise<any> => {
    return fetchData(`${BASE_API_URL}/rooms/${roomId}/end-raid`, { method: 'POST' });
};
