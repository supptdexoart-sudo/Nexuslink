
import React, { useState, useEffect, Suspense, lazy, ReactNode, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameLogic, Tab } from './hooks/useGameLogic';
import Scanner from './components/Scanner';
import LoginScreen from './components/LoginScreen';
import StartupBoot from './components/StartupBoot';
import GameSetup from './components/GameSetup';
import Toast from './components/Toast';
import EventCard from './components/EventCard';
import { 
  Scan, Box, Hammer, Users, Settings as SettingsIcon, 
  Sun, Moon, Heart, Zap, Coins, Shield, Star, 
  Wind, Loader2, AlertTriangle
} from 'lucide-react';
import { playSound, vibrate } from './services/soundService';

// --- DYNAMIC IMPORTS FOR PREFETCHING ---
const inventoryImport = () => import('./components/InventoryView');
const generatorImport = () => import('./components/Generator');
const roomImport = () => import('./components/Room');
const settingsImport = () => import('./components/SettingsView');

// --- LAZY LOADED MODULES ---
const InventoryView = lazy(inventoryImport);
const Generator = lazy(generatorImport);
const Room = lazy(roomImport);
const SettingsView = lazy(settingsImport);

// --- ERROR BOUNDARY FOR LAZY MODULES ---
interface ModuleErrorBoundaryProps {
  children?: ReactNode;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
}

// Fixed: Using Component from 'react' explicitly to resolve type inference issues with this.state and this.props
class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, ModuleErrorBoundaryState> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ModuleErrorBoundaryState { 
    return { hasError: true }; 
  }
  
  render() {
    // Fixed: Accessed this.state safely with correctly typed inheritance
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-black p-10 text-center">
          <div className="w-16 h-16 bg-red-950/20 border border-red-500/50 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Chyba_Segmentu</h2>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-8 leading-relaxed">
            Nepodařilo se stáhnout herní modul.<br/>Možná ztráta signálu se sektorem.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="button-primary py-4 px-10 text-[10px]"
          >
            Restartovat HUD
          </button>
        </div>
      );
    }
    // Fixed: Accessed this.props safely with correctly typed inheritance
    return this.props.children;
  }
}

const TabLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-4">
    <div className="relative">
      <Loader2 className="w-12 h-12 text-signal-cyan animate-spin opacity-50" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-2 h-2 bg-signal-cyan rounded-full shadow-[0_0_10px_#00f2ff]" />
      </motion.div>
    </div>
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-black text-signal-cyan uppercase tracking-[0.4em] animate-pulse">Synchronizace_Dat</span>
      <span className="text-[8px] font-mono text-zinc-600 uppercase mt-1">Stahování_Segmentu...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const logic = useGameLogic();
  const [bootComplete, setBootComplete] = useState(() => sessionStorage.getItem('nexus_boot_done') === 'true');
  const [batteryLevel, setBatteryLevel] = useState(0.85);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (bootComplete && logic.userEmail && isOnline) {
      inventoryImport().catch(() => {});
      roomImport().catch(() => {});
      if (logic.isAdmin) generatorImport().catch(() => {});
      settingsImport().catch(() => {});
    }
  }, [bootComplete, logic.userEmail, isOnline, logic.isAdmin]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => setBatteryLevel(battery.level);
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        return () => battery.removeEventListener('levelchange', updateBattery);
      });
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleBootComplete = () => {
    setBootComplete(true);
    sessionStorage.setItem('nexus_boot_done', 'true');
  };

  const handleDayNightClick = () => {
      playSound('message');
      vibrate(15);
      const isNight = logic.isNight;
      const title = isNight ? "NOČNÍ PROTOKOL AKTIVNÍ" : "DENNÍ PROTOKOL AKTIVNÍ";
      const timeRange = isNight ? "20:00 — 06:00" : "06:00 — 20:00";
      const desc = isNight 
          ? "Zvýšená aktivita biotických hrozeb. Noční varianty karet mají bonus k poškození (+5 DMG). Viditelnost skeneru omezena."
          : "Stabilní atmosférické podmínky. Standardní loot tabulky a bezpečné obchodní trasy. Bonus k regeneraci kyslíku.";
      
      logic.setNotification({ 
        id: 'cycle-'+Date.now(), 
        message: `${title}\nČas: ${timeRange}\n\n${desc}`, 
        type: 'info' 
      });
  };

  if (!bootComplete) return <StartupBoot onComplete={handleBootComplete} />;
  if (!logic.userEmail) return <LoginScreen onLogin={logic.handleLogin} />;
  if (!logic.roomState.isNicknameSet || !logic.playerClass) {
    return <GameSetup initialNickname={logic.roomState.nickname} onConfirmSetup={logic.handleGameSetup} isGuest={logic.isGuest} />;
  }

  return (
    <div className={`h-screen w-screen bg-black overflow-hidden flex flex-col font-sans text-white relative`}>
      
      <div className="h-28 bg-zinc-950/95 border-b border-white/10 flex flex-col z-[100] shadow-[0_5px_20px_rgba(0,0,0,0.8)]">
        {/* Top Status Info */}
        <div className="flex items-center justify-between px-4 py-1 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-2">
                <span className="text-[7px] font-black text-signal-cyan uppercase tracking-[0.2em] opacity-80">Nexus_OS_v1.4</span>
                <div className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500 shadow-[0_0_8px_red] animate-ping'}`} />
            </div>
            <div className="flex items-center gap-3">
                <button onClick={handleDayNightClick} className="flex items-center gap-1.5 active:scale-95 transition-transform">
                    {logic.isNight ? <Moon className="w-3 h-3 text-indigo-400" /> : <Sun className="w-3 h-3 text-signal-amber" />}
                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">{logic.isNight ? 'Night_Cycle' : 'Day_Cycle'}</span>
                </button>
                <div className="w-8 h-1.5 bg-white/5 relative rounded-full overflow-hidden border border-white/10">
                    <div className="h-full bg-signal-amber shadow-[0_0_5px_#ff9d00]" style={{ width: `${batteryLevel * 100}%` }} />
                </div>
            </div>
        </div>

        {/* Improved Stats Grid - 2 Rows for better visibility */}
        <div className="flex-1 flex flex-col gap-1 p-1 bg-black/40">
            <div className="flex-1 grid grid-cols-3 gap-1">
                <StatSlot icon={<Heart className="w-4 h-4" />} value={logic.playerHp} color="#ef4444" label="HP" />
                <StatSlot icon={<Zap className="w-4 h-4" />} value={logic.playerMana} color="#00f2ff" label="MANA" />
                <StatSlot icon={<Coins className="w-4 h-4" />} value={logic.playerGold} color="#fbbf24" label="GOLD" />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-1">
                <StatSlot icon={<Shield className="w-3 h-3" />} value={logic.playerArmor} color="#a1a1aa" label="ARMOR" small />
                <StatSlot icon={<Star className="w-3 h-3" />} value={logic.playerLuck} color="#c084fc" label="LUCK" small />
                <StatSlot icon={<Wind className="w-3 h-3" />} value={logic.playerOxygen} color="#22d3ee" label="O2" small />
            </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <ModuleErrorBoundary>
          <Suspense fallback={<TabLoader />}>
            <AnimatePresence mode="wait">
              {logic.activeTab === Tab.SCANNER && (
                <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <Scanner onScanCode={logic.handleScanCode} isAIThinking={logic.isAIThinking} isPaused={logic.isScannerPaused} />
                </motion.div>
              )}

              {logic.activeTab === Tab.INVENTORY && (
                <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <InventoryView 
                    inventory={logic.inventory} loadingInventory={false} isRefreshing={logic.isRefreshing} 
                    isAdmin={logic.isAdmin} isNight={logic.isNight} adminNightOverride={logic.adminNightOverride}
                    playerClass={logic.playerClass} giftTarget={logic.giftTarget} onRefresh={logic.handleRefreshDatabase} 
                    onItemClick={logic.handleOpenInventoryItem} 
                  />
                </motion.div>
              )}

              {logic.activeTab === Tab.GENERATOR && (
                <motion.div key="generator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <Generator 
                    onSaveCard={logic.handleSaveEvent} userEmail={logic.userEmail || ''} initialData={logic.editingEvent}
                    onClearData={() => logic.setEditingEvent(null)} onDelete={logic.handleDeleteEvent}
                  />
                </motion.div>
              )}

              {logic.activeTab === Tab.ROOM && (
                <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <Room 
                    roomState={logic.roomState} inventory={logic.inventory} playerHp={logic.playerHp} scanLog={logic.scanLog}
                    onLeaveRoom={logic.handleLeaveRoom} onSendMessage={logic.handleSendMessage} onStartGame={logic.handleStartGame}
                    onInspectItem={logic.handleInspectItem} onSwapItems={logic.handleSwapItems} userEmail={logic.userEmail || undefined}
                  />
                </motion.div>
              )}

              {logic.activeTab === Tab.SETTINGS && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                  <SettingsView 
                    onBack={() => logic.setActiveTab(Tab.SCANNER)} onLogout={logic.handleLogout}
                    soundEnabled={logic.soundEnabled} vibrationEnabled={logic.vibrationEnabled}
                    onToggleSound={logic.handleToggleSound} onToggleVibration={logic.handleToggleVibration} userEmail={logic.userEmail}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Suspense>
        </ModuleErrorBoundary>
      </div>

      <div className="h-20 bg-zinc-950 border-t-2 border-signal-cyan/40 flex items-center justify-around px-6 pb-2 relative z-50 shadow-[0_-12px_35px_rgba(0,242,255,0.25)]">
        <NavButton active={logic.activeTab === Tab.SCANNER} onClick={() => logic.setActiveTab(Tab.SCANNER)} icon={<Scan />} label="Sken" />
        <NavButton active={logic.activeTab === Tab.INVENTORY} onClick={() => logic.setActiveTab(Tab.INVENTORY)} icon={<Box />} label="Batoh" />
        {logic.isAdmin && <NavButton active={logic.activeTab === Tab.GENERATOR} onClick={() => logic.setActiveTab(Tab.GENERATOR)} icon={<Hammer />} label="Fab" />}
        <NavButton active={logic.activeTab === Tab.ROOM} onClick={() => logic.setActiveTab(Tab.ROOM)} icon={<Users />} label="Tým" />
        <NavButton active={logic.activeTab === Tab.SETTINGS} onClick={() => logic.setActiveTab(Tab.SETTINGS)} icon={<SettingsIcon />} label="Sys" />
      </div>

      <AnimatePresence>
        {logic.currentEvent && (
          <EventCard 
            event={logic.currentEvent} 
            onClose={logic.closeEvent} 
            onSave={() => logic.handleSaveEvent(logic.currentEvent!)}
            onUse={() => logic.handleUseEvent(logic.currentEvent!)} 
            onResolveDilemma={logic.handleResolveDilemma}
            isSaved={logic.inventory.some(i => i.id === logic.currentEvent?.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logic.notification && <Toast data={logic.notification} onClose={() => logic.setNotification(null)} />}
      </AnimatePresence>

      <style>{`
        .stat-glow-box {
          box-shadow: inset 0 0 10px var(--slot-color-alpha);
          border-color: var(--slot-color-border);
        }
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const StatSlot: React.FC<{ icon: React.ReactNode, value: number, color: string, label: string, small?: boolean }> = ({ icon, value, color, label, small }) => (
  <div 
    className={`flex flex-col items-center justify-center rounded-lg border bg-black/60 transition-all stat-glow-box ${small ? 'py-0.5' : 'py-1'}`}
    style={{ 
        '--slot-color-alpha': `${color}15`, 
        '--slot-color-border': `${color}40` 
    } as any}
  >
    <div className="flex items-center gap-1.5">
        <div style={{ color }}>{icon}</div>
        <span className={`${small ? 'text-xs' : 'text-sm'} font-black font-mono tracking-tighter text-white drop-shadow-sm`}>
            {value}
        </span>
    </div>
    <span className="text-[6px] font-black uppercase tracking-[0.2em] opacity-50 text-white leading-none mt-0.5">{label}</span>
  </div>
);

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-signal-cyan scale-110' : 'text-zinc-500'}`}>
    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-signal-cyan/10 border border-signal-cyan/20' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
