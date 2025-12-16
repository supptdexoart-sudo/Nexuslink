
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Server, RefreshCw, PowerOff, ShieldCheck } from 'lucide-react';
import * as apiService from '../services/apiService';

interface ServerLoaderProps {
  onConnected: () => void;
  onSwitchToOffline: () => void;
}

const loadingTexts = [
  "Inicializace protokolu...",
  "Hledání signálu Nexus...",
  "Propojování.##.%./*_#..",
  "Ověřování integrity dat...",
  "Navazování zabezpečeného spojení..."
];

const ServerLoader: React.FC<ServerLoaderProps> = ({ onConnected, onSwitchToOffline }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    // Text rotation
    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 3000);

    return () => clearInterval(textInterval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkConnection = async () => {
      if (!isMounted) return;

      try {
        const isOnline = await apiService.checkHealth();
        if (isOnline && isMounted) {
          onConnected();
          return;
        }
      } catch (e) {
        console.log("Waiting for server...");
      }

      // Retry logic
      if (isMounted) {
        setAttempt(prev => prev + 1);
        if (attempt > 5) setIsTakingLong(true); // Show offline button after ~10s
        timeoutId = setTimeout(checkConnection, 2000);
      }
    };

    checkConnection();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [onConnected, attempt]);

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        
        {/* Animated Icon Container */}
        <div className="relative mb-12">
            {/* Ping Ripples */}
            <motion.div 
                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-neon-blue/20 rounded-full blur-md"
            />
            <motion.div 
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-neon-blue/10 rounded-full blur-md"
            />

            {/* Central Icon */}
            <div className="relative w-24 h-24 bg-zinc-900 rounded-2xl border border-zinc-700 flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                <Server className="w-10 h-10 text-neon-blue" />
                <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
                    </span>
                </div>
            </div>
        </div>

        {/* Loading Bar */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mb-6 relative">
            <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-neon-blue to-transparent"
            />
        </div>

        {/* Status Text */}
        <h2 className="text-xl font-display font-bold uppercase tracking-widest mb-2 text-center">
            Připojování
        </h2>
        <motion.p 
            key={textIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-zinc-500 font-mono uppercase tracking-wider text-center h-4"
        >
            {loadingTexts[textIndex]}
        </motion.p>

        {/* Technical Details */}
        <div className="mt-8 flex gap-4 text-[10px] text-zinc-600 font-mono uppercase">
            <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Pokus #{attempt}</span>
            </div>
            <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>SSL Secured</span>
            </div>
        </div>

        {/* Offline Fallback Button (Appears if taking too long) */}
        {isTakingLong && (
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={onSwitchToOffline}
                className="mt-12 py-3 px-6 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
            >
                <PowerOff className="w-4 h-4" />
                Přejít do Offline Režimu
            </motion.button>
        )}

      </div>
    </div>
  );
};

export default ServerLoader;
