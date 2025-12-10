import { GameEvent } from "../types";

// Base URL for your backend API.
// Dynamically set based on environment.
const BASE_API_URL = 
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://YOUR_DEPLOYED_BACKEND_URL/api'; // <--- !!! DŮLEŽITÉ: Zde musíte nahradit 'https://YOUR_DEPLOYED_BACKEND_URL/api' skutečnou URL vašeho nasazeného backendu !!!

// Utility for fetching data with error handling
const fetchData = async <T>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

/**
 * Fetches all GameEvents for a specific user.
 * @param userEmail The email of the logged-in user.
 * @returns A promise that resolves to an array of GameEvent.
 */
export const getInventory = async (userEmail: string): Promise<GameEvent[]> => {
  if (!userEmail) {
    console.warn("User email is required to fetch inventory.");
    return [];
  }
  const url = `${BASE_API_URL}/inventory/${userEmail}`;
  return fetchData<GameEvent[]>(url);
};

/**
 * Fetches a single GameEvent by its ID for a specific user.
 * @param userEmail The email of the logged-in user.
 * @param cardId The ID of the card to fetch.
 * @returns A promise that resolves to a GameEvent or null if not found.
 */
export const getCardById = async (userEmail: string, cardId: string): Promise<GameEvent | null> => {
  if (!userEmail || !cardId) {
    console.warn("User email and card ID are required to fetch a card.");
    return null;
  }
  const url = `${BASE_API_URL}/inventory/${userEmail}/${cardId}`;
  try {
    return await fetchData<GameEvent>(url);
  } catch (error: any) {
    if (error.message.includes('404')) { // Assuming backend returns 404 for not found
      return null;
    }
    throw error;
  }
};

/**
 * Saves a new GameEvent for a specific user.
 * @param userEmail The email of the logged-in user.
 * @param event The GameEvent to save.
 * @returns A promise that resolves to the saved GameEvent.
 */
export const saveCard = async (userEmail: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail) {
    throw new Error("User email is required to save a card.");
  }
  const url = `${BASE_API_URL}/inventory/${userEmail}`;
  return fetchData<GameEvent>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
};

/**
 * Updates an existing GameEvent for a specific user.
 * @param userEmail The email of the logged-in user.
 * @param cardId The ID of the card to update.
 * @param event The updated GameEvent.
 * @returns A promise that resolves to the updated GameEvent.
 */
export const updateCard = async (userEmail: string, cardId: string, event: GameEvent): Promise<GameEvent> => {
  if (!userEmail || !cardId) {
    throw new Error("User email and card ID are required to update a card.");
  }
  const url = `${BASE_API_URL}/inventory/${userEmail}/${cardId}`;
  return fetchData<GameEvent>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
};

/**
 * Deletes a GameEvent for a specific user.
 * @param userEmail The email of the logged-in user.
 * @param cardId The ID of the card to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteCard = async (userEmail: string, cardId: string): Promise<void> => {
  if (!userEmail || !cardId) {
    throw new Error("User email and card ID are required to delete a card.");
  }
  const url = `${BASE_API_URL}/inventory/${userEmail}/${cardId}`;
  await fetchData<void>(url, {
    method: 'DELETE',
  });
};

/**
 * Proxies a request to the Gemini API via the backend for code interpretation.
 * @param code The code string to interpret.
 * @returns A promise that resolves to the interpreted GameEvent.
 */
export const interpretCode = async (code: string): Promise<GameEvent> => {
  const url = `${BASE_API_URL}/gemini/interpret-code`;
  return fetchData<GameEvent>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
};