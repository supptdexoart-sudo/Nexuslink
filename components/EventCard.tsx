
import React, { useState, useEffect } from 'react'; 
import { GameEvent, GameEventType, DilemmaOption } from '../types';
import { MapPin, Skull, Zap, Box, Star, Save, Trash2, Loader2, AlertTriangle, Activity, Shield, Hash, Share2, CheckCircle, HeartCrack, Heart, Coins, Pencil, Split, HelpCircle, ArrowRight, QrCode, PlayCircle, Ghost, X, Sword, Target, Backpack, BriefcaseMedical, Wind, Lock, Crown, Siren, Globe, User, BookOpen } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, vibrate } from '../services/soundService'; 

interface EventCardProps {
  event: GameEvent;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onEdit?: () => void; 
  onResolveDilemma?: (option: DilemmaOption) => void; 
  onUse?: () => Promise<void> | void; 
  onConsume?: (id: string) => Promise<void> | void;
  isSaved?: boolean;
  isInstantEffect?: boolean;
  effectValue?: number; 
  isAdmin?: boolean;
  inventory?: GameEvent[]; 
  onPlayerDamage?: (amount: number) => void;
  onStartRaid?: (event: GameEvent) => void; // NEW callback for starting raid
  playerHp?: number; // Added player HP for combat UI
}

// --- HELPER TO PARSE STATS ---
const getStatValue = (stats: {label: string, value: string | number}[] | undefined, keys: string[]): number => {
    if (!stats) return 0;
    const stat = stats.find(s => keys.some(k => s.label.toUpperCase().includes(k)));
    return stat ? parseInt(String(stat.value)) : 0;
};

// --- OPTIMIZED ANIMATION CONFIG ---
// Lighter physics for mobile performance
const cardTransition = { 
    type: "spring" as const, // Fixed type inference for framer-motion
    damping: 25, 
    stiffness: 350, 
    mass: 0.8 // Lower mass = faster settling, less computation time
};

// --- DILEMMA COMPONENTS (REDESIGNED) ---
interface DilemmaChoicesProps {
    event: GameEvent;
    onSelect: (opt: DilemmaOption) => void;
}
const DilemmaChoices: React.FC<DilemmaChoicesProps> = ({ event, onSelect }) => (
    <motion.div
        key="choices"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full"
    >
        <div className="flex-1 overflow-y-auto mb-4">
            <p className="text-zinc-300 font-serif text-lg leading-relaxed italic text-center mb-6">
                "{event.description}"
            </p>
            
            {/* Dilemma Scope Indicator */}
            <div className={`flex items-center justify-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border w-fit mx-auto ${
                event.dilemmaScope === 'GLOBAL' 
                ? 'bg-red-900/20 text-red-400 border-red-900/50' 
                : 'bg-blue-900/20 text-blue-400 border-blue-900/50'
            }`}>
                {event.dilemmaScope === 'GLOBAL' ? <Globe className="w-4 h-4"/> : <User className="w-4 h-4"/>}
                {event.dilemmaScope === 'GLOBAL' ? 'Globální (Pro Všechny)' : 'Osobní (Jen pro tebe)'}
            </div>

            <div className="mt-4 p-4 bg-neon-purple/5 rounded-xl border border-neon-purple/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-neon-purple"></div>
                <p className="text-xs text-neon-purple font-mono uppercase tracking-widest mb-1">Dilema</p>
                <p className="text-zinc-400 text-sm">Vyberte moudře. Vaše volba může mít následky.</p>
            </div>
        </div>

        <div className="space-y-3 mt-auto">
            {event.dilemmaOptions?.map((opt, idx) => (
                <button 
                    key={idx}
                    onClick={() => onSelect(opt)}
                    className="w-full p-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-neon-purple rounded-xl text-left transition-all active:scale-[0.98] group shadow-lg relative overflow-hidden flex justify-between items-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="font-display font-bold text-white uppercase tracking-wide text-sm relative z-10">{opt.label}</span>
                    <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-neon-purple transition-colors relative z-10" />
                </button>
            ))}
            {(!event.dilemmaOptions || event.dilemmaOptions.length === 0) && (
                <p className="text-red-500 text-center text-xs">Chyba: Toto dilema nemá definované možnosti.</p>
            )}
        </div>
    </motion.div>
);

