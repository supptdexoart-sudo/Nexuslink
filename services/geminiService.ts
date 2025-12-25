
import { GameEvent } from "../types";
import * as apiService from "./apiService"; // Import the new apiService

export const interpretCode = async (code: string): Promise<GameEvent> => {
  try {
    // Proxy the Gemini interpretation request through the backend
    const response = await apiService.interpretCode(code);
    return response;
  } catch (error: unknown) { // Explicitly type error as unknown
    console.error("Gemini API proxy Error:", error);
    // Safely access error.message if it's an Error instance
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // Re-throw the error to be handled by the calling component (e.g., Scanner)
    throw new Error(`Failed to interpret code via backend: ${errorMessage}`);
  }
};