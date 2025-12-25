
export enum GameEventType {
  ITEM = 'PŘEDMĚT',
  ENCOUNTER = 'SETKÁNÍ',
  LOCATION = 'LOKACE',
  TRAP = 'NÁSTRAHA',
  MERCHANT = 'OBCHODNÍK',
  DILEMA = 'DILEMA'
}

export interface Stat {
  label: string;
  value: string | number;
  icon?: string;
}

export interface MerchantItemEntry {
  id: string;
  stock: number;
}

export interface DilemmaOption {
  label: string; // Text on the button (e.g. "Attack", "Run")
  consequenceText: string; // Story result (e.g. "You escaped but lost your honor.")
  physicalInstruction?: string; // Instruction for board game (e.g. "Move back 1 space")
  effectType: 'none' | 'hp' | 'gold';
  effectValue: number; // e.g. -20 or +50
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: GameEventType;
  stats?: Stat[]; 
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  flavorText?: string;
  isShareable?: boolean;
  isConsumable?: boolean; // If true, item is removed upon use
  canBeSaved?: boolean;   // NEW: If true (and consumable), user can choose to Save OR Use. If false, only Use.
  // Merchant & Economy extensions
  price?: number; 
  merchantItems?: MerchantItemEntry[];
  // Dilemma extensions
  dilemmaOptions?: DilemmaOption[];
  // Admin extensions
  qrCodeUrl?: string; // Stored QR code URL for printing purposes
}

export interface ScanHistoryItem extends GameEvent {
  timestamp: number;
}
