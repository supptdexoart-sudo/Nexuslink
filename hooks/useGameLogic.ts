
import { useState, useEffect, useRef } from 'react';
import { GameEvent, DilemmaOption, PlayerClass, GameEventType } from '../types';
import * as apiService from '../services/apiService';
import { NEXUS_SEED_DATA } from '../services/seedData';
import { playSound, vibrate, getSoundStatus, getVibrationStatus, toggleSoundSystem, toggleVibrationSystem } from '../services/soundService';
import { ToastData } from '../components/Toast';

const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const TEST_ACCOUNT_EMAIL = 'admin_test_vault@nexus.local'; // Virtuální účet pro testování

const MAX_PLAYER_HP = 100;
const MAX_PLAYER_MANA = 100;
const MAX_PLAYER_FUEL = 100; 
const INITIAL_GOLD = 100;

export enum Tab {
  SCANNER = 'scanner',
  INVENTORY = 'inventory',
  GENERATOR = 'generator',
  ROOM = 'room',
  SETTINGS = 'settings',
  SPACESHIP = 'spaceship'
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

  // TEST MODE STATE
  const [isTestMode, setIsTestMode] = useState(() => localStorage.getItem('nexus_admin_test_mode') === 'true');
  
  // Určíme, který email se používá pro operace s BATOHEM (Inventory/Crafting/Scanning)
  // Admin v Test Mode používá oddělený účet. Admin v normálním módu používá svůj hlavní.
  const activeInventoryEmail = (isAdmin && isTestMode) ? TEST_ACCOUNT_EMAIL : userEmail;

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
  const [activeStation, setActiveStation] = useState<GameEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null);
  const [eventSource, setEventSource] = useState<'scanner' | 'inventory' | 'inspect' | null>(null);
  const [actionTakenDuringEvent, setActionTakenDuringEvent] = useState(false);
  const [screenFlash, setScreenFlash] = useState<'red' | 'green' | 'blue' | 'amber' | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // Docking State
  const [isDocking, setIsDocking] = useState(false);

  // Inventory načítáme podle activeInventoryEmail
  const [inventory, setInventory] = useState<GameEvent[]>(() => {
      const saved = localStorage.getItem(`nexus_inv_${activeInventoryEmail || 'guest'}`);
      return saved ? JSON.parse(saved) : [];
  });

  // Reload inventory when toggling modes
  useEffect(() => {
      if (activeInventoryEmail) {
          const saved = localStorage.getItem(`nexus_inv_${activeInventoryEmail}`);
          setInventory(saved ? JSON.parse(saved) : []);
          if (!isGuest) {
              // Fetch fresh from server on switch
              apiService.getInventory(activeInventoryEmail).then(inv => {
                  setInventory(inv);
                  localStorage.setItem(`nexus_inv_${activeInventoryEmail}`, JSON.stringify(inv));
              }).catch(() => {});
          }
      }
  }, [activeInventoryEmail, isGuest]);

  const [scanLog, setScanLog] = useState<string[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<ToastData | null>(null);
  
  const [showEndTurnPrompt, setShowEndTurnPrompt] = useState(false);
  const [showTurnAlert] = useState(false);
  const [showRoundEndAlert, setShowRoundEndAlert] = useState(false);

  // Player Stats
  const [playerHp, setPlayerHp] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_hp') || String(MAX_PLAYER_HP)));
  const [playerMana, setPlayerMana] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_mana') || String(MAX_PLAYER_MANA)));
  const [playerFuel, setPlayerFuel] = useState<number>(() => parseInt(localStorage.getItem('nexus_player_fuel') || String(MAX_PLAYER_FUEL)));
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

  const toggleTestMode = () => {
      if (!isAdmin) return;
      const newMode = !isTestMode;
      setIsTestMode(newMode);
      localStorage.setItem('nexus_admin_test_mode', String(newMode));
      playSound('open');
      setNotification({
          id: 'mode-' + Date.now(),
          type: 'info',
          message: newMode ? 'AKTIVOVÁN TESTOVACÍ BATOH' : 'AKTIVOVÁNA MASTER DATABÁZE'
      });
  };

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

  const handleFuelChange = (amount: number) => {
    setPlayerFuel(prev => {
        const currentFuel = Number(prev) || 0;
        const change = Number(amount) || 0;
        const newValue = Math.max(0, Math.min(MAX_PLAYER_FUEL, currentFuel + change));
        localStorage.setItem('nexus_player_fuel', String(newValue));
        return newValue;
    });
    if (amount < 0) {
        setScreenFlash('amber');
        playSound('error'); 
        vibrate([50, 100, 50]); 
        setNotification({
            id: 'fuel-' + Date.now(),
            type: 'error',
            message: `VAROVÁNÍ: Spotřeba Paliva ${amount}%`
        });
        setTimeout(() => setScreenFlash(null), 800);
    }
  };

  const handleGoldChange = (amount: number) => {
    setPlayerGold(prev => {
        const newValue = Math.max(0, prev + amount);
        localStorage.setItem('nexus_player_gold', String(newValue));
        return newValue;
    });
  };

  // Upravená metoda pro ukládání. 
  // Pokud je isCatalogUpdate=true (z Generátoru), ukládá VŽDY do Master DB (ADMIN_EMAIL).
  // Jinak ukládá do activeInventoryEmail (což může být Test Batoh).
  const handleSaveEvent = async (event: GameEvent, isCatalogUpdate: boolean = false) => {
    try {
      if (isGuest || !userEmail) {
        // Guest Logic
        setInventory(prev => {
          const exists = prev.find(i => i.id === event.id);
          const newInv = exists ? prev.map(i => i.id === event.id ? event : i) : [...prev, event];
          localStorage.setItem(`nexus_inv_guest`, JSON.stringify(newInv));
          return newInv;
        });
      } else {
        // Determine target email
        // If it's a catalog update (Generator), FORCE Admin Email.
        // Otherwise use active inventory email (which respects Test Mode).
        const targetEmail = isCatalogUpdate ? ADMIN_EMAIL : activeInventoryEmail;
        
        if (!targetEmail) throw new Error("No target email");

        // Send to server
        const serverResponse = await apiService.saveCard(targetEmail, event);
        
        const mergedEvent: GameEvent = {
            ...serverResponse, 
            ...event,          
            id: serverResponse.id 
        };

        // If we are saving to the CURRENTLY VIEWED inventory, update UI immediately
        if (targetEmail === activeInventoryEmail) {
            setInventory(prev => {
                const exists = prev.find(i => i.id === mergedEvent.id);
                const newInv = exists ? prev.map(i => i.id === mergedEvent.id ? mergedEvent : i) : [...prev, mergedEvent];
                localStorage.setItem(`nexus_inv_${activeInventoryEmail}`, JSON.stringify(newInv));
                return newInv;
            });
        }

        // If this was a Catalog Update (Admin Work), ensure Master Catalog is updated locally too
        if (isCatalogUpdate && isAdmin) {
            setMasterCatalog(prev => {
                const exists = prev.find(i => i.id === mergedEvent.id);
                const newCat = exists ? prev.map(i => i.id === mergedEvent.id ? mergedEvent : i) : [...prev, mergedEvent];
                localStorage.setItem('nexus_master_catalog', JSON.stringify(newCat));
                return newCat;
            });
            // Also notify that it was saved to DB
            addToLog(`DB UPDATE: ${event.title}`);
            setNotification({ id: 'db-save-' + Date.now(), message: 'Zapsáno do Master Databáze.', type: 'success' });
        } else {
            // Normal backpack save
            addToLog(`Archivováno: ${event.title}`);
            setNotification({ id: 'save-' + Date.now(), message: 'Asset uložen do Batohu.', type: 'success' });
        }
      }
    } catch (e) {
      setNotification({ id: 'err-' + Date.now(), message: 'Chyba ukládání.', type: 'error' });
    }
  };

  const handleSwapItems = async (makerEmail: string, takerEmail: string, makerItemId: string, takerItemId: string) => {
    if (isGuest || !activeInventoryEmail) return;
    setIsAIThinking(true);
    try {
        await apiService.swapItems(makerEmail, takerEmail, makerItemId, takerItemId);
        // Refresh Current Inventory
        const inv = await apiService.getInventory(activeInventoryEmail);
        setInventory(inv);
        localStorage.setItem(`nexus_inv_${activeInventoryEmail}`, JSON.stringify(inv));
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
      if (!isGuest && activeInventoryEmail) {
        await apiService.deleteCard(activeInventoryEmail, id);
      }
      setInventory(prev => {
        const newInv = prev.filter(i => i.id !== id);
        localStorage.setItem(`nexus_inv_${activeInventoryEmail || 'guest'}`, JSON.stringify(newInv));
        return newInv;
    });
    if (itemToDelete) addToLog(`Zahozeno z Batohu: ${itemToDelete.title}`);
    setNotification({ id: 'del-' + Date.now(), message: 'Asset odstraněn.', type: 'success' });
    } catch (e) {
      setNotification({ id: 'err-' + Date.now(), message: 'Chyba při mazání.', type: 'error' });
    }
  };

  const handleCraftItem = async (recipeItem: GameEvent) => {
      if (!recipeItem.craftingRecipe?.requiredResources) return;

      const requiredResources = recipeItem.craftingRecipe.requiredResources;
      let newInventory = [...inventory];
      let resourcesConsumed = true;

      // 1. DEDUCT RESOURCES
      for (const req of requiredResources) {
          let needed = req.amount;
          for (let i = 0; i < newInventory.length; i++) {
              if (needed <= 0) break;
              const item = newInventory[i];
              if (item.resourceConfig?.isResourceContainer && item.resourceConfig.resourceName === req.resourceName) {
                  const available = item.resourceConfig.resourceAmount || 0;
                  if (available > needed) {
                      newInventory[i] = {
                          ...item,
                          resourceConfig: { ...item.resourceConfig, resourceAmount: available - needed }
                      };
                      needed = 0;
                  } else {
                      needed -= available;
                      newInventory[i] = {
                          ...item,
                          resourceConfig: { ...item.resourceConfig, resourceAmount: 0 } // Mark empty
                      };
                  }
              }
          }
          if (needed > 0) {
              resourcesConsumed = false;
              break;
          }
      }

      if (!resourcesConsumed) {
          setNotification({ id: 'craft-fail', type: 'error', message: 'Chyba při spotřebě surovin.' });
          return;
      }

      const itemsToRemove = newInventory.filter(i => i.resourceConfig?.isResourceContainer && (i.resourceConfig?.resourceAmount || 0) <= 0);
      const itemsToUpdate = newInventory.filter(i => i.resourceConfig?.isResourceContainer && (i.resourceConfig?.resourceAmount || 0) > 0);
      const otherItems = newInventory.filter(i => !i.resourceConfig?.isResourceContainer);
      const finalInventory = [...otherItems, ...itemsToUpdate];

      // 3. ADD NEW ITEM (The Crafted Result)
      const newItem = { 
          ...recipeItem, 
          id: `CRAFTED-${Math.random().toString(36).substr(2, 6).toUpperCase()}` 
      };
      finalInventory.push(newItem);

      // 4. PERSIST CHANGES (Using activeInventoryEmail)
      if (isGuest || !activeInventoryEmail) {
          setInventory(finalInventory);
          localStorage.setItem(`nexus_inv_${activeInventoryEmail || 'guest'}`, JSON.stringify(finalInventory));
      } else {
          try {
              for (const item of itemsToRemove) await apiService.deleteCard(activeInventoryEmail, item.id);
              for (const item of itemsToUpdate) await apiService.saveCard(activeInventoryEmail, item);
              await apiService.saveCard(activeInventoryEmail, newItem);
              
              const serverInv = await apiService.getInventory(activeInventoryEmail);
              setInventory(serverInv);
              localStorage.setItem(`nexus_inv_${activeInventoryEmail}`, JSON.stringify(serverInv));
          } catch (e) {
              setNotification({ id: 'craft-sync-err', type: 'error', message: 'Chyba synchronizace výroby.' });
              setInventory(finalInventory);
          }
      }

      addToLog(`Vyrobeno: ${newItem.title}`);
      setNotification({ id: 'craft-success', type: 'success', message: `${newItem.title} úspěšně vyroben!` });
  };

  const handleRefreshDatabase = async () => {
    if (isGuest || !activeInventoryEmail) return;
    setIsRefreshing(true);
    try {
      // 1. Refresh Inventory (Active Context)
      const inv = await apiService.getInventory(activeInventoryEmail);
      setInventory(inv);
      localStorage.setItem(`nexus_inv_${activeInventoryEmail}`, JSON.stringify(inv));
      
      // 2. Always Refresh Master Catalog from Admin
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

  const handleExitToMenu = async () => {
    if (roomState.id && roomState.nickname) {
        try { await apiService.leaveRoom(roomState.id, roomState.nickname); } catch(e) {}
    }
    setRoomState(prev => ({ ...prev, isInRoom: false, id: '', isNicknameSet: false }));
    localStorage.removeItem('nexus_last_room_id');
    localStorage.removeItem('nexus_is_in_room');
    setIsSoloMode(false);
    localStorage.setItem('nexus_solo_mode', 'false');
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

    if (playerFuel <= 0 && !code.startsWith('friend:')) {
        setNotification({ id: 'no-fuel', type: 'error', message: "NEDOSTATEK PALIVA: Loď nemůže manévrovat (skenovat)." });
        playSound('error');
        vibrate([200, 200, 200]);
        return;
    }

    setIsAIThinking(true);
    vibrate(50);
    playSound('scan');
    
    // --- PLANET SCANNING LOGIC START ---
    // Check if this code corresponds to a planet quest in user's inventory
    const planetQuest = inventory.find(i => i.title === code || (masterCatalog.find(mc => mc.id.toLowerCase() === code.toLowerCase())?.title === i.title && i.type === GameEventType.PLANET));
    
    // Better logic: Match by original title or ID if available
    // Since quest ID is different, we must match against the Master Catalog to see if `code` is a planet ID
    const masterPlanet = masterCatalog.find(mc => mc.id.toLowerCase() === code.toLowerCase() && mc.type === GameEventType.PLANET);
    
    if (masterPlanet) {
        // Player scanned a planet card. Do they have the quest?
        const activeQuest = inventory.find(i => i.title === masterPlanet.title && i.type === GameEventType.PLANET);
        
        if (activeQuest) {
            // YES: Open Spaceship View
            setIsAIThinking(false);
            setActiveTab(Tab.SPACESHIP);
            addToLog(`Cíl zaměřen: ${activeQuest.title}`);
            playSound('success');
            // We can't easily auto-select inside SpaceshipView without context, 
            // but we could store a "highlightedPlanet" state if we wanted.
            // For now, redirecting to ship is enough as per request.
            return;
        } else {
            // NO: Show Unknown Signal error
            setIsAIThinking(false);
            setNotification({ id: 'unknown-planet', type: 'error', message: 'Neznámý signál. Stáhněte souřadnice na stanici.' });
            playSound('error');
            return;
        }
    }
    // --- PLANET SCANNING LOGIC END ---

    // Check Local Inventory first (Active Context)
    const localItem = inventory.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (localItem) { 
        handleFoundItem(localItem, 'scanner'); 
        return; 
    }
    
    // Check Master Catalog (Always from Admin)
    const vaultItem = masterCatalog.find(i => i.id.toLowerCase() === code.toLowerCase());
    if (vaultItem) { 
        handleFoundItem(vaultItem, 'scanner');
        return; 
    }

    // Check Cloud (Master DB)
    if (!isGuest && navigator.onLine) {
        try {
            const cloudItem = await apiService.getCardById(ADMIN_EMAIL, code);
            if (cloudItem) {
                handleFoundItem(cloudItem, 'scanner');
                return;
            }
        } catch (e) {}
    }

    setIsAIThinking(false);
    setNotification({ id: 'not-found-' + Date.now(), type: 'error', message: 'ID karty nenalezeno.' });
    playSound('error');
  };

  const handleFoundItem = (item: GameEvent, source: 'scanner' | 'inventory' | null = null) => {
      if (source === 'scanner') {
          handleFuelChange(-5);
          addToLog(`Manévr lodi: -5% Paliva`);
      }

      const adjusted = getAdjustedItem(item, isNight, playerClass);
      
      if (adjusted.type === GameEventType.SPACE_STATION && source === 'scanner') {
          setIsAIThinking(false);
          setIsDocking(true);
          setCurrentEvent(adjusted);
          setEventSource(source);
          return;
      }

      setCurrentEvent(adjusted);
      if (source) setEventSource(source);
      addToLog(source === 'scanner' ? `Skenováno: ${adjusted.title}` : `Zobrazeno: ${adjusted.title}`);
      setIsAIThinking(false);
  };

  const handleDockingComplete = () => {
      setIsDocking(false);
      if (currentEvent && currentEvent.type === GameEventType.SPACE_STATION) {
          setActiveStation(currentEvent);
          setCurrentEvent(null);
          addToLog(`Dokováno: ${currentEvent.title}`);
          playSound('success');
      }
  };

  const handleClaimStationRewards = (station: GameEvent) => {
      if (station.stationConfig?.refillO2) {
          setPlayerOxygen(100);
          localStorage.setItem('nexus_player_oxygen', "100");
      }
      
      const fuelAmount = station.stationConfig?.fuelReward ? Number(station.stationConfig.fuelReward) : 0;
      if (fuelAmount > 0) {
          handleFuelChange(fuelAmount);
          addToLog(`Tankování: +${fuelAmount} Jednotek`);
      }
      
      if (station.stationConfig?.repairAmount) {
          handleHpChange(station.stationConfig.repairAmount);
      }

      playSound('success');
      setNotification({ id: 'station-rewards', type: 'success', message: 'Servisní úkony dokončeny.' });
      setScreenFlash('green');
      setTimeout(() => setScreenFlash(null), 500);
  };

  const handleResolveDilemma = (option: DilemmaOption, result: 'success' | 'fail') => {
      setActionTakenDuringEvent(true);
      
      if (result === 'success') {
          if (option.rewards) {
              option.rewards.forEach(rew => {
                  if (rew.type === 'HP') handleHpChange(rew.value);
                  if (rew.type === 'GOLD') handleGoldChange(rew.value);
                  if (rew.type === 'MANA') handleManaChange(rew.value);
              });
          }
          /* @ts-ignore */
          if (option.effectType === 'hp') handleHpChange(option.effectValue);
          /* @ts-ignore */
          else if (option.effectType === 'gold') handleGoldChange(option.effectValue);
          
          addToLog(`Dilema: ${option.label} (ÚSPĚCH)`);
      } else {
          if (option.failDamage) {
              handleHpChange(-Math.abs(option.failDamage));
          }
          addToLog(`Dilema: ${option.label} (SELHÁNÍ)`);
      }
  };

  const handleUseEvent = async (event: GameEvent) => {
      if (isBlocked) {
          setNotification({ id: 'block', type: 'error', message: "NEMŮŽEŠ POUŽÍT KARTU: Nejseš na tahu!" });
          playSound('error');
          return;
      }

      if (event.type === GameEventType.SPACE_STATION) {
          setActiveStation(event);
          setCurrentEvent(null);
          addToLog(`Dokováno: ${event.title}`);
          playSound('success');
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
              else if (['FUEL', 'PALIVO'].some(k => label.includes(k))) handleFuelChange(val);
          }); 
      }
      if (!inventory.some(i => i.id === event.id)) { setCurrentEvent(null); return; }
      if (event.isConsumable) {
          await handleDeleteEvent(event.id);
          addToLog(`Spotřebováno z Batohu: ${event.title}`);
          setNotification({ id: 'use', type: 'success', message: `${event.title} použito!` });
          setScreenFlash('green');
          setTimeout(() => setScreenFlash(null), 500);
      } else { 
          setScreenFlash('green'); 
          playSound('success'); 
          vibrate([50, 50]); 
          setTimeout(() => setScreenFlash(null), 500); 
          addToLog(`Aktivováno: ${event.title}`);
          setNotification({ id: 'act', type: 'info', message: `${event.title} aktivováno.` });
      }
  };

  const handleLeaveStation = () => {
    setActiveStation(null);
    setNotification({ id: 'undock', type: 'info', message: 'Odpojeno od stanice.' });
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
      isRefreshing, notification, setNotification, showEndTurnPrompt, 
      playerHp, playerMana, playerFuel, playerGold, playerArmor, playerLuck, playerOxygen, playerClass,
      roomState, isSoloMode, giftTarget, setGiftTarget, isScannerPaused: !!currentEvent || showTurnAlert || showRoundEndAlert || isDocking || !!activeStation,
      isAIThinking, showTurnAlert, showRoundEndAlert, handleAcknowledgeRound,
      isMyTurn, isBlocked, handleStartGame,
      isDocking, handleDockingComplete,
      activeStation, handleLeaveStation, handleClaimStationRewards,
      masterCatalog,
      handleLogin: (email: string) => { localStorage.setItem('nexus_current_user', email); setUserEmail(email); if (email !== 'guest') setIsServerReady(false); },
      handleLogout: () => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); },
      handleScanCode, 
      handleSaveEvent, // Updated signature allows passing target email
      handleDeleteEvent, handleUseEvent, handleRefreshDatabase, handleGameSetup, handleLeaveRoom, handleExitToMenu,
      handleResolveDilemma,
      handleEndTurn, handleSendMessage, closeEvent, handleHpChange, handleManaChange, handleGoldChange,
      handleOpenInventoryItem: (item: GameEvent) => { 
          if (isAdmin && !isTestMode) { 
              setEditingEvent(item); 
              setActiveTab(Tab.GENERATOR); 
          } else { 
              setEventSource('inventory'); 
              setCurrentEvent(item); 
          } 
      },
      getAdjustedItem, handleSwapItems, soundEnabled, vibrationEnabled, 
      handleToggleSound: () => { toggleSoundSystem(!soundEnabled); setSoundEnabled(!soundEnabled); }, 
      handleToggleVibration: () => { toggleVibrationSystem(!vibrationEnabled); setVibrationEnabled(!vibrationEnabled); },
      handleInspectItem,
      handleCraftItem,
      scanLog,
      isTestMode, // EXPORTED
      toggleTestMode // EXPORTED
  };
};
