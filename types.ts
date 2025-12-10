export enum GameEventType {
  ITEM = 'ITEM',
  ENCOUNTER = 'ENCOUNTER',
  LOCATION = 'LOCATION',
  TRAP = 'TRAP'
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  title: string;
  description: string;
  stats?: {
    label: string;
    value: string | number;
    icon?: string;
  }[];
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  flavorText?: string;
}

export interface ScanHistoryItem extends GameEvent {
  timestamp: number;
}
