
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Fuel, Shield, AlertTriangle, Crosshair, ChevronRight, Gauge, Globe, Scan, Lock, CheckCircle } from 'lucide-react';
import { playSound, vibrate } from '../services/soundService';
import { GameEvent, GameEventType } from '../types';

interface SpaceshipViewProps {
    playerFuel?: number;
    inventory?: GameEvent[]; // Added inventory access
}

const SpaceshipView: React.FC<SpaceshipViewProps> = ({ playerFuel = 0, inventory = [] }) => {
    const [hull] = useState(100);
    const [shields] = useState(60);
    
    const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    // Filter planets from inventory
    const activePlanets = inventory.filter(i => i.type === GameEventType.PLANET);

    useEffect(() => {
        playSound('open');
    }, []);

    const selectedPlanet = activePlanets.find(p => p.id === selectedPlanetId);

    const handleScanPlanet = () => {
        if (!selectedPlanet) return;
        
        // Cost Check (Simulated for UI, logic handled via interactions in real app)
        if (playerFuel < (selectedPlanet.planetConfig?.scanCost || 10)) {
            playSound('error');
            return;
        }

        setScanning(true);
        playSound('scan');
        vibrate([50, 50, 50]);

        // Simulating scan progress for visual effect
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setScanProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                setScanning(false);
                setScanProgress(0);
                playSound('success');
                // Real logic would call an API update here
            }
        }, 30);
    };

    const getDiscoveryLabel = (progress: number) => {
        if (progress >= 100) return "IDENTIFIKACE KOMPLETNÍ";
        if (progress >= 66) return "POVRCHOVÁ ANALÝZA";
        if (progress >= 33) return "ATMOSFÉRICKÁ DATA";
        return "NEZNÁMÝ SIGNÁL";
    };

    return (
        <div className="h-full w-full bg-[#0a0b0d] flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-white/10 bg-black/50 z-10 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-signal-cyan/10 rounded-lg border border-signal-cyan/30">
                        <Rocket className="w-6 h-6 text-signal-cyan" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-white font-display chromatic-text">Moje Loď</h2>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Interceptor Class V-2</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10">
                
                {/* --- PLANET DETAIL VIEW (IF SELECTED) --- */}
                <AnimatePresence mode="wait">
                    {selectedPlanet ? (
                        <motion.div 
                            key="detail"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col h-full"
                        >
                            <button onClick={() => setSelectedPlanetId(null)} className="text-xs font-bold text-zinc-500 uppercase mb-4 flex items-center gap-1 hover:text-white">
                                <ChevronRight className="w-4 h-4 rotate-180" /> Zpět na seznam
                            </button>

                            <div className="relative aspect-square max-h-64 mx-auto mb-6 w-full flex items-center justify-center">
                                {/* Rotating Wireframe Planet */}
                                <div className={`w-48 h-48 rounded-full border-2 ${selectedPlanet.discoveryProgress === 100 ? 'border-green-500 bg-green-900/20' : 'border-dashed border-zinc-600 animate-spin-slow'}`}></div>
                                <Globe className={`absolute w-24 h-24 ${selectedPlanet.discoveryProgress === 100 ? 'text-green-400' : 'text-zinc-700 animate-pulse'}`} />
                                {scanning && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-56 h-56 border-t-2 border-signal-cyan rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-black uppercase tracking-widest text-white">
                                    {selectedPlanet.discoveryProgress === 100 ? selectedPlanet.planetConfig?.realName : selectedPlanet.planetConfig?.unknownName}
                                </h3>
                                <p className="text-xs font-mono text-signal-cyan mt-1">{getDiscoveryLabel(selectedPlanet.discoveryProgress || 0)}</p>
                            </div>

                            {/* PROGRESS BAR */}
                            <div className="w-full bg-zinc-900 h-4 rounded-full overflow-hidden border border-zinc-700 mb-6 relative">
                                <motion.div 
                                    className="h-full bg-signal-cyan"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${selectedPlanet.discoveryProgress || 0}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white mix-blend-difference uppercase">
                                    Data Průzkumu: {selectedPlanet.discoveryProgress || 0}%
                                </div>
                            </div>

                            {/* LOGS */}
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-6 flex-1 overflow-y-auto">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">Palubní Deník:</p>
                                <div className="space-y-2 font-mono text-xs text-zinc-300">
                                    <p className="opacity-50">&gt; Signál zachycen.</p>
                                    {selectedPlanet.planetConfig?.layers
                                        .filter(l => (selectedPlanet.discoveryProgress || 0) >= l.requiredProgress)
                                        .map((l, i) => (
                                            <p key={i} className="text-green-400">&gt; {l.logText}</p>
                                    ))}
                                </div>
                            </div>

                            {/* ACTION BUTTON */}
                            <button
                                onClick={handleScanPlanet}
                                disabled={scanning || (selectedPlanet.discoveryProgress || 0) >= 100}
                                className={`w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                                    (selectedPlanet.discoveryProgress || 0) >= 100
                                        ? 'bg-green-600 text-white cursor-default'
                                        : 'bg-white text-black hover:bg-signal-cyan'
                                }`}
                            >
                                {scanning ? (
                                    <>SKENOVÁNÍ POVRCHU {scanProgress}%...</>
                                ) : (selectedPlanet.discoveryProgress || 0) >= 100 ? (
                                    <><CheckCircle className="w-4 h-4" /> PLANETA OSVOJENA</>
                                ) : (
                                    <><Scan className="w-4 h-4" /> HLOUBKOVÝ SKEN (-{selectedPlanet.planetConfig?.scanCost} PALIVA)</>
                                )}
                            </button>
                            
                            <p className="text-[9px] text-zinc-500 text-center mt-3 uppercase">
                                Pro postup v průzkumu naskenujte fyzickou kartu na herním plánu.
                            </p>
                        </motion.div>
                    ) : (
                        /* --- LIST OF PLANETS --- */
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Crosshair className="w-4 h-4 text-signal-cyan" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-white">Aktivní Cíle (Questy)</h3>
                            </div>

                            <div className="space-y-3">
                                {activePlanets.length === 0 ? (
                                    <div className="text-center py-10 opacity-50 border border-dashed border-zinc-700 rounded-xl">
                                        <Globe className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                                        <p className="text-xs font-bold uppercase text-zinc-500">Žádné aktivní signály</p>
                                        <p className="text-[9px] text-zinc-600 mt-1">Navštivte stanici pro získání souřadnic.</p>
                                    </div>
                                ) : (
                                    activePlanets.map(planet => (
                                        <button
                                            key={planet.id}
                                            onClick={() => { setSelectedPlanetId(planet.id); playSound('click'); }}
                                            className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-between transition-all active:scale-[0.98] hover:border-signal-cyan/30"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-black ${planet.discoveryProgress === 100 ? 'border-green-500' : 'border-zinc-700'}`}>
                                                    <Globe className={`w-6 h-6 ${planet.discoveryProgress === 100 ? 'text-green-500' : 'text-zinc-500'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-bold text-white uppercase tracking-wider">
                                                        {planet.discoveryProgress === 100 ? planet.planetConfig?.realName : planet.planetConfig?.unknownName}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="w-20 h-1.5 bg-black rounded-full overflow-hidden border border-zinc-700">
                                                            <div className="h-full bg-signal-cyan" style={{ width: `${planet.discoveryProgress || 0}%` }}></div>
                                                        </div>
                                                        <span className="text-[9px] text-zinc-500 font-mono">{planet.discoveryProgress || 0}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* Ship Status Summary */}
                            <div className="mt-8 p-4 bg-zinc-900/30 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Gauge className="w-4 h-4 text-zinc-500" />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stav Systémů</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1"><Shield className="w-3 h-3 text-cyan-400"/> Štíty</div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-400" style={{ width: `${shields}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1"><Fuel className="w-3 h-3 text-signal-amber"/> Palivo</div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-signal-amber" style={{ width: `${playerFuel}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5 z-0" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>
        </div>
    );
};

export default SpaceshipView;
