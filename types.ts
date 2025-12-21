
export enum GameEventType {
  ITEM = 'PŘEDMĚT',
  ENCOUNTER = 'SETKÁNÍ',
  TRAP = 'NÁSTRAHA',
  MERCHANT = 'OBCHODNÍK',
  DILEMA = 'DILEMA',
  BOSS = 'BOSS',
  SPACE_STATION = 'VESMÍRNÁ_STANICE'
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
  price?: number;
  sellPrice?: number;
}

export interface DilemmaReward {
    type: 'HP' | 'GOLD' | 'MANA' | 'XP';
    value: number;
}

export interface DilemmaOption {
  label: string; 
  
  // Success Scenarion
  successChance: number; // 0-100
  consequenceText: string; 
  rewards?: DilemmaReward[]; // List of effects on success

  // Legacy / Simple effect support
  effectType?: string;
  effectValue?: number;

  // Fail Scenario
  failMessage?: string;
  failDamage?: number; // DMG on fail

  physicalInstruction?: string; 
}

export interface BossPhase {
    triggerType: 'TURN' | 'HP_PERCENT';
    triggerValue: number;
    name: string;
    description: string;
    damageBonus: number;
}

export interface MerchantTradeConfig {
    warriorDiscount: number;
    clericDiscount: number;
    mageDiscount: number;
    rogueStealChance: number;
}

export interface TrapConfig {
    difficulty: number; 
    damage: number; 
    disarmClass: PlayerClass | 'ANY'; 
    successMessage: string;
    failMessage: string;
}

export interface EnemyLoot {
    goldReward: number;
    xpReward: number;
    dropItemChance: number; 
    dropItemId?: string; 
}

export interface StationConfig {
    o2RefillPrice: number;
    armorRepairPrice: number;
    energyRechargePrice: number;
    welcomeMessage: string;
}

export interface ResourceConfig {
    isResourceContainer: boolean;
    resourceName: string;
    resourceAmount: number;
    customLabel?: string; // Vlastní nápis sekce (např. "Palivová Nádrž" místo "Surovina k Těžbě")
}

export interface TimeVariant {
    enabled: boolean;
    nightTitle?: string;
    nightDescription?: string;
    nightType?: GameEventType;
    nightStats?: Stat[];
}

export interface ClassVariant {
    overrideTitle?: string;
    overrideDescription?: string;
    overrideType?: GameEventType;
    bonusStats?: Stat[];
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
  isLocked?: boolean; // Bezpečnostní pojistka proti smazání
  
  price?: number; 
  
  canSellToMerchant?: boolean; 
  tradeConfig?: MerchantTradeConfig; 
  merchantItems?: MerchantItemEntry[]; 
  
  dilemmaScope?: 'INDIVIDUAL' | 'GLOBAL'; 
  dilemmaOptions?: DilemmaOption[]; 
  
  bossPhases?: BossPhase[]; 
  
  trapConfig?: TrapConfig; 
  enemyLoot?: EnemyLoot; 

  stationConfig?: StationConfig;
  
  resourceConfig?: ResourceConfig; // Konfigurace surovin

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
