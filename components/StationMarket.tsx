
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEvent, GameEventType, PlayerClass } from '../types';
import { Coins, X, ShoppingCart, Recycle, Hammer, ArrowRight, Zap, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { playSound, vibrate } from '../services/soundService';

interface StationMarketProps {
    onClose: () => void;
    masterCatalog: GameEvent[];
    inventory: GameEvent[];
    playerGold: number;
    playerClass: PlayerClass | null;
    onBuy: (item: GameEvent, price: number) => void;
    onRecycle: (itemToRecycle: GameEvent, rewards: { resource: GameEvent, amount: number }[]) => void;
}

const StationMarket: React.FC<StationMarketProps> = ({ 
    onClose, masterCatalog, inventory, playerGold, playerClass, onBuy, onRecycle 
}) => {
    const [mode, setMode] = useState<'BUY' | 'RECYCLE'>('BUY');
    const [selectedItem, setSelectedItem] = useState<GameEvent | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- BUY LOGIC ---
    const itemsForSale = useMemo(() => {
        return masterCatalog.filter(item => item.marketConfig?.enabled);
    }, [masterCatalog]);

    const getPriceInfo = (item: GameEvent) => {
        const basePrice = item.marketConfig?.marketPrice ?? item.price ?? 100;
        let finalPrice = basePrice;
        let discountLabel = null;

        // 1. Class Modifier
        if (playerClass && item.marketConfig?.classModifiers) {
            const mod = item.marketConfig.classModifiers.find(m => m.playerClass === playerClass);
            if (mod) {
                finalPrice = Math.floor(basePrice * mod.priceMultiplier);
                if (mod.priceMultiplier < 1) discountLabel = `SLEVA TŘÍDY`;
                else if (mod.priceMultiplier > 1) discountLabel = `PŘIRÁŽKA`;
            }
        }

        // 2. Sale Chance (Random Sale Visual - purely visual based on config, or fixed if desired)
        // Here we use the config value. If saleChance > 0, we treat it as "ON SALE" visually
        // In a real app, you might want to salt this with the date so it stays consistent for the day.
        const isOnSale = (item.marketConfig?.saleChance || 0) > 0;
        
        return { finalPrice, discountLabel, isOnSale };
    };

    const handleBuy = () => {
        if (!selectedItem || isProcessing) return;
        const { finalPrice } = getPriceInfo(selectedItem);
        
        if (playerGold < finalPrice) {
            playSound('error');
            vibrate(200);
            return;
        }

        setIsProcessing(true);
        playSound('success'); // Cash register sound
        vibrate([50, 50]);

        setTimeout(() => {
            onBuy(selectedItem, finalPrice);
            setIsProcessing(false);
            setSelectedItem(null);
        }, 1000);
    };

    // --- RECYCLE LOGIC ---
    const recyclableItems = useMemo(() => {
        return inventory.filter(item => 
            item.marketConfig?.recyclingOutput && item.marketConfig.recyclingOutput.length > 0
        );
    }, [inventory]);

    const getRecycleRewards = (item: GameEvent) => {
        if (!item.marketConfig?.recyclingOutput) return [];
        
        return item.marketConfig.recyclingOutput.map(out => {
            // Find resource template in master catalog
            const resourceTemplate = masterCatalog.find(
                i => (i.resourceConfig?.isResourceContainer && i.resourceConfig.resourceName === out.resourceName) || i.title === out.resourceName
            );
            
            if (!resourceTemplate) return null;

            return {
                resource: resourceTemplate,
                amount: out.amount
            };
        }).filter((r): r is { resource: GameEvent, amount: number } => r !== null);
    };

    const handleRecycleAction = () => {
        if (!selectedItem || isProcessing) return;
        const rewards = getRecycleRewards(selectedItem);
        if (rewards.length === 0) return;

        setIsProcessing(true);
        playSound('damage'); // Crunch sound
        vibrate([100, 50, 100, 50, 200]);

        setTimeout(() => {
            onRecycle(selectedItem, rewards);
            setIsProcessing(false);
            setSelectedItem(null);
            playSound('success'); // Result sound
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-[220] bg-black text-white font-sans overflow-hidden flex flex-col">
            
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"></div>
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #000 0, #000 40px, #111 40px, #111 41px)' }}></div>

            {/* HEADER - NEON SIGN */}
            <div className="relative z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 bg-zinc-900/50 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                        <X className="w-6 h-6 text-zinc-400" />
                    </button>
                    <div className="flex flex-col">
                        <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none transition-colors duration-500 ${mode === 'BUY' ? 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]'}`}>
                            {mode === 'BUY' ? 'TRŽIŠTĚ' : 'LINKA'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${mode === 'BUY' ? 'bg-cyan-500' : 'bg-orange-500'}`}></span>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-[0.3em]">
                                {mode === 'BUY' ? 'SEKTOR_OBCHOD' : 'RECYKLAČNÍ_PROTOKOL'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* WALLET */}
                <div className="bg-black/60 border border-yellow-500/30 px-4 py-2 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="text-xl font-mono font-black text-yellow-500 tracking-wider">{playerGold}</span>
                </div>
            </div>

            {/* MAIN AREA - SHELVES (BUY) or CONVEYOR (RECYCLE) */}
            <div className="flex-1 relative overflow-y-auto no-scrollbar p-6 pb-48">
                
                {mode === 'BUY' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 pt-4">
                        {itemsForSale.map((item) => {
                            const { finalPrice, discountLabel, isOnSale } = getPriceInfo(item);
                            const canAfford = playerGold >= finalPrice;

                            return (
                                <motion.button
                                    key={item.id}
                                    onClick={() => { setSelectedItem(item); playSound('click'); }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative flex flex-col items-center"
                                >
                                    {/* NEON "AKCE" SIGN */}
                                    {isOnSale && (
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 bg-black/80 border border-pink-500 px-2 py-0.5 rounded shadow-[0_0_10px_#ec4899] animate-pulse">
                                            <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">AKCE!</span>
                                        </div>
                                    )}

                                    {/* ITEM ON SHELF */}
                                    <div className={`relative w-full aspect-square bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-2 ${canAfford ? 'group-hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] group-hover:border-cyan-500/50' : 'opacity-60 grayscale'}`}>
                                        <Package className={`w-16 h-16 ${canAfford ? 'text-zinc-300' : 'text-zinc-600'}`} strokeWidth={1} />
                                        
                                        {/* Price Tag */}
                                        <div className={`absolute -bottom-3 right-2 px-2 py-1 bg-black border ${canAfford ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'} rounded text-xs font-mono font-bold shadow-lg flex items-center gap-1`}>
                                            {finalPrice} <Coins className="w-3 h-3" />
                                        </div>
                                    </div>

                                    {/* SHELF BASE */}
                                    <div className="w-[120%] h-4 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 mt-2 rounded-sm shadow-[0_10px_20px_black] relative z-0">
                                        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10"></div>
                                    </div>

                                    <div className="mt-3 text-center">
                                        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wide line-clamp-1 group-hover:text-white">{item.title}</h3>
                                        {discountLabel && <p className="text-[9px] text-yellow-500 font-mono uppercase">{discountLabel}</p>}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                )}

                {mode === 'RECYCLE' && (
                    <div className="space-y-4">
                        {recyclableItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 gap-4">
                                <Recycle className="w-16 h-16 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest text-center">Žádný recyklovatelný odpad<br/>v batohu.</p>
                            </div>
                        ) : (
                            recyclableItems.map(item => (
                                <motion.button
                                    key={item.id}
                                    onClick={() => { setSelectedItem(item); playSound('click'); }}
                                    className="w-full bg-zinc-900/50 border border-white/5 hover:border-orange-500/50 p-4 rounded-xl flex items-center gap-4 group transition-all active:scale-95 text-left"
                                >
                                    <div className="w-12 h-12 bg-black border border-zinc-800 rounded-lg flex items-center justify-center group-hover:border-orange-500/30">
                                        <Package className="w-6 h-6 text-zinc-500 group-hover:text-orange-500 transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide group-hover:text-white">{item.title}</h3>
                                        <p className="text-[10px] text-zinc-500 font-mono mt-1 line-clamp-1">{item.description}</p>
                                    </div>
                                    <div className="text-orange-500/50 group-hover:text-orange-500">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                )}

            </div>

            {/* BOTTOM DESK / COUNTER */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#1a1a1a] border-t-8 border-[#333] shadow-[0_-10px_50px_black] z-20 flex items-center justify-center px-6">
                {/* Visual texture of the counter */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h20v20H0V0zm10 10h10v10H10V10zM0 10h10v10H0V10z\' fill=\'%23fff\' fill-opacity=\'0.1\'/%3E%3C/svg%3E")' }}></div>
                
                {/* MODE SWITCHER (If no item selected) */}
                {!selectedItem && (
                    <div className="flex gap-4 w-full max-w-sm relative z-10 -mt-10">
                        <button 
                            onClick={() => { setMode('BUY'); playSound('click'); }}
                            className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${mode === 'BUY' ? 'bg-zinc-900 border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] -translate-y-2' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Nákup</span>
                        </button>
                        <button 
                            onClick={() => { setMode('RECYCLE'); playSound('click'); }}
                            className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${mode === 'RECYCLE' ? 'bg-zinc-900 border-orange-500 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.2)] -translate-y-2' : 'bg-black border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
                        >
                            <Recycle className="w-6 h-6" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Drtička</span>
                        </button>
                    </div>
                )}
            </div>

            {/* TRANSACTION OVERLAY (The "On Counter" View) */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 z-30 bg-[#111] border-t border-white/10 rounded-t-3xl p-6 shadow-2xl h-[45vh] flex flex-col"
                    >
                        <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/10">
                            <X className="w-5 h-5 text-white" />
                        </button>

                        <div className="flex-1 flex flex-col items-center text-center pt-2">
                            {isProcessing ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    {mode === 'BUY' ? (
                                        <div className="relative">
                                            <DollarSign className="w-16 h-16 text-cyan-500 animate-bounce" />
                                            <div className="absolute inset-0 bg-cyan-500/30 blur-xl animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Hammer className="w-16 h-16 text-orange-500 animate-spin-slow" />
                                            <div className="absolute inset-0 bg-orange-500/30 blur-xl animate-pulse"></div>
                                        </div>
                                    )}
                                    <p className="text-xs font-mono uppercase tracking-[0.3em] font-bold animate-pulse">
                                        {mode === 'BUY' ? 'Zpracování Platby...' : 'Probíhá Skartace...'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-1">{selectedItem.title}</h3>
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase mb-6 tracking-widest">{selectedItem.rarity} • {selectedItem.type}</p>
                                    
                                    {mode === 'BUY' ? (
                                        <div className="space-y-6 w-full max-w-xs">
                                            <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                                <span className="text-xs font-bold text-zinc-400 uppercase">Cena</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xl font-mono font-black ${playerGold >= getPriceInfo(selectedItem).finalPrice ? 'text-yellow-500' : 'text-red-500'}`}>
                                                        {getPriceInfo(selectedItem).finalPrice}
                                                    </span>
                                                    <Coins className="w-5 h-5 text-yellow-500" />
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={handleBuy}
                                                disabled={playerGold < getPriceInfo(selectedItem).finalPrice}
                                                className={`w-full py-4 font-black uppercase text-sm tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${playerGold >= getPriceInfo(selectedItem).finalPrice ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                                            >
                                                {playerGold >= getPriceInfo(selectedItem).finalPrice ? 'KOUPIT' : 'NEDOSTATEK ZLATA'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 w-full max-w-xs">
                                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-left">
                                                <p className="text-[10px] font-bold text-orange-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                                    <Zap className="w-3 h-3" /> Výstup Recyklace
                                                </p>
                                                <div className="space-y-2">
                                                    {getRecycleRewards(selectedItem).map((rew, i) => (
                                                        <div key={i} className="flex justify-between items-center text-xs">
                                                            <span className="text-zinc-300 font-mono">{rew.resource.title}</span>
                                                            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded">x{rew.amount}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                                <p className="text-[9px] text-red-400 leading-tight">VAROVÁNÍ: Předmět bude trvale zničen.</p>
                                            </div>

                                            <button 
                                                onClick={handleRecycleAction}
                                                className="w-full py-4 font-black uppercase text-sm tracking-[0.3em] rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20"
                                            >
                                                RECYKLOVAT
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default StationMarket;
