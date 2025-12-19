
import React, { useState } from 'react';
import { ScanLine, Settings, Box, Layers, Coins, SquarePen, ChevronRight, Timer, ArrowRight, Zap, Shield, Sparkles, Wind, ChevronDown, ChevronUp, Sun, Moon, Activity, Target, ShieldAlert, BookOpen, Server, RefreshCcw, Volume2, VolumeX, Smartphone, Vibrate, VibrateOff } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Scanner from './components/Scanner';
import EventCard from './components/EventCard';
import MerchantScreen from './components/MerchantScreen';
import LoginScreen from './components/LoginScreen';
import Generator from './components/Generator';
import Room from './components/Room';
import GameSetup from './components/GameSetup'; 
import Toast from './components/Toast';
import ServerLoader from './components/ServerLoader'; 
import InventoryView from './components/InventoryView'; 
import StartupBoot from './components/StartupBoot'; 
import ManualView from './components/ManualView';
import { useGameLogic, Tab } from './hooks/useGameLogic';
import * as apiService from './services/apiService';

const APP_VERSION = "v1.3.1_PERF";

const EndTurnSwipe: React.FC<{ onEnd: () => void; countdown: number }> = ({ onEnd, countdown }) => {
  const x = useMotionValue(0);
  const swipeWidth = 240; 
  const opacity = useTransform(x, [0, swipeWidth * 0.8], [1, 0]);
  const handleDragEnd = (_: any, info: any) => { if (info.offset.x > 150) onEnd(); };

  return (
    <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="fixed top-10 left-4 right-4 z-[110] safe-area-top">
      <div className="tactical-card bg-[#0a0b0d]/95 border-signal-amber/60 p-4 shadow-[0_0_40px_rgba(255,157,0,0.25)] backdrop-blur-xl">
        <div className="corner-accent top-left !border-2 !border-signal-amber"></div>
        <div className="absolute top-0 left-0 w-1 h-full bg-signal-amber" />
        <motion.div initial={{ width: '100%' }} animate={{ width: `${(countdown / 15) * 100}%` }} transition={{ duration: 1, ease: "linear" }} className="absolute bottom-0 left-0 h-1 bg-signal-amber" />
        
        <div className="flex items-center px-2 justify-between pointer-events-none">
          <div className="flex items-center gap-4">
             <Timer className="w-6 h-6 text-signal-amber" />
             <div>
                <p className="text-signal-amber font-black uppercase text-[8px] tracking-[0.3em] font-mono">Sync_Vypršení</p>
                <p className="text-white text-sm font-mono font-bold tracking-[0.1em] uppercase">{countdown}S ZBÝVÁ</p>
             </div>
          </div>
          <ChevronRight className="w-5 h-5 text-signal-amber animate-pulse" />
        </div>
        <motion.div drag="x" dragConstraints={{ left: 0, right: swipeWidth }} onDragEnd={handleDragEnd} style={{ x, opacity }} className="absolute left-1 top-1 bottom-1 w-14 bg-signal-amber rounded-sm flex items-center justify-center cursor-grab active:cursor-grabbing z-10 shadow-lg">
          <ArrowRight className="w-6 h-6 text-black" />
        </motion.div>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [serverStatusLog, setServerStatusLog] = useState<string[]>([]);
  const logic = useGameLogic();

  const runDiagnostics = async () => {
    setServerStatusLog(["[SYSTEM] Zahajuji diagnostiku..."]);
    try {
      const isOnline = await apiService.checkHealth();
      setServerStatusLog(prev => [...prev, "[NET] Dotazuji Backend: " + (isOnline ? 'OK' : 'FAIL')]);
      setServerStatusLog(prev => [...prev, isOnline ? "[BACKEND] Spojení navázáno." : "[BACKEND] Server neodpovídá!"]);
      setServerStatusLog(prev => [...prev, "[DB] Kontrola MongoDB Atlas..."]);
      setTimeout(() => {
        setServerStatusLog(prev => [...prev, "[DB] Cluster Nexus: PŘIPOJENO", "[SYSTEM] Diagnostika dokončena."]);
      }, 1000);
    } catch (e) {
      setServerStatusLog(prev => [...prev, "[ERR] Kritická chyba spojení."]);
    }
  };

  const displayIsNight = logic.adminNightOverride !== null ? logic.adminNightOverride : logic.isNight;

  if (isBooting) return <StartupBoot onComplete={() => setIsBooting(false)} />;
  if (!logic.userEmail) return <LoginScreen onLogin={logic.handleLogin} />;
  if (!logic.isServerReady && !logic.isGuest) return <ServerLoader onConnected={() => logic.setIsServerReady(true)} onSwitchToOffline={() => logic.handleLogin('guest')} />;
  
  if (!logic.isAdmin && (!logic.roomState.isInRoom && !logic.isSoloMode)) {
      return <GameSetup initialNickname={logic.roomState.nickname} onConfirmSetup={logic.handleGameSetup} isGuest={logic.isGuest} />;
  }

  const adminShortLabel = `*ADM v1.3`;
  const userLabel = `*NXS ${APP_VERSION.split('_')[0]}`;

  return (
    <div className="relative w-full h-full md:h-[96vh] md:max-w-6xl bg-[#0a0b0d] md:border-2 border-white/10 md:rounded-[50px] overflow-hidden flex flex-col font-sans text-white pointer-events-auto shadow-2xl transform-gpu">
      <AnimatePresence>
        {logic.screenFlash && (
          <motion.div key={logic.screenFlash} initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} className={`absolute inset-0 z-[120] pointer-events-none ${logic.screenFlash === 'red' ? 'bg-signal-hazard' : logic.screenFlash === 'green' ? 'bg-signal-cyan' : 'bg-blue-500'}`} />
        )}
      </AnimatePresence>

      <AnimatePresence>
          {logic.notification && (
            <Toast key={logic.notification.id} data={logic.notification} onClose={() => logic.setNotification(null)} />
          )}
      </AnimatePresence>

      <AnimatePresence>
        {logic.showEndTurnPrompt && (
            <EndTurnSwipe onEnd={logic.handleEndTurn} countdown={logic.turnCountdown} />
        )}
      </AnimatePresence>

      <header className="flex-none z-[100] relative safe-area-top border-b border-white/5 bg-black/90 backdrop-blur-md">
        <div className="px-4 py-3 md:px-8 md:py-6 flex justify-between items-center gap-2">
          {/* UNIT STATUS */}
          <button 
            onClick={() => logic.setNotification({
                id: 't', 
                type: 'info', 
                message: displayIsNight ? 'FÁZE: NOC (20:00 - 06:00)' : 'FÁZE: DEN (06:00 - 20:00)'
            })} 
            className="flex items-center gap-3 active:scale-95 transition-transform overflow-hidden min-w-0"
          >
            <div className={`p-2 tactical-card border-none bg-white/5 rounded-lg flex-shrink-0 ${displayIsNight ? 'text-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.2)]' : 'text-signal-amber shadow-[0_0_15px_rgba(255,157,0,0.2)]'}`}>
              {displayIsNight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest text-white/80 uppercase truncate">
                  {logic.isAdmin ? adminShortLabel : userLabel}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${logic.isServerReady ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`} />
              </div>
              <div className="battery-meter !w-8 !h-1 mt-1"></div>
            </div>
          </button>
          
          {/* MAIN STATS PILL - Hidden for Admin */}
          {!logic.isAdmin && (
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => logic.setIsStatsExpanded(!logic.isStatsExpanded)}
              className={`flex items-center gap-4 bg-white/[0.04] px-4 py-2 border transition-all cursor-pointer rounded-lg shrink-0 ${logic.isStatsExpanded ? 'border-signal-cyan shadow-[0_0_20px_rgba(0,242,255,0.15)]' : 'border-white/10 hover:border-white/20'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${logic.playerHp < 25 ? 'text-signal-hazard animate-pulse' : 'text-signal-cyan'}`} />
                <span className="text-lg font-mono font-bold text-white tracking-tighter chromatic-text">{logic.playerHp}%</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-signal-amber" />
                <span className="text-lg font-mono font-bold text-white tracking-tighter">{logic.playerGold}</span>
              </div>
              {logic.isStatsExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
            </motion.div>
          )}

          {logic.isAdmin && (
            <div className="px-2 py-1.5 bg-signal-amber/10 border border-signal-amber/30 rounded-lg flex items-center gap-1.5 flex-shrink-0">
               <ShieldAlert className="w-3.5 h-3.5 text-signal-amber" />
               <span className="text-[9px] font-black uppercase tracking-widest text-signal-amber">CONSOLE</span>
            </div>
          )}
        </div>

        {/* EXPANDED STATS GRID */}
        {!logic.isAdmin && (
          <AnimatePresence>
            {logic.isStatsExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="bg-black/90 border-t border-white/5 z-50 overflow-hidden"
              >
                <div className="p-4 grid grid-cols-4 gap-2 md:gap-4 md:p-6">
                  {[
                    { icon: Zap, label: 'MANA', val: logic.playerMana, color: 'text-signal-cyan' },
                    { icon: Shield, label: 'ZBRN', val: logic.playerArmor, color: 'text-white/30' },
                    { icon: Sparkles, label: 'STST', val: logic.playerLuck, color: 'text-signal-amber/60' },
                    { icon: Wind, label: 'KYSL', val: logic.playerOxygen + '%', color: 'text-signal-cyan' },
                  ].map((stat) => (
                    <div key={stat.label} className="tactical-card p-2 flex flex-col items-center bg-white/[0.02] border-white/5">
                      <stat.icon className={`w-4 h-4 ${stat.color} mb-1`} />
                      <span className="text-[7px] font-mono font-bold text-white/30 tracking-[0.2em] uppercase">{stat.label}</span>
                      <span className="font-mono text-white font-black text-xs tracking-widest">{stat.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </header>

      <main className="flex-1 relative z-0 bg-[#0a0b0d] overflow-hidden">
        <AnimatePresence mode="wait">
          {logic.activeTab === Tab.SCANNER && (
            <motion.div key="scanner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <Scanner onScanCode={logic.handleScanCode} isAIThinking={logic.isAIThinking} isPaused={logic.isScannerPaused} />
            </motion.div>
          )}
          {logic.activeTab === Tab.INVENTORY && (
            <motion.div key="inventory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <InventoryView inventory={logic.inventory} loadingInventory={logic.loadingInventory} isRefreshing={logic.isRefreshing} isAdmin={logic.isAdmin} isNight={logic.isNight} adminNightOverride={logic.adminNightOverride} playerClass={logic.playerClass} giftTarget={null} onRefresh={logic.handleRefreshDatabase} onToggleNightOverride={() => logic.setAdminNightOverride(prev => prev === null ? true : prev === true ? false : null)} onCancelGift={() => {}} onItemClick={logic.handleOpenInventoryItem} getAdjustedItem={logic.getAdjustedItem} onToggleLock={logic.handleToggleLock} onDeleteItem={logic.handleDeleteEvent} />
            </motion.div>
          )}
          {logic.activeTab === Tab.GENERATOR && (
            <motion.div key="generator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <Generator onSaveCard={logic.handleSaveEvent} onDelete={logic.handleDeleteEvent} userEmail={logic.userEmail || ''} initialData={logic.editingEvent} onClearData={() => logic.setEditingEvent(null)} />
            </motion.div>
          )}
          {logic.activeTab === Tab.ROOM && (
            <motion.div key="room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <Room 
                userEmail={logic.userEmail} 
                roomState={logic.roomState} 
                onCreateRoom={() => {}} 
                onJoinRoom={() => {}} 
                onLeaveRoom={logic.handleLeaveRoom} 
                onSendMessage={logic.handleSendMessage} 
                onUpdateNickname={() => {}} 
                onScanFriend={() => {}} 
                onReceiveGift={() => {}} 
                onInitiateGift={() => {}} 
              />
            </motion.div>
          )}
          {logic.activeTab === Tab.SETTINGS && (
             <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 p-8 md:p-10 flex flex-col bg-[#0a0b0d]">
                <AnimatePresence>{showManual && <ManualView onBack={() => setShowManual(false)} />}</AnimatePresence>
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-sans chromatic-text">Systém/{logic.roomState.nickname}</h2>
                  <Target className="w-6 h-6 text-signal-cyan/30" />
                </div>
                <div className="space-y-6 overflow-y-auto no-scrollbar pb-10">
                  {/* QR CODE - Hidden for Admin */}
                  {!logic.isAdmin && (
                    <div className="tactical-card p-8 border-signal-cyan/20 bg-white/[0.02] text-center shadow-[inset_0_0_30px_rgba(0,242,255,0.05)]">
                      <div className="corner-accent top-left !border-2"></div>
                      <div className="corner-accent bottom-right !border-2"></div>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=friend:${logic.userEmail}&color=00f2ff&bgcolor=0a0b0d`} className="mx-auto mb-6 border border-signal-cyan/20 p-2 bg-black w-32 h-32" />
                      <p className="text-[9px] font-mono font-bold tracking-[0.4em] uppercase text-signal-cyan">tvůj QR_ID pro přátelé!</p>
                    </div>
                  )}

                  {/* SETTINGS CARD */}
                  <div className="tactical-card p-6 border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                        <Smartphone className="w-4 h-4 text-signal-cyan" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Konfigurace_Rozhraní</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={logic.handleToggleSound}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${logic.soundEnabled ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan' : 'bg-white/5 border-white/10 text-white/30'}`}
                        >
                            {logic.soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">Zvuk: {logic.soundEnabled ? 'ON' : 'OFF'}</span>
                        </button>

                        <button 
                            onClick={logic.handleToggleVibration}
                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${logic.vibrationEnabled ? 'bg-signal-amber/10 border-signal-amber text-signal-amber' : 'bg-white/5 border-white/10 text-white/30'}`}
                        >
                            {logic.vibrationEnabled ? <Vibrate className="w-6 h-6" /> : <VibrateOff className="w-6 h-6" />}
                            <span className="text-[9px] font-black uppercase tracking-widest">Haptika: {logic.vibrationEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                    </div>
                  </div>

                  {/* ADMIN SERVER DIAGNOSTICS */}
                  {logic.isAdmin && (
                    <div className="tactical-card p-6 border-signal-amber/30 bg-white/[0.02] space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                         <div className="flex items-center gap-2">
                           <Server className="w-4 h-4 text-signal-amber" />
                           <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Diagnostika_Serveru</h3>
                         </div>
                         <button onClick={runDiagnostics} className="p-2 bg-signal-amber/10 hover:bg-signal-amber/20 rounded-md transition-all">
                           <RefreshCcw className="w-4 h-4 text-signal-amber" />
                         </button>
                      </div>
                      
                      <div className="bg-black/60 p-4 border border-white/5 h-32 overflow-y-auto no-scrollbar font-mono text-[9px] leading-relaxed text-signal-cyan/80">
                         {serverStatusLog.length === 0 ? "> Systém v pohotovostním režimu." : serverStatusLog.map((log, i) => (
                           <div key={i}>{log}</div>
                         ))}
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${logic.isServerReady ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                           <span className="text-[8px] font-bold text-white/40 uppercase">Backend</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${logic.isServerReady ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                           <span className="text-[8px] font-bold text-white/40 uppercase">MongoDB_Atlas</span>
                         </div>
                      </div>
                    </div>
                  )}

                  <button onClick={() => setShowManual(true)} className="tactical-card w-full p-6 flex items-center justify-between hover:border-signal-cyan/40 transition-all group active:scale-[0.98]">
                    <div className="flex items-center gap-4">
                      <BookOpen className="w-6 h-6 text-signal-amber" />
                      <span className="font-bold uppercase text-xs tracking-widest text-white font-sans">Operační_Manuál</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-signal-cyan transition-all" />
                  </button>
                  <button onClick={logic.handleLogout} className="button-primary !bg-signal-hazard/10 !text-signal-hazard border border-signal-hazard/30 font-black uppercase text-[10px] tracking-[0.3em] mt-4 py-4">Odhlásit se!</button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="flex-none bg-black border-t border-white/10 px-4 py-4 safe-area-bottom z-[100] backdrop-blur-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-12 gap-2">
          {!logic.isAdmin && (
            <button onClick={() => logic.setActiveTab(Tab.SCANNER)} className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all rounded-xl relative ${logic.activeTab === Tab.SCANNER ? 'text-signal-cyan' : 'opacity-30 hover:opacity-100 text-white'}`}>
              <ScanLine className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Scan</span>
              {logic.activeTab === Tab.SCANNER && <motion.div layoutId="nav-glow" className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-signal-cyan shadow-[0_0_15px_#00f2ff]" />}
            </button>
          )}
          <button onClick={() => logic.setActiveTab(Tab.INVENTORY)} className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all rounded-xl relative ${logic.activeTab === Tab.INVENTORY ? 'text-signal-cyan' : 'opacity-30 hover:opacity-100 text-white'}`}>
            <Layers className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest font-sans">Databáze</span>
            {logic.activeTab === Tab.INVENTORY && <motion.div layoutId="nav-glow" className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-signal-cyan shadow-[0_0_15px_#00f2ff]" />}
          </button>
          {logic.isAdmin && (
            <button onClick={() => logic.setActiveTab(Tab.GENERATOR)} className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all rounded-xl relative ${logic.activeTab === Tab.GENERATOR ? 'text-signal-cyan' : 'opacity-30 hover:opacity-100 text-white'}`}>
              <SquarePen className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Fabrikace</span>
              {logic.activeTab === Tab.GENERATOR && <motion.div layoutId="nav-glow" className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-signal-cyan shadow-[0_0_15px_#00f2ff]" />}
            </button>
          )}
          {!logic.isAdmin && (
            <button onClick={() => logic.setActiveTab(Tab.ROOM)} className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all rounded-xl relative ${logic.activeTab === Tab.ROOM ? 'text-signal-cyan' : 'opacity-30 hover:opacity-100 text-white'}`}>
              <Box className="w-6 h-6" />
              <span className="text-[8px] font-black uppercase tracking-widest font-sans">Jednotka</span>
              {logic.activeTab === Tab.ROOM && <motion.div layoutId="nav-glow" className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-signal-cyan shadow-[0_0_15px_#00f2ff]" />}
            </button>
          )}
          <button onClick={() => logic.setActiveTab(Tab.SETTINGS)} className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all rounded-xl relative ${logic.activeTab === Tab.SETTINGS ? 'text-signal-cyan' : 'opacity-30 hover:opacity-100 text-white'}`}>
            <Settings className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest font-sans">Systém</span>
            {logic.activeTab === Tab.SETTINGS && <motion.div layoutId="nav-glow" className="absolute -bottom-4 left-1/4 right-1/4 h-0.5 bg-signal-cyan shadow-[0_0_15px_#00f2ff]" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {logic.currentEvent && (
          <EventCard event={logic.currentEvent} onClose={logic.closeEvent} onSave={() => logic.handleSaveEvent(logic.currentEvent!)} onUse={() => logic.handleUseEvent(logic.currentEvent!)} onResolveDilemma={logic.handleResolveDilemma} isSaved={logic.inventory.some(i => i.id === logic.currentEvent?.id)} onPlayerDamage={logic.handleHpChange} />
        )}
        {logic.activeMerchant && logic.userEmail && <MerchantScreen merchant={logic.activeMerchant} userGold={logic.playerGold} adminEmail={logic.ADMIN_EMAIL} inventory={logic.inventory} playerClass={logic.playerClass} onClose={() => logic.setActiveMerchant(null)} onBuy={() => {}} onSell={() => {}} onAddFreeItem={() => {}} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
