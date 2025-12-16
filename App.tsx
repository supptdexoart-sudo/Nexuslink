
import React, { useState } from 'react';
import { ScanLine, Settings, Box, Layers, Heart, Coins, SquarePen, Moon, Sun, Sword, Wand2, Footprints, Cross, ChevronUp, ChevronDown, User, LogOut, QrCode, AlertTriangle, Check, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Scanner from './components/Scanner';
import EventCard from './components/EventCard';
import MerchantScreen from './components/MerchantScreen';
import LoginScreen from './components/LoginScreen';
import Generator from './components/Generator';
import Room from './components/Room';
import GameSetup from './components/GameSetup'; 
import Toast from './components/Toast';
import BossRaidScreen from './components/BossRaidScreen'; 
import BossRaidIntro from './components/BossRaidIntro'; 
import ServerLoader from './components/ServerLoader'; 
import InventoryView from './components/InventoryView'; 
import StartupBoot from './components/StartupBoot'; 
import { PlayerClass, GameEvent } from './types';
import { useGameLogic, Tab } from './hooks/useGameLogic';

// Variants for page transitions
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badgeCount?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, badgeCount }) => {
  return (
    <button 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${active ? 'text-neon-blue' : 'text-zinc-600 hover:text-zinc-400'}`}
    >
      {active && (
        <motion.div layoutId="nav-glow" className="absolute -top-1 w-12 h-1 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff]" initial={false} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      )}
      <div className={`mb-1 relative z-10 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]' : ''}`}>
        {icon}
        {badgeCount !== undefined && badgeCount > 0 && (
             <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center rounded-full border-2 border-zinc-950 animate-in zoom-in duration-300 shadow-sm pointer-events-none">
                {badgeCount > 9 ? '9+' : badgeCount}
             </div>
        )}
      </div>
      <span className={`text-[10px] font-display font-bold tracking-widest relative z-10 ${active ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  // Boot Sequence State
  const [isBooting, setIsBooting] = useState(() => {
      // Optional: Only show boot on full refresh, not hot reload in dev
      // For now, always show to demonstrate the effect
      return true; 
  });

  const logic = useGameLogic();

  // --- RENDERING HELPERS ---
  const SyncIndicator = () => {
     if (logic.isGuest) return <div className="flex items-center gap-1 text-zinc-500"><Settings className="w-4 h-4" /><span className="text-[10px] font-mono">OFFLINE</span></div>;
     if (logic.syncStatus === 'restoring') return <div className="flex items-center gap-1 text-yellow-500 animate-pulse"><Settings className="w-4 h-4" /><span className="text-[10px] font-mono">OBNOVA</span></div>;
     if (logic.syncStatus === 'offline') return <div className="flex items-center gap-1 text-red-500"><Settings className="w-4 h-4" /><span className="text-[10px] font-mono">ODPOJENO</span></div>;
     if (logic.syncStatus === 'error') return <div className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-4 h-4" /><span className="text-[10px] font-mono">CHYBA</span></div>;
     return <div className="flex items-center gap-1 text-emerald-500"><Settings className="w-4 h-4" /><span className="text-[10px] font-mono">ONLINE</span></div>;
  };

  const handleItemClick = (event: GameEvent) => {
      if (logic.giftTarget) {
          if (event.isShareable) {
            logic.setPendingGiftItem(event);
          } else {
            alert("Tento předmět nelze darovat (není směnitelný).");
          }
      } else {
          logic.setCurrentEvent(event);
      }
  };

  const handleSellItem = async (item: GameEvent, price: number) => {
      logic.handleGoldChange(price);
      await logic.handleConsumeItem(item.id);
  };

  // --- BOOT SEQUENCE ---
  if (isBooting) {
      return <StartupBoot onComplete={() => setIsBooting(false)} />;
  }

  // --- MAIN RENDER ---
  if (!logic.userEmail) return <LoginScreen onLogin={logic.handleLogin} />;

  if (!logic.isServerReady && !logic.isGuest) {
      return (
          <ServerLoader 
              onConnected={() => logic.setIsServerReady(true)} 
              onSwitchToOffline={() => logic.handleLogin('guest')}
          />
      );
  }

  if (!logic.isAdmin && (!logic.roomState.isInRoom && !logic.isSoloMode) || (logic.userEmail && !logic.isGuest && !logic.isAdmin && !logic.playerClass)) {
      return <GameSetup initialNickname={logic.roomState.nickname} onConfirmSetup={logic.handleGameSetup} isGuest={logic.isGuest} />;
  }

  return (
    <div className="relative h-screen bg-zinc-950 overflow-hidden flex flex-col font-sans text-white">
      {/* RAID INTRO */}
      <AnimatePresence>
          {logic.showRaidIntro && logic.activeRaid && (
              <BossRaidIntro bossName={logic.activeRaid.bossName} />
          )}
      </AnimatePresence>

      {/* RAID SCREEN - ACTIVE COMBAT */}
      <AnimatePresence>
          {logic.isRaidScreenVisible && logic.activeRaid && (
              <BossRaidScreen 
                  roomId={logic.roomState.id}
                  playerNickname={logic.roomState.nickname}
                  raidState={logic.activeRaid}
                  members={logic.roomState.members}
                  onClose={() => logic.setIsRaidScreenVisible(false)}
              />
          )}
      </AnimatePresence>

      {/* NOTIFICATIONS */}
      <AnimatePresence>
          {logic.notification && (
              <Toast data={logic.notification} onClose={() => logic.setNotification(null)} />
          )}
      </AnimatePresence>

      {/* TIME INFO MODAL */}
      <AnimatePresence>
          {logic.showTimeInfo && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => logic.setShowTimeInfo(false)} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <div className={`absolute top-0 left-0 right-0 h-1 ${logic.isNight ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>
                      <button onClick={() => logic.setShowTimeInfo(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><LogOut className="w-6 h-6"/></button>
                      
                      <div className="flex items-center gap-4 mb-6">
                          <div className={`p-4 rounded-full ${logic.isNight ? 'bg-indigo-900/20 text-indigo-400 border border-indigo-500/50' : 'bg-orange-900/20 text-orange-400 border border-orange-500/50'}`}>
                              {logic.isNight ? <Moon className="w-8 h-8" /> : <Sun className="w-8 h-8" />}
                          </div>
                          <div>
                              <h3 className="text-xl font-display font-bold uppercase text-white tracking-wider">{logic.isNight ? 'NOČNÍ CYKLUS' : 'DENNÍ CYKLUS'}</h3>
                              <p className="text-xs text-zinc-500 font-mono">Reálný čas: {new Date().toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                      </div>

                      <div className="space-y-4 text-sm text-zinc-300 leading-relaxed">
                          <p>
                              <strong className="text-white">Herní svět dýchá.</strong> Cyklus dne a noci se mění automaticky.
                          </p>
                          <div className="bg-black/50 p-3 rounded-lg border border-zinc-800">
                              <div className="flex items-center gap-2 mb-1">
                                  <Sun className="w-4 h-4 text-orange-400" />
                                  <span className="text-xs font-bold text-orange-400 uppercase">DEN (06:00 - 20:00)</span>
                              </div>
                              <p className="text-xs text-zinc-500">Bezpečnější průzkum, obchodníci mají otevřeno, standardní loot.</p>
                          </div>
                          <div className="bg-black/50 p-3 rounded-lg border border-zinc-800">
                              <div className="flex items-center gap-2 mb-1">
                                  <Moon className="w-4 h-4 text-indigo-400" />
                                  <span className="text-xs font-bold text-indigo-400 uppercase">NOC (20:00 - 06:00)</span>
                              </div>
                              <p className="text-xs text-zinc-500">Nebezpečnější monstra, vzácnější "Temný Loot", některé karty mění své vlastnosti.</p>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* GIFT CONFIRM MODAL */}
      {logic.pendingGiftItem && logic.giftTarget && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-sm bg-zinc-900 border-2 border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div className="bg-red-900/20 p-4 border-b border-red-500/30 flex items-center gap-3"><AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" /><h3 className="font-display font-bold text-white uppercase tracking-wider">Potvrzení Přenosu</h3></div>
                <div className="p-6 text-center space-y-4">
                    <p className="text-zinc-400 text-sm">Chystáte se odeslat předmět hráči <br/><span className="text-neon-blue font-bold text-base">{logic.giftTarget}</span></p>
                    <div className="bg-black p-4 rounded-xl border border-zinc-700"><p className="text-neon-purple font-display font-bold text-lg mb-1">{logic.pendingGiftItem.title}</p></div>
                    <div className="flex flex-col gap-3 mt-4">
                        {logic.giftTransferStatus === 'success' ? (
                            <div className="py-3 bg-green-500/20 border border-green-500 rounded-xl text-green-500 font-bold uppercase flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Odesláno</div>
                        ) : (
                            <button onClick={logic.handleConfirmGift} disabled={logic.giftTransferStatus === 'processing'} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95">{logic.giftTransferStatus === 'processing' ? "..." : <Trash2 className="w-5 h-5" />}{logic.giftTransferStatus === 'processing' ? "Mazání a Odesílání..." : "ODSTRANIT A ODESLAT"}</button>
                        )}
                        {logic.giftTransferStatus !== 'success' && logic.giftTransferStatus !== 'processing' && (<button onClick={() => logic.setPendingGiftItem(null)} className="w-full py-3 bg-zinc-800 text-zinc-400 font-bold uppercase rounded-xl hover:bg-zinc-700">Zpět</button>)}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[100px] animate-pulse-slow"></div>
           <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-neon-purple/5 rounded-full blur-[100px] animate-pulse-slow"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
      </div>

      <AnimatePresence>
          {logic.screenFlash && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] pointer-events-none ${logic.screenFlash === 'red' ? 'bg-red-600' : 'bg-green-500'}`} />
          )}
      </AnimatePresence>

      <header className="flex-none p-4 pb-2 z-50 flex justify-between items-center safe-area-top relative">
        <div className="flex flex-col"><h1 className="text-xl font-display font-black tracking-widest text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">NEXUS <span className="text-neon-blue text-[10px] align-top">SYS v0.6</span></h1><SyncIndicator /></div>
        <div className="flex items-center gap-3">
            <button onClick={() => logic.setShowTimeInfo(true)} className={`p-1.5 rounded-full border shadow-sm transition-colors duration-500 active:scale-90 ${logic.isNight ? 'bg-indigo-950/80 border-indigo-500' : 'bg-orange-500/20 border-orange-400'}`}>{logic.isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-orange-400" />}</button>
            {!logic.isAdmin && logic.playerClass && (<div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-zinc-700 bg-zinc-900/80`}>{logic.playerClass === PlayerClass.WARRIOR && <Sword className="w-3 h-3 text-red-500"/>}{logic.playerClass === PlayerClass.MAGE && <Wand2 className="w-3 h-3 text-blue-400"/>}{logic.playerClass === PlayerClass.ROGUE && <Footprints className="w-3 h-3 text-green-500"/>}{logic.playerClass === PlayerClass.CLERIC && <Cross className="w-3 h-3 text-yellow-500"/>}<span className="text-[9px] font-bold uppercase">{logic.playerClass}</span></div>)}
            {!logic.isAdmin && (<>
                    <div className="flex items-center gap-2 bg-zinc-900/80 px-2 py-1 rounded-full border border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <Heart className={`w-4 h-4 ${logic.playerHp < 30 ? 'text-red-500 animate-pulse' : 'text-red-500'}`} fill="currentColor" /><span className={`text-sm font-mono font-bold ${logic.playerHp < 30 ? 'text-red-500' : 'text-white'}`}>{logic.playerHp}</span>
                        <div className="flex flex-col gap-0.5 ml-1 border-l border-zinc-700 pl-1.5"><button onClick={() => logic.handleHpChange(5)} className="text-zinc-500 hover:text-green-400 active:text-white"><ChevronUp className="w-3 h-3" /></button><button onClick={() => logic.handleHpChange(-5)} className="text-zinc-500 hover:text-red-400 active:text-white"><ChevronDown className="w-3 h-3" /></button></div>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-900/80 px-2 py-1 rounded-full border border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <Coins className="w-4 h-4 text-yellow-500" fill="currentColor" /><span className="text-sm font-mono font-bold text-yellow-500">{logic.playerGold}</span>
                        <div className="flex flex-col gap-0.5 ml-1 border-l border-zinc-700 pl-1.5"><button onClick={() => logic.handleGoldChange(10)} className="text-zinc-500 hover:text-yellow-300 active:text-white"><ChevronUp className="w-3 h-3" /></button><button onClick={() => logic.handleGoldChange(-10)} className="text-zinc-500 hover:text-red-400 active:text-white"><ChevronDown className="w-3 h-3" /></button></div>
                    </div>
            </>)}
            {logic.isAdmin && <span className="text-xs font-bold text-neon-purple uppercase border border-neon-purple px-2 py-1 rounded bg-neon-purple/10">GM MODE</span>}
            <button onClick={() => logic.setActiveTab(Tab.SETTINGS)} className="p-2 bg-zinc-900/50 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800"><Settings className="w-5 h-5 text-zinc-400" /></button>
        </div>
      </header>

      <main className="flex-1 relative z-0 overflow-hidden">
        <AnimatePresence>
          {logic.activeTab === Tab.SCANNER && (
            <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
               <Scanner onScanCode={logic.handleScanCode} inventoryCount={logic.inventory.length} scanMode={logic.scanMode} isPaused={logic.isScannerPaused} />
            </motion.div>
          )}

          {logic.activeTab === Tab.INVENTORY && (
            <motion.div key="inventory" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full">
                <InventoryView 
                    inventory={logic.inventory}
                    loadingInventory={logic.loadingInventory}
                    isRefreshing={logic.isRefreshing}
                    isAdmin={logic.isAdmin}
                    isNight={logic.isNight}
                    adminNightOverride={logic.adminNightOverride}
                    playerClass={logic.playerClass}
                    giftTarget={logic.giftTarget}
                    onRefresh={logic.handleRefreshDatabase}
                    onToggleNightOverride={() => logic.setAdminNightOverride(prev => prev === null ? true : prev === true ? false : null)}
                    onCancelGift={logic.cancelGiftMode}
                    onItemClick={handleItemClick}
                    getAdjustedItem={logic.getAdjustedItem}
                />
            </motion.div>
          )}

          {logic.activeTab === Tab.GENERATOR && (
            <motion.div key="generator" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
              <Generator onSaveCard={logic.handleSaveEvent} userEmail={logic.userEmail || ''} initialData={logic.editingEvent} onClearData={() => logic.setEditingEvent(null)} />
            </motion.div>
          )}

          {logic.activeTab === Tab.ROOM && (
            <motion.div key="room" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
                <Room 
                    userEmail={logic.userEmail}
                    roomState={logic.roomState}
                    onCreateRoom={logic.handleCreateRoom}
                    onJoinRoom={logic.handleJoinRoom}
                    onLeaveRoom={logic.handleLeaveRoom}
                    onSendMessage={logic.handleSendMessage}
                    onUpdateNickname={logic.updateNickname}
                    onScanFriend={logic.initiateFriendScan}
                    onReceiveGift={logic.handleReceiveGift}
                    onInitiateGift={logic.handleInitiateGift} 
                />
            </motion.div>
          )}

          {logic.activeTab === Tab.SETTINGS && (
             <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full p-6 flex flex-col bg-zinc-950 overflow-y-auto">
                <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-8 text-white">Nastavení</h2>
                <div className="space-y-6">
                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center border border-zinc-700 shadow-inner"><User className="w-6 h-6 text-neon-blue" /></div>
                             <div><p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Identita</p><p className="font-mono text-white text-lg">{logic.userEmail}</p>{!logic.isAdmin && logic.playerClass && (<p className="text-xs text-neon-blue font-bold uppercase mt-1">Role: {logic.playerClass}</p>)}</div>
                        </div>
                        {!logic.isGuest && !logic.isAdmin && (
                            <div className="mt-6 border-t border-zinc-800 pt-6 flex flex-col items-center">
                                <div className="bg-white p-3 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4 relative group">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=friend:${logic.userEmail}&color=000000`} alt="Osobní QR Kód" className="w-48 h-48 object-contain" />
                                </div>
                                <div className="text-center space-y-1"><p className="text-neon-blue font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2"><QrCode className="w-4 h-4" /> Váš Unikátní Kód</p><p className="text-[10px] text-zinc-500 max-w-[250px] mx-auto leading-relaxed">Nechte ostatní hráče naskenovat tento kód (v režimu "Přítel"), aby si vás přidali do seznamu kontaktů.</p></div>
                            </div>
                        )}
                    </div>

                    {/* INSTALL PWA BUTTON */}
                    {logic.deferredPrompt && (
                        <button 
                            onClick={logic.installApp} 
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-bold uppercase rounded-xl shadow-lg flex items-center justify-center gap-2 tracking-widest animate-pulse"
                        >
                            <Download className="w-5 h-5" /> Nainstalovat Aplikaci
                        </button>
                    )}

                    <button onClick={logic.handleLogout} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 mt-auto tracking-widest"><LogOut className="w-5 h-5" /> Odhlásit se</button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="flex-none bg-black border-t border-zinc-800 p-2 safe-area-bottom z-40 relative">
          <div className="flex justify-around items-center h-14">
            {!logic.isAdmin && (
                <NavButton 
                  active={logic.activeTab === Tab.SCANNER} 
                  onClick={() => logic.setActiveTab(Tab.SCANNER)} 
                  icon={<ScanLine className="w-6 h-6" />} 
                  label="SKEN" 
                />
            )}
            <NavButton 
              active={logic.activeTab === Tab.INVENTORY} 
              onClick={() => logic.setActiveTab(Tab.INVENTORY)} 
              icon={<Layers className="w-6 h-6" />} 
              label="BATOH" 
            />
            {logic.isAdmin && (
              <NavButton 
                active={logic.activeTab === Tab.GENERATOR} 
                onClick={() => logic.setActiveTab(Tab.GENERATOR)} 
                icon={<SquarePen className="w-6 h-6" />} 
                label="ADMIN" 
              />
            )}
            {!logic.isAdmin && (
                <NavButton 
                  active={logic.activeTab === Tab.ROOM} 
                  onClick={() => logic.setActiveTab(Tab.ROOM)} 
                  icon={<Box className="w-6 h-6" />} 
                  label="MÍSTNOST" 
                  badgeCount={logic.unreadMessagesCount}
                />
            )}
          </div>
      </nav>

      <AnimatePresence>
        {logic.currentEvent && !logic.pendingGiftItem && (
          <EventCard 
            event={logic.currentEvent} 
            onClose={logic.closeEvent} 
            onSave={() => logic.handleSaveEvent(logic.currentEvent!)}
            onUse={() => logic.handleUseEvent(logic.currentEvent!)} 
            onDelete={() => logic.handleDeleteEvent(logic.currentEvent!.id)}
            onEdit={logic.isAdmin ? () => logic.handleEditEvent(logic.currentEvent!) : undefined}
            onConsume={logic.handleConsumeItem}
            onResolveDilemma={logic.handleResolveDilemma}
            isSaved={logic.inventory.some(i => i.id === logic.currentEvent?.id)}
            isAdmin={logic.isAdmin}
            isInstantEffect={logic.instantEffectValue !== null}
            effectValue={logic.instantEffectValue || 0}
            inventory={logic.inventory} 
            onPlayerDamage={logic.handleHpChange}
            onStartRaid={logic.handleStartRaid}
            playerHp={logic.playerHp} 
          />
        )}

        {logic.activeMerchant && logic.userEmail && (
            <MerchantScreen 
                merchant={logic.activeMerchant} 
                userGold={logic.playerGold} 
                adminEmail={logic.ADMIN_EMAIL} 
                inventory={logic.inventory}
                playerClass={logic.playerClass} // Pass Player Class
                onClose={() => logic.setActiveMerchant(null)} 
                onBuy={logic.handleBuyItem} 
                onSell={handleSellItem}
                onAddFreeItem={logic.handleSaveEvent} // For Rogue steal mechanic
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
