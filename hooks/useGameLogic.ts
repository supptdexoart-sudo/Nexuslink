
import { useState, useEffect, useRef } from 'react';
import { GameEvent, DilemmaOption, PlayerClass } from '../types';
import * as apiService from '../services/apiService';
import { NEXUS_SEED_DATA } from '../services/seedData';
import { playSound, vibrate, getSoundStatus, getVibrationStatus, toggleSoundSystem, toggleVibrationSystem } from '../services/soundService';
import { ToastData } from '../components/Toast';

const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const MAX_PLAYER_HP = 100;
const MAX_PLAYER_MANA = 100;
const INITIAL_GOLD = 100;

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

const getAdjustedItem = (item: GameEvent, isNight: boolean, pClass: PlayerClass | null): GameEvent => {
    let adjusted = { ...item };
    if (isNight && item.timeVariant?.enabled) {
        adjusted = {
            ...adjusted,
            title: item.timeVariant.nightTitle || adjusted.title,
            description: item.timeVariant.nightDescription || adjusted.description,
            type: item.timeVariant.nightType || adjusted.type,
            stats: item.timeVariant.nightStats || adjusted.stats
        };
    }
    if (pClass && item.classVariants && item.classVariants[pClass]) {
        const variant = item.classVariants[pClass]!;
        adjusted = {
            ...adjusted,
            title: variant.overrideTitle || adjusted.title,
            description: variant.overrideDescription || adjusted.description,
            type: variant.overrideType || adjusted.type,
            stats: variant.bonusStats ? [...(adjusted.stats || []), ...variant.bonusStats] : adjusted.stats
        };
    }
    return adjusted;
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
  const [eventSource, setEventSource] = useState<'scanner' | 'inventory' | 'inspect' | null>(null);
  const [actionTakenDuringEvent, setActionTakenDuringEvent] = useState(false);
  const [screenFlash, setScreenFlash] = useState<'red' | 'green' | 'blue' | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const [inventory, setInventory] = useState<GameEvent[]>(() => {
      const saved = localStorage.getItem(`nexus_inv_${userEmail || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
  });

  const [scanLog, setScanLog] = useState<string[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<ToastData | null>(null);
  
  const [showEndTurnPrompt, setShowEndTurnPrompt] = useState(false);
  const [showTurnAlert] = useState(false);
  const [showRoundEndAlert, setShowRoundEndAlert] = useState(false);

  const [playerHp, setPlayerHp] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_hp') || String(MAX_PLAYER_HP)));
  const [playerMana, setPlayerMana] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_mana') || String(MAX_PLAYER_MANA)));
  const [playerGold, setPlayerGold] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_gold') || String(INITIAL_GOLD)));
  const [playerArmor, setPlayerArmor] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_armor') || "0"));
  const [playerLuck, setPlayerLuck] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_luck') || "5"));
  const [playerOxygen, setPlayerOxygen] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_oxygen') || "100"));
  
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
    members: {name: string, email?: string, hp: number}[];
    turnIndex: number;
    isGameStarted: boolean;
    roundNumber: number;
    turnOrder: string[];
    readyForNextRound: string[];
    host: string;
  }>({
      id: localStorage.getItem('nexus_last_room_id') || '',
      isInRoom: localStorage.getItem('nexus_is_in_room') === 'true',
      messages: [],
      nickname: localStorage.getItem(`nexus_nickname_${userEmail}`) || '',
      isNicknameSet: !!localStorage.getItem(`nexus_nickname_${userEmail}`),
      members: [],
      turnIndex: 0,
      isGameStarted: false,
      roundNumber: 0,
      turnOrder: [],
      readyForNextRound: [],
      host: ''
  });
  
  const [isSoloMode, setIsSoloMode] = useState(() => localStorage.getItem('nexus_solo_mode') === 'true');
  const [giftTarget, setGiftTarget] = useState<string | null>(null);

  const prevMembersRef = useRef<any[]>([]);

  const isMyTurn = !isSoloMode && roomState.isGameStarted && roomState.turnOrder[roomState.turnIndex] === roomState.nickname;
  const isBlocked = !isAdmin && !isSoloMode && (!roomState.isGameStarted || !isMyTurn);

  const addToLog = (msg: string) => {
    setScanLog(prev => [msg, ...prev].slice(0, 50));
  };

  const handleHpChange = (amount: number) => {
    setPlayerHp(prev => {
        const newValue = Math.max(0, Math.min(MAX_PLAYER_HP, prev + amount));
        localStorage.setItem('nexus_player_hp', String(newValue));
        return newValue;
    });
    if (amount < 0) { 
        setScreenFlash('red'); 
        playSound('damage'); 
        vibrate([200]); 
        setTimeout(() => setScreenFlash(null), 500); 
    } 
    else if (amount > 0) { 
        setScreenFlash('green'); 
        playSound('heal'); 
        setTimeout(() => setScreenFlash(null), 500); 
    }
  };

  const handleManaChange = (amount: number) => {
    setPlayerMana(prev => {
        const newValue = Math.max(0, Math.min(MAX_PLAYER_MANA, prev + amount));
        localStorage.setItem('nexus_player_mana', String(newValue));
        return newValue;
    });
  };

  const handleGoldChange = (amount: number) => {
    setPlayerGold(prev => {
        const newValue = Math.max(0, prev + amount);
        localStorage.setItem('nexus_player_gold', String(newValue));
        return newValue;
    });
  };

  const handleSaveEvent = async (event: GameEvent) => {
    try {
      if (isGuest || !userEmail) {
        setInventory(prev => {
          const exists = prev.find(i => i.id === event.id);
          const newInv = exists ? prev.map(i => i.id === event.id ? event : i) : [...prev, event];
          localStorage.setItem(`nexus_inv_${userEmail || 'guest'}`, JSON.stringify(newInv));
          return newInv;
        });
      } else {
        const saved = await apiService.saveCard(userEmail, event);
        setInventory(prev => {
          const exists = prev.find(i => i.id === saved.id);
          const newInv = exists ? prev.map(i => i.id === saved.id ? saved : i) : [...prev, saved];
          localStorage.setItem(`nexus_inv_${userEmail}`, JSON.stringify(newInv));
          return newInv;
        });
      }
      addToLog(`Archivováno: ${event.title}`);
      setNotification({ id: 'save-' + Date.now(), message: 'Asset uložen do Batohu.', type: 'success' });
    } catch (e) {
      setNotification({ id: 'err-' + Date.now(), message: 'Chyba ukládání.', type: 'error' });
    }
  };

  const handleSwapItems = async (makerEmail: string, takerEmail: string, makerItemId: string, takerItemId: string) => {
    if (isGuest || !userEmail) return;
    setIsAIThinking(true);
    try {
        await apiService.swapItems(makerEmail, takerEmail, makerItemId, takerItemId);
        const inv = await apiService.getInventory(userEmail);
        setInventory(inv);
        localStorage.setItem(`nexus_inv_${userEmail}`, JSON.stringify(inv));
        await apiService.sendMessage(roomState.id, 'SYSTEM', `BURZA_SUCCESS: Výměna assetů byla dokončena.`);
        setNotification({ id: 'swap-ok', type: 'success', message: 'Výměna assetů byla úspěšná!' });
        playSound('success');
    } catch (e: any) {
        setNotification({ id: 'swap-err', type: 'error', message: e.message || 'Chyba při výměně dat.' });
    } finally {
        setIsAIThinking(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const itemToDelete = inventory.find(i => i.id === id);
      if (!isGuest && userEmail) {
        await apiService.deleteCard(userEmail, id);
      }
      setInventory(prev => {
        const newInv = prev.filter(i => i.id !== id);
        localStorage.setItem(`nexus_inv_${userEmail || 'guest'}`, JSON.stringify(newInv));
        return newInv;
    });
    if (itemToDelete) addToLog(`Zahozeno z Batohu: ${itemToDelete.title}`);
    setNotification({ id: 'del-' + Date.now(), message: 'Asset odstraněn.', type: 'success' });
    } catch (e) {
      setNotification({ id: 'err-' + Date.now(), message: 'Chyba při mazání.', type: 'error' });
    }
  };

  const handleRefreshDatabase = async () => {
    if (isGuest || !userEmail) return;
    setIsRefreshing(true);
    try {
      const inv = await apiService.getInventory(userEmail);
      setInventory(inv);
      localStorage.setItem(`nexus_inv_${userEmail}`, JSON.stringify(inv));
      const catalog = await apiService.getMasterCatalog();
      setMasterCatalog(catalog);
      localStorage.setItem('nexus_master_catalog', JSON.stringify(catalog));
      setNotification({ id: 'ref-' + Date.now(), message: 'Data synchronizována.', type: 'success' });
    } catch (e) {
      setNotification({ id: 'err-' + Date.now(), message: 'Chyba spojení.', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGameSetup = async (nickname: string, pClass: PlayerClass, roomId: string | 'create' | 'solo' | 'solo-online', password?: string) => {
    localStorage.setItem(`nexus_nickname_${userEmail}`, nickname);
    localStorage.setItem(`nexus_class_${userEmail || 'guest'}`, pClass);
    setPlayerClass(pClass);
    
    if (roomId === 'solo') {
      setIsSoloMode(true);
      localStorage.setItem('nexus_solo_mode', 'true');
      localStorage.setItem('nexus_is_in_room', 'false');
      setRoomState(prev => ({ ...prev, nickname, isNicknameSet: true, isInRoom: false, id: '' }));
      addToLog(`Systém aktivován. Batoh připraven, ${nickname}.`);
      return;
    }

    try {
      let finalRoomId = roomId;
      if (roomId === 'create' || roomId === 'solo-online') {
        finalRoomId = (roomId === 'solo-online' ? 'SOLO-' : '') + Math.random().toString(36).substring(2, 7).toUpperCase();
        await apiService.createRoom(finalRoomId, nickname, password);
        setRoomState(prev => ({ ...prev, id: finalRoomId, nickname, isNicknameSet: true, isInRoom: true, host: nickname }));
        if (roomId === 'solo-online') addToLog(`Online mise zahájena v sektoru ${finalRoomId}.`);
      } else {
        await apiService.joinRoom(finalRoomId, nickname, playerHp, password, userEmail || undefined);
        setRoomState(prev => ({ ...prev, id: finalRoomId, nickname, isNicknameSet: true, isInRoom: true }));
      }
      
      localStorage.setItem('nexus_last_room_id', finalRoomId);
      localStorage.setItem('nexus_is_in_room', 'true');
      setIsSoloMode(roomId === 'solo-online');
      localStorage.setItem('nexus_solo_mode', roomId === 'solo-online' ? 'true' : 'false');

      if (roomId === 'solo-online') {
          setTimeout(async () => {
              try { await apiService.startGame(finalRoomId); } catch(e) {}
          }, 1000);
      }
    } catch (e: any) {
      setNotification({ id: 'room-err', type: 'error', message: e.message });
      throw e;
    }
  };

  const handleLeaveRoom = async () => {
    if (roomState.id && roomState.nickname) {
      await apiService.leaveRoom(roomState.id, roomState.nickname);
    }
    setRoomState(prev => ({ ...prev, isInRoom: false, id: '' }));
    localStorage.removeItem('nexus_last_room_id');
    localStorage.removeItem('nexus_is_in_room');
    setIsSoloMode(true);
    localStorage.setItem('nexus_solo_mode', 'true');
    setScanLog([]);
  };

  const handleSendMessage = async (text: string) => {
    if (!roomState.id || !roomState.nickname) return;
    try {
      await apiService.sendMessage(roomState.id, roomState.nickname, text);
    } catch (e) {}
  };

  const handleInspectItem = async (itemId: string) => {
    setIsAIThinking(true);
    try {
      let item: GameEvent | null | undefined = masterCatalog.find(i => i.id === itemId);
      if (!item) {
        item = await apiService.getCardById(ADMIN_EMAIL, itemId);
      }
      if (item) {
        setEventSource('inspect');
        setCurrentEvent(getAdjustedItem(item, isNight, playerClass));
        addToLog(`Inspekce: ${item.title}`);
      } else {
        setNotification({ id: 'inspect-err', type: 'error', message: "Data assetu nelze dekódovat." });
      }
    } catch (e) {
      setNotification({ id: 'inspect-err', type: 'error', message: "Chyba spojení s Batohem." });
    } finally {
      setIsAIThinking(false);
    }
  };

  useEffect(() => {
    if (!roomState.isInRoom || !roomState.id || isGuest || !isServerReady) return;
    const pollInterval = setInterval(async () => {
        try {
            const status = await apiService.getRoomStatus(roomState.id);
            const messages = await apiService.getRoomMessages(roomState.id);
            if (prevMembersRef.current.length > 0 && status.members.length > prevMembersRef.current.length) {
              const newMember = status.members.find((m: any) => !prevMembersRef.current.some(pm => pm.name === m.name));
              if (newMember && newMember.name !== roomState.nickname) {
                setNotification({ id: 'join-'+Date.now(), type: 'message', message: `Hráč ${newMember.name} se připojil do sektoru!` });
                playSound('message');
              }
            }
            prevMembersRef.current = status.members;
            setRoomState(prev => ({ 
              ...prev, members: status.members, turnIndex: status.turnIndex, messages, isGameStarted: status.isGameStarted,
              roundNumber: status.roundNumber, turnOrder: status.turnOrder, readyForNextRound: status.readyForNextRound, host: status.host
            }));
            await apiService.updatePlayerStatus(roomState.id, roomState.nickname, playerHp);
        } catch (e) {}
    }, 2000);
    return () => clearInterval(pollInterval);
  }, [roomState.isInRoom, roomState.id, roomState.nickname, playerHp, isGuest, isServerReady]);

  const handleStartGame = async () => {
    if (roomState.host !== roomState.nickname) return;
    if (roomState.members.length < 1) return;
    try {
      await apiService.startGame(roomState.id);
      playSound('success');
    } catch (e) {
      setNotification({ id: 'err', type: 'error', message: 'Nepodařilo se spustit misi.' });
    }
  };

  const handleAcknowledgeRound = async () => {
    try {
      await apiService.acknowledgeRoundEnd(roomState.id, roomState.nickname);
      setShowRoundEndAlert(false);
      playSound('click');
    } catch (e) {}
  };

  const handleScanCode = async (code: string) => {
    if (isBlocked && !code.startsWith('friend:')) {
        const msg = !roomState.isGameStarted ? "MISE NEZAČALA: Čekejte na hostitele." : "NEMŮŽEŠ SKENOVAT: Nejseš na tahu!";
        setNotification({ id: 'block', type: 'error', message: msg });
        vibrate([100, 50, 100]);
        playSound('error');
        return;
    }
    setIsAIThinking(true);
    vibrate(50);
    playSound('scan');
    
    const localItem = inventory.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (localItem) { 
        setCurrentEvent(getAdjustedItem(localItem, isNight, playerClass)); 
        addToLog(`Identifikováno: ${localItem.title}`);
        setIsAIThinking(false);
        return; 
    }
    
    const vaultItem = masterCatalog.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (vaultItem) { 
        setCurrentEvent(getAdjustedItem(vaultItem, isNight, playerClass)); 
        setEventSource('scanner');
        addToLog(`Nalezeno v Batohu: ${vaultItem.title}`);
        setIsAIThinking(false);
        return; 
    }

    if (!isGuest && navigator.onLine) {
        try {
            const cloudItem = await apiService.getCardById(ADMIN_EMAIL, code);
            if (cloudItem) {
                setCurrentEvent(getAdjustedItem(cloudItem, isNight, playerClass));
                setEventSource('scanner');
                addToLog(`Staženo z cloudu: ${cloudItem.title}`);
                setIsAIThinking(false);
                return;
            }
        } catch (e) {}
    }

    setIsAIThinking(false);
    setNotification({ id: 'not-found-' + Date.now(), type: 'error', message: 'ID karty nenalezeno.' });
    playSound('error');
  };

  const handleUseEvent = async (event: GameEvent) => {
      if (isBlocked) {
          setNotification({ id: 'block', type: 'error', message: "NEMŮŽEŠ POUŽÍT KARTU: Nejseš na tahu!" });
          playSound('error');
          return;
      }
      setActionTakenDuringEvent(true);
      if (event.stats) { 
          event.stats.forEach(stat => { 
              const val = parseInt(String(stat.value)); 
              if (isNaN(val)) return; 
              const label = stat.label.toUpperCase(); 
              if (['HP', 'ZDRAVÍ', 'HEALTH', 'ŽIVOTY', 'HEAL', 'LÉČENÍ'].some(k => label.includes(k))) handleHpChange(val); 
              else if (['MANA', 'ENERGIE', 'ENERGY'].some(k => label.includes(k))) handleManaChange(val);
              else if (['DMG', 'POŠKOZENÍ', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => label.includes(k))) handleHpChange(-Math.abs(val)); 
              else if (['GOLD', 'KREDITY', 'PENÍZE', 'MINCE'].some(k => label.includes(k))) handleGoldChange(val); 
              else if (['ARMOR', 'OBRANA', 'BRNĚNÍ'].some(k => label.includes(k))) setPlayerArmor(prev => prev + val);
              else if (['LUCK', 'ŠTĚSTÍ'].some(k => label.includes(k))) setPlayerLuck(prev => prev + val);
              else if (['O2', 'KYSLÍK', 'OXYGEN'].some(k => label.includes(k))) setPlayerOxygen(prev => prev + val);
          }); 
      }
      if (!inventory.some(i => i.id === event.id)) { setCurrentEvent(null); return; }
      if (event.isConsumable) {
          await handleDeleteEvent(event.id);
          addToLog(`Spotřebováno z Batohu: ${event.title}`);
          setNotification({ id: 'use', type: 'success', message: `${event.title} použito!` });
          setScreenFlash('green');
      } else { 
          setScreenFlash('green'); 
          playSound('success'); 
          vibrate([50, 50]); 
          setTimeout(() => setScreenFlash(null), 500); 
          addToLog(`Aktivováno: ${event.title}`);
          setNotification({ id: 'act', type: 'info', message: `${event.title} aktivováno.` });
      }
  };

  const closeEvent = () => {
    const wasScanner = eventSource === 'scanner';
    const wasAction = actionTakenDuringEvent;
    const wasInspect = eventSource === 'inspect';
    setCurrentEvent(null);
    setEventSource(null);
    setActionTakenDuringEvent(false);
    if (!isAdmin && (wasScanner || wasAction) && !wasInspect) {
      setNotification({ id: 'turn-end', type: 'info', message: 'Konec interakce. Pokračujte v misi.' });
      playSound('open');
    }
  };

  const handleEndTurn = async () => {
      setShowEndTurnPrompt(false);
      if (isSoloMode) { 
          playSound('success'); 
          addToLog(`Tah dokončen.`);
          return; 
      }
      if (!roomState.id) return;
      try {
          await apiService.nextTurn(roomState.id);
          playSound('success');
      } catch (e) {}
  };

  return {
      userEmail, isAdmin, isGuest, isServerReady, setIsServerReady, isNight, adminNightOverride, setAdminNightOverride,
      activeTab, setActiveTab, currentEvent, setCurrentEvent, editingEvent, setEditingEvent, screenFlash, inventory, 
      isRefreshing, notification, setNotification, showEndTurnPrompt, playerHp, playerMana, playerGold, playerArmor, playerLuck, playerOxygen, playerClass,
      roomState, isSoloMode, giftTarget, setGiftTarget, isScannerPaused: !!currentEvent || showTurnAlert || showRoundEndAlert,
      isAIThinking, showTurnAlert, showRoundEndAlert, handleAcknowledgeRound,
      isMyTurn, isBlocked, handleStartGame,
      handleLogin: (email: string) => { localStorage.setItem('nexus_current_user', email); setUserEmail(email); if (email !== 'guest') setIsServerReady(false); },
      handleLogout: () => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); },
      handleScanCode, handleSaveEvent, handleDeleteEvent, handleUseEvent, handleRefreshDatabase, handleGameSetup, handleLeaveRoom,
      handleResolveDilemma: (option: DilemmaOption) => { setActionTakenDuringEvent(true); if (option.effectType === 'hp') handleHpChange(option.effectValue); else if (option.effectType === 'gold') handleGoldChange(option.effectValue); addToLog(`Volba: ${option.label}`); },
      handleEndTurn, handleSendMessage, closeEvent, handleHpChange, handleManaChange, handleGoldChange,
      handleOpenInventoryItem: (item: GameEvent) => { if (isAdmin) { setEditingEvent(item); setActiveTab(Tab.GENERATOR); } else { setEventSource('inventory'); setCurrentEvent(item); } },
      getAdjustedItem, handleSwapItems, soundEnabled, vibrationEnabled, 
      handleToggleSound: () => { toggleSoundSystem(!soundEnabled); setSoundEnabled(!soundEnabled); }, 
      handleToggleVibration: () => { toggleVibrationSystem(!vibrationEnabled); setVibrationEnabled(!vibrationEnabled); },
      handleInspectItem,
      scanLog
  };
};
