
import React, { useState, useEffect } from 'react'; 
import { GameEvent, GameEventType, DilemmaOption } from '../types';
import { X, ChevronRight, AlertTriangle, Info, Trash2, Skull, Crown, ShoppingBag, Zap, Shield, Swords, Coins, Heart, Footprints, Cross, Wand2, Sword, Scan } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, vibrate } from '../services/soundService'; 

interface EventCardProps {
  event: GameEvent;
  onClose: () => void;
  onSave?: () => Promise<void> | void;
  onDiscard?: () => Promise<void> | void;
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
  onDiscard,
  onUse, 
  onResolveDilemma,
  isSaved,
}) => {
  const [dilemmaStep, setDilemmaStep] = useState<'CHOICE' | 'RESULT'>('CHOICE');
  const [selectedOption, setSelectedOption] = useState<DilemmaOption | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedStat, setExpandedStat] = useState<string | null>(null); 

  useEffect(() => {
    playSound('open');
  }, [event]);

  const handleStatClick = (label: string) => {
    setExpandedStat(expandedStat === label ? null : label);
    playSound('click');
    vibrate(10);
  };

  const getStatColor = (label: string) => {
    const l = label.toUpperCase();
    if (['HP', 'ZDRAVÍ', 'HEAL', 'HEALTH'].some(k => l.includes(k))) return 'text-green-400';
    if (['DMG', 'ATK', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => l.includes(k))) return 'text-signal-hazard';
    if (['GOLD', 'MINCE', 'KREDITY', 'CREDITS'].some(k => l.includes(k))) return 'text-signal-amber';
    if (['MANA', 'ENERGIE', 'ENERGY'].some(k => l.includes(k))) return 'text-signal-cyan';
    return 'text-white';
  };

  const getStatDescription = (label: string, value: string | number) => {
    const l = label.toUpperCase();
    const v = String(value);
    const isPositive = v.includes('+') || (!v.includes('-') && parseInt(v) > 0);

    if (['HP', 'ZDRAVÍ', 'HEAL', 'HEALTH'].some(k => l.includes(k))) {
        return isPositive ? `Okamžitě obnovuje ${v} jednotek biologické integrity.` : `Způsobuje přímé poškození tkání ve výši ${v} HP.`;
    }
    if (['DMG', 'ATK', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => l.includes(k))) {
        return `Zvyšuje sílu příštího úderu nebo automatického útoku o ${v}.`;
    }
    if (['GOLD', 'MINCE', 'KREDITY', 'CREDITS'].some(k => l.includes(k))) {
        return `Transakční kredity v hodnotě ${v} byly připsány do tvého účtu.`;
    }
    if (['MANA', 'ENERGIE', 'ENERGY'].some(k => l.includes(k))) {
        return `Obnovuje ${v} jednotek energie pro použití schopností nebo svitků.`;
    }
    if (['ARMOR', 'OBRANA', 'BRNĚNÍ'].some(k => l.includes(k))) {
        return `Zvyšuje tvou statickou ochranu o ${v}. Snižuje příchozí DMG.`;
    }
    return `Speciální modifikátor sektoru ovlivňující parametr ${label} o ${v}.`;
  };

  const handleDilemmaChoice = (option: DilemmaOption) => {
    setSelectedOption(option);
    setDilemmaStep('RESULT');
    playSound('success');
    vibrate([30, 30]);
    if (onResolveDilemma) onResolveDilemma(option);
  };

  const handleDiscardClick = () => {
    if (showDeleteConfirm && onDiscard) {
        onDiscard();
        playSound('error'); 
    } else {
        setShowDeleteConfirm(true);
        vibrate(20);
    }
  };

  const getTheme = (type: GameEventType, rarity: string) => {
      if (type === GameEventType.BOSS) return {
          bg: 'bg-gradient-to-b from-red-950/90 to-black',
          border: 'border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.4)]',
          text: 'text-red-500',
          accent: 'bg-red-600',
          icon: <Crown className="w-8 h-8 text-red-500" />
      };
      if (type === GameEventType.TRAP) return {
          bg: 'bg-gradient-to-b from-orange-950/90 to-black',
          border: 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]',
          text: 'text-orange-500',
          accent: 'bg-orange-500',
          icon: <Zap className="w-8 h-8 text-orange-500" />
      };
      if (type === GameEventType.MERCHANT) return {
          bg: 'bg-gradient-to-b from-yellow-950/90 to-black',
          border: 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)]',
          text: 'text-yellow-500',
          accent: 'bg-yellow-500',
          icon: <ShoppingBag className="w-8 h-8 text-yellow-500" />
      };
      if (type === GameEventType.ENCOUNTER) return {
          bg: 'bg-gradient-to-b from-rose-950/90 to-black',
          border: 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)]',
          text: 'text-rose-500',
          accent: 'bg-rose-500',
          icon: <Swords className="w-8 h-8 text-rose-500" />
      };
      if (type === GameEventType.DILEMA) return {
          bg: 'bg-gradient-to-b from-purple-950/90 to-black',
          border: 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]',
          text: 'text-purple-400',
          accent: 'bg-purple-500',
          icon: <AlertTriangle className="w-8 h-8 text-purple-500" />
      };
      const rarityColors: Record<string, string> = {
          'Legendary': 'border-signal-amber text-signal-amber shadow-[0_0_30px_rgba(255,157,0,0.3)]',
          'Epic': 'border-purple-400 text-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.3)]',
          'Rare': 'border-signal-cyan text-signal-cyan shadow-[0_0_20px_rgba(0,242,255,0.2)]',
          'Common': 'border-white/30 text-white/60'
      };
      return {
          bg: 'bg-[#0a0b0d]',
          border: rarityColors[rarity] || rarityColors['Common'],
          text: rarityColors[rarity]?.split(' ')[1] || 'text-white',
          accent: rarityColors[rarity]?.split(' ')[1].replace('text-', 'bg-') || 'bg-white',
          icon: <Scan className="w-8 h-8" />
      };
  };

  const theme = getTheme(event.type, event.rarity);
  const isDilemma = event.type === GameEventType.DILEMA;

  const renderStatExplain = (label: string, value: string | number) => (
    <AnimatePresence>
        {expandedStat === label && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="mt-2 p-2 bg-black/60 border border-white/10 rounded-lg text-[10px] text-zinc-300 leading-tight italic">
                    {getStatDescription(label, value)}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
  );

  const renderTrapContent = () => (
      <div className="space-y-4">
          <div className="p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg flex justify-between items-center">
              <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-orange-400">Obtížnost (Hod kostkou)</span>
                  <span className="text-3xl font-black text-white">{event.trapConfig?.difficulty || 10}+</span>
              </div>
              <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-red-400">Poškození při selhání</span>
                  <div className="flex items-center gap-2">
                      <Skull className="w-5 h-5 text-red-500" />
                      <span className="text-3xl font-black text-red-500">-{event.trapConfig?.damage || 0}</span>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-700 rounded-lg">
              <div className="p-2 bg-zinc-800 rounded"><Footprints className="w-4 h-4 text-green-400" /></div>
              <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold">Možnost Zneškodnění</p>
                  <p className="text-xs font-bold text-white">{event.trapConfig?.disarmClass === 'ANY' ? 'Kdokoliv' : `Pouze třída: ${event.trapConfig?.disarmClass}`}</p>
              </div>
          </div>
      </div>
  );

  const renderCombatContent = () => {
      const hp = event.stats?.find(s => s.label.toUpperCase() === 'HP')?.value || '??';
      const atk = event.stats?.find(s => s.label.toUpperCase() === 'ATK')?.value || '??';
      const def = event.stats?.find(s => s.label.toUpperCase() === 'DEF')?.value || '??';

      return (
          <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                  <motion.button onClick={() => handleStatClick('HP')} className={`bg-red-950/30 border p-2 rounded flex flex-col items-center transition-all ${expandedStat === 'HP' ? 'border-red-500' : 'border-red-500/30'}`}>
                      <Heart className="w-4 h-4 text-red-500 mb-1" />
                      <span className="text-xl font-black text-white">{hp}</span>
                      <span className="text-[8px] uppercase font-bold text-red-400">HP</span>
                  </motion.button>
                  <motion.button onClick={() => handleStatClick('ATK')} className={`bg-orange-950/30 border p-2 rounded flex flex-col items-center transition-all ${expandedStat === 'ATK' ? 'border-orange-500' : 'border-orange-500/30'}`}>
                      <Swords className="w-4 h-4 text-orange-500 mb-1" />
                      <span className="text-xl font-black text-white">{atk}</span>
                      <span className="text-[8px] uppercase font-bold text-red-400">Útok</span>
                  </motion.button>
                  <motion.button onClick={() => handleStatClick('DEF')} className={`bg-blue-950/30 border p-2 rounded flex flex-col items-center transition-all ${expandedStat === 'DEF' ? 'border-blue-500' : 'border-blue-500/30'}`}>
                      <Shield className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xl font-black text-white">{def}</span>
                      <span className="text-[8px] uppercase font-bold text-blue-400">Obrana</span>
                  </motion.button>
              </div>
              
              {expandedStat && ['HP', 'ATK', 'DEF'].includes(expandedStat) && (
                <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-[10px] text-zinc-400 italic">
                    {expandedStat === 'HP' ? 'Celková životní síla nepřítele. Snížením na 0 je eliminován.' :
                     expandedStat === 'ATK' ? 'Základní poškození, které nepřítel způsobí při úspěšném zásahu.' :
                     'Snižuje poškození obdržené od hodu hráče.'}
                </div>
              )}

              {event.enemyLoot && (
                  <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-700">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-2 flex items-center gap-2"><Coins className="w-3 h-3" /> Odměna za likvidaci</h4>
                      <div className="flex justify-between items-center text-xs font-mono font-bold">
                          <span className="text-yellow-500">{event.enemyLoot.goldReward} Gold</span>
                          <span className="text-purple-400">{event.enemyLoot.xpReward} XP</span>
                          <span className="text-zinc-400">Drop: {event.enemyLoot.dropItemChance}%</span>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const renderMerchantContent = () => (
      <div className="space-y-4">
          <div className="bg-yellow-900/10 border border-yellow-700/30 p-4 rounded-lg text-center">
              <p className="text-[10px] uppercase font-bold text-yellow-500 mb-2">Obchodní Status</p>
              <div className="text-xs text-zinc-300 italic">"{event.description}"</div>
          </div>
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-3">
               <h4 className="text-[10px] font-bold text-zinc-400 uppercase mb-3 border-b border-zinc-800 pb-1">Třídní Slevy & Bonusy</h4>
               <div className="space-y-2">
                   <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase"><Sword className="w-3 h-3"/> Válečník</div><div className="text-white font-mono text-xs">{event.tradeConfig?.warriorDiscount || 10}% SLEVA</div></div>
                   <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase"><Wand2 className="w-3 h-3"/> Mág (Svitky)</div><div className="text-white font-mono text-xs">{event.tradeConfig?.mageDiscount || 25}% SLEVA</div></div>
                   <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-yellow-500 text-[10px] font-bold uppercase"><Cross className="w-3 h-3"/> Kněz (Heal)</div><div className="text-white font-mono text-xs">{event.tradeConfig?.clericDiscount || 45}% SLEVA</div></div>
               </div>
          </div>
      </div>
  );

  const renderItemContent = () => (
      <div className="space-y-4">
          <p className="text-[8px] text-white/30 uppercase font-black tracking-widest flex items-center gap-2 mb-2">
            <Info className="w-3 h-3" /> Klikni na stat pro vysvětlení vlivu
          </p>
          {event.stats && event.stats.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                  {event.stats.map((stat, idx) => (
                      <div key={idx} className="flex flex-col">
                        <motion.button 
                            onClick={() => handleStatClick(stat.label)}
                            className={`bg-white/5 border p-3 rounded-xl flex flex-col items-center transition-all ${expandedStat === stat.label ? 'border-signal-cyan bg-signal-cyan/5' : 'border-white/10'}`}
                        >
                            <span className="text-[9px] uppercase font-bold text-zinc-400">{stat.label}</span>
                            <span className={`text-lg font-black font-mono ${getStatColor(stat.label)}`}>{stat.value}</span>
                        </motion.button>
                        {renderStatExplain(stat.label, stat.value)}
                      </div>
                  ))}
              </div>
          )}
          
          <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-700">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Tržní Hodnota</span>
              <div className="flex items-center gap-2 text-yellow-500"><Coins className="w-4 h-4" /><span className="font-mono font-bold text-lg">{event.price || 50}</span></div>
          </div>
      </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05, y: -20 }} className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
      <div className={`w-full max-w-sm ${theme.bg} border-2 ${theme.border} relative overflow-hidden flex flex-col shadow-2xl rounded-3xl max-h-[90vh]`}>
        <div className="relative p-6 pb-4 z-10">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
              <div className={`p-3 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm ${theme.text}`}>{theme.icon}</div>
              <button onClick={onClose} className="p-2 text-white/30 hover:text-white transition-colors bg-black/20 rounded-full"><X className="w-6 h-6" /></button>
          </div>
          <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-[0.3em] block mb-1">{event.type} • {event.id}</span>
          <h2 className={`text-3xl font-black uppercase tracking-tighter leading-none font-sans ${theme.text} drop-shadow-md`}>{event.title}</h2>
          <div className={`inline-block mt-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest border rounded ${theme.border} ${theme.text} bg-black/40`}>{event.rarity}</div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 relative z-10">
          <div className="mb-6 relative">
             <div className={`absolute top-0 left-0 w-1 h-full ${theme.accent} opacity-50`} />
             <p className="pl-4 text-xs text-zinc-300 italic leading-relaxed font-serif opacity-90">"{event.description}"</p>
          </div>

          {!isDilemma && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {event.type === GameEventType.TRAP && renderTrapContent()}
                {(event.type === GameEventType.ENCOUNTER || event.type === GameEventType.BOSS) && renderCombatContent()}
                {event.type === GameEventType.MERCHANT && renderMerchantContent()}
                {event.type === GameEventType.ITEM && renderItemContent()}
            </div>
          )}

          {isDilemma && dilemmaStep === 'CHOICE' && (
            <div className="space-y-3 mt-4">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle className="w-3 h-3" /> Vyberte Osud:</p>
              {event.dilemmaOptions?.map((opt, i) => (
                <button key={i} onClick={() => handleDilemmaChoice(opt)} className="w-full p-4 border border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/30 text-white text-left text-[11px] font-bold uppercase tracking-[0.1em] transition-all flex justify-between items-center group rounded-xl">
                  <span>{opt.label}</span>
                  <ChevronRight className="w-4 h-4 text-purple-500" />
                </button>
              ))}
            </div>
          )}

          {isDilemma && dilemmaStep === 'RESULT' && (
            <div className="space-y-4 mt-6 bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-400 mb-2"><Info className="w-4 h-4" /><span className="text-[10px] font-bold uppercase tracking-widest">Následek Volby</span></div>
              <p className="text-sm text-white font-bold leading-relaxed">{selectedOption?.consequenceText}</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-black/60 border-t border-white/5 flex flex-col gap-2 relative z-10 backdrop-blur-md">
          <div className="flex gap-3">
              {onUse && dilemmaStep !== 'RESULT' && !isDilemma && (
                <button onClick={onUse} className={`flex-1 py-4 text-black font-black uppercase text-[11px] tracking-[0.2em] hover:brightness-110 active:scale-95 transition-all font-mono rounded-xl shadow-lg ${theme.accent}`}>
                    {event.type === GameEventType.TRAP ? 'Pokusit se Odejít' : 
                     event.type === GameEventType.ENCOUNTER ? 'Zahájit Boj' : 
                     event.type === GameEventType.MERCHANT ? 'Otevřít Obchod' : 'Použít'}
                </button>
              )}
              {onSave && !isSaved && (
                <button onClick={onSave} className="flex-1 py-4 border border-white/20 text-white font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/5 active:scale-95 transition-all font-mono rounded-xl">Uložit</button>
              )}
          </div>
          {isSaved && onDiscard && !isDilemma && (
             <button onClick={handleDiscardClick} className={`w-full py-3 border ${showDeleteConfirm ? 'bg-red-900/80 border-red-500 text-white' : 'border-white/5 bg-transparent text-zinc-500'} font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all font-mono rounded-xl flex items-center justify-center gap-2`}>
                <Trash2 className="w-3 h-3" /> {showDeleteConfirm ? 'POTVRDIT ZAHOZENÍ' : 'Zahodit'}
             </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;
