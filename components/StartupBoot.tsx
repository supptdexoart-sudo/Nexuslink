
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Fingerprint, Activity, Zap, Binary, ShieldCheck, Scan } from 'lucide-react';
import { playSound } from '../services/soundService';

interface StartupBootProps {
  onComplete: () => void;
}

const bootLines = [
  "BIOS CHECK... OK",
  "LOADING KERNEL v0.6...",
  "MOUNTING FILE SYSTEM...",
  "DECRYPTING SECURE STORAGE...",
  "ESTABLISHING NEURAL LINK...",
  "SYNCING WITH NEXUS CLOUD...",
  "LOADING ASSETS...",
  "SYSTEM READY."
];

const StartupBoot: React.FC<StartupBootProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'init' | 'biometric' | 'complete'>('init');

  useEffect(() => {
    // 1. Initial Sound
    playSound('click');
    
    // 2. Terminal Lines Animation
    let lineIndex = 0;
    const lineInterval = setInterval(() => {
      if (lineIndex < bootLines.length) {
        setLines(prev => [...prev, bootLines[lineIndex]]);
        // Random glitch sound on text appearance
        if (Math.random() > 0.7) playSound('click');
        lineIndex++;
      } else {
        clearInterval(lineInterval);
        setPhase('biometric');
      }
    }, 200);

    // 3. Progress Bar Animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 5; // Random increments
      });
    }, 100);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (phase === 'biometric') {
        playSound('scan');
        setTimeout(() => {
            setPhase('complete');
            playSound('success');
            setTimeout(onComplete, 800); // Wait a bit after success before unmounting
        }, 1500);
    }
  }, [phase, onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[9999] bg-zinc-950 text-neon-blue font-mono overflow-hidden flex flex-col items-center justify-center"
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Ambience (Same as Login + Blinking Animation) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Left - Blue Pulse */}
        <motion.div 
            animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.1, 0.3, 0.1] 
            }}
            transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
            }}
            className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-neon-blue/20 rounded-full blur-[100px]"
        />
        
        {/* Bottom Right - Purple Pulse */}
        <motion.div 
            animate={{ 
                scale: [1, 1.3, 1], 
                opacity: [0.1, 0.3, 0.1] 
            }}
            transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 0.5 
            }}
            className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-neon-purple/20 rounded-full blur-[100px]"
        />
        
        {/* Carbon Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6 flex flex-col h-full justify-between">
        
        {/* TOP SECTION: LOGO & HEADER */}
        <div className="flex justify-between items-start border-b border-neon-blue/30 pb-4 mt-8">
            <div className="flex items-center gap-3">
                <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="p-2 border border-neon-blue rounded-lg bg-black/20 backdrop-blur-sm"
                >
                    <Binary className="w-6 h-6 text-neon-blue" />
                </motion.div>
                <div>
                    <h1 className="text-2xl font-display font-black tracking-widest text-white">NEXUS<span className="text-neon-blue">.OS</span></h1>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em]">System Initialization</p>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-neon-blue">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-bold">ONLINE</span>
                </div>
                <p className="text-[10px] text-zinc-600">v0.6.2_BUILD</p>
            </div>
        </div>

        {/* CENTER SECTION: DYNAMIC CONTENT */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
            <AnimatePresence mode="wait">
                {phase === 'init' && (
                    <motion.div 
                        key="cpu"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative"
                    >
                        <div className="w-40 h-40 border-2 border-neon-blue/20 rounded-full flex items-center justify-center animate-spin-slow relative bg-black/20 backdrop-blur-sm">
                            <div className="absolute inset-0 border-t-2 border-neon-blue rounded-full animate-spin"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cpu className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]" />
                        </div>
                    </motion.div>
                )}

                {phase === 'biometric' && (
                    <motion.div 
                        key="bio"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="relative">
                            <Scan className="w-32 h-32 text-neon-blue absolute inset-0 animate-pulse" />
                            <Fingerprint className="w-32 h-32 text-white/80 relative z-10" />
                            <motion.div 
                                className="absolute top-0 left-0 right-0 h-1 bg-neon-purple shadow-[0_0_20px_#bc13fe]"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                        <p className="text-sm text-neon-blue font-bold uppercase tracking-widest animate-pulse">Ověřování Uživatele...</p>
                    </motion.div>
                )}

                {phase === 'complete' && (
                    <motion.div 
                        key="success"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="p-6 bg-neon-blue/10 rounded-full border-2 border-neon-blue shadow-[0_0_50px_rgba(0,243,255,0.5)]">
                            <ShieldCheck className="w-16 h-16 text-white" />
                        </div>
                        <h2 className="mt-6 text-xl md:text-2xl font-display font-black text-white uppercase tracking-widest text-center">Přístup Povolen</h2>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* BOTTOM SECTION: TERMINAL, PROGRESS & AUTHOR */}
        <div className="w-full space-y-4 mb-2">
            {/* Terminal Lines */}
            <div className="h-24 bg-zinc-900/50 border border-zinc-800 rounded p-2 overflow-hidden flex flex-col justify-end backdrop-blur-sm">
                {lines.map((line, i) => (
                    <motion.p 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] text-zinc-400 font-mono leading-tight truncate"
                    >
                        <span className="text-neon-blue mr-2">{'>'}</span>{line}
                    </motion.p>
                ))}
            </div>

            {/* Progress Bar */}
            <div>
                <div className="flex justify-between text-[10px] uppercase text-zinc-500 mb-1">
                    <span>System Integrity</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Author Credit */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 1 }}
                className="text-center pt-4"
            >
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">
                    Vytvořil - <span className="text-neon-blue font-bold drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">DeXoArt</span>
                </p>
            </motion.div>
        </div>

      </div>
    </motion.div>
  );
};

export default StartupBoot;
