
export enum GameEventType {
  ITEM = 'PŘEDMĚT',
  ENCOUNTER = 'SETKÁNÍ',
  LOCATION = 'LOKACE',
  TRAP = 'NÁSTRAHA',
  MERCHANT = 'OBCHODNÍK',
  DILEMA = 'DILEMA',
  BOSS = 'BOSS'
}

export enum PlayerClass {
  WARRIOR = 'Válečník',
  MAGE = 'Mág',
  ROGUE = 'Zloděj',
  CLERIC = 'Kněz'
}

export interface Stat {
  label: string;
  value: string | number;
  icon?: string;
}

export interface MerchantItemEntry {
  id: string;
  stock: number;
  price?: number; // Cena za kterou hráč nakupuje
  sellPrice?: number; // Cena za kterou hráč prodává (výkupní cena)
}

export interface DilemmaOption {
  label: string; 
  consequenceText: string; 
  physicalInstruction?: string; 
  effectType: 'none' | 'hp' | 'gold';
  effectValue: number; 
}

export interface BossPhase {
    triggerType: 'TURN' | 'HP_PERCENT';
    triggerValue: number;
    name: string;
    description: string;
    damageBonus: number; // Extra damage this turn/phase
}

// NEW: Merchant Class Config
export interface MerchantTradeConfig {
    warriorDiscount: number; // % Discount for Warriors
    clericDiscount: number; // % Discount for Clerics (on healing items)
    mageDiscount: number; // % Discount for Mages (on consumables)
    rogueStealChance: number; // % Chance to steal extra item
}

// NEW: Night Variant definition
export interface TimeVariant {
    enabled: boolean;
    nightTitle?: string;
    nightDescription?: string;
    nightType?: GameEventType;
    nightStats?: Stat[]; // Stats that replace base stats at night
}

// NEW: Class Variant definition
export interface ClassVariant {
    overrideTitle?: string;
    overrideDescription?: string;
    overrideType?: GameEventType;
    bonusStats?: Stat[]; // These are ADDED to base stats or replace them? Let's say Replace for simplicity/control
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
  isConsumable?: boolean; 
  canBeSaved?: boolean;   
  price?: number; 
  canSellToMerchant?: boolean; 
  tradeConfig?: MerchantTradeConfig; // NEW: Config for merchant bonuses
  dilemmaScope?: 'INDIVIDUAL' | 'GLOBAL'; 
  merchantItems?: MerchantItemEntry[];
  dilemmaOptions?: DilemmaOption[];
  bossPhases?: BossPhase[]; 
  timeVariant?: TimeVariant; 
  classVariants?: Partial<Record<PlayerClass, ClassVariant>>; 
  qrCodeUrl?: string; 
}

export interface ScanHistoryItem extends GameEvent {
  timestamp: number;
}

export interface RaidState {
    isActive: boolean;
    bossName: string;
    bossId: string;
    maxHp: number;
    currentHp: number;
    turnIndex: number; 
    combatLog: string[];
}
