import { useState, useEffect, useCallback } from 'react';
import { GameEvent, DilemmaOption, PlayerClass } from '../types';
import * as apiService from '../services/apiService';
import { NEXUS_SEED_DATA } from '../services/seedData';
import { playSound, vibrate, getSoundStatus, getVibrationStatus, toggleSoundSystem, toggleVibrationSystem } from '../services/soundService';
import { ToastData, ToastType } from '../components/Toast';
import * as geminiService from '../services/geminiService';

const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const MAX_PLAYER_HP = 100;
const MAX_PLAYER_MANA = 100;
const INITIAL_GOLD = 100;
const TURN_TIMEOUT_SECONDS = 15;

export enum Tab {
  SCANNER = 'scanner',
  INVENTORY = 'inventory',
  GENERATOR = 'generator',
  ROOM = 'room',
  SETTINGS = 'settings'
}

const isNightTime = (): boolean => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6;
};

export const useGameLogic = () => {
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('nexus_current_user'));
  const isAdmin = userEmail === ADMIN_EMAIL;
  const isGuest = userEmail === 'guest';

  const [isServerReady, setIsServerReady] = useState(false);
  const isNight = isNightTime();
  const [adminNightOverride, setAdminNightOverride] = useState<boolean | null>(null);
  
  const [soundEnabled, setSoundEnabled] = useState(getSoundStatus());
  const [vibrationEnabled, setVibrationEnabled] = useState(getVibrationStatus());

  const [activeTab, setActiveTab] = useState<Tab>(() => (userEmail === ADMIN_EMAIL ? Tab.GENERATOR : Tab.SCANNER));

  const [masterCatalog, setMasterCatalog] = useState<GameEvent[]>(() => {
      const saved = localStorage.getItem('nexus_master_catalog');
      return saved ? JSON.parse(saved) : NEXUS_SEED_DATA;
  });

  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null);
  const [eventSource, setEventSource] = useState<'scanner' | 'inventory' | null>(null);
  const [actionTakenDuringEvent, setActionTakenDuringEvent] = useState(false);
  const [activeMerchant, setActiveMerchant] = useState<GameEvent | null>(null);
  const [screenFlash, setScreenFlash] = useState<'red' | 'green' | 'blue' | null>(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const [inventory, setInventory] = useState<GameEvent[]>(() => {
      const saved = localStorage.getItem(`nexus_inv_${userEmail || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [notification, setNotification] = useState<ToastData | null>(null);
  const [showEndTurnPrompt, setShowEndTurnPrompt] = useState(false);
  const [turnCountdown, setTurnCountdown] = useState(TURN_TIMEOUT_SECONDS);
  const [hasInitialRefreshDone, setHasInitialRefreshDone] = useState(false);

  const [playerHp, setPlayerHp] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_hp') || String(MAX_PLAYER_HP)));
  const [playerMana, setPlayerMana] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_mana') || String(MAX_PLAYER_MANA)));
  const [playerGold, setPlayerGold] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_gold') || String(INITIAL_GOLD)));
  const [playerArmor] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_armor') || '0'));
  const [playerLuck] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_luck') || '5'));
  const [playerOxygen] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_oxygen') || '100'));

  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(() => {
      const saved = localStorage.getItem(`nexus_class_${userEmail || 'guest'}`);
      return saved ? (saved as PlayerClass) : null;
  });

  const [roomState, setRoomState] = useState<{
    id: string;
    isInRoom: boolean;
    messages: any[];
    nickname: string;
    isNicknameSet: boolean;
    members: any[];
    turnIndex: number;
  }>({
      id: localStorage.getItem('nexus_last_room_id') || '',
      isInRoom: localStorage.getItem('nexus_is_in_room') === 'true',
      messages: [],
      nickname: localStorage.getItem(`nexus_nickname_${userEmail}`) || '',
      isNicknameSet: !!localStorage.getItem(`nexus_nickname_${userEmail}`),
      members: [],
      turnIndex: 0
  });
  
  const [isSoloMode, setIsSoloMode] = useState(() => localStorage.getItem('nexus_solo_mode') === 'true');
  const [scanMode, setScanMode] = useState<'item' | 'friend'>('item');

  const isGameActive = isSoloMode || isGuest || (roomState.isInRoom && roomState.members.length >= 2);

  useEffect(() => {
    if (!roomState.isInRoom || !roomState.id || isGuest || !isServerReady) return;
    const pollInterval = setInterval(async () => {
        try {
            const status = await apiService.getRoomStatus(roomState.id);
            const messages = await apiService.getRoomMessages(roomState.id);
            setRoomState(prev => ({ ...prev, members: status.members, turnIndex: status.turnIndex, messages }));
            await apiService.updatePlayerStatus(roomState.id, roomState.nickname, playerHp);
        } catch (e) {}
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [roomState.isInRoom, roomState.id, roomState.nickname, playerHp, isGuest, isServerReady]);

  useEffect(() => {
    if (isServerReady && !isGuest) {
        syncMasterCatalog();
    }
  }, [isServerReady, isGuest]);

  const syncMasterCatalog = async () => {
      try {
          const catalog = await apiService.getMasterCatalog();
          if (catalog && catalog.length > 0) {
              setMasterCatalog(catalog);
              localStorage.setItem('nexus_master_catalog', JSON.stringify(catalog));
          }
      } catch (e) {}
  };

  useEffect(() => {
    if (!userEmail) return;
    localStorage.setItem('nexus_player_hp', playerHp.toString());
    localStorage.setItem('nexus_player_mana', playerMana.toString());
    localStorage.setItem('nexus_player_gold', playerGold.toString());
    localStorage.setItem('nexus_player_armor', playerArmor.toString());
    localStorage.setItem('nexus_player_luck', playerLuck.toString());
    localStorage.setItem('nexus_player_oxygen', playerOxygen.toString());
    if (playerClass) localStorage.setItem(`nexus_class_${userEmail || 'guest'}`, playerClass);
    localStorage.setItem(`nexus_inv_${userEmail || 'guest'}`, JSON.stringify(inventory));
    localStorage.setItem('nexus_solo_mode', isSoloMode.toString());
    localStorage.setItem('nexus_is_in_room', roomState.isInRoom.toString());
    localStorage.setItem('nexus_last_room_id', roomState.id);
    localStorage.setItem('nexus_master_catalog', JSON.stringify(masterCatalog));
  }, [playerHp, playerMana, playerGold, playerArmor, playerLuck, playerOxygen, playerClass, inventory, userEmail, isSoloMode, roomState.isInRoom, roomState.id, masterCatalog]);

  const showNotification = useCallback((message: string, type: ToastType = 'info') => {
      setNotification({ id: Date.now().toString(), message, type });
      if (type === 'gift') playSound('success');
      else if (type === 'message') playSound('message');
      else if (type === 'error') playSound('error');
      else playSound('click');
  }, []);

  const handleRefreshDatabase = async () => {
    if (!userEmail || isGuest || !isServerReady) {
        showNotification("Místní databáze aktualizována.", "info");
        await syncMasterCatalog();
        return;
    }
    setIsRefreshing(true);
    setLoadingInventory(true);
    try {
        const data = await apiService.getInventory(userEmail);
        setInventory(data);
        await syncMasterCatalog();
        showNotification("Vše synchronizováno", "success");
    } catch (e) {
        showNotification("Chyba synchronizace", "error");
    } finally {
        setIsRefreshing(false);
        setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (activeTab === Tab.INVENTORY && !hasInitialRefreshDone && userEmail && !isGuest && isServerReady) {
      handleRefreshDatabase();
      setHasInitialRefreshDone(true);
    }
  }, [activeTab, hasInitialRefreshDone, userEmail, isGuest, isServerReady]);

  const handleGameSetup = async (nickname: string, pClass: PlayerClass, action: string | 'create' | 'solo', password?: string) => {
    setPlayerClass(pClass);
    setRoomState(prev => ({ ...prev, nickname, isNicknameSet: true }));
    if (userEmail) localStorage.setItem(`nexus_nickname_${userEmail}`, nickname);
    if (action === 'solo') {
        setIsSoloMode(true);
        setRoomState(prev => ({ ...prev, isInRoom: false, id: '' }));
        showNotification("Solo režim aktivován", "success");
        return;
    }
    setIsSoloMode(false);
    try {
        if (action === 'create') {
            const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
            if (isServerReady && !isGuest) await apiService.createRoom(newRoomId, nickname, password);
            setRoomState(prev => ({ ...prev, id: newRoomId, isInRoom: true }));
            showNotification(`Místnost ${newRoomId} vytvořena`, "success");
        } else {
            if (isServerReady && !isGuest) await apiService.joinRoom(action, nickname, playerHp, password);
            setRoomState(prev => ({ ...prev, id: action, isInRoom: true }));
            showNotification(`Připojeno k ${action}`, "success");
        }
    } catch (err: any) {
        showNotification(err.message || "Chyba připojení", "error");
        throw err;
    }
  };

  const handleLeaveRoom = useCallback(async () => {
    if (!roomState.id) return;
    try {
        if (isServerReady && !isGuest) {
            await apiService.leaveRoom(roomState.id, roomState.nickname);
        }
        setRoomState(prev => ({ ...prev, isInRoom: false, id: '', members: [] }));
        localStorage.removeItem('nexus_is_in_room');
        localStorage.removeItem('nexus_last_room_id');
        showNotification("Místnost opuštěna", "info");
        playSound('click');
    } catch (e) {
        showNotification("Chyba při opouštění místnosti", "error");
    }
  }, [roomState.id, roomState.nickname, isServerReady, isGuest, showNotification]);

  const handleEndTurn = async () => {
      setShowEndTurnPrompt(false);
      setTurnCountdown(TURN_TIMEOUT_SECONDS);
      if (isSoloMode) { playSound('success'); return; }
      if (!roomState.id) return;
      try {
          await apiService.nextTurn(roomState.id);
          playSound('success');
      } catch (e) {}
  };

  const handleSendMessage = async (text: string) => {
    if (!roomState.isInRoom || !roomState.id || !roomState.nickname) return;
    try {
      await apiService.sendMessage(roomState.id, roomState.nickname, text);
    } catch (e) {
      showNotification("Zprávu nelze odeslat", "error");
    }
  };

  const handleUseEvent = async (event: GameEvent) => {
      if (!isGameActive && !isAdmin) {
          showNotification("NELZE POUŽÍT: Jednotka nekompletní (vyžadováni 2+ hráči)", "error");
          vibrate([100]);
          return;
      }

      setActionTakenDuringEvent(true);
      if (event.stats) { 
          event.stats.forEach(stat => { 
              const val = parseInt(String(stat.value)); 
              if (isNaN(val)) return; 
              const label = stat.label.toUpperCase(); 
              if (['HP', 'ZDRAVÍ', 'HEALTH', 'ŽIVOTY', 'HEAL', 'LÉČENÍ'].some(k => label.includes(k))) handleHpChange(val); 
              else if (['DMG', 'POŠKOZENÍ', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => label.includes(k))) handleHpChange(-Math.abs(val)); 
              else if (['GOLD', 'KREDITY', 'PENÍZE', 'MINCE'].some(k => label.includes(k))) handleGoldChange(val); 
              else if (['MANA', 'ENERGIE', 'ENERGY', 'POWER'].some(k => label.includes(k))) handleManaChange(val);
          }); 
      }
      if (!inventory.some(i => i.id === event.id)) { setCurrentEvent(null); return; }
      if (event.isConsumable) {
          await handleDeleteEvent(event.id);
          showNotification(`${event.title} použito!`, 'success');
          setScreenFlash('green');
      } else { 
          setScreenFlash('green'); 
          playSound('success'); 
          vibrate([50, 50]); 
          setTimeout(() => setScreenFlash(null), 500); 
          showNotification(`${event.title} aktivováno.`, 'info');
      }
  };

  const handleHpChange = (amount: number) => {
      setPlayerHp(prev => Math.max(0, Math.min(MAX_PLAYER_HP, prev + amount)));
      if (amount < 0) { setScreenFlash('red'); playSound('damage'); vibrate([200]); setTimeout(() => setScreenFlash(null), 500); } 
      else if (amount > 0) { setScreenFlash('green'); playSound('heal'); setTimeout(() => setScreenFlash(null), 500); }
  };

  const handleManaChange = (amount: number) => {
      setPlayerMana(prev => Math.max(0, Math.min(MAX_PLAYER_MANA, prev + amount)));
      if (amount > 0) { setScreenFlash('blue'); playSound('heal'); setTimeout(() => setScreenFlash(null), 500); }
  };

  const handleGoldChange = (amount: number) => { setPlayerGold(prev => Math.max(0, prev + amount)); if (amount > 0) playSound('success'); else playSound('click'); };

  const handleScanCode = async (code: string) => {
    if (!isGameActive && !isAdmin && !code.startsWith('friend:')) {
        showNotification("SKENER BLOKOVÁN: Jednotka nekompletní (vyžadováni 2+ hráči)", "error");
        vibrate([100, 50, 100]);
        return;
    }

    if (scanMode === 'friend' || code.startsWith('friend:')) {
        const friendEmail = code.replace('friend:', '');
        if (isServerReady && userEmail && !isGuest) {
            await apiService.sendFriendRequest(userEmail, friendEmail);
            showNotification("Žádost o přátelství odeslána", "success");
        } else showNotification("Offline: Nelze přidat přátele", "info");
        setScanMode('item');
        return;
    }

    setIsAIThinking(true);
    vibrate(50);

    const localItem = inventory.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (localItem) { 
        setCurrentEvent(getAdjustedItem(localItem, isNight, playerClass)); 
        setIsAIThinking(false);
        return; 
    }
    const vaultItem = masterCatalog.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (vaultItem) { 
        setCurrentEvent(getAdjustedItem(vaultItem, isNight, playerClass)); 
        setEventSource('scanner');
        setIsAIThinking(false);
        return; 
    }

    try {
        if (isServerReady) {
            let foundItem = await apiService.getCardById(userEmail!, code);
            if (!foundItem) foundItem = await apiService.getCardById(ADMIN_EMAIL, code);
            
            if (foundItem) {
                setCurrentEvent(getAdjustedItem(foundItem, isNight, playerClass));
                setEventSource('scanner');
                setIsAIThinking(false);
                return;
            }
        }
    } catch (e) {}

    showNotification("Analyzuji neznámý kód přes AI...", "info");
    try {
        const aiEvent = await geminiService.interpretCode(code);
        setCurrentEvent(aiEvent);
        setEventSource('scanner');
        showNotification("Anomálie identifikována!", "success");
    } catch (err) {
        showNotification("Chyba analýzy signálu", "error");
    } finally {
        setIsAIThinking(false);
    }
  };

  const closeEvent = () => {
    const wasScanner = eventSource === 'scanner';
    const wasAction = actionTakenDuringEvent;
    setCurrentEvent(null);
    setEventSource(null);
    setActionTakenDuringEvent(false);
    if (!isAdmin && (wasScanner || wasAction)) {
      setShowEndTurnPrompt(true);
      setTurnCountdown(TURN_TIMEOUT_SECONDS);
      playSound('open');
    }
  };

  const handleOpenInventoryItem = (item: GameEvent) => {
      if (isAdmin) {
          if (item.isLocked) {
               showNotification("PŘÍSTUP ZAMÍTNUT: Asset je ZAMČEN. Úpravy blokovány.", "error");
               playSound('error');
               vibrate([50, 100]);
               return;
          }

          setEditingEvent(item);
          setActiveTab(Tab.GENERATOR);
          setCurrentEvent(null);
          showNotification(`Karta ${item.id} načtena k úpravě.`, 'info');
      } else {
          setEventSource('inventory');
          setActionTakenDuringEvent(false);
          setCurrentEvent(item);
      }
  };

  const handleSaveEvent = async (event: GameEvent) => {
    setInventory(prev => {
        const exists = prev.some(i => i.id === event.id);
        return exists ? prev.map(i => i.id === event.id ? event : i) : [...prev, event];
    });
    if (!isGuest && !isSoloMode && isServerReady) {
        try { await apiService.saveCard(userEmail!, event); } catch (e) {}
    }
    playSound('success');
  };

  const handleDeleteEvent = useCallback(async (id: string) => {
    const lowerId = id.toLowerCase();
    
    const itemInInv = inventory.find(i => i.id.toLowerCase() === lowerId);
    const itemInCatalog = masterCatalog.find(i => i.id.toLowerCase() === lowerId);
    
    if (itemInInv?.isLocked || itemInCatalog?.isLocked) {
        showNotification("Asset je ZAMČEN. Nelze odstranit!", "error");
        return;
    }

    if (currentEvent && currentEvent.id.toLowerCase() === lowerId) {
        setCurrentEvent(null);
    }
    
    if (editingEvent && editingEvent.id.toLowerCase() === lowerId) {
        setEditingEvent(null);
    }

    setInventory(prev => prev.filter(i => i.id.toLowerCase() !== lowerId));
    setMasterCatalog(prev => prev.filter(i => i.id.toLowerCase() !== lowerId));
    
    if (!isGuest && userEmail && isServerReady) {
        try { 
            await apiService.deleteCard(userEmail, id);
            showNotification("Data TRVALE vymazána ze sektoru.", "success");
            playSound('success');
        } catch (e) {
            showNotification("Chyba při mazání z DB. Zkuste obnovit.", "error");
        }
    } else {
        showNotification("Vymazáno z místní paměti.", "info");
    }
  }, [inventory, masterCatalog, userEmail, isGuest, isServerReady, currentEvent, editingEvent, showNotification]);

  const handleToggleLock = (id: string) => {
      if (!isAdmin) return;
      setInventory(prev => prev.map(item => {
          if (item.id === id) {
              const newLocked = !item.isLocked;
              showNotification(newLocked ? "Asset ZAMČEN" : "Asset ODEMČEN", newLocked ? "info" : "success");
              const updatedItem = { ...item, isLocked: newLocked };
              if (!isGuest && isServerReady) apiService.saveCard(userEmail!, updatedItem).catch(() => {});
              return updatedItem;
          }
          return item;
      }));
  };

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    toggleSoundSystem(newState);
    setSoundEnabled(newState);
  };

  const handleToggleVibration = () => {
    const newState = !vibrationEnabled;
    toggleVibrationSystem(newState);
    setVibrationEnabled(newState);
  };

  const handleLogout = () => { 
    localStorage.removeItem('nexus_current_user');
    localStorage.removeItem('nexus_is_in_room');
    localStorage.removeItem('nexus_last_room_id');
    localStorage.removeItem('nexus_solo_mode');
    sessionStorage.clear();
    
    setUserEmail(null);
    setRoomState({
        id: '',
        isInRoom: false,
        messages: [],
        nickname: '',
        isNicknameSet: false,
        members: [],
        turnIndex: 0
    });
    setIsSoloMode(false);
    setActiveTab(Tab.SCANNER);
    
    window.location.assign(window.location.origin + window.location.pathname);
  };

  const getAdjustedItem = useCallback((item: GameEvent, isNightMode: boolean, _pClass: PlayerClass | null): GameEvent => {
      let newItem = { ...item };
      if (isNightMode && item.timeVariant && item.timeVariant.enabled) {
          newItem = {
              ...newItem,
              title: item.timeVariant.nightTitle || item.title,
              description: item.timeVariant.nightDescription || item.description,
              type: item.timeVariant.nightType || item.type,
              stats: item.timeVariant.nightStats && item.timeVariant.nightStats.length > 0 ? item.timeVariant.nightStats : item.stats
          };
      }
      return newItem;
  }, []);

  return {
      userEmail, isAdmin, isGuest, isServerReady, setIsServerReady,
      isNight, adminNightOverride, setAdminNightOverride,
      activeTab, setActiveTab,
      currentEvent, setCurrentEvent, activeMerchant, setActiveMerchant,
      editingEvent, setEditingEvent,
      screenFlash, inventory, loadingInventory,
      isRefreshing, notification, setNotification,
      showEndTurnPrompt, setShowEndTurnPrompt, turnCountdown,
      playerHp, playerGold, playerMana, playerArmor, playerLuck, playerOxygen, playerClass,
      roomState, isSoloMode, scanMode, isScannerPaused: !!currentEvent || !!activeMerchant || !!showEndTurnPrompt,
      isStatsExpanded, setIsStatsExpanded, isAIThinking,
      masterCatalog, isGameActive,
      handleLogin: (email: string) => { localStorage.setItem('nexus_current_user', email); setUserEmail(email); if (email !== 'guest') setIsServerReady(false); },
      handleLogout,
      handleScanCode, handleSaveEvent, handleDeleteEvent, handleUseEvent, handleRefreshDatabase, handleGameSetup, handleLeaveRoom,
      handleResolveDilemma: (option: DilemmaOption) => { setActionTakenDuringEvent(true); if (option.effectType === 'hp') handleHpChange(option.effectValue); else if (option.effectType === 'gold') handleGoldChange(option.effectValue); },
      handleHpChange, handleGoldChange, handleManaChange, handleEndTurn, handleSendMessage,
      closeEvent, handleOpenInventoryItem, getAdjustedItem, ADMIN_EMAIL,
      handleToggleLock,
      giftTarget: null, cancelGiftMode: () => {},
      soundEnabled, vibrationEnabled, handleToggleSound, handleToggleVibration
  };
};
