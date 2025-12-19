
import React, { useState, useEffect } from 'react'; 
import { GameEvent, GameEventType, DilemmaOption } from '../types';
import { X, ChevronRight, AlertTriangle } from 'lucide-react'; 
import { motion } from 'framer-motion';
import { playSound, vibrate } from '../services/soundService'; 

interface EventCardProps {
  event: GameEvent;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  onResolveDilemma?: (option: DilemmaOption) => void; 
  onUse?: () => Promise<void> | void; 
  isSaved?: boolean;
  isAdmin?: boolean;
  onPlayerDamage?: (amount: number) => void;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  onClose, 
  onSave, 
  onUse, 
  onResolveDilemma,
  isSaved,
}) => {
  const [dilemmaStep, setDilemmaStep] = useState<'CHOICE' | 'RESULT'>('CHOICE');
  const [selectedOption, setSelectedOption] = useState<DilemmaOption | null>(null);

  useEffect(() => {
    playSound('open');
  }, [event]);

  const handleDilemmaChoice = (option: DilemmaOption) => {
    setSelectedOption(option);
    setDilemmaStep('RESULT');
    playSound('success');
    vibrate([30, 30]);
    if (onResolveDilemma) onResolveDilemma(option);
  };

  const getRarityStyles = (rarity: string, type: GameEventType) => {
    if (type === GameEventType.BOSS) return { border: 'border-signal-hazard shadow-[0_0_50px_rgba(255,60,0,0.3)]', text: 'text-signal-hazard' };
    switch(rarity) {
      case 'Legendary': return { border: 'border-signal-amber shadow-[0_0_50px_rgba(255,157,0,0.4)]', text: 'text-signal-amber' };
      case 'Epic': return { border: 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.2)]', text: 'text-purple-400' };
      case 'Rare': return { border: 'border-signal-cyan shadow-[0_0_20px_rgba(0,242,255,0.2)]', text: 'text-signal-cyan' };
      default: return { border: 'border-white/20', text: 'text-white/40' };
    }
  };

  const getStatColor = (label: string, _value: string | number) => {
    const l = label.toUpperCase();
    if (['HP', 'ZDRAVÍ', 'HEAL', 'HEALTH'].some(k => l.includes(k))) return 'text-green-400';
    if (['DMG', 'ATK', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => l.includes(k))) return 'text-signal-hazard';
    if (['GOLD', 'MINCE', 'KREDITY', 'CREDITS'].some(k => l.includes(k))) return 'text-signal-amber';
    if (['MANA', 'ENERGIE', 'ENERGY'].some(k => l.includes(k))) return 'text-signal-cyan';
    return 'text-white';
  };

  const style = getRarityStyles(event.rarity, event.type);
  const isDilemma = event.type === GameEventType.DILEMA;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 1.05, y: -20 }} 
      className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md transform-gpu"
    >
      <div className={`w-full max-w-sm bg-[#0a0b0d] border-2 ${style.border} relative overflow-hidden flex flex-col shadow-2xl rounded-2xl`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        
        <div className="p-6 pb-2 flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-[0.3em]">ID KARTY: {event.id}</span>
            <h2 className="text-3xl font-bold text-white uppercase tracking-tighter leading-none mb-2 font-sans chromatic-text">{event.title}</h2>
            <div className={`inline-flex px-2 py-0.5 border text-[8px] font-bold uppercase w-fit font-mono tracking-widest ${style.text} ${style.border}`}>
              {event.rarity}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto no-scrollbar font-mono relative z-10">
          <div className="bg-white/[0.03] border border-white/5 p-4 mb-6 relative italic text-[11px] leading-relaxed text-white/70">
             <div className="absolute top-0 left-0 w-0.5 h-full bg-signal-cyan/30" />
             "{event.description}"
          </div>

          {isDilemma && dilemmaStep === 'CHOICE' && (
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-signal-amber uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> Vyžadována_Akce_Operátora:
              </p>
              {event.dilemmaOptions?.map((opt, i) => (
                <button key={i} onClick={() => handleDilemmaChoice(opt)} className="w-full p-4 border border-white/10 bg-white/5 hover:border-signal-cyan hover:bg-signal-cyan/10 text-white text-left text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex justify-between items-center group rounded-lg">
                  <span>{opt.label}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-signal-cyan" />
                </button>
              ))}
            </div>
          )}

          {isDilemma && dilemmaStep === 'RESULT' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
              <div className="p-2 bg-signal-cyan text-black font-bold text-[10px] uppercase text-center tracking-[0.4em] rounded">Akce_Potvrzena</div>
              <p className="text-xs text-white font-bold leading-relaxed">{selectedOption?.consequenceText}</p>
              {selectedOption?.physicalInstruction && (
                <div className="border border-signal-amber/20 p-4 flex gap-3 text-signal-amber bg-signal-amber/5 rounded-lg">
                   <AlertTriangle className="w-4 h-4 shrink-0" />
                   <p className="text-[9px] uppercase font-bold leading-normal tracking-wide">{selectedOption.physicalInstruction}</p>
                </div>
              )}
            </div>
          )}

          {event.stats && event.stats.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {event.stats.map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-3 flex flex-col items-center rounded-xl">
                  <span className="text-[7px] font-bold text-white/30 uppercase tracking-tighter mb-1">{s.label}</span>
                  <span className={`font-mono font-black text-sm tracking-tighter ${getStatColor(s.label, s.value)}`}>{s.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 flex gap-4 relative z-10">
          {onUse && dilemmaStep !== 'RESULT' && !isDilemma && (
            <button onClick={onUse} className="flex-1 py-4 bg-signal-amber text-black font-black uppercase text-[11px] tracking-[0.3em] hover:brightness-110 active:scale-95 transition-all font-mono rounded-lg shadow-lg">Aktivovat KARTU!</button>
          )}
          {onSave && !isSaved && (
            <button onClick={onSave} className="flex-1 py-4 border border-white/20 text-white font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white/5 active:scale-95 transition-all font-mono rounded-lg">Archivovat</button>
          )}
          {dilemmaStep === 'RESULT' && (
            <button onClick={onClose} className="w-full py-4 bg-signal-cyan text-black font-black uppercase text-[11px] tracking-[0.3em] font-mono rounded-lg shadow-lg">Zavřít_Log</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
