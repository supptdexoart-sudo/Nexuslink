
import { GoogleGenAI, Type } from "@google/genai";
import { GameEvent, GameEventType } from "../types";

// Globální deklarace pro process.env, aby TypeScript nehlásil chybu
declare const process: { env: { API_KEY: string } };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const interpretCode = async (code: string): Promise<GameEvent> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Interpretuj tento čárový kód/sériové číslo "${code}" jako unikátní prvek do sci-fi deskové hry Nexus. 
                 Vytvoř zajímavý název, atmosférický popis a herní statistiky.`,
      config: {
        systemInstruction: "Jsi generátor obsahu pro kyberpunkovou deskovou hru. Generuj pouze validní JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { 
              type: Type.STRING, 
              enum: Object.values(GameEventType) 
            },
            rarity: { 
              type: Type.STRING, 
              enum: ['Common', 'Rare', 'Epic', 'Legendary'] 
            },
            stats: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING }
                },
                required: ["label", "value"]
              }
            },
            flavorText: { type: Type.STRING },
            isConsumable: { type: Type.BOOLEAN },
            price: { type: Type.NUMBER }
          },
          required: ["title", "description", "type", "rarity", "stats"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText);
    return {
      ...result,
      id: code,
      canBeSaved: true,
      isShareable: true
    };
  } catch (error) {
    console.error("Gemini Interpretation Error:", error);
    return {
      id: code,
      title: "Neznámý Artefakt",
      description: "Tento kód vykazuje anomálie v datech. Původ neznámý.",
      type: GameEventType.ITEM,
      rarity: "Common",
      stats: [{ label: "HP", value: "+5" }],
      canBeSaved: true
    };
  }
};
