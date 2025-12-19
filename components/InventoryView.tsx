import React, { useState, useMemo } from 'react';
import { GameEvent, GameEventType, PlayerClass } from '../types';
import { Box, ShoppingBag, BookOpen, Crown, RefreshCw, Loader2, Database, Gift, X, Cpu, Swords, AlertTriangle, Sun, Moon, Lock, Unlock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../services/soundService';

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
    onToggleLock?: (id: string) => void;
    onDeleteItem?: (id: string) => void;
}

const getRarityConfig = (rarity: string, type: string) => {
    if (type === GameEventType.BOSS) return { border: 'border-signal-hazard shadow-[0_0_15px_rgba(255,60,60,0.3)]', text: 'text-signal-hazard', label: 'BOSS_LEVEL' };
    switch (rarity) {
        case 'Legendary': return { border: 'border-signal-amber shadow-[0_0_15px_rgba(255,157,0,0.4)]', text: 'text-signal-amber', label: 'LEGENDÁRNÍ' };
        case 'Epic': return { border: 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]', text: 'text-purple-400', label: 'EPICKÉ' };
        case 'Rare': return { border: 'border-signal-cyan shadow-[0_0_10px_rgba(0,242,255,0.2)]', text: 'text-signal-cyan', label: 'VZÁCNÉ' };
        default: return { border: 'border-white/20', text: 'text-white/40', label: 'BĚŽNÉ' };
    }
};

const getEventIcon = (type: GameEventType) => {
    switch (type) {
        case GameEventType.BOSS: return <Crown className="w-4 h-4" />;
        case GameEventType.ITEM: return <Box className="w-4 h-4" />;
        case GameEventType.MERCHANT: return <ShoppingBag className="w-4 h-4" />;
        case GameEventType.TRAP: return <AlertTriangle className="w-4 h-4" />;
        case GameEventType.ENCOUNTER: return <Swords className="w-4 h-4" />;
        default: return <BookOpen className="w-4 h-4" />;
    }
};

