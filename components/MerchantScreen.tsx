
import React, { useState, useEffect } from 'react';
import { GameEvent, GameEventType, PlayerClass } from '../types';
import { ShoppingBag, Coins, X, Loader2, Package, Ban, ArrowRightLeft, DollarSign, Brain, Sword, Cross, Wand2, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as apiService from '../services/apiService';
import { playSound } from '../services/soundService';

interface MerchantScreenProps {
    merchant: GameEvent;
    userGold: number;
    adminEmail: string;
    inventory?: GameEvent[]; 
    playerClass: PlayerClass | null; // Added
    onClose: () => void;
    onBuy: (item: GameEvent) => void;
    onSell?: (item: GameEvent, price: number) => void; 
    onAddFreeItem?: (item: GameEvent) => void; // For Rogue stealing
}

const MerchantScreen: React.FC<MerchantScreenProps> = ({ merchant, userGold, adminEmail, inventory, playerClass, onClose, onBuy, onSell, onAddFreeItem }) => {
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    const [shopItems, setShopItems] = useState<GameEvent[]>([]);
    // Track stock locally for this session: { itemId: quantity }
    const [stockLevels, setStockLevels] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);
    const [rogueMessage, setRogueMessage] = useState<string | null>(null);

    // Appraisal State
    const [appraisingItem, setAppraisingItem] = useState<GameEvent | null>(null);
    const [appraisalStatus, setAppraisalStatus] = useState<'thinking' | 'offer' | 'reject'>('thinking');
    const [offeredPrice, setOfferedPrice] = useState(0);

    // Get Config or use defaults
    const config = merchant.tradeConfig || {
        warriorDiscount: 10,
        clericDiscount: 45,
        mageDiscount: 25,
        rogueStealChance: 30
    };

    useEffect(() => {
        const fetchItems = async () => {
            if (!merchant.merchantItems || merchant.merchantItems.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Initialize stock levels and price map from the merchant data
                const initialStock: { [key: string]: number } = {};
                merchant.merchantItems.forEach(entry => {
                    initialStock[entry.id] = entry.stock;
                });
                setStockLevels(initialStock);

                // Fetch item details by ID
                const itemPromises = merchant.merchantItems.map(entry => 
                    apiService.getCardById(adminEmail, entry.id)
                );
                const results = await Promise.all(itemPromises);
                
                // Filter out nulls and set state
                // IMPORTANT: Override the fetched item's price with the price defined on the merchant card
                const processedItems = results
                    .filter((item): item is GameEvent => item !== null)
                    .map(item => {
                        const merchantEntry = merchant.merchantItems?.find(entry => entry.id === item.id);
                        if (merchantEntry && merchantEntry.price !== undefined) {
                            return { ...item, price: merchantEntry.price };
                        }
                        return item;
                    });

                setShopItems(processedItems);
            } catch (err) {
                console.error("Failed to load shop items", err);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [merchant, adminEmail]);

    // --- CLASS LOGIC ---
    const getCalculatedPrice = (item: GameEvent): { finalPrice: number, discountType: PlayerClass | null } => {
        const basePrice = item.price || 0;
        
        // WARRIOR: Discount
        if (playerClass === PlayerClass.WARRIOR) {
            const factor = (100 - config.warriorDiscount) / 100;
            return { finalPrice: Math.floor(basePrice * factor), discountType: PlayerClass.WARRIOR };
        }

        // CLERIC: Discount Healing Items
        if (playerClass === PlayerClass.CLERIC) {
            const isHealing = item.stats?.some(s => ['HP', 'HEAL', 'LÉČENÍ', 'ZDRAVÍ'].some(k => s.label.toUpperCase().includes(k)));
            if (isHealing) {
                const factor = (100 - config.clericDiscount) / 100;
                return { finalPrice: Math.floor(basePrice * factor), discountType: PlayerClass.CLERIC };
            }
        }

        // MAGE: Discount Consumables
        if (playerClass === PlayerClass.MAGE) {
            if (item.isConsumable || item.type === GameEventType.ITEM) { // Broad check for now
                 const factor = (100 - config.mageDiscount) / 100;
                 return { finalPrice: Math.floor(basePrice * factor), discountType: PlayerClass.MAGE };
            }
        }

        return { finalPrice: basePrice, discountType: null };
    };

    const handleBuyClick = (item: GameEvent) => {
        const currentStock = stockLevels[item.id] || 0;
        const { finalPrice } = getCalculatedPrice(item);

        if (currentStock > 0 && userGold >= finalPrice) {
            // Logic for buying 1 item
            let stockReduction = 1;
            
            // --- ROGUE STEAL MECHANIC ---
            if (playerClass === PlayerClass.ROGUE && currentStock >= 2 && onAddFreeItem) {
                const chance = Math.random() * 100;
                if (chance < config.rogueStealChance) { 
                    stockReduction = 2; // Take 2 from stock
                    onAddFreeItem(item); // Add the free one directly
                    playSound('success');
                    setRogueMessage(`Získal jsi ${item.title} navíc zdarma! (Krádež)`);
                    setTimeout(() => setRogueMessage(null), 3000);
                }
            }

            // Decrement stock locally
            setStockLevels(prev => ({
                ...prev,
                [item.id]: Math.max(0, prev[item.id] - stockReduction)
            }));
            
            // Trigger standard purchase (deduct gold, add 1 item) with calculated price
            const itemToBuy = { ...item, price: finalPrice };
            onBuy(itemToBuy);
        }
    };

    const handleStartAppraisal = (item: GameEvent) => {
        setAppraisingItem(item);
        setAppraisalStatus('thinking');
        playSound('scan');
        
        // Simulate NPC thinking time
        setTimeout(() => {
            const merchantEntry = merchant.merchantItems?.find(entry => entry.id === item.id);
            if (merchantEntry && merchantEntry.sellPrice && merchantEntry.sellPrice > 0) {
                setOfferedPrice(merchantEntry.sellPrice);
                setAppraisalStatus('offer');
                playSound('success');
            } else {
                setAppraisalStatus('reject');
                playSound('error');
            }
        }, 1500);
    };

    const confirmSell = () => {
        if (appraisingItem && onSell) {
            onSell(appraisingItem, offeredPrice);
            playSound('success'); // Coins sound
            setAppraisingItem(null); // Close modal
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col"
        >
            {/* Header */}
            <div className="p-6 pb-2 bg-black border-b border-zinc-800 relative">
                
                {/* Rogue Toast Notification */}
                <AnimatePresence>
                    {rogueMessage && (
                        <motion.div 
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute top-2 left-2 right-2 bg-green-900/90 border border-green-500 text-green-100 p-3 rounded-xl z-50 flex items-center gap-2 shadow-xl"
                        >
                            <Footprints className="w-5 h-5 text-green-400" />
                            <span className="text-xs font-bold uppercase">{rogueMessage}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-wider">{merchant.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded border border-neon-purple/50 font-bold uppercase">Obchodník</span>
                            <span className="text-xs text-zinc-500 font-mono">ID: {merchant.id}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-zinc-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <p className="text-sm text-zinc-400 font-serif italic mb-4">{merchant.description}</p>
                
                <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800 mb-4">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Váš zůstatek</span>
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-xl font-mono font-bold text-white">{userGold}</span>
                    </div>
                </div>

                {/* TABS */}
                {merchant.canSellToMerchant && (
                    <div className="flex bg-zinc-900 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('buy')}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${activeTab === 'buy' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Nákup Zboží
                        </button>
                        <button 
                            onClick={() => setActiveTab('sell')}
                            className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${activeTab === 'sell' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Prodej (Výkup)
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-950">
                {activeTab === 'buy' ? (
                    loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4">
                            <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Naskladňování zboží...</p>
                        </div>
                    ) : shopItems.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                            <p>Tento obchodník má momentálně vyprodáno.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 pb-20">
                            {shopItems.map(item => {
                                const currentStock = stockLevels[item.id] || 0;
                                const isOutOfStock = currentStock <= 0;
                                const { finalPrice, discountType } = getCalculatedPrice(item);
                                const canAfford = userGold >= finalPrice;

                                return (
                                    <div key={item.id} className={`bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}>
                                        {/* Rarity Stripe */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                            item.rarity === 'Legendary' ? 'bg-yellow-500' : 
                                            item.rarity === 'Epic' ? 'bg-purple-500' : 
                                            item.rarity === 'Rare' ? 'bg-blue-500' : 'bg-zinc-600'
                                        }`}></div>

                                        <div className="pl-3 flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-white text-lg leading-tight">{item.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.type} • {item.rarity}</span>
                                                    {/* Stock Indicator */}
                                                    <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                        isOutOfStock ? 'bg-red-900/20 text-red-500 border-red-900/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                                    }`}>
                                                        <Package className="w-3 h-3" />
                                                        {isOutOfStock ? 'Vyprodáno' : `Skladem: ${currentStock}`}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* PRICE DISPLAY */}
                                            <div className="flex flex-col items-end">
                                                {discountType && (
                                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 line-through decoration-red-500 mb-0.5">
                                                        <Coins className="w-3 h-3" /> {item.price}
                                                    </div>
                                                )}
                                                <div className={`flex items-center gap-1 bg-black/50 px-2 py-1 rounded font-mono font-bold ${discountType ? 'text-green-400 border border-green-900' : 'text-yellow-500'}`}>
                                                    {discountType === PlayerClass.WARRIOR && <Sword className="w-3 h-3" />}
                                                    {discountType === PlayerClass.CLERIC && <Cross className="w-3 h-3" />}
                                                    {discountType === PlayerClass.MAGE && <Wand2 className="w-3 h-3" />}
                                                    {(!discountType) && <Coins className="w-3 h-3" />}
                                                    {finalPrice}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <p className="pl-3 text-xs text-zinc-400 line-clamp-2 font-serif">{item.description}</p>
                                        
                                        {/* Rogue Tip */}
                                        {playerClass === PlayerClass.ROGUE && currentStock >= 2 && (
                                            <div className="pl-3 flex items-center gap-1 text-[9px] text-green-600 font-bold uppercase">
                                                <Footprints className="w-3 h-3" /> Šance na krádež ({config.rogueStealChance}%)
                                            </div>
                                        )}

                                        <button 
                                            onClick={() => handleBuyClick(item)}
                                            disabled={isOutOfStock || !canAfford}
                                            className={`w-full py-3 mt-2 rounded-lg font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                                                isOutOfStock
                                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                                : canAfford 
                                                    ? 'bg-neon-blue text-black hover:bg-white shadow-[0_0_10px_rgba(0,243,255,0.3)]' 
                                                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                            }`}
                                        >
                                            {isOutOfStock ? (
                                                <>
                                                    <Ban className="w-4 h-4" /> Vyprodáno
                                                </>
                                            ) : canAfford ? (
                                                'Koupit'
                                            ) : (
                                                'Nedostatek Kreditů'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    // SELL TAB CONTENT
                    <div className="pb-20">
                        <div className="mb-4 bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-3">
                            <ArrowRightLeft className="w-5 h-5 text-green-500" />
                            <p className="text-xs text-zinc-400">Vyberte předmět z batohu, který chcete nabídnout obchodníkovi.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {(inventory || []).filter(i => i.type === GameEventType.ITEM).map(item => (
                                <button 
                                    key={item.id}
                                    onClick={() => handleStartAppraisal(item)}
                                    className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex flex-col gap-2 relative overflow-hidden hover:border-green-500/50 transition-colors text-left"
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <Package className="w-5 h-5 text-zinc-500" />
                                        <span className="text-[9px] font-bold uppercase bg-black/40 px-1.5 rounded text-zinc-400">{item.rarity}</span>
                                    </div>
                                    <h4 className="font-bold text-white text-xs line-clamp-1">{item.title}</h4>
                                </button>
                            ))}
                            {(!inventory || inventory.filter(i => i.type === GameEventType.ITEM).length === 0) && (
                                <p className="col-span-2 text-center text-zinc-600 text-xs py-10">Váš batoh je prázdný.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* APPRAISAL OVERLAY MODAL */}
            <AnimatePresence>
                {appraisingItem && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm text-center relative overflow-hidden"
                        >
                            <button onClick={() => setAppraisingItem(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                            
                            <h3 className="text-xl font-bold text-white mb-1">{appraisingItem.title}</h3>
                            <p className="text-xs text-zinc-500 font-mono mb-6 uppercase">ID: {appraisingItem.id}</p>

                            {appraisalStatus === 'thinking' && (
                                <div className="py-8 flex flex-col items-center gap-4">
                                    <Brain className="w-12 h-12 text-neon-purple animate-pulse" />
                                    <p className="text-sm font-bold text-neon-purple uppercase tracking-widest animate-pulse">Obchodník přemýšlí...</p>
                                </div>
                            )}

                            {appraisalStatus === 'reject' && (
                                <div className="py-4 flex flex-col items-center gap-4">
                                    <Ban className="w-12 h-12 text-red-500" />
                                    <div className="bg-zinc-800 p-4 rounded-xl border-l-4 border-red-500 text-left w-full">
                                        <p className="text-sm italic text-zinc-300">"Tohle? To je bezcenný krám. O to nemám zájem. Přines mi něco pořádného, co mám na seznamu."</p>
                                    </div>
                                    <button onClick={() => setAppraisingItem(null)} className="w-full py-3 bg-zinc-800 text-white font-bold uppercase rounded-lg">Zpět</button>
                                </div>
                            )}

                            {appraisalStatus === 'offer' && (
                                <div className="py-4 flex flex-col items-center gap-4">
                                    <DollarSign className="w-12 h-12 text-green-500" />
                                    <div className="bg-zinc-800 p-4 rounded-xl border-l-4 border-green-500 text-left w-full">
                                        <p className="text-sm italic text-zinc-300 mb-2">"Hmm, zajímavé. O tohle bych zájem měl."</p>
                                        <div className="flex justify-between items-center bg-black/30 p-2 rounded">
                                            <span className="text-xs font-bold uppercase text-zinc-500">Nabídka:</span>
                                            <span className="text-xl font-mono font-bold text-green-500 flex items-center gap-1">
                                                {offeredPrice} <Coins className="w-4 h-4"/>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button onClick={() => setAppraisingItem(null)} className="flex-1 py-3 bg-zinc-800 text-zinc-400 font-bold uppercase rounded-lg">Odmítnout</button>
                                        <button onClick={confirmSell} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)]">PRODAT</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MerchantScreen;
