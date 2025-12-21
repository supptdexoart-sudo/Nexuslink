
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Fuel, Shield, Navigation, AlertTriangle, Map, Crosshair, ChevronRight, Gauge } from 'lucide-react';
import { playSound, vibrate } from '../services/soundService';

const PLANETS = [
    { id: 'p1', name: 'Terra Nova', distance: '12 AU', danger: 'Nízká', type: 'Obyvatelná', color: 'text-green-400', border: 'border-green-500/30' },
    { id: 'p2', name: 'Kepler-186f', distance: '450 LY', danger: 'Střední', type: 'Exoplaneta', color: 'text-blue-400', border: 'border-blue-500/30' },
    { id: 'p3', name: 'Mars Outpost', distance: '0.5 AU', danger: 'Vysoká', type: 'Kolonie', color: 'text-red-400', border: 'border-red-500/30' },
    { id: 'p4', name: 'Black Nebula', distance: 'Unknown', danger: 'Extrémní', type: 'Anomálie', color: 'text-purple-400', border: 'border-purple-500/30' }
];

interface SpaceshipViewProps {
    playerFuel?: number; // Optional as it might be passed from App
}

const SpaceshipView: React.FC<SpaceshipViewProps> = ({ playerFuel = 0 }) => {
    // Removed local fuel state, using prop
    const [hull, setHull] = useState(100);
    const [shields, setShields] = useState(60);
    const [isTraveling, setIsTraveling] = useState(false);
    const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

    useEffect(() => {
        playSound('open');
    }, []);

    const handleTravel = () => {
        if (!selectedPlanet) return;
        if (playerFuel < 20) {
            playSound('error');
            vibrate(100);
            return;
        }

        setIsTraveling(true);
        playSound('scan'); // Engine start sound equivalent
        vibrate([50, 100, 200]);

        // Note: Actual fuel deduction happens via scanning in the main loop, 
        // this is currently just a visual simulation of travel within the dashboard.
        setTimeout(() => {
            setIsTraveling(false);
            playSound('success');
            vibrate(50);
        }, 3000);
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

            {/* Dashboard Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 relative z-10">
                
                {/* Ship Visual / Status */}
                <div className="relative aspect-video bg-zinc-900/50 rounded-2xl border border-white/10 overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-signal-cyan/10 via-transparent to-transparent opacity-50" />
                    
                    {/* Placeholder for 3D Ship Model or Image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className={`w-32 h-32 text-zinc-700 transition-all duration-1000 ${isTraveling ? 'animate-pulse text-signal-cyan' : ''}`} />
                    </div>

                    {isTraveling && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                            <div className="text-center">
                                <div className="text-signal-cyan font-mono text-xs uppercase tracking-widest animate-pulse mb-2">Hyperskok Aktivní</div>
                                <div className="w-48 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-signal-cyan"
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Stats Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent flex justify-between items-end">
                        <div className="flex gap-4">
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1"><Shield className="w-3 h-3 text-cyan-400"/> Štíty</div>
                                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-400" style={{ width: `${shields}%` }} />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1"><AlertTriangle className="w-3 h-3 text-red-500"/> Trup</div>
                                <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-white" style={{ width: `${hull}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-400 uppercase font-bold mb-1"><Fuel className="w-3 h-3 text-signal-amber"/> Palivo</div>
                             <span className="text-xl font-mono font-bold text-signal-amber">{playerFuel}%</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Navigation className="w-4 h-4 text-signal-cyan" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Navigace Sektoru</h3>
                    </div>

                    <div className="space-y-3">
                        {PLANETS.map(planet => (
                            <button
                                key={planet.id}
                                onClick={() => { setSelectedPlanet(planet.id); playSound('click'); }}
                                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all active:scale-[0.98] ${selectedPlanet === planet.id ? `bg-zinc-800 ${planet.border} ring-1 ring-white/20` : 'bg-black/40 border-white/5 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center bg-black ${planet.border}`}>
                                        <GlobeIcon className={`w-5 h-5 ${planet.color}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-white uppercase tracking-wider">{planet.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${planet.color} font-mono uppercase`}>{planet.type}</span>
                                            <span className="text-[9px] text-zinc-500 font-mono">{planet.distance}</span>
                                        </div>
                                    </div>
                                </div>
                                {selectedPlanet === planet.id && <ChevronRight className="w-5 h-5 text-white animate-pulse" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    disabled={!selectedPlanet || isTraveling || playerFuel < 20}
                    onClick={handleTravel}
                    className={`w-full py-4 font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                        !selectedPlanet 
                            ? 'bg-zinc-900 text-zinc-600 border border-zinc-800' 
                            : playerFuel < 20 
                                ? 'bg-red-900/50 text-red-500 border border-red-900' 
                                : 'bg-white text-black hover:bg-signal-cyan border border-white/50'
                    }`}
                >
                    {isTraveling ? (
                        <>Iniciace Motorů...</>
                    ) : playerFuel < 20 ? (
                        <>Nedostatek Paliva</>
                    ) : (
                        <><Crosshair className="w-4 h-4" /> Zahájit Skok (Simulace)</>
                    )}
                </button>
                
                {playerFuel < 20 && (
                    <p className="text-[9px] text-red-500 text-center uppercase font-bold tracking-widest animate-pulse">Varování: Hladina paliva kritická</p>
                )}

                <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Diagnostika</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                        Všechny systémy nominální. Skenování objektů automaticky spotřebovává 5% paliva na manévr.
                    </p>
                </div>
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5 z-0" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
            </div>
        </div>
    );
};

// Helper icon component
const GlobeIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" x2="22" y1="12" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export default SpaceshipView;