const InventoryView: React.FC<InventoryViewProps> = ({
    inventory, loadingInventory, isRefreshing, isAdmin, isNight, adminNightOverride, playerClass, giftTarget,
    onRefresh, onToggleNightOverride, onCancelGift, onItemClick, getAdjustedItem, onToggleLock, onDeleteItem
}) => {
    const [flippingId, setFlippingId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<GameEventType | 'ALL' | 'OTHERS'>('ALL');

    const handleCardClick = (event: GameEvent) => {
        if (giftTarget && !event.isShareable) return;
        playSound('click');
        setFlippingId(event.id);
        setTimeout(() => {
            onItemClick(event);
            setFlippingId(null);
        }, 300);
    };

    const handleLockToggle = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggleLock) onToggleLock(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string, isLocked?: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLocked) {
            playSound('error');
            return;
        }
        if (window.confirm(`Smazat asset ${id}? Operace je NEVRATNÁ.`)) {
            if (onDeleteItem) {
                onDeleteItem(id);
            }
        }
    };

    const displayTimeIsNight = adminNightOverride !== null ? adminNightOverride : isNight;

    const filteredInventory = useMemo(() => {
        if (selectedCategory === 'ALL') return inventory;
        if (selectedCategory === 'OTHERS') {
            return inventory.filter(i => i.type !== GameEventType.ITEM && i.type !== GameEventType.MERCHANT && i.type !== GameEventType.BOSS);
        }
        return inventory.filter(item => item.type === selectedCategory);
    }, [inventory, selectedCategory]);

    const categories = [
        { id: 'ALL', label: 'Vše', icon: Database },
        { id: GameEventType.BOSS, label: 'Boss', icon: Crown },
        { id: GameEventType.ITEM, label: 'Předmět', icon: Box },
        { id: GameEventType.MERCHANT, label: 'Obchod', icon: ShoppingBag },
        { id: 'OTHERS', label: 'Akce', icon: Swords },
    ];

    const renderInventorySection = (title: string, items: GameEvent[]) => {
        const displayedItems = items.map(item => getAdjustedItem(item, displayTimeIsNight, playerClass));
  
        if (displayedItems.length === 0) return null;
        return (
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-6 border-l-2 border-signal-cyan pl-4">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-signal-cyan">{title}</h3>
                    <span className="text-[10px] font-mono text-white font-bold bg-white/5 px-2 py-0.5 border border-white/10 rounded">{items.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {displayedItems.map((event, idx) => {
                        const isFlipping = flippingId === event.id;
                        const config = getRarityConfig(event.rarity, event.type);
                        const isLocked = event.isLocked;

                        return (
                            <div key={event.id} className="relative h-48 md:h-56">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.01, ease: "easeOut" }}
                                    onClick={() => handleCardClick(event)}
                                    className={`relative w-full h-full cursor-pointer transition-transform duration-300 ${isFlipping ? 'scale-90' : 'active:scale-95'}`}
                                >
                                    <div className={`tactical-card h-full flex flex-col justify-between p-4 bg-black/40 border-t-2 ${config.border}`}>
                                        <div className="corner-accent top-left !w-2 !h-2 opacity-30"></div>
                                        
                                        <div className="flex justify-between items-start mb-2">
                                            <div className={`${config.text} bg-white/5 p-1.5 rounded-lg`}>
                                                {getEventIcon(event.type)}
                                            </div>
                                            {isAdmin && (
                                                <div className="flex items-center gap-2 z-50">
                                                    <button 
                                                        onClick={(e) => handleLockToggle(e, event.id)}
                                                        className={`p-2 rounded-md transition-all z-50 ${isLocked ? 'text-signal-hazard bg-signal-hazard/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDelete(e, event.id, isLocked)}
                                                        className={`p-2 rounded-md transition-all z-50 ${isLocked ? 'text-white/5 cursor-not-allowed' : 'text-zinc-400 bg-zinc-800 hover:text-white hover:bg-red-600'}`}
                                                        disabled={isLocked}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                            {!isAdmin && <span className="text-[8px] font-mono text-white/20 uppercase font-black tracking-widest">{event.id.slice(-4)}</span>}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center">
                                            <h3 className="font-bold text-[11px] leading-tight text-white uppercase tracking-tight mb-2 line-clamp-2 font-sans">{event.title}</h3>
                                            <p className="text-[8px] text-white/40 font-mono line-clamp-2 leading-relaxed uppercase tracking-tighter">{event.description}</p>
                                        </div>

                                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                            <span className={`text-[8px] font-mono uppercase font-black tracking-[0.2em] ${config.text}`}>{config.label}</span>
                                            {event.price && <span className="text-[10px] text-signal-amber font-mono font-black">{event.price}₪</span>}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="absolute inset-0 w-full h-full flex flex-col p-6 bg-[#0a0b0d] overflow-hidden">
            <AnimatePresence>
                {giftTarget && (
                    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="mb-6 tactical-card border-signal-cyan/40 p-4 flex justify-between items-center z-20 bg-signal-cyan/5">
                        <div className="flex items-center gap-4">
                            <Gift className="w-6 h-6 text-signal-cyan" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-signal-cyan uppercase tracking-[0.3em] animate-pulse">PROTOKOL_PŘENOSU</span>
                                <span className="text-xs text-white font-mono font-bold">CÍL: {giftTarget}</span>
                            </div>
                        </div>
                        <button onClick={onCancelGift} className="p-2 text-white/30 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-start mb-4 relative z-20">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-sans chromatic-text leading-none">DATABÁZE</h2>
                    <div className="flex items-center gap-3 mt-1.5">
                      <Database className="w-4 h-4 text-signal-cyan/50" />
                      <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-[0.4em]">Centrální_Repozitář</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button 
                            onClick={onToggleNightOverride}
                            className={`p-3 tactical-card border-white/10 transition-all active:scale-90 ${displayTimeIsNight ? 'bg-indigo-900/40 text-indigo-400 border-indigo-500/50' : 'bg-amber-900/40 text-amber-500 border-amber-500/50'}`}
                        >
                            {displayTimeIsNight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </button>
                    )}
                    <button onClick={() => onRefresh()} disabled={isRefreshing} className="p-3 tactical-card bg-white/5 border-white/10 hover:border-signal-cyan transition-all active:scale-90 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 text-signal-cyan ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 relative z-20 pb-1">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setSelectedCategory(cat.id as any);
                            playSound('click');
                        }}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            // Fix: Použití stavu selectedCategory místo setteru setSelectedCategory pro porovnání aktivní kategorie
                            selectedCategory === cat.id 
                            ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan shadow-[0_0_8px_rgba(0,242,255,0.2)]' 
                            : 'bg-white/5 border-white/10 text-white/30 hover:border-white/20'
                        }`}
                    >
                        <cat.icon className="w-2.5 h-2.5" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {loadingInventory ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-signal-cyan/30" />
                        <Cpu className="w-8 h-8 text-signal-cyan absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-signal-cyan tracking-[0.5em] animate-pulse">DOTAZOVÁNÍ_CENTRÁLNÍHO_TREZORU...</span>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pb-24 no-scrollbar relative z-10">
                    <AnimatePresence mode="popLayout">
                        {filteredInventory.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                            <Database className="w-20 h-20 text-white/5 mb-6" />
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold uppercase tracking-widest text-white/60">Prázdný_Sektor</h3>
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] leading-relaxed text-white/20 font-mono">
                                    V této kategorii se momentálně nenachází žádná data.
                                </p>
                            </div>
                        </div>
                        ) : (
                        <div className="space-y-8">
                            { (selectedCategory === 'ALL' || selectedCategory === GameEventType.BOSS) && 
                                renderInventorySection("TŘÍDA: BOSS", filteredInventory.filter(i => i.type === GameEventType.BOSS)) }
                            { (selectedCategory === 'ALL' || selectedCategory === GameEventType.ITEM) && 
                                renderInventorySection("TŘÍDA: VYBAVENÍ", filteredInventory.filter(i => i.type === GameEventType.ITEM)) }
                            { (selectedCategory === 'ALL' || selectedCategory === GameEventType.MERCHANT) && 
                                renderInventorySection("TŘÍDA: OBCHODNÍK", filteredInventory.filter(i => i.type === GameEventType.MERCHANT)) }
                            { (selectedCategory === 'ALL' || selectedCategory === 'OTHERS') && 
                                renderInventorySection("TŘÍDA: TAKTICKÉ_OPERACE", filteredInventory.filter(i => i.type !== GameEventType.ITEM && i.type !== GameEventType.MERCHANT && i.type !== GameEventType.BOSS)) }
                        </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default InventoryView;