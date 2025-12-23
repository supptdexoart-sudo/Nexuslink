
export enum GameEventType {
  ITEM = 'PŘEDMĚT',
  ENCOUNTER = 'SETKÁNÍ',
  TRAP = 'NÁSTRAHA',
  MERCHANT = 'OBCHODNÍK',
  DILEMA = 'DILEMA',
  BOSS = 'BOSS',
  SPACE_STATION = 'VESMÍRNÁ_STANICE',
  PLANET = 'PLANETA'
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
    fuelReward: number;     // Kolik paliva se doplní (např. 50)
    repairAmount: number;   // Kolik HP/Hull se opraví (např. 30)
    refillO2: boolean;      // Zda doplnit O2 na 100% (true)
    welcomeMessage: string;
}

export interface ResourceConfig {
    isResourceContainer: boolean;
    resourceName: string;
    resourceAmount: number;
    customLabel?: string; // Vlastní nápis sekce (např. "Palivová Nádrž" místo "Surovina k Těžbě")
}

export interface CraftingRecipe {
    enabled: boolean;
    requiredResources: {
        resourceName: string;
        amount: number;
    }[];
    craftingTimeSeconds: number;
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

// --- PLANET CONFIG ---
export interface PlanetLayer {
    requiredProgress: number; // e.g., 33, 66, 100
    logText: string; // "Senzory detekují atmosféru..."
}

export interface PlanetConfig {
    realName: string; // "Kepler-186f" (Viditelné až po 100%)
    unknownName: string; // "Anomálie #8932" (Viditelné na začátku)
    planetType: 'HABITABLE' | 'BARREN' | 'ANOMALY' | 'COLONY';
    scanCost: number; // Cena za sken (Palivo/Energie)
    scanProgressPerAction: number; // Kolik % přidá jeden sken (např. 10 nebo 34)
    layers: PlanetLayer[];
    finalReward?: {
        gold: number;
        xp: number;
        itemRewardId?: string;
    };
}

export interface RecycleOutput {
    resourceName: string; // ID suroviny (např. "Kovový šrot")
    amount: number;
}

export interface ClassMarketModifier {
    playerClass: PlayerClass;
    priceMultiplier: number; // 0.8 = 20% sleva, 1.2 = 20% přirážka
}

export interface MarketConfig {
    enabled: boolean;
    marketPrice?: number; // Override standardní ceny
    saleChance: number; // 0-100% šance, že bude v akci
    classModifiers: ClassMarketModifier[];
    recyclingOutput: RecycleOutput[];
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
  craftingRecipe?: CraftingRecipe; // Konfigurace výroby
  
  marketConfig?: MarketConfig; // Konfigurace tržiště a recyklace
  
  planetConfig?: PlanetConfig; // Konfigurace planety
  discoveryProgress?: number; // Uloženo u uživatele (0-100)

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