interface DilemmaResultProps {
    option: DilemmaOption;
    onClose: () => void;
}
const DilemmaResult: React.FC<DilemmaResultProps> = ({ option, onClose }) => (
    <motion.div 
        key="result"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col h-full"
    >
         <div className="flex-1 overflow-y-auto">
             <div className="w-16 h-16 bg-neon-purple/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-neon-purple shadow-[0_0_30px_rgba(188,19,254,0.4)] animate-pulse">
                 <Split className="w-8 h-8 text-neon-purple" />
             </div>
             
             <h3 className="text-xl font-display font-black text-white mb-6 uppercase tracking-widest text-center border-b border-zinc-800 pb-4">Následky Volby</h3>
             
             <div className="bg-zinc-900/50 p-4 rounded-xl border-l-4 border-neon-purple mb-6">
                 <p className="text-zinc-300 italic text-base leading-relaxed">"{option.consequenceText}"</p>
             </div>

             {/* APP EFFECT */}
             {option.effectType !== 'none' && (
                 <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 ${
                     option.effectValue < 0 ? 'bg-red-950/30 border-red-500/30' : 'bg-green-950/30 border-green-500/30'
                 }`}>
                     <div className={`p-3 rounded-full ${option.effectValue < 0 ? 'bg-red-900/50' : 'bg-green-900/50'}`}>
                        {option.effectType === 'hp' ? <Heart className="w-5 h-5 text-white"/> : <Coins className="w-5 h-5 text-white"/>}
                     </div>
                     <div className="flex flex-col items-start">
                         <span className="font-mono font-bold text-xl text-white">{option.effectValue > 0 ? '+' : ''}{option.effectValue} {option.effectType.toUpperCase()}</span>
                         <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest">Aplikováno v Aplikaci</span>
                     </div>
                 </div>
             )}

             {/* PHYSICAL INSTRUCTION - HIGHLIGHTED */}
             {option.physicalInstruction && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-5 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-2 border-yellow-600/50 rounded-2xl mb-4 relative overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                 >
                     <div className="absolute top-0 right-0 p-2 opacity-20"><BookOpen className="w-12 h-12 text-yellow-500"/></div>
                     <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                         <AlertTriangle className="w-3 h-3" /> Instrukce pro Desku
                     </p>
                     <p className="text-yellow-100 font-bold text-lg font-display leading-tight">{option.physicalInstruction}</p>
                 </motion.div>
             )}
         </div>

         <button onClick={onClose} className="w-full py-4 bg-white text-black hover:bg-zinc-200 font-black rounded-xl uppercase tracking-widest shadow-lg transition-transform active:scale-95 mt-4">Pokračovat</button>
    </motion.div>
);

// --- MAIN COMPONENT ---
const EventCard: React.FC<EventCardProps> = ({ event, onClose, onSave, onDelete, onEdit, onResolveDilemma, onUse, onConsume, isSaved, isInstantEffect, effectValue, isAdmin, inventory, onPlayerDamage, onStartRaid, playerHp }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsDeleting] = useState(false); 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDilemmaOption, setSelectedDilemmaOption] = useState<DilemmaOption | null>(null);

  // --- COMBAT STATE ---
  const isEncounter = event.type === GameEventType.ENCOUNTER;
  const isBoss = event.type === GameEventType.BOSS; 

  const [enemyMaxHp, setEnemyMaxHp] = useState(0);
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(0);
  const [enemyDefense, setEnemyDefense] = useState(0);
  const [enemyAttack, setEnemyAttack] = useState(0);
  const [attackInput, setAttackInput] = useState('');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [showInventory, setShowInventory] = useState(false);
  const [victory, setVictory] = useState(false);
  
  // Flee Mechanics
  const [fleeAttempts, setFleeAttempts] = useState(0);
  const MAX_FLEE_ATTEMPTS = 2;

  useEffect(() => {
     if(isBoss) {
         playSound('error'); 
         vibrate([100, 50, 100, 50, 500]);
     } else {
         playSound('open');
     }

     if (isEncounter || isBoss) {
         // Initialize Combat Stats
         const hp = getStatValue(event.stats, ['HP', 'ZDRAVÍ', 'HEALTH']) || (isBoss ? 1000 : 50); 
         const def = getStatValue(event.stats, ['DEF', 'ARMOR', 'BRNĚNÍ', 'OBRANA']) || 0;
         const atk = getStatValue(event.stats, ['ATK', 'DMG', 'ÚTOK', 'POŠKOZENÍ']) || 5;

         setEnemyMaxHp(hp);
         setEnemyCurrentHp(hp);
         setEnemyDefense(def);
         setEnemyAttack(atk);
         setCombatLog(["Nepřítel se objevil! Hod kostkou a zaútoč."]);
     }
  }, [event, isEncounter, isBoss]);

  const getRarityStyles = (rarity: string) => {
    if (event.type === GameEventType.BOSS) {
        return {
            border: 'border-red-900',
            headerBg: 'bg-gradient-to-br from-red-950 to-black',
            iconColor: 'text-red-600',
            badge: 'bg-red-950 text-red-500 border-red-500',
            shadow: 'shadow-lg' // Optimized shadow
        };
    }
    if (event.type === GameEventType.TRAP || event.type === GameEventType.ENCOUNTER) {
         return {
            border: 'border-red-600',
            headerBg: 'bg-gradient-to-br from-red-600 to-red-900',
            iconColor: 'text-white',
            badge: 'bg-red-950 text-red-500 border-red-500',
            shadow: 'shadow-lg'
        };
    }
    if (event.type === GameEventType.DILEMA) {
        return {
            border: 'border-neon-purple',
            headerBg: 'bg-gradient-to-br from-neon-purple to-purple-900',
            iconColor: 'text-white',
            badge: 'bg-purple-950 text-neon-purple border-neon-purple',
            shadow: 'shadow-lg'
        };
    }
    switch (rarity) {
      case 'Legendary': return { border: 'border-yellow-500', headerBg: 'bg-gradient-to-br from-yellow-400 to-orange-600', iconColor: 'text-yellow-950', badge: 'bg-yellow-950 text-yellow-500 border-yellow-500', shadow: 'shadow-lg' };
      case 'Epic': return { border: 'border-purple-500', headerBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-700', iconColor: 'text-white', badge: 'bg-purple-950 text-purple-400 border-purple-500', shadow: 'shadow-lg' };
      case 'Rare': return { border: 'border-blue-500', headerBg: 'bg-gradient-to-br from-cyan-400 to-blue-600', iconColor: 'text-white', badge: 'bg-blue-950 text-blue-400 border-blue-500', shadow: 'shadow-lg' };
      default: return { border: 'border-zinc-600', headerBg: 'bg-gradient-to-br from-zinc-500 to-zinc-700', iconColor: 'text-white', badge: 'bg-zinc-900 text-zinc-400 border-zinc-600', shadow: 'shadow-lg' };
    }
  };

  const style = getRarityStyles(event.rarity);

  const getIcon = () => {
    switch (event.type) {
      case GameEventType.BOSS: return <Crown className="w-24 h-24 text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />;
      case GameEventType.ITEM: return <Box className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.ENCOUNTER: return <Skull className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.LOCATION: return <MapPin className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.TRAP: return <Zap className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.DILEMA: return <Split className="w-20 h-20 opacity-90 drop-shadow-md" />;
      default: return <Star className="w-20 h-20 opacity-90 drop-shadow-md" />;
    }
  };

  // --- ACTIONS ---
  const handleSaveClick = async () => { if (!onSave) return; setIsSaving(true); playSound('click'); try { await onSave(); } catch (e) { console.error("Save failed", e); } finally { setIsSaving(false); } };
  const handleUseClick = async () => { if (!onUse) return; setIsSaving(true); playSound('click'); try { await onUse(); } catch (e) { setIsSaving(false); } };
  const handleDeleteClick = () => { setShowDeleteConfirm(true); playSound('error'); };
  const handleConfirmDelete = async () => { if (!onDelete) return; setIsDeleting(true); try { await onDelete(); } catch (e) { setIsDeleting(false); setShowDeleteConfirm(false); } };
  const handleDilemmaChoice = (option: DilemmaOption) => { setSelectedDilemmaOption(option); if (onResolveDilemma) onResolveDilemma(option); };
  const handleDownloadSavedQr = async () => { /* ... existing logic ... */ }; 
  
  // --- COMBAT LOGIC ---
  const handleAttack = () => {
      const rollValue = parseInt(attackInput);
      if (isNaN(rollValue)) return;
      const dmg = Math.max(0, rollValue - enemyDefense);
      setEnemyCurrentHp(prev => Math.max(0, prev - dmg));
      let newLog = [...combatLog, `> Útok ${rollValue} (vs DEF ${enemyDefense}) = ${dmg} DMG`];
      if (dmg > 0) { playSound('scan'); vibrate([50]); } else { playSound('error'); }
      setAttackInput('');
      if (enemyCurrentHp - dmg <= 0) { setVictory(true); playSound('success'); newLog.push("NEPŘÍTEL PORAŽEN!"); setCombatLog(newLog); return; }
      setIsPlayerTurn(false);
      setTimeout(() => { if (onPlayerDamage) { onPlayerDamage(-enemyAttack); newLog.push(`> Nepřítel útočí za ${enemyAttack} DMG!`); setCombatLog(newLog); } setIsPlayerTurn(true); }, 1000);
      setCombatLog(newLog);
  };

  const fleeChance = (() => { switch (event.rarity) { case 'Legendary': return 10; case 'Epic': return 30; case 'Rare': return 50; default: return 80; } })();

  const handleAttemptFlee = () => {
      if (fleeAttempts >= MAX_FLEE_ATTEMPTS) { playSound('error'); return; }
      const roll = Math.random() * 100;
      setFleeAttempts(prev => prev + 1);
      if (roll <= fleeChance) { playSound('open'); onClose(); } else { playSound('damage'); vibrate([100, 50, 100]); if (onPlayerDamage) { onPlayerDamage(-enemyAttack); } const attemptsLeft = MAX_FLEE_ATTEMPTS - (fleeAttempts + 1); setCombatLog(prev => [...prev, `> ÚTĚK SELHAL! (Šance ${fleeChance}%)`, `> Nepřítel tě zasáhl za ${enemyAttack} DMG!`, attemptsLeft > 0 ? `> Zbývá pokusů: ${attemptsLeft}` : `> ÚTĚK UŽ NENÍ MOŽNÝ!`]); }
  };

  const handleUseCombatItem = async (item: GameEvent) => {
      let used = false;
      if (item.stats) { 
          item.stats.forEach(s => { 
              const label = s.label.toUpperCase(); 
              const val = parseInt(String(s.value));
              if (isNaN(val)) return;

              if (['HP', 'HEAL', 'LÉČENÍ'].some(k => label.includes(k))) { 
                  if (onPlayerDamage) {
                      onPlayerDamage(val); 
                  }
                  setCombatLog(prev => [...prev, `> Použit ${item.title}: +${val} HP`]); 
                  used = true; 
              } 
              
              if (['DMG', 'ÚTOK'].some(k => label.includes(k))) { 
                  const dmg = Math.abs(val); 
                  setEnemyCurrentHp(prev => Math.max(0, prev - dmg)); 
                  setCombatLog(prev => [...prev, `> Použit ${item.title}: -${dmg} Enemy HP`]); 
                  used = true; 
              } 
          }); 
      }
      
      if (used) { 
          playSound('heal'); 
          if (item.isConsumable && onConsume) {
              await onConsume(item.id);
          }
          setShowInventory(false); 
      } else { 
          alert("Tento předmět nelze v boji použít (nemá staty)."); 
      }
  };


  // --- RENDER VARIATIONS (OPTIMIZED) ---

  if (isBoss) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950">
            {/* Optimized background: Solid color instead of heavy blur */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{ willChange: 'transform' }} // HW Acceleration hint
                transition={cardTransition}
                className="relative w-full max-w-sm bg-black border-4 border-red-900 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(220,38,38,0.3)] flex flex-col"
            >
                {/* Delete Confirm Overlay for BOSS */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat Bosse?</h3>
                        <div className="flex w-full gap-3 mt-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg border border-zinc-700">Zrušit</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold uppercase rounded-lg">Smazat</button></div>
                    </div>
                )}

                <div className="absolute top-4 left-4 z-20 flex gap-2">
                    {onEdit && (
                        <button onClick={onEdit} className="text-red-500 hover:text-white bg-black/50 p-2 rounded-full border border-red-900/50"><Pencil className="w-5 h-5"/></button>
                    )}
                    {isAdmin && onDelete && (
                        <button onClick={handleDeleteClick} className="text-red-500 hover:text-white bg-black/50 p-2 rounded-full border border-red-900/50">
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    )}
                </div>

                {/* BOSS HEADER */}
                <div className="bg-gradient-to-b from-red-900 via-red-950 to-black p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500/20 to-transparent animate-pulse-slow"></div>
                    <motion.div 
                        animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="relative z-10 flex justify-center mb-4"
                    >
                        {getIcon()}
                    </motion.div>
                    <h2 className="relative z-10 text-3xl font-display font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                        {event.title}
                    </h2>
                    <div className="relative z-10 mt-2 inline-flex items-center gap-2 bg-red-950/80 border border-red-600 px-3 py-1 rounded-full">
                        <Siren className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">Extrémní Nebezpečí</span>
                    </div>
                </div>

                {/* BOSS INFO */}
                <div className="p-6 space-y-6 bg-black relative z-10">
                    <p className="text-zinc-400 text-center font-serif italic border-l-2 border-red-900 pl-4">
                        "{event.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl flex flex-col items-center">
                            <Heart className="w-6 h-6 text-red-600 mb-1" />
                            <span className="text-2xl font-display font-bold text-white">{enemyMaxHp} x ???</span>
                            <span className="text-[9px] text-zinc-500 uppercase">Základní HP (Škáluje se)</span>
                        </div>
                        <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl flex flex-col items-center">
                            <Sword className="w-6 h-6 text-red-600 mb-1" />
                            <span className="text-2xl font-display font-bold text-white">{enemyAttack}</span>
                            <span className="text-[9px] text-zinc-500 uppercase">Útok</span>
                        </div>
                    </div>

                    <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                        <h4 className="text-red-500 font-bold uppercase text-xs mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Varování
                        </h4>
                        <p className="text-xs text-red-300/80 leading-relaxed">
                            Tento nepřítel je příliš silný pro jednoho hráče. HP se automaticky vynásobí počtem hráčů v místnosti. Ujistěte se, že je celý tým připraven.
                        </p>
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="p-6 bg-zinc-900 border-t border-zinc-800 flex flex-col gap-3">
                    {onStartRaid && (
                        <button 
                            onClick={() => onStartRaid(event)}
                            className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black uppercase text-lg tracking-widest rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 transition-transform active:scale-95 group"
                        >
                            <Skull className="w-6 h-6 group-hover:animate-bounce" />
                            VYZVAT NA SOUBOJ
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                        <Wind className="w-5 h-5" />
                        Utéct (Ignorovat)
                    </button>
                </div>
            </motion.div>
        </motion.div>
      );
  }

  if (event.type === GameEventType.DILEMA) {
     return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
             <button onClick={!showDeleteConfirm ? onClose : undefined} className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
             
             {/* Admin Controls for Dilemma */}
             <div className="absolute top-4 left-4 z-50 flex gap-2">
                {onEdit && (
                    <button onClick={onEdit} className="p-2 bg-black/50 border border-zinc-700 rounded-full text-blue-400 hover:text-white transition-colors"><Pencil className="w-5 h-5"/></button>
                )}
                {isAdmin && onDelete && (
                     <button onClick={handleDeleteClick} className="p-2 bg-black/50 border border-zinc-700 rounded-full text-red-500 hover:text-white transition-colors">
                        <Trash2 className="w-5 h-5"/>
                    </button>
                )}
             </div>

             {onEdit && <div className="absolute inset-0" onClick={!showDeleteConfirm ? onClose : undefined}></div>}
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={cardTransition}
                style={{ willChange: 'transform' }}
                className="w-full max-w-md bg-zinc-950 border-2 border-neon-purple rounded-[30px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative"
             >
                {/* Delete Confirm Overlay */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat Dilema?</h3>
                        <div className="flex w-full gap-3 mt-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg border border-zinc-700">Zrušit</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold uppercase rounded-lg">Smazat</button></div>
                    </div>
                )}
                <div className="bg-gradient-to-b from-purple-900 to-zinc-900 p-8 text-center border-b border-neon-purple/30 relative shrink-0">
                     <div className="absolute top-4 right-4 text-neon-purple animate-pulse"><HelpCircle className="w-6 h-6"/></div>
                     <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest mb-1 drop-shadow-md">{event.title}</h2>
                     <p className="text-neon-purple text-xs font-bold uppercase tracking-[0.3em] font-mono">Sociální Dilema</p>
                </div>
                <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {!selectedDilemmaOption ? <DilemmaChoices event={event} onSelect={handleDilemmaChoice} key="choices" /> : <DilemmaResult option={selectedDilemmaOption} onClose={onClose} key="result" />}
                    </AnimatePresence>
                </div>
             </motion.div>
        </motion.div>
      );
  }

  // --- COMBAT UI (STANDARD ENCOUNTER) ---
  if (isEncounter) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80">
            {/* INVENTORY OVERLAY */}
            <AnimatePresence>
                {showInventory && (
                    <motion.div initial={{y: '100%'}} animate={{y: 0}} exit={{y: '100%'}} transition={{type:'tween', ease:'circOut'}} className="absolute inset-0 z-[70] bg-zinc-950 flex flex-col">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black">
                            <h3 className="font-bold text-white flex items-center gap-2"><Backpack className="w-5 h-5 text-neon-blue"/> Taktický Inventář</h3>
                            <button onClick={() => setShowInventory(false)}><X className="w-6 h-6 text-zinc-500 hover:text-white"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Dostupné Vybavení (Použitelné)</p>
                            {inventory?.filter(i => i.isConsumable).map(item => {
                                const healStat = item.stats?.find(s => ['HP', 'HEAL', 'LÉČENÍ'].some(k => s.label.toUpperCase().includes(k)));
                                const dmgStat = item.stats?.find(s => ['DMG', 'ÚTOK', 'POŠKOZENÍ'].some(k => s.label.toUpperCase().includes(k)));
                                
                                // Only show relevant items
                                if (!healStat && !dmgStat) return null;

                                return (
                                    <button key={item.id} onClick={() => handleUseCombatItem(item)} className="w-full bg-zinc-900 p-4 rounded-xl flex justify-between items-center border border-zinc-800 hover:border-neon-blue active:scale-[0.98] transition-all group relative overflow-hidden">
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className={`p-2 rounded-lg ${healStat ? 'bg-green-900/20 text-green-500 border border-green-900/50' : 'bg-red-900/20 text-red-500 border border-red-900/50'}`}>
                                                {healStat ? <BriefcaseMedical className="w-5 h-5"/> : <Sword className="w-5 h-5"/>}
                                            </div>
                                            <div className="text-left">
                                                <span className="font-bold text-white block">{item.title}</span>
                                                <div className="flex gap-2 text-[10px] font-mono uppercase tracking-wider">
                                                    {healStat && <span className="text-green-400">+{healStat.value} HP</span>}
                                                    {dmgStat && <span className="text-red-400">{Math.abs(parseInt(String(dmgStat.value)))} DMG</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-zinc-800 px-3 py-1.5 rounded text-[10px] font-bold text-zinc-400 group-hover:bg-neon-blue group-hover:text-black transition-colors relative z-10">
                                            POUŽÍT
                                        </div>
                                    </button>
                                );
                            })}
                            {(!inventory || inventory.filter(i => i.isConsumable).length === 0) && <p className="text-center text-zinc-500 mt-10 italic">Žádné použitelné předměty v batohu.</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                style={{ willChange: 'transform' }}
                transition={cardTransition}
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="w-full max-w-sm bg-zinc-950 border-4 border-red-600 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative"
            >
                {/* Delete Confirm Overlay for ENCOUNTER */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                        <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat Nepřítele?</h3>
                        <div className="flex w-full gap-3 mt-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg border border-zinc-700">Zrušit</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold uppercase rounded-lg">Smazat</button></div>
                    </div>
                )}
                
                {/* Header */}
                <div className="bg-red-900/50 p-6 text-center border-b border-red-600 relative">
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest drop-shadow-md">{event.title}</h2>
                    <div className="absolute top-4 right-4 bg-red-600 px-2 py-1 rounded text-[10px] font-bold text-white uppercase">Nepřítel</div>
                    <div className="absolute top-4 left-4 flex gap-2">
                        {onEdit && (
                            <button onClick={onEdit} className="text-red-300 hover:text-white transition-colors bg-red-900/30 p-1.5 rounded-lg border border-red-500/30">
                                <Pencil className="w-5 h-5" />
                            </button>
                        )}
                        {isAdmin && onDelete && (
                             <button onClick={handleDeleteClick} className="text-red-300 hover:text-white transition-colors bg-red-900/30 p-1.5 rounded-lg border border-red-500/30">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Combat Stats Area */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Enemy HP BAR */}
                    <div>
                        <div className="flex justify-between text-xs font-bold text-red-400 uppercase mb-1">
                            <span>Zdraví Nepřítele</span>
                            <span>{enemyCurrentHp} / {enemyMaxHp}</span>
                        </div>
                        <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700 relative">
                            <motion.div 
                                className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                initial={{ width: '100%' }}
                                animate={{ width: `${(enemyCurrentHp / enemyMaxHp) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex justify-around py-2">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-1 border-2 border-zinc-700">
                                <Shield className="w-6 h-6 text-zinc-400" />
                            </div>
                            <span className="text-xl font-bold text-white">{enemyDefense}</span>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Brnění</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-1 border-2 border-red-500">
                                <Sword className="w-6 h-6 text-red-500" />
                            </div>
                            <span className="text-xl font-bold text-red-500">{enemyAttack}</span>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold">Útok</p>
                        </div>
                    </div>

                    {/* Combat Log */}
                    <div className="h-32 bg-black rounded-lg p-3 overflow-y-auto font-mono text-xs text-green-500 border border-zinc-800 space-y-1 shadow-inner">
                        {combatLog.map((log, i) => (
                            <div key={i} className={log.includes('SELHAL') || log.includes('zasáhl') ? 'text-red-500 font-bold' : ''}>{log}</div>
                        ))}
                    </div>
                </div>

                {/* Controls Area */}
                <div className="p-4 bg-zinc-900 border-t border-zinc-800 mt-auto">
                    {/* Player HP Bar - Visual Feedback for Player State */}
                    {playerHp !== undefined && (
                        <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-bold text-neon-blue uppercase mb-1 px-1">
                                <span>Tvoje Zdraví</span>
                                <span>{playerHp} / 100</span>
                            </div>
                            <div className="h-2 bg-black rounded-full overflow-hidden border border-zinc-700">
                                <motion.div 
                                    className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${Math.min(100, Math.max(0, (playerHp / 100) * 100))}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {victory ? (
                        <div className="space-y-3">
                            <div className="bg-green-500/20 border border-green-500 p-3 rounded-lg text-center text-green-500 font-bold uppercase animate-pulse flex items-center justify-center gap-2">
                                <Crown className="w-5 h-5"/> Vítězství!
                            </div>
                            <button onClick={onClose} className="w-full py-4 bg-zinc-800 text-white font-bold uppercase rounded-xl">Zavřít</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={attackInput}
                                    onChange={(e) => setAttackInput(e.target.value)}
                                    placeholder="Hodnota útoku..."
                                    className="flex-1 bg-black border border-zinc-700 rounded-xl p-3 text-white text-center font-bold text-lg outline-none focus:border-red-500"
                                    disabled={!isPlayerTurn}
                                />
                                <button 
                                    onClick={handleAttack}
                                    disabled={!isPlayerTurn || !attackInput}
                                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:bg-zinc-800 text-white font-bold uppercase rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <Target className="w-5 h-5" /> ÚTOK
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowInventory(true)}
                                    className="flex-1 py-3 bg-zinc-800 text-zinc-300 hover:text-white font-bold uppercase rounded-xl text-xs flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
                                >
                                    <Backpack className="w-4 h-4" /> Batoh
                                </button>
                                <button 
                                    onClick={handleAttemptFlee}
                                    disabled={fleeAttempts >= MAX_FLEE_ATTEMPTS}
                                    className={`w-28 py-3 font-bold uppercase rounded-xl text-xs border flex flex-col items-center justify-center leading-none transition-colors ${
                                        fleeAttempts >= MAX_FLEE_ATTEMPTS 
                                        ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed' 
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-zinc-700'
                                    }`}
                                >
                                    {fleeAttempts >= MAX_FLEE_ATTEMPTS ? (
                                        <>
                                            <span className="flex items-center gap-1"><Lock className="w-3 h-3"/> ZAMČENO</span>
                                            <span className="text-[9px] mt-1 opacity-70">Už nelze utéct</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex items-center gap-1"><Wind className="w-3 h-3"/> Útěk</span>
                                            <span className="text-[9px] mt-1 opacity-70">({MAX_FLEE_ATTEMPTS - fleeAttempts}x) {fleeChance}%</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
      );
  }

  // --- STANDARD ITEM RENDER (OPTIMIZED) ---
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" // Solid background instead of blur
    >
      <div className="absolute inset-0" onClick={!showDeleteConfirm ? onClose : undefined}></div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={cardTransition} // Using faster physics
        style={{ willChange: 'transform' }} // Optimization
        className={`relative w-full max-w-[360px] bg-zinc-950 rounded-[28px] ${style.shadow} overflow-hidden flex flex-col border-[4px] ${style.border} max-h-[85vh]`}
      >
        <button onClick={onClose} className="absolute top-3 right-3 z-50 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-all border border-white/10"><X className="w-5 h-5" /></button>

        {showDeleteConfirm && (
             <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat kartu?</h3>
                <div className="flex w-full gap-3 mt-4"><button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg border border-zinc-700">Zrušit</button><button onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold uppercase rounded-lg">Smazat</button></div>
            </div>
        )}

        <div className={`h-48 ${style.headerBg} flex items-center justify-center relative shadow-inner overflow-hidden shrink-0`}>
           <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>
           <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent"></div>
           <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className={`relative z-10 ${style.iconColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>{getIcon()}</motion.div>
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg"><span className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em] drop-shadow-sm">{event.rarity}</span></div>
           {event.isShareable && <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-sm"><Share2 className="w-4 h-4 text-white" /></div>}
           {event.isConsumable && <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-red-400 shadow-sm flex items-center gap-1"><Ghost className="w-3 h-3 text-white" /><span className="text-[8px] font-bold text-white uppercase tracking-widest">1x USE</span></div>}
        </div>

        <div className="flex-1 p-6 flex flex-col bg-zinc-950 overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-800">
                <div className="flex flex-col"><h2 className="text-2xl font-display font-black text-white leading-none uppercase tracking-wide drop-shadow-sm">{event.title}</h2></div>
                <div className="flex flex-col items-end gap-1.5 pl-2"><span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${style.badge}`}>{event.type}</span>
                {/* Price display REMOVED from here as requested */}
                </div>
            </div>

            {isInstantEffect && effectValue !== undefined && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 shadow-lg ${effectValue < 0 ? 'bg-red-950/50 border-red-500' : 'bg-green-950/50 border-green-500'}`}>
                    {effectValue < 0 ? <div className="bg-red-900/50 p-3 rounded-full border border-red-500"><HeartCrack className="w-6 h-6 text-red-500" /></div> : <div className="bg-green-900/50 p-3 rounded-full border border-green-500"><Heart className="w-6 h-6 text-green-500" /></div>}
                    <div><h4 className={`text-sm font-bold uppercase font-display tracking-wider ${effectValue < 0 ? 'text-red-500' : 'text-green-500'}`}>{effectValue < 0 ? 'Poškození!' : 'Vyléčeno!'}</h4><p className="text-lg font-mono font-bold text-white">HP {effectValue > 0 ? '+' : ''}{effectValue}</p></div>
                </div>
            )}

            <div className="mb-6"><p className="text-sm text-zinc-300 leading-relaxed font-sans text-justify font-light">{event.description}</p></div>

            {event.stats && event.stats.length > 0 && (
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 mb-6 shadow-inner">
                    <div className="flex items-center gap-2 mb-3 opacity-70"><Activity className="w-4 h-4 text-neon-blue" /><span className="text-[10px] uppercase font-bold text-neon-blue tracking-widest font-display">Statistiky</span></div>
                    <div className="grid grid-cols-2 gap-3">{event.stats.map((stat, idx) => (<div key={idx} className="flex justify-between items-center bg-zinc-900 px-3 py-2 rounded border border-zinc-800 shadow-sm"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span><span className="text-sm font-mono font-bold text-white">{stat.value}</span></div>))}</div>
                </div>
            )}
            {event.flavorText && <div className="mt-auto pt-4 border-t border-zinc-800/50"><p className="text-xs text-zinc-600 italic font-serif text-center px-4">"{event.flavorText}"</p></div>}
        </div>

        <div className="bg-zinc-950 p-4 border-t border-zinc-800 shrink-0 safe-area-bottom">
            <div className="flex justify-between items-center mb-3 px-1">
                 <div className="flex items-center gap-1 opacity-50"><Hash className="w-3 h-3 text-zinc-600" /><span className="text-[10px] font-mono text-zinc-600">{event.id}</span></div>
                 {isSaved && <div className="flex items-center gap-1 text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900"><Shield className="w-3 h-3" /><span className="text-[9px] font-bold uppercase tracking-wide">Vlastněno</span></div>}
            </div>

            <div className="flex gap-2 h-14">
                 {isInstantEffect ? (
                     <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg font-display"><CheckCircle className="w-5 h-5 text-neon-green" /> Potvrdit Efekt</button>
                 ) : (
                    <>
                        {onUse && <button onClick={handleUseClick} disabled={isSaving} className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold uppercase text-xs tracking-wider text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r ${event.isConsumable ? 'from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border-red-500' : 'from-neon-blue to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-neon-blue text-black'} border ${isSaving ? 'opacity-80' : ''}`}>{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}{event.isConsumable ? "POUŽÍT (SPOTŘEBOVAT)" : "AKTIVOVAT"}</button>}
                        {onSave && (!event.isConsumable || event.canBeSaved) && !isSaved && <button onClick={handleSaveClick} disabled={isSaving} className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold uppercase text-xs tracking-wider text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r from-neon-blue to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-neon-blue text-black ${isSaving ? 'opacity-80' : ''}`}>{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}{isSaving ? "Sync..." : "Uložit"}</button>}
                        {!onUse && !(onSave && (!event.isConsumable || event.canBeSaved) && !isSaved) && <button onClick={onClose} className="flex-1 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors">Zavřít</button>}
                        
                        {event.qrCodeUrl && isSaved && isAdmin && <button onClick={handleDownloadSavedQr} className="w-14 flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-xl transition-colors"><QrCode className="w-5 h-5" /></button>}
                        
                        {onEdit && <button onClick={onEdit} className="w-14 flex items-center justify-center bg-blue-900/20 border border-blue-900 hover:bg-blue-900/40 text-blue-400 rounded-xl transition-colors"><Pencil className="w-5 h-5" /></button>}
                        
                        {/* UPDATE: Show Delete for Admin even if not saved locally, as Admin controls the DB */}
                        {(isSaved || isAdmin) && onDelete && <button onClick={handleDeleteClick} className="w-14 flex items-center justify-center bg-red-900/20 border border-red-900 hover:bg-red-900/40 text-red-500 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                    </>
                 )}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventCard;
