
import React, { useState, useEffect } from 'react'; 
import { GameEvent, GameEventType, DilemmaOption } from '../types';
import { MapPin, Skull, Zap, Box, Star, Save, RefreshCw, Trash2, Loader2, AlertTriangle, Activity, Shield, Hash, Share2, CheckCircle, HeartCrack, Heart, Coins, Pencil, Split, HelpCircle, ArrowRight, QrCode, PlayCircle, Ghost, X } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../services/soundService'; 

interface EventCardProps {
  event: GameEvent;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onEdit?: () => void; 
  onResolveDilemma?: (option: DilemmaOption) => void; 
  onUse?: () => Promise<void> | void; 
  isSaved?: boolean;
  isInstantEffect?: boolean;
  effectValue?: number; 
  isAdmin?: boolean; 
}

interface DilemmaChoicesProps {
    event: GameEvent;
    onSelect: (opt: DilemmaOption) => void;
}

const DilemmaChoices: React.FC<DilemmaChoicesProps> = ({ event, onSelect }) => (
    <motion.div
        key="choices"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
    >
        <div className="mb-8 text-center">
            <p className="text-zinc-300 font-serif text-lg leading-relaxed italic">
                "{event.description}"
            </p>
            <div className="mt-4 p-3 bg-neon-purple/10 rounded-lg border border-neon-purple/30 text-xs text-neon-purple font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(188,19,254,0.2)]">
                PŘEČTĚTE NAHLAS A DISKUTUJTE
            </div>
        </div>
        
        <div className="space-y-4">
            {event.dilemmaOptions?.map((opt, idx) => (
                <button 
                    key={idx}
                    onClick={() => onSelect(opt)}
                    className="w-full p-6 bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-zinc-700 hover:to-zinc-800 border border-zinc-600 hover:border-neon-purple rounded-xl text-left transition-all active:scale-[0.98] group shadow-lg relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <span className="font-display font-bold text-white uppercase tracking-wide text-lg">{opt.label}</span>
                        <ArrowRight className="w-6 h-6 text-zinc-500 group-hover:text-neon-purple transition-colors" />
                    </div>
                </button>
            ))}
            {(!event.dilemmaOptions || event.dilemmaOptions.length === 0) && (
                <p className="text-red-500 text-center">Chyba: Toto dilema nemá definované možnosti.</p>
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
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="text-center"
    >
         <div className="w-20 h-20 bg-neon-purple/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-neon-purple shadow-[0_0_30px_rgba(188,19,254,0.4)] animate-in zoom-in duration-300">
             <Split className="w-10 h-10 text-neon-purple" />
         </div>
         
         <h3 className="text-2xl font-display font-bold text-white mb-6 uppercase tracking-widest">Následky</h3>
         
         <p className="text-zinc-300 mb-8 italic text-lg leading-relaxed">
             "{option.consequenceText}"
         </p>

         {option.effectType !== 'none' && (
             <div className={`mb-8 p-6 rounded-2xl border flex items-center justify-center gap-4 ${
                 option.effectValue < 0 ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-green-950/40 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]'
             }`}>
                 {option.effectType === 'hp' ? <Heart className="w-8 h-8"/> : <Coins className="w-8 h-8"/>}
                 <div className="flex flex-col items-start">
                     <span className="font-mono font-bold text-2xl">
                         {option.effectValue > 0 ? '+' : ''}{option.effectValue} {option.effectType.toUpperCase()}
                     </span>
                     <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">Aplikováno automaticky</span>
                 </div>
             </div>
         )}

         {option.physicalInstruction && (
             <div className="p-6 bg-yellow-900/20 border border-yellow-600/50 rounded-2xl mb-8">
                 <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.2em] mb-2">INSTRUKCE PRO DESKOVOU HRU</p>
                 <p className="text-yellow-400 font-bold text-xl font-display">{option.physicalInstruction}</p>
             </div>
         )}

         <button 
            onClick={onClose}
            className="w-full py-4 bg-neon-purple hover:bg-fuchsia-600 text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-transform active:scale-95"
         >
             Pokračovat ve hře
         </button>
    </motion.div>
);

const EventCard: React.FC<EventCardProps> = ({ event, onClose, onSave, onDelete, onEdit, onResolveDilemma, onUse, isSaved, isInstantEffect, effectValue, isAdmin }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDilemmaOption, setSelectedDilemmaOption] = useState<DilemmaOption | null>(null);

  useEffect(() => {
     playSound('open');
  }, []);

  const getRarityStyles = (rarity: string) => {
    if (event.type === GameEventType.TRAP || event.type === GameEventType.ENCOUNTER) {
         return {
            border: 'border-red-600',
            headerBg: 'bg-gradient-to-br from-red-600 to-red-900',
            iconColor: 'text-white',
            badge: 'bg-red-950 text-red-500 border-red-500',
            shadow: 'shadow-[0_0_50px_rgba(220,38,38,0.3)]'
        };
    }
    if (event.type === GameEventType.DILEMA) {
        return {
            border: 'border-neon-purple',
            headerBg: 'bg-gradient-to-br from-neon-purple to-purple-900',
            iconColor: 'text-white',
            badge: 'bg-purple-950 text-neon-purple border-neon-purple',
            shadow: 'shadow-[0_0_50px_rgba(188,19,254,0.3)]'
        };
    }
    switch (rarity) {
      case 'Legendary': return { border: 'border-yellow-500', headerBg: 'bg-gradient-to-br from-yellow-400 to-orange-600', iconColor: 'text-yellow-950', badge: 'bg-yellow-950 text-yellow-500 border-yellow-500', shadow: 'shadow-[0_0_50px_rgba(234,179,8,0.4)]' };
      case 'Epic': return { border: 'border-purple-500', headerBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-700', iconColor: 'text-white', badge: 'bg-purple-950 text-purple-400 border-purple-500', shadow: 'shadow-[0_0_40px_rgba(168,85,247,0.3)]' };
      case 'Rare': return { border: 'border-blue-500', headerBg: 'bg-gradient-to-br from-cyan-400 to-blue-600', iconColor: 'text-white', badge: 'bg-blue-950 text-blue-400 border-blue-500', shadow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]' };
      default: return { border: 'border-zinc-600', headerBg: 'bg-gradient-to-br from-zinc-500 to-zinc-700', iconColor: 'text-white', badge: 'bg-zinc-900 text-zinc-400 border-zinc-600', shadow: 'shadow-[0_0_30px_rgba(82,82,91,0.2)]' };
    }
  };

  const style = getRarityStyles(event.rarity);

  const getIcon = () => {
    switch (event.type) {
      case GameEventType.ITEM: return <Box className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.ENCOUNTER: return <Skull className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.LOCATION: return <MapPin className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.TRAP: return <Zap className="w-20 h-20 opacity-90 drop-shadow-md" />;
      case GameEventType.DILEMA: return <Split className="w-20 h-20 opacity-90 drop-shadow-md" />;
      default: return <Star className="w-20 h-20 opacity-90 drop-shadow-md" />;
    }
  };

  const handleSaveClick = async () => {
    if (!onSave) return;
    setIsSaving(true);
    playSound('click');
    try { await onSave(); } catch (e) { console.error("Save failed", e); } finally { setIsSaving(false); }
  };

  const handleUseClick = async () => {
      if (!onUse) return;
      setIsSaving(true); 
      playSound('click');
      try { await onUse(); } catch (e) { setIsSaving(false); }
  };

  const handleDeleteClick = () => { setShowDeleteConfirm(true); playSound('error'); };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try { await onDelete(); } catch (e) { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const handleDilemmaChoice = (option: DilemmaOption) => {
      setSelectedDilemmaOption(option);
      if (onResolveDilemma) onResolveDilemma(option);
  };

  const handleDownloadSavedQr = async () => {
      if (!event.qrCodeUrl) return;
      try {
          const response = await fetch(event.qrCodeUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const safeTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          link.download = `nexus-${event.type}-${safeTitle}-${event.id}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (e) { alert("Nelze stáhnout QR kód."); }
  };
  
  const showUseButton = onUse; 
  const showSaveButton = onSave && (!event.isConsumable || event.canBeSaved) && !isSaved;

  if (event.type === GameEventType.DILEMA) {
      return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
        >
             {/* Close Button for Dilemma */}
             <button 
                onClick={!showDeleteConfirm ? onClose : undefined} 
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 border border-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

             {onEdit && <div className="absolute inset-0" onClick={!showDeleteConfirm ? onClose : undefined}></div>}

             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-zinc-950 border-2 border-neon-purple rounded-[30px] overflow-hidden shadow-[0_0_50px_rgba(188,19,254,0.2)] flex flex-col max-h-[90vh] relative"
             >
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat Dilema?</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                            Tato akce je nevratná. Karta <span className="font-bold">"{event.title}"</span> bude trvale odstraněna.
                        </p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg transition-colors text-xs border border-zinc-700">Zrušit</button>
                            <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{isDeleting ? "Mazání..." : "Smazat"}</button>
                        </div>
                    </div>
                )}

                <div className="bg-gradient-to-b from-purple-900 to-zinc-900 p-8 text-center border-b border-neon-purple/30 relative shrink-0">
                     <div className="absolute top-4 right-4 text-neon-purple animate-pulse"><HelpCircle className="w-6 h-6"/></div>
                     <h2 className="text-3xl font-display font-black text-white uppercase tracking-widest mb-1 drop-shadow-md">{event.title}</h2>
                     <p className="text-neon-purple text-xs font-bold uppercase tracking-[0.3em] font-mono">Sociální Dilema</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        {!selectedDilemmaOption ? (
                            <DilemmaChoices event={event} onSelect={handleDilemmaChoice} key="choices" />
                        ) : (
                            <DilemmaResult option={selectedDilemmaOption} onClose={onClose} key="result" />
                        )}
                    </AnimatePresence>
                </div>
                
                {(onEdit || onDelete || (event.qrCodeUrl && isSaved && isAdmin)) && (
                    <div className="p-4 bg-black border-t border-zinc-800 flex gap-2 justify-center shrink-0 pb-safe">
                        {event.qrCodeUrl && isSaved && isAdmin && (
                             <button onClick={handleDownloadSavedQr} className="w-14 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-xl flex items-center justify-center transition-colors"><QrCode className="w-5 h-5" /></button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 border border-zinc-700"><Pencil className="w-4 h-4"/> Upravit</button>
                        )}
                        {onDelete && (
                            <button onClick={handleDeleteClick} className="w-14 py-3 bg-red-900/10 hover:bg-red-900/30 text-red-500 border border-red-900/30 rounded-xl flex items-center justify-center transition-colors"><Trash2 className="w-5 h-5"/></button>
                        )}
                    </div>
                )}
             </motion.div>
        </motion.div>
      );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
    >
      <div className="absolute inset-0" onClick={!showDeleteConfirm ? onClose : undefined}></div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 50, rotateX: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`relative w-full max-w-[360px] bg-zinc-900 rounded-[28px] ${style.shadow} overflow-hidden flex flex-col border-[4px] ${style.border} max-h-[85vh]`}
      >
        {/* Close Button for Standard Card */}
        <button 
            onClick={onClose}
            className="absolute top-3 right-3 z-50 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white/80 hover:text-white transition-all border border-white/10"
        >
            <X className="w-5 h-5" />
        </button>

        {showDeleteConfirm && (
            <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                <div className="p-4 bg-red-900/20 rounded-full mb-4 animate-bounce border border-red-500">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-red-500 uppercase mb-2">Smazat kartu?</h3>
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Tato akce je nevratná. Karta <span className="font-bold">"{event.title}"</span> bude trvale odstraněna.</p>
                <div className="flex w-full gap-3">
                    <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold uppercase rounded-lg transition-colors text-xs border border-zinc-700">Zrušit</button>
                    <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-xs">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{isDeleting ? "Mazání..." : "Smazat"}</button>
                </div>
            </div>
        )}

        <div className={`h-48 ${style.headerBg} flex items-center justify-center relative shadow-inner overflow-hidden shrink-0`}>
           <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>
           <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent"></div>
           
           <motion.div 
             initial={{ scale: 0, rotate: -45 }}
             animate={{ scale: 1, rotate: 0 }}
             transition={{ type: "spring", delay: 0.2 }}
             className={`relative z-10 ${style.iconColor} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
           >
             {getIcon()}
           </motion.div>
           
           <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-lg">
              <span className="text-[10px] font-display font-bold text-white uppercase tracking-[0.2em] drop-shadow-sm">{event.rarity}</span>
           </div>
           
           {event.isShareable && (
               <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-sm" title="Směnitelné">
                   <Share2 className="w-4 h-4 text-white" />
               </div>
           )}

            {event.isConsumable && (
               <div className="absolute top-4 left-4 bg-red-600/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-red-400 shadow-sm flex items-center gap-1" title="Jednorázový předmět">
                   <Ghost className="w-3 h-3 text-white" />
                   <span className="text-[8px] font-bold text-white uppercase tracking-widest">1x USE</span>
               </div>
           )}
        </div>

        <div className="flex-1 p-6 flex flex-col bg-zinc-900 overflow-y-auto">
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-zinc-800">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-display font-black text-white leading-none uppercase tracking-wide drop-shadow-sm">{event.title}</h2>
                </div>
                <div className="flex flex-col items-end gap-1.5 pl-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${style.badge}`}>{event.type}</span>
                    {event.price && event.price > 0 && (
                        <span className="text-[10px] font-mono font-bold text-yellow-500 flex items-center gap-1 bg-black/50 px-2 py-1 rounded border border-zinc-800"><Coins className="w-3 h-3" /> {event.price}</span>
                    )}
                </div>
            </div>

            {isInstantEffect && effectValue !== undefined && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 shadow-lg ${effectValue < 0 ? 'bg-red-950/50 border-red-500' : 'bg-green-950/50 border-green-500'}`}>
                    {effectValue < 0 ? <div className="bg-red-900/50 p-3 rounded-full border border-red-500"><HeartCrack className="w-6 h-6 text-red-500" /></div> : <div className="bg-green-900/50 p-3 rounded-full border border-green-500"><Heart className="w-6 h-6 text-green-500" /></div>}
                    <div>
                        <h4 className={`text-sm font-bold uppercase font-display tracking-wider ${effectValue < 0 ? 'text-red-500' : 'text-green-500'}`}>{effectValue < 0 ? 'Poškození!' : 'Vyléčeno!'}</h4>
                        <p className="text-lg font-mono font-bold text-white">HP {effectValue > 0 ? '+' : ''}{effectValue}</p>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <p className="text-sm text-zinc-300 leading-relaxed font-sans text-justify font-light">{event.description}</p>
            </div>

            {event.stats && event.stats.length > 0 && (
                <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 mb-6 shadow-inner">
                    <div className="flex items-center gap-2 mb-3 opacity-70">
                         <Activity className="w-4 h-4 text-neon-blue" />
                         <span className="text-[10px] uppercase font-bold text-neon-blue tracking-widest font-display">Statistiky</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {event.stats.map((stat, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-900 px-3 py-2 rounded border border-zinc-800 shadow-sm">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                                <span className="text-sm font-mono font-bold text-white">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {event.flavorText && (
                <div className="mt-auto pt-4 border-t border-zinc-800/50">
                    <p className="text-xs text-zinc-600 italic font-serif text-center px-4">"{event.flavorText}"</p>
                </div>
            )}
        </div>

        <div className="bg-zinc-950 p-4 border-t border-zinc-800 shrink-0 safe-area-bottom">
            <div className="flex justify-between items-center mb-3 px-1">
                 <div className="flex items-center gap-1 opacity-50">
                    <Hash className="w-3 h-3 text-zinc-600" />
                    <span className="text-[10px] font-mono text-zinc-600">{event.id}</span>
                 </div>
                 {isSaved && (
                     <div className="flex items-center gap-1 text-emerald-500 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-900">
                        <Shield className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-wide">Vlastněno</span>
                     </div>
                 )}
            </div>

            <div className="flex gap-2 h-14">
                 {isInstantEffect ? (
                     <button onClick={onClose} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg font-display">
                        <CheckCircle className="w-5 h-5 text-neon-green" />
                        Potvrdit Efekt
                     </button>
                 ) : (
                    <>
                        {showUseButton && (
                             <button onClick={handleUseClick} disabled={isSaving} className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold uppercase text-xs tracking-wider text-white shadow-lg transition-all active:scale-95 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-500 ${isSaving ? 'opacity-80' : ''}`}>
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
                                POUŽÍT
                            </button>
                        )}
                        {showSaveButton && (
                            <button onClick={handleSaveClick} disabled={isSaving} className={`flex-[2] flex items-center justify-center gap-2 rounded-xl font-bold uppercase text-xs tracking-wider text-white shadow-lg transition-all active:scale-95 ${isSaved ? "bg-emerald-600 hover:bg-emerald-500 border border-emerald-500" : "bg-gradient-to-r from-neon-blue to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-neon-blue text-black"} ${isSaving ? 'opacity-80' : ''}`}>
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSaved ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />)}
                                {isSaving ? "Sync..." : (isSaved ? "Upravit" : "Uložit")}
                            </button>
                        )}
                        {!showUseButton && !showSaveButton && (
                            <button onClick={onClose} className="flex-1 bg-zinc-800 border border-zinc-600 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors">Zavřít</button>
                        )}
                        {event.qrCodeUrl && isSaved && isAdmin && (
                            <button onClick={handleDownloadSavedQr} className="w-14 flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-400 rounded-xl transition-colors" title="Stáhnout QR (Admin)"><QrCode className="w-5 h-5" /></button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit} className="w-14 flex items-center justify-center bg-blue-900/20 border border-blue-900 hover:bg-blue-900/40 text-blue-400 rounded-xl transition-colors" title="Upravit"><Pencil className="w-5 h-5" /></button>
                        )}
                        {isSaved && onDelete && (
                            <button onClick={handleDeleteClick} className="w-14 flex items-center justify-center bg-red-900/20 border border-red-900 hover:bg-red-900/40 text-red-500 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                        )}
                    </>
                 )}
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventCard;
