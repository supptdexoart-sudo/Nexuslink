
import React, { useState, useEffect } from 'react';
import { GameEvent, GameEventType, PlayerClass, Stat } from '../types';
import { Download, RotateCcw, Zap, Box, Coins, QrCode, Heart, Swords, Shield, Trash2, Sparkles, Wind, Upload, AlertTriangle, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MerchantPanel from './generator/MerchantPanel';
import DilemmaPanel from './generator/DilemmaPanel';
import CombatPanel from './generator/CombatPanel';
import { playSound, vibrate } from '../services/soundService';

interface GeneratorProps {
  onSaveCard: (event: GameEvent) => void;
  userEmail: string;
  initialData?: GameEvent | null;
  onClearData?: () => void;
  onDelete?: (id: string) => void;
}

const initialEventState: GameEvent = {
  id: '',
  title: '',
  description: '',
  type: GameEventType.ITEM,
  rarity: 'Common',
  flavorText: '',
  stats: [],
  isShareable: true,
  isConsumable: false,
  canBeSaved: true, 
  price: 0,
  trapConfig: { difficulty: 10, damage: 20, disarmClass: PlayerClass.ROGUE, successMessage: "Past zneškodněna.", failMessage: "Past sklapla!" },
  enemyLoot: { goldReward: 20, xpReward: 10, dropItemChance: 0 },
  timeVariant: { enabled: false, nightStats: [] }
};

const Generator: React.FC<GeneratorProps> = ({ onSaveCard, userEmail, initialData, onClearData, onDelete }) => {
  const [newEvent, setNewEvent] = useState<GameEvent>(initialEventState);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNewEvent({ ...initialEventState, ...initialData });
      setIsEditingMode(true);
    } else {
        setNewEvent(initialEventState);
        setIsEditingMode(false);
    }
  }, [initialData]);

  const updateEvent = (updates: Partial<GameEvent>) => setNewEvent(prev => ({ ...prev, ...updates }));
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateEvent({ [e.target.name]: e.target.value });

  const addQuickStat = (label: string, value: string = '+10') => {
      const currentStats = [...(newEvent.stats || [])];
      if (currentStats.some(s => s.label.toUpperCase() === label.toUpperCase())) return;
      updateEvent({ stats: [...currentStats, { label, value }] });
  };

  const updateStat = (idx: number, field: keyof Stat, value: string) => {
      const newStats = [...(newEvent.stats || [])];
      newStats[idx] = { ...newStats[idx], [field]: value };
      updateEvent({ stats: newStats });
  };

  const removeStat = (idx: number) => {
      updateEvent({ stats: (newEvent.stats || []).filter((_, i) => i !== idx) });
  };

  const handleDeleteClick = () => {
      if (!onDelete || !newEvent.id) return;
      playSound('error');
      vibrate(50);
      setShowDeleteModal(true);
  };

  const confirmDelete = () => {
      if (onDelete && newEvent.id) {
          onDelete(newEvent.id);
          setShowDeleteModal(false);
      }
  };

  const renderItemPanel = () => {
      const quickOptions = [
          { label: 'HP', icon: Heart, color: 'text-red-500' },
          { label: 'DMG', icon: Swords, color: 'text-orange-500' },
          { label: 'ARMOR', icon: Shield, color: 'text-zinc-200' },
          { label: 'MANA', icon: Zap, color: 'text-cyan-400' },
          { label: 'ZLATO', icon: Coins, color: 'text-yellow-500' },
          { label: 'ŠTĚSTÍ', icon: Sparkles, color: 'text-purple-400' },
          { label: 'KYSLÍK', icon: Wind, color: 'text-cyan-400' },
      ];

      return (
          <div className="space-y-6 bg-arc-panel p-5 border border-arc-border relative">
              <div className="flex items-center gap-2 text-arc-yellow border-b border-arc-border pb-3">
                  <Box className="w-5 h-5"/>
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Konfigurace_Assetu:</h3>
              </div>

              {/* Redesigned Checkbox - Clean Full Width */}
              <div className="bg-black border border-arc-border/50 rounded-lg overflow-hidden transition-colors hover:border-arc-yellow">
                  <label className="flex items-center gap-4 p-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                            type="checkbox" 
                            checked={newEvent.isConsumable} 
                            onChange={(e) => updateEvent({ isConsumable: e.target.checked })} 
                            className="w-6 h-6 rounded border-arc-border bg-zinc-900 text-arc-yellow focus:ring-arc-yellow accent-arc-yellow" 
                        />
                      </div>
                      <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${newEvent.isConsumable ? 'text-arc-yellow' : 'text-white'}`}>
                              Spotřebovatelný Předmět
                          </span>
                          <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-tight">
                              Asset bude zničen po jednom použití
                          </span>
                      </div>
                  </label>
              </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <label className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest">Aktivní_stats na kartě:</label>
                  </div>

                  <div className="flex flex-wrap gap-2">
                      {quickOptions.map(opt => (
                          <button 
                            key={opt.label} 
                            type="button" 
                            onClick={() => addQuickStat(opt.label)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border border-arc-border hover:border-arc-yellow transition-all active:scale-95 bg-black`}
                          >
                              <opt.icon className={`w-3 h-3 ${opt.color}`} />
                              <span className={`text-[9px] font-bold uppercase tracking-tighter text-zinc-200`}>{opt.label}</span>
                          </button>
                      ))}
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                      {newEvent.stats?.map((stat, idx) => {
                          const labelUpper = stat.label.toUpperCase();
                          const foundOption = quickOptions.find(o => 
                            labelUpper.includes(o.label) || 
                            (o.label === 'ARMOR' && labelUpper.includes('ARMOR')) ||
                            (o.label === 'KYSLÍK' && labelUpper.includes('OXYGEN')) ||
                            (o.label === 'HP' && (labelUpper.includes('HEALTH') || labelUpper.includes('ŽIVOT')))
                          );

                          return (
                              <div key={idx} className="flex gap-2 items-center bg-black p-2 border border-arc-border animate-in slide-in-from-left-2 duration-200">
                                  <div className={`p-2 border border-zinc-800 bg-arc-panel`}>
                                      {foundOption ? <foundOption.icon className={`w-4 h-4 ${foundOption.color}`} /> : <Sparkles className="w-4 h-4 text-zinc-400" />}
                                  </div>
                                  <input 
                                    value={stat.label} 
                                    onChange={(e) => updateStat(idx, 'label', e.target.value)} 
                                    className="w-24 bg-transparent border-none p-1 text-[10px] font-bold text-white placeholder-zinc-700 outline-none uppercase font-mono" 
                                    placeholder="TAG" 
                                  />
                                  <input 
                                    value={stat.value} 
                                    onChange={(e) => updateStat(idx, 'value', e.target.value)} 
                                    className="flex-1 bg-arc-panel border border-zinc-800 px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 focus:border-arc-yellow outline-none" 
                                    placeholder="HODNOTA" 
                                  />
                                  <button 
                                    type="button" 
                                    onClick={() => removeStat(idx)} 
                                    className="p-2 text-zinc-400 hover:text-arc-red transition-colors"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  };

  const renderNightVariantPanel = () => (
      <div className={`mt-6 p-5 border rounded-xl transition-all ${newEvent.timeVariant?.enabled ? 'bg-indigo-950/30 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/10 opacity-70'}`}>
          <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-400">
                  <Moon className="w-5 h-5" />
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">Noční_Protokol_v2.0</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={newEvent.timeVariant?.enabled || false} 
                      onChange={(e) => updateEvent({ timeVariant: { ...(newEvent.timeVariant || { enabled: false }), enabled: e.target.checked } })}
                  />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
          </div>

          {newEvent.timeVariant?.enabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 gap-4">
                      <div>
                          <label className="text-[8px] text-indigo-300 uppercase font-bold tracking-widest mb-1 block">Název karty v noci (Override):</label>
                          <input 
                              value={newEvent.timeVariant.nightTitle || ''} 
                              onChange={(e) => updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightTitle: e.target.value } })}
                              placeholder="Ponechte prázdné pro původní"
                              className="w-full bg-black border border-indigo-900/50 p-3 text-white text-sm outline-none focus:border-indigo-500"
                          />
                      </div>
                      <div>
                          <label className="text-[8px] text-indigo-300 uppercase font-bold tracking-widest mb-1 block">Popis karty v noci (Override):</label>
                          <textarea 
                              value={newEvent.timeVariant.nightDescription || ''} 
                              onChange={(e) => updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightDescription: e.target.value } })}
                              placeholder="Ponechte prázdné pro původní"
                              className="w-full bg-black border border-indigo-900/50 p-3 text-zinc-300 text-xs font-mono outline-none focus:border-indigo-500"
                              rows={2}
                          />
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                          <label className="text-[8px] text-indigo-300 uppercase font-bold tracking-widest">Noční_Statistiky (Nahrazují původní):</label>
                          <button 
                              type="button"
                              onClick={() => {
                                  const stats = [...(newEvent.timeVariant?.nightStats || [])];
                                  stats.push({ label: 'NIGHT_MOD', value: '+5' });
                                  updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightStats: stats } });
                              }}
                              className="text-[8px] bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 font-bold uppercase"
                          >
                              + PŘIDAT NOČNÍ STAT
                          </button>
                      </div>
                      {newEvent.timeVariant.nightStats?.map((stat, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 border border-indigo-900/30">
                              <input 
                                  value={stat.label} 
                                  onChange={(e) => {
                                      const stats = [...newEvent.timeVariant!.nightStats!];
                                      stats[idx].label = e.target.value;
                                      updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightStats: stats } });
                                  }}
                                  className="w-20 bg-transparent border-none p-1 text-[9px] font-bold text-indigo-300 uppercase font-mono"
                                  placeholder="TAG"
                              />
                              <input 
                                  value={stat.value} 
                                  onChange={(e) => {
                                      const stats = [...newEvent.timeVariant!.nightStats!];
                                      stats[idx].value = e.target.value;
                                      updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightStats: stats } });
                                  }}
                                  className="flex-1 bg-indigo-950/40 border border-indigo-900/50 px-2 py-1 text-xs text-white font-mono focus:border-indigo-400 outline-none"
                                  placeholder="HODNOTA"
                              />
                              <button 
                                  type="button"
                                  onClick={() => {
                                      const stats = newEvent.timeVariant!.nightStats!.filter((_, i) => i !== idx);
                                      updateEvent({ timeVariant: { ...newEvent.timeVariant!, nightStats: stats } });
                                  }}
                                  className="text-red-500 p-1 hover:text-red-400"
                              >
                                  <Trash2 className="w-3.5 h-3.5" />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  const renderTrapPanel = () => (
      <div className="space-y-4 bg-arc-panel p-5 border border-arc-red/30 text-white">
          <div className="flex items-center gap-2 mb-2 text-arc-red border-b border-arc-red/20 pb-2">
              <Zap className="w-5 h-5"/>
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">Nástraha_konfigurace:</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">Kolik musí hodit hráč kostkou??</label>
                  <input type="number" value={newEvent.trapConfig?.difficulty ?? 10} onChange={(e) => updateEvent({ trapConfig: { ...newEvent.trapConfig!, difficulty: parseInt(e.target.value) } })} className="w-full bg-black border border-arc-red/40 p-3 text-white font-mono text-sm" />
              </div>
              <div>
                  <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">DMG po prohře:</label>
                  <input type="number" value={newEvent.trapConfig?.damage ?? 20} onChange={(e) => updateEvent({ trapConfig: { ...newEvent.trapConfig!, damage: parseInt(e.target.value) } })} className="w-full bg-black border border-arc-red/40 p-3 text-arc-red font-mono text-sm" />
              </div>
          </div>
          <div>
              <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">Pro jakou postavu ??</label>
              <select value={newEvent.trapConfig?.disarmClass ?? 'ANY'} onChange={(e) => updateEvent({ trapConfig: { ...newEvent.trapConfig!, disarmClass: e.target.value as any } })} className="w-full bg-black border border-arc-border p-3 text-white text-xs font-mono uppercase focus:ring-1 focus:ring-arc-yellow outline-none">
                  <option value="ANY" className="bg-arc-panel text-white">UNSPECIFIED</option>
                  {Object.values(PlayerClass).map(c => <option key={c} value={c} className="bg-arc-panel text-white">{c}</option>)}
              </select>
          </div>
      </div>
  );

  const renderEnemyLootPanel = () => (
      <div className="mt-4 bg-arc-panel p-5 border border-arc-yellow/20 text-white">
          <h4 className="text-[10px] font-bold text-arc-yellow uppercase tracking-widest mb-4 flex items-center gap-2"><Coins className="w-4 h-4"/> Odměna_po_boji:</h4>
          <div className="grid grid-cols-3 gap-3">
              <div>
                  <label className="text-[8px] text-zinc-300 uppercase">Zlato</label>
                  <input type="number" value={newEvent.enemyLoot?.goldReward ?? 0} onChange={(e) => updateEvent({ enemyLoot: { ...newEvent.enemyLoot!, goldReward: parseInt(e.target.value) } })} className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" />
              </div>
              <div>
                  <label className="text-[8px] text-zinc-300 uppercase">Exp_Data</label>
                  <input type="number" value={newEvent.enemyLoot?.xpReward ?? 0} onChange={(e) => updateEvent({ enemyLoot: { ...newEvent.enemyLoot!, xpReward: parseInt(e.target.value) } })} className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" />
              </div>
              <div>
                  <label className="text-[8px] text-zinc-300 uppercase">Drop_%</label>
                  <input type="number" value={newEvent.enemyLoot?.dropItemChance ?? 0} onChange={(e) => updateEvent({ enemyLoot: { ...newEvent.enemyLoot!, dropItemChance: parseInt(e.target.value) } })} className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" />
              </div>
          </div>
      </div>
  );

  const getQrUrl = (id: string, type: GameEventType) => {
      if (!id) return '';
      const colorMap: Record<string, string> = {
          [GameEventType.BOSS]: 'ff3b30', 
          [GameEventType.TRAP]: 'f5c518', 
          [GameEventType.ENCOUNTER]: 'ff3b30', 
          [GameEventType.DILEMA]: '9333ea', 
          [GameEventType.MERCHANT]: 'f5c518', 
          [GameEventType.ITEM]: '007aff' 
      };
      const color = colorMap[type] || 'ffffff';
      return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&color=${color}&bgcolor=0a0a0c&margin=20&data=${encodeURIComponent(id)}`;
  };

  const currentQrUrl = getQrUrl(newEvent.id, newEvent.type);

  const handleDownloadQr = async () => {
      if (!currentQrUrl || !newEvent.id) {
          setFeedback({ message: 'Identifikátor chybí.', type: 'error' });
          return;
      }
      setIsDownloading(true);
      try {
          const response = await fetch(currentQrUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const safeTitle = newEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'unnamed_asset';
          link.download = `nexus_${newEvent.type.toLowerCase()}_${safeTitle}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setFeedback({ message: 'Identifikátor stažen do lokální cache.', type: 'success' });
      } catch (e) {
          setFeedback({ message: 'Chyba protokolu stahování.', type: 'error' });
      } finally {
          setIsDownloading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!userEmail || !newEvent.id) { setFeedback({ message: 'Zadejte ID assetu.', type: 'error' }); return; }
      try {
          const eventToSave = { ...newEvent };
          if (userEmail === 'zbynekbal97@gmail.com') eventToSave.qrCodeUrl = currentQrUrl;
          await onSaveCard(eventToSave);
          setFeedback({ message: 'Data synchronizována se serverem.', type: 'success' });
          if(!isEditingMode) setNewEvent(initialEventState);
      } catch (e: any) { setFeedback({ message: e.message, type: 'error' }); }
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar bg-arc-bg text-white relative">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-arc-bg/95 backdrop-blur z-20 pb-4 border-b border-arc-border">
            <h1 className="text-2xl font-bold uppercase tracking-tighter text-white">
                {isEditingMode ? 'Editovat' : 'FABRIKACE'} <span className="text-arc-yellow">Assetu</span>
            </h1>
            <div className="flex items-center gap-2">
                {isEditingMode && onDelete && (
                    <button type="button" onClick={handleDeleteClick} className="p-2 bg-black border border-red-900/50 text-red-500 hover:bg-red-900/20 active:scale-95 transition-all">
                        <Trash2 className="w-5 h-5"/>
                    </button>
                )}
                {isEditingMode && (
                    <button type="button" onClick={onClearData} className="p-2 bg-black border border-arc-border text-arc-yellow hover:bg-arc-yellow/10 active:scale-95 transition-all">
                        <RotateCcw className="w-5 h-5"/>
                    </button>
                )}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-arc-panel p-6 border border-arc-border space-y-6 relative bracket-tl bracket-tr">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest mb-1 block">ID_KARTY (jedinečné!):</label>
                        <input name="id" value={newEvent.id} onChange={handleChange} placeholder="NXS-001" className="w-full bg-black border border-arc-border p-3 text-white font-mono uppercase focus:border-arc-yellow outline-none text-sm" required readOnly={isEditingMode}/>
                    </div>
                    <div>
                        <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest mb-1 block">TYP_karty:</label>
                        <select name="type" value={newEvent.type} onChange={handleChange} className="w-full bg-black border border-arc-border p-3 text-white font-mono uppercase focus:border-arc-yellow outline-none text-sm">
                            {Object.values(GameEventType).map(t => <option key={t} value={t} className="bg-arc-panel text-white">{t}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest mb-1 block">Název_karty:</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <input name="title" value={newEvent.title} onChange={handleChange} placeholder="NÁZEV ASSETU" className="bg-black border border-arc-border p-3 text-white font-bold uppercase focus:border-arc-yellow outline-none text-sm" required />
                        <select name="rarity" value={newEvent.rarity} onChange={handleChange} className="bg-black border border-arc-border p-3 text-[10px] text-zinc-200 font-mono uppercase outline-none">
                            {['Common', 'Rare', 'Epic', 'Legendary'].map(r => <option key={r} value={r} className="bg-arc-panel text-white">{r}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest mb-1 block">Popis_karty:</label>
                    <textarea name="description" value={newEvent.description} onChange={handleChange} placeholder="Analýza objektu..." rows={3} className="w-full bg-black border border-arc-border p-3 text-zinc-100 text-xs font-mono focus:border-arc-yellow outline-none" required />
                </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {newEvent.type === GameEventType.ITEM && renderItemPanel()}
                {newEvent.type === GameEventType.TRAP && renderTrapPanel()}
                
                {(newEvent.type === GameEventType.ENCOUNTER || newEvent.type === GameEventType.BOSS) && (
                    <>
                        <CombatPanel event={newEvent} onUpdate={updateEvent} />
                        {newEvent.type === GameEventType.ENCOUNTER && renderEnemyLootPanel()}
                    </>
                )}
                
                {newEvent.type === GameEventType.MERCHANT && <MerchantPanel event={newEvent} onUpdate={updateEvent} />}
                {newEvent.type === GameEventType.DILEMA && <DilemmaPanel event={newEvent} onUpdate={updateEvent} />}

                {/* NOČNÍ VARIANTA SECTOR */}
                {renderNightVariantPanel()}
            </div>

            <div className="flex items-center gap-6 bg-black p-6 border border-arc-border relative bracket-bl bracket-br">
                <div className="bg-white p-2 border border-zinc-800 shrink-0">
                    {newEvent.id ? (
                        <img src={currentQrUrl} alt="QR" className="w-24 h-24 object-contain invert" />
                    ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-zinc-900 border border-zinc-800">
                            <QrCode className="w-10 h-10 text-zinc-700" />
                        </div>
                    )}
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <p className="text-[8px] text-zinc-300 font-bold uppercase tracking-[0.3em] mb-1">QR kod karty!:</p>
                        <p className="text-[10px] text-zinc-200 font-mono truncate max-w-[120px]">{newEvent.id || 'WAITING_FOR_ID'}</p>
                    </div>
                    
                    <button 
                        type="button" 
                        onClick={handleDownloadQr}
                        disabled={!newEvent.id || isDownloading}
                        className={`w-full py-3 px-4 text-[10px] uppercase font-bold flex items-center justify-center gap-2 border-2 transition-all ${!newEvent.id ? 'text-zinc-700 border-zinc-800 cursor-not-allowed' : 'text-arc-yellow border-arc-yellow hover:bg-arc-yellow hover:text-black'}`}
                    >
                        {isDownloading ? <RotateCcw className="w-3 h-3 animate-spin"/> : <Download className="w-3 h-3" />}
                        {isDownloading ? 'Stahování...' : 'Uložit_PNG_Kód'}
                    </button>
                </div>
            </div>

            {feedback.message && (
                <div className={`p-4 border font-mono text-[10px] uppercase tracking-widest text-center animate-pulse ${feedback.type === 'success' ? 'text-arc-yellow border-arc-yellow/30 bg-arc-yellow/5' : 'text-arc-red border-arc-red/30 bg-arc-red/5'}`}>
                    {'>'} {feedback.message}
                </div>
            )}

            <button type="submit" className="w-full py-6 bg-signal-amber border-2 border-signal-amber/50 text-black font-black uppercase text-sm tracking-[0.4em] hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(255,157,0,0.3)] rounded-xl flex items-center justify-center gap-3">
                <Upload className="w-5 h-5" />
                {isEditingMode ? 'Synchronizovat_Změny' : 'Nahrát kartu do databáze!'}
            </button>
        </form>

        <AnimatePresence>
            {showDeleteModal && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-black border-2 border-red-600 w-full max-w-xs shadow-[0_0_60px_rgba(220,38,38,0.4)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
                        <div className="p-6 text-center space-y-4">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-red-600/10 rounded-full border border-red-600/50">
                                    <AlertTriangle className="w-12 h-12 text-red-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-red-600 uppercase tracking-tighter">Destrukce Dat</h3>
                                <p className="text-[10px] text-red-600/60 font-mono mt-1 font-bold tracking-widest">PROCES JE NEVRATNÝ</p>
                            </div>
                            <p className="text-xs text-zinc-300 font-bold leading-relaxed">
                                Opravdu chcete trvale vymazat asset <span className="text-white font-mono bg-white/10 px-1">{newEvent.id}</span> z databáze?
                            </p>
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="py-3 bg-zinc-900 text-zinc-400 font-bold uppercase text-[10px] tracking-widest hover:bg-zinc-800 transition-colors border border-zinc-800"
                                >
                                    Zrušit
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="py-3 bg-red-600 text-black font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-colors shadow-lg animate-pulse"
                                >
                                    Smazat
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};

export default Generator;
