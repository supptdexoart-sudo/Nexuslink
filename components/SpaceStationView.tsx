
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameEvent } from '../types';
import { 
  LogOut, Satellite, Activity, Shield, Zap, Wind, 
  ShoppingBag, PenTool, Database, Radio, LayoutGrid, AlertCircle
} from 'lucide-react';
import { playSound } from '../services/soundService';

interface SpaceStationViewProps {
  station: GameEvent;
  onLeave: () => void;
}

const SpaceStationView: React.FC<SpaceStationViewProps> = ({ station, onLeave }) => {
  const [bootSequence, setBootSequence] = useState(true);

  useEffect(() => {
    playSound('open');
    const timer = setTimeout(() => setBootSequence(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { id: 'repair', label: 'Opravna', icon: <PenTool className="w-6 h-6" />, desc: 'Opravy pláště a modulů', disabled: true },
    { id: 'market', label: 'Tržiště', icon: <ShoppingBag className="w-6 h-6" />, desc: 'Nákup zásob a vybavení', disabled: true },
    { id: 'support', label: 'Podpora Života', icon: <Wind className="w-6 h-6" />, desc: 'Doplnění O2 zásob', disabled: true },
    { id: 'reactor', label: 'Reaktor', icon: <Zap className="w-6 h-6" />, desc: 'Dobíjení energetických článků', disabled: true },
  ];

  const handleUndock = () => {
    playSound('click');
    onLeave();
  };

  if (bootSequence) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center font-mono">
        <div className="text-center space-y-4">
          <Satellite className="w-16 h-16 text-cyan-500 animate-pulse mx-auto" />
          <div className="space-y-1">
            <p className="text-xs text-cyan-500 uppercase tracking-[0.2em] font-bold">Navazování spojení...</p>
            <p className="text-xl text-white font-black uppercase tracking-widest">{station.title}</p>
          </div>
          <div className="w-48 h-1 bg-zinc-800 rounded-full mx-auto overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#050608] text-white overflow-hidden flex flex-col font-sans"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* HEADER */}
      <header className="relative z-10 bg-black/60 backdrop-blur-md border-b border-white/10 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-950/30 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                <Satellite className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{station.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-widest">Systémy Online • ID: {station.id}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                 <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Lokální Čas</p>
                 <p className="text-sm font-mono font-bold text-zinc-300">{new Date().toLocaleTimeString()}</p>
             </div>
        </div>
      </header>

      {/* MAIN DASHBOARD */}
      <main className="flex-1 relative z-10 p-6 overflow-y-auto no-scrollbar">
        
        {/* Welcome Message */}
        <div className="mb-8 p-6 bg-gradient-to-r from-cyan-900/20 to-transparent border-l-4 border-cyan-500 rounded-r-xl">
             <h2 className="text-lg font-bold text-cyan-100 mb-1">Vítejte, veliteli.</h2>
             <p className="text-sm text-cyan-400/60 font-mono">"{station.stationConfig?.welcomeMessage || 'Stanice je plně operabilní.'}"</p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <Shield className="w-5 h-5 text-zinc-500" />
                    <span className="text-[10px] font-bold text-green-500">100%</span>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Integrita Štítů</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <Radio className="w-5 h-5 text-zinc-500" />
                    <span className="text-[10px] font-bold text-cyan-500">SILNÝ</span>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Signál Sektoru</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <Activity className="w-5 h-5 text-zinc-500" />
                    <span className="text-[10px] font-bold text-white">NORMÁLNÍ</span>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Radiace</p>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                    <Database className="w-5 h-5 text-zinc-500" />
                    <span className="text-[10px] font-bold text-yellow-500">STABILNÍ</span>
                </div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Jádro Stanice</p>
            </div>
        </div>

        {/* Modules Grid */}
        <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Dostupné Moduly
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
            {menuItems.map((item) => (
                <button 
                    key={item.id}
                    disabled={item.disabled}
                    className="group relative overflow-hidden bg-zinc-900/50 border border-white/5 p-6 rounded-2xl text-left transition-all hover:border-cyan-500/50 hover:bg-zinc-900 active:scale-[0.98]"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        {item.icon}
                    </div>
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className={`p-3 rounded-lg ${item.disabled ? 'bg-zinc-800 text-zinc-600' : 'bg-cyan-500/10 text-cyan-400'}`}>
                            {item.icon}
                        </div>
                        <div>
                            <h4 className={`text-lg font-bold uppercase tracking-tight ${item.disabled ? 'text-zinc-600' : 'text-white'}`}>{item.label}</h4>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-mono relative z-10 pl-1">{item.desc}</p>
                    
                    {item.disabled && (
                        <div className="absolute bottom-3 right-4 flex items-center gap-1.5 opacity-50">
                            <AlertCircle className="w-3 h-3 text-yellow-500" />
                            <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest">Ve výstavbě</span>
                        </div>
                    )}
                </button>
            ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 p-6 bg-black/80 backdrop-blur-xl border-t border-white/10">
        <button 
            onClick={handleUndock}
            className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-500 font-black uppercase text-sm tracking-[0.3em] rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
            <LogOut className="w-5 h-5" />
            Odpojit se (Undock)
        </button>
      </footer>
    </motion.div>
  );
};

export default SpaceStationView;
