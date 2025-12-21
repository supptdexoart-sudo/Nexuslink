
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameEvent } from '../types';
import { Hammer, X, Database, Box, Cog, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { playSound, vibrate } from '../services/soundService';

interface FactoryViewProps {
    inventory: GameEvent[];
    masterCatalog: GameEvent[];
    onClose: () => void;
    onCraft?: (item: GameEvent) => void;
}

const FactoryView: React.FC<FactoryViewProps> = ({ inventory, masterCatalog, onClose, onCraft }) => {
    // Left Panel: Player Resources
    const playerResources = inventory.filter(i => i.resourceConfig?.isResourceContainer);
    
    // Right Panel: Only items that have crafting ENABLED
    const blueprints = masterCatalog.filter(i => 
        i.craftingRecipe && i.craftingRecipe.enabled === true
    );

    const [selectedBlueprint, setSelectedBlueprint] = useState<GameEvent | null>(null);
    const [isCrafting, setIsCrafting] = useState(false);

    const handleSelectBlueprint = (item: GameEvent) => {
        playSound('click');
        setSelectedBlueprint(item);
    };

    // Calculate total amount of a specific resource in player inventory
    // Aggregates amounts from multiple stacks if present
    const getPlayerResourceAmount = (resourceName: string) => {
        return playerResources.reduce((total, item) => {
            if (item.resourceConfig?.resourceName === resourceName) {
                return total + (item.resourceConfig.resourceAmount || 0);
            }
            return total;
        }, 0);
    };

    const checkCanCraft = (blueprint: GameEvent) => {
        if (!blueprint.craftingRecipe?.requiredResources) return true; // No requirements = free?
        
        return blueprint.craftingRecipe.requiredResources.every(req => {
            const playerHas = getPlayerResourceAmount(req.resourceName);
            return playerHas >= req.amount;
        });
    };

    const handleCraftClick = () => {
        if (!selectedBlueprint || !onCraft) return;
        if (!checkCanCraft(selectedBlueprint)) {
            playSound('error');
            return;
        }

        setIsCrafting(true);
        playSound('scan'); // Construction sound start
        vibrate([50, 100, 50]);

        // Simulate short delay for effect (can be longer based on recipe time, but for UX kept short)
        setTimeout(() => {
            onCraft(selectedBlueprint);
            setIsCrafting(false);
            setSelectedBlueprint(null); // Close modal on success
            playSound('success');
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[250] bg-zinc-950 text-white flex flex-col font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-zinc-900 border-b border-orange-500/30 p-4 flex justify-between items-center relative overflow-hidden">
                {/* Hazard Stripes Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #f97316 10px, #f97316 20px)' }}>
                </div>
                
                <div className="flex items-center gap-3 relative z-10 text-orange-500">
                    <div className="p-2 bg-orange-500/10 border border-orange-500/30 rounded">
                        <Hammer className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-widest leading-none text-white">Výrobní Modul</h1>
                        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em]">Sekce: FAB-01</p>
                    </div>
                </div>
                
                <button onClick={onClose} className="p-2 relative z-10 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors">
                    <X className="w-6 h-6 text-zinc-400" />
                </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* --- LEFT PANEL: RESOURCE STORAGE --- */}
                <div className="flex-1 border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950/50 flex flex-col min-h-[40%] md:min-h-full">
                    <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Box className="w-4 h-4" /> Sklad Surovin
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600">{playerResources.length} jednotek</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-2 gap-3 content-start">
                        {playerResources.length === 0 ? (
                            <div className="col-span-2 text-center py-10 opacity-30 flex flex-col items-center">
                                <Box className="w-12 h-12 mb-2" />
                                <span className="text-xs font-bold uppercase">Sklad prázdný</span>
                            </div>
                        ) : (
                            playerResources.map((res, idx) => (
                                <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col items-center justify-center gap-1 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-600/50"></div>
                                    <Hammer className="w-5 h-5 text-orange-500/50 mb-1" />
                                    <span className="text-xs font-bold text-white uppercase text-center leading-tight line-clamp-2">{res.title}</span>
                                    <span className="text-[10px] font-mono text-orange-400 bg-orange-950/30 px-2 py-0.5 rounded border border-orange-500/20">
                                        x{res.resourceConfig?.resourceAmount || 1}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- RIGHT PANEL: BLUEPRINTS --- */}
                <div className="flex-[1.5] bg-black flex flex-col">
                    <div className="p-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Databáze Schémat
                        </span>
                        <span className="text-[9px] font-mono text-zinc-600">Admin_Vault Access</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {blueprints.length === 0 ? (
                            <div className="text-center py-10 text-zinc-600 font-mono text-xs uppercase">Žádná schémata k dispozici.</div>
                        ) : (
                            blueprints.map((item) => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleSelectBlueprint(item)}
                                    className="w-full text-left bg-zinc-900/40 border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900 p-3 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] group"
                                >
                                    <div className="w-10 h-10 bg-black border border-zinc-700 rounded-lg flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
                                        <Cog className="w-5 h-5 text-zinc-500 group-hover:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.title}</h4>
                                            <span className="text-[9px] font-mono text-zinc-500">{item.rarity}</span>
                                        </div>
                                        <p className="text-[9px] text-zinc-500 line-clamp-1 italic">{item.description}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* BLUEPRINT DETAIL MODAL */}
            <AnimatePresence>
                {selectedBlueprint && (
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
                            className="bg-zinc-900 border border-orange-500/50 w-full max-w-sm rounded-2xl p-6 relative shadow-[0_0_50px_rgba(249,115,22,0.15)] flex flex-col max-h-[90vh]"
                        >
                            <button onClick={() => setSelectedBlueprint(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
                            
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-20 h-20 bg-black border-2 border-orange-500/30 rounded-xl flex items-center justify-center mb-4 relative">
                                    <Wrench className={`w-8 h-8 text-orange-500 ${isCrafting ? 'animate-spin-slow' : ''}`} />
                                    {isCrafting && <div className="absolute inset-0 border-2 border-orange-500 rounded-xl animate-ping" />}
                                </div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{selectedBlueprint.title}</h2>
                                <p className="text-xs text-zinc-400 font-mono line-clamp-2">{selectedBlueprint.description}</p>
                                
                                <div className="mt-3 flex items-center gap-2 text-orange-400 bg-orange-950/20 px-3 py-1 rounded-full border border-orange-500/20">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        Čas výroby: {selectedBlueprint.craftingRecipe?.craftingTimeSeconds || 60}s
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-black/40 rounded-xl border border-zinc-800 mb-6 flex-1 overflow-y-auto">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-3 tracking-widest border-b border-zinc-800 pb-2">Požadované Suroviny</p>
                                <div className="space-y-2">
                                    {selectedBlueprint.craftingRecipe?.requiredResources?.map((req, idx) => {
                                        const playerHas = getPlayerResourceAmount(req.resourceName);
                                        const isEnough = playerHas >= req.amount;
                                        
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-zinc-900/50 p-2 rounded">
                                                <span className="text-xs text-zinc-300 font-mono">{req.resourceName}</span>
                                                <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isEnough ? 'text-green-500' : 'text-red-500'}`}>
                                                    <span>{playerHas} / {req.amount}</span>
                                                    {isEnough ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!selectedBlueprint.craftingRecipe?.requiredResources || selectedBlueprint.craftingRecipe.requiredResources.length === 0) && (
                                        <p className="text-center text-zinc-600 text-xs italic">Žádné suroviny nejsou potřeba.</p>
                                    )}
                                </div>
                            </div>

                            <button 
                                onClick={handleCraftClick}
                                disabled={isCrafting || !checkCanCraft(selectedBlueprint)}
                                className={`w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all ${
                                    isCrafting 
                                    ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50 cursor-wait'
                                    : checkCanCraft(selectedBlueprint) 
                                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
                                }`}
                            >
                                {isCrafting ? 'VÝROBA PROBÍHÁ...' : checkCanCraft(selectedBlueprint) ? 'VYROBIT PŘEDMĚT' : 'NEDOSTATEK SUROVIN'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FactoryView;
