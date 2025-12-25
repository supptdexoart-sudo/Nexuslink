
import React, { useState, useEffect } from 'react';
import { GameEvent } from '../types';
import { ShoppingBag, Coins, X, Loader2, Package, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import * as apiService from '../services/apiService';

interface MerchantScreenProps {
    merchant: GameEvent;
    userGold: number;
    adminEmail: string;
    onClose: () => void;
    onBuy: (item: GameEvent) => void;
}

const MerchantScreen: React.FC<MerchantScreenProps> = ({ merchant, userGold, adminEmail, onClose, onBuy }) => {
    const [shopItems, setShopItems] = useState<GameEvent[]>([]);
    // Track stock locally for this session: { itemId: quantity }
    const [stockLevels, setStockLevels] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            if (!merchant.merchantItems || merchant.merchantItems.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Initialize stock levels from the merchant data
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
                setShopItems(results.filter((item): item is GameEvent => item !== null));
            } catch (err) {
                console.error("Failed to load shop items", err);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [merchant, adminEmail]);

    const handleBuyClick = (item: GameEvent) => {
        const currentStock = stockLevels[item.id] || 0;
        if (currentStock > 0 && userGold >= (item.price || 0)) {
            // Decrement stock locally
            setStockLevels(prev => ({
                ...prev,
                [item.id]: prev[item.id] - 1
            }));
            // Trigger purchase logic in App
            onBuy(item);
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
            <div className="p-6 pb-2 bg-black border-b border-zinc-800">
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
                
                <div className="flex items-center justify-between bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Váš zůstatek</span>
                    <div className="flex items-center gap-2">
                        <Coins className="w-5 h-5 text-yellow-500" />
                        <span className="text-xl font-mono font-bold text-white">{userGold}</span>
                    </div>
                </div>
            </div>

            {/* Shop Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
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
                            const canAfford = userGold >= (item.price || 0);

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
                                        <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded text-yellow-500 font-mono font-bold">
                                            <Coins className="w-3 h-3" />
                                            {item.price || 0}
                                        </div>
                                    </div>
                                    
                                    <p className="pl-3 text-xs text-zinc-400 line-clamp-2 font-serif">{item.description}</p>
                                    
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
                )}
            </div>
        </motion.div>
    );
};

export default MerchantScreen;
