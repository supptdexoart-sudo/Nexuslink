
import React from 'react';
import { GameEvent, GameEventType, PlayerClass } from '../types';
import { Box, ShoppingBag, BookOpen, Crown, Ghost, RefreshCw, Loader2, Database, Gift, X, Moon, Sun, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface InventoryViewProps {
    inventory: GameEvent[];
    loadingInventory: boolean;
    isRefreshing: boolean;
    isAdmin: boolean;
    isNight: boolean;
    adminNightOverride: boolean | null;
    playerClass: PlayerClass | null;
    giftTarget: string | null;
    onRefresh: () => void;
    onToggleNightOverride: () => void;
    onCancelGift: () => void;
    onItemClick: (event: GameEvent) => void;
    getAdjustedItem: (item: GameEvent, isNight: boolean, pClass: PlayerClass | null) => GameEvent;
}

const getRarityColor = (rarity: string, type: string) => {
    if (type === GameEventType.BOSS) return 'border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.5)] bg-red-950/20';
    if (type === GameEventType.TRAP || type === GameEventType.ENCOUNTER) return 'border-red-500 shadow-red-900/20';
    if (type === GameEventType.DILEMA) return 'border-neon-purple shadow-neon-purple/20';
    switch (rarity) {
        case 'Legendary': return 'border-yellow-500 shadow-yellow-900/30 bg-yellow-950/10';
        case 'Epic': return 'border-purple-500 shadow-purple-900/30 bg-purple-950/10';
        case 'Rare': return 'border-blue-500 shadow-blue-900/30 bg-blue-950/10';
        default: return 'border-zinc-700 shadow-zinc-900/50 bg-zinc-900/50';
    }
};

const getEventIcon = (type: GameEventType) => {
    switch (type) {
        case GameEventType.BOSS: return <Crown className="w-5 h-5 text-yellow-500" />;
        case GameEventType.ITEM: return <Box className="w-5 h-5" />;
        case GameEventType.MERCHANT: return <ShoppingBag className="w-5 h-5" />;
        default: return <BookOpen className="w-5 h-5" />; // Simplified fallback
    }
};

const InventoryView: React.FC<InventoryViewProps> = ({
    inventory, loadingInventory, isRefreshing, isAdmin, isNight, adminNightOverride, playerClass, giftTarget,
    onRefresh, onToggleNightOverride, onCancelGift, onItemClick, getAdjustedItem
}) => {

    const renderInventorySection = (title: string, items: GameEvent[], icon: React.ReactNode) => {
        const displayTimeIsNight = adminNightOverride !== null ? adminNightOverride : isNight;
        const displayedItems = items.map(item => getAdjustedItem(item, displayTimeIsNight, playerClass));
  
        if (displayedItems.length === 0) return null;
        return (
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                    <div className="text-neon-blue">{icon}</div>
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest text-zinc-300">{title}</h3>
                    <span className="text-[10px] text-zinc-600 font-mono bg-zinc-900 px-2 rounded-full">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 content-start">
                    {displayedItems.map((event) => (
                        <motion.div
                            key={event.id}
                            layoutId={event.id}
                            onClick={() => onItemClick(event)}
                            whileTap={{ scale: 0.96 }}
                            className={`
                                relative rounded-xl p-3 flex flex-col gap-2 overflow-hidden backdrop-blur-sm border
                                ${getRarityColor(event.rarity, event.type)}
                                ${giftTarget && !event.isShareable ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                                transition-all duration-200 hover:scale-[1.02]
                            `}
                        >
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 ${event.rarity === 'Legendary' ? 'text-yellow-500' : 'text-zinc-400'}`}>
                                    {getEventIcon(event.type)}
                                </div>
                                {event.isConsumable && (
                                    <div className="bg-red-500/80 p-1 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                                        <Ghost className="w-3 h-3 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="mt-auto relative z-10">
                                <h3 className="font-display font-bold text-sm leading-tight text-white mb-1 line-clamp-2">{event.title}</h3>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{event.type}</span>
                                    {/* Price display removed from Inventory per request */}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col p-4 bg-zinc-950 overflow-hidden">
            {/* GIFT MODE BANNER */}
            {giftTarget && (
                <div className="mb-4 bg-neon-purple/20 border border-neon-purple p-3 rounded-lg flex justify-between items-center animate-pulse">
                    <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-neon-purple" />
                            <div>
                                <p className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">Režim Darování</p>
                                <p className="text-xs text-white">Vyberte předmět pro: <span className="font-bold">{giftTarget}</span></p>
                            </div>
                    </div>
                    <button onClick={onCancelGift} className="bg-zinc-900 p-2 rounded hover:bg-zinc-800">
                        <X className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            )}

            <div className="flex justify-between items-end mb-6 px-1">
                <div>
                    <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 drop-shadow-sm">Inventář</h2>
                    <div className="h-1 w-20 bg-neon-blue rounded-full shadow-[0_0_10px_#00f3ff]"></div>
                </div>
                
                <div className="flex gap-2">
                    {/* ADMIN TOGGLE */}
                    {isAdmin && (
                        <button 
                            onClick={onToggleNightOverride}
                            className="p-2 bg-zinc-900 border border-indigo-500/50 rounded-lg text-indigo-400 hover:text-white hover:bg-indigo-900/30 transition-all flex items-center gap-2"
                            title="Přepnout náhled Den/Noc"
                        >
                            {(adminNightOverride === true) ? <Moon className="w-5 h-5" /> : (adminNightOverride === false) ? <Sun className="w-5 h-5 text-orange-400" /> : <Eye className="w-5 h-5" />}
                            <span className="text-[10px] font-bold uppercase hidden sm:inline">
                                {(adminNightOverride === true) ? "Noc" : (adminNightOverride === false) ? "Den" : "Live"}
                            </span>
                        </button>
                    )}

                    <button 
                        onClick={onRefresh} 
                        disabled={isRefreshing}
                        className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-neon-blue hover:text-white transition-colors shadow-lg"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            
            {loadingInventory ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-neon-blue" />
                    <span className="text-sm font-mono uppercase tracking-widest font-bold text-neon-blue animate-pulse">Načítám Data...</span>
                </div>
            ) : inventory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 opacity-50">
                    <Database className="w-20 h-20 mb-4 text-zinc-800" />
                    <p className="font-mono text-sm uppercase tracking-widest">Žádná data</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pb-24 px-1 no-scrollbar">
                    {/* KATEGORIE 1: BOSSOVÉ */}
                    {renderInventorySection(
                        "Raid Bossové & Titáni", 
                        inventory.filter(i => i.type === GameEventType.BOSS), 
                        <Crown className="w-5 h-5 text-yellow-500"/>
                    )}

                    {/* KATEGORIE 2: PŘEDMĚTY */}
                    {renderInventorySection(
                        "Vybavení & Předměty", 
                        inventory.filter(i => i.type === GameEventType.ITEM), 
                        <Box className="w-5 h-5"/>
                    )}
                    
                    {/* KATEGORIE 3: OBCHODNÍCI */}
                    {renderInventorySection(
                        "Obchodníci & Služby", 
                        inventory.filter(i => i.type === GameEventType.MERCHANT), 
                        <ShoppingBag className="w-5 h-5"/>
                    )}

                    {/* KATEGORIE 4: OSTATNÍ */}
                    {renderInventorySection(
                        "Příběh & Události", 
                        inventory.filter(i => i.type !== GameEventType.ITEM && i.type !== GameEventType.MERCHANT && i.type !== GameEventType.BOSS), 
                        <BookOpen className="w-5 h-5"/>
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryView;
