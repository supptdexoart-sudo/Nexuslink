
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameEvent, GameEventType, DilemmaOption, RaidState, PlayerClass } from '../types';
import * as apiService from '../services/apiService';
import { playSound, vibrate } from '../services/soundService';
import { Message } from '../components/Room';
import { ToastData, ToastType } from '../components/Toast';

// --- CONFIGURATION ---
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const MAX_PLAYER_HP = 100;
const INITIAL_GOLD = 100;

export enum Tab {
  SCANNER = 'scanner',
  INVENTORY = 'inventory',
  GENERATOR = 'generator',
  ROOM = 'room',
  SETTINGS = 'settings'
}

type SyncStatus = 'synced' | 'offline' | 'restoring' | 'error' | 'guest';

// Helper function moved here
const isNightTime = (): boolean => {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 6;
};

export const useGameLogic = () => {
  // --- STATE ---
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem('nexus_current_user'));
  const isAdmin = userEmail === ADMIN_EMAIL;
  const isGuest = userEmail === 'guest';

  const [isServerReady, setIsServerReady] = useState(false);
  const [isNight, setIsNight] = useState(isNightTime());
  const [adminNightOverride, setAdminNightOverride] = useState<boolean | null>(null);
  const [showTimeInfo, setShowTimeInfo] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(() => (userEmail === ADMIN_EMAIL ? Tab.GENERATOR : Tab.SCANNER));

  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<GameEvent | null>(null);
  const [activeMerchant, setActiveMerchant] = useState<GameEvent | null>(null);
  const [instantEffectValue, setInstantEffectValue] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState<'red' | 'green' | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<GameEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [initialSyncComplete, setInitialSyncComplete] = useState(false);
  
  const [notification, setNotification] = useState<ToastData | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [pendingGiftItem, setPendingGiftItem] = useState<GameEvent | null>(null);
  const [giftTransferStatus, setGiftTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const [activeRaid, setActiveRaid] = useState<RaidState | null>(null);
  const [isRaidScreenVisible, setIsRaidScreenVisible] = useState(false);
  const [showRaidIntro, setShowRaidIntro] = useState(false);
  const prevRaidActiveRef = useRef<boolean>(false);

  const [playerHp, setPlayerHp] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_player_hp');
    return saved ? parseInt(saved, 10) : MAX_PLAYER_HP;
  });

  const [playerGold, setPlayerGold] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_player_gold');
    return saved ? parseInt(saved, 10) : INITIAL_GOLD;
  });

  const [playerClass, setPlayerClass] = useState<PlayerClass | null>(() => {
      const saved = localStorage.getItem(`nexus_class_${userEmail || 'guest'}`);
      return saved ? (saved as PlayerClass) : null;
  });

  const [roomState, setRoomState] = useState<{
      id: string;
      isInRoom: boolean;
      messages: Message[];
      nickname: string;
      isNicknameSet: boolean;
      members: {name: string, hp: number}[]; 
  }>({
      id: '',
      isInRoom: false,
      messages: [],
      nickname: '',
      isNicknameSet: false,
      members: []
  });
  
  const [isSoloMode, setIsSoloMode] = useState(false);
  
  // SCANNER STATE
  const [scanMode, setScanMode] = useState<'item' | 'friend'>('item');
  const [friendRequestStatus, setFriendRequestStatus] = useState<string | null>(null);
  const [isAdminPreview, setIsAdminPreview] = useState(false);

  // REFS
  const roomPollInterval = useRef<number | null>(null);
  const statusUpdateInterval = useRef<number | null>(null);
  const heartbeatInterval = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // --- UTILS ---
  const getAdjustedItem = useCallback((item: GameEvent, isNightMode: boolean, pClass: PlayerClass | null): GameEvent => {
      let newItem = { ...item };
      if (isNightMode && item.timeVariant && item.timeVariant.enabled) {
          newItem = {
              ...newItem,
              title: item.timeVariant.nightTitle || item.title,
              description: item.timeVariant.nightDescription || item.description,
              type: item.timeVariant.nightType || item.type,
              stats: item.timeVariant.nightStats && item.timeVariant.nightStats.length > 0 
                     ? item.timeVariant.nightStats 
                     : item.stats
          };
      }
      if (pClass && item.classVariants && item.classVariants[pClass]) {
          const variant = item.classVariants[pClass];
          if (variant) {
              if (variant.overrideTitle) newItem.title = variant.overrideTitle;
              if (variant.overrideDescription) newItem.description = variant.overrideDescription;
              if (variant.overrideType) newItem.type = variant.overrideType;
              if (variant.bonusStats && variant.bonusStats.length > 0) {
                  newItem.stats = variant.bonusStats;
              }
          }
      }
      return newItem;
  }, []);

  const showNotification = (message: string, type: ToastType = 'info') => {
      setNotification({ id: Date.now().toString(), message, type });
      if (type === 'gift') playSound('success');
      else if (type === 'message') playSound('message');
      else playSound('click');
  };

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('nexus_player_hp', playerHp.toString()); }, [playerHp]);
  useEffect(() => { localStorage.setItem('nexus_player_gold', playerGold.toString()); }, [playerGold]);
  useEffect(() => { if (playerClass) localStorage.setItem(`nexus_class_${userEmail || 'guest'}`, playerClass); }, [playerClass, userEmail]);
  
  useEffect(() => {
      const timer = setInterval(() => { setIsNight(isNightTime()); }, 60000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (isAdmin && (activeTab === Tab.SCANNER || activeTab === Tab.ROOM)) {
          setActiveTab(Tab.GENERATOR);
      }
  }, [isAdmin, activeTab]);

  useEffect(() => {
      if (isGuest) { setIsServerReady(true); }
  }, [isGuest]);

  useEffect(() => {
    if (userEmail && !isGuest && !isAdmin) {
         const localNick = localStorage.getItem(`nexus_nickname_${userEmail}`);
         if (localNick) setRoomState(prev => ({ ...prev, nickname: localNick, isNicknameSet: true }));
         apiService.getNickname(userEmail).then(cloudNick => {
             if(cloudNick && cloudNick !== localNick) {
                 setRoomState(prev => ({ ...prev, nickname: cloudNick, isNicknameSet: true }));
                 localStorage.setItem(`nexus_nickname_${userEmail}`, cloudNick);
             }
         });
    } else if (isGuest) {
         const localNick = localStorage.getItem(`nexus_nickname_guest`);
         if (localNick) setRoomState(prev => ({ ...prev, nickname: localNick, isNicknameSet: true }));
    }
  }, [userEmail, isGuest, isAdmin]);

  // --- INVENTORY LOGIC ---
  const saveToLocalBackup = (email: string, data: GameEvent[]) => {
    try { localStorage.setItem(`nexus_inventory_backup_${email}`, JSON.stringify(data)); } catch (e) {}
  };
  const loadFromLocalBackup = (email: string): GameEvent[] => {
    try { return JSON.parse(localStorage.getItem(`nexus_inventory_backup_${email}`) || '[]'); } catch (e) { return []; }
  };

  const loadInventory = useCallback(async () => {
    if (userEmail) {
      setLoadingInventory(true);
      let localData = loadFromLocalBackup(userEmail);
      if (isGuest) { setInventory(localData); setSyncStatus('guest'); setLoadingInventory(false); return; }

      try {
        let cloudData: GameEvent[] = [], adminData: GameEvent[] = [];
        if (isAdmin) cloudData = await apiService.getInventory(userEmail);
        else [cloudData, adminData] = await Promise.all([apiService.getInventory(userEmail), apiService.getInventory(ADMIN_EMAIL)]);

        if (!isAdmin && adminData.length > 0) {
            const masterMap = new Map(adminData.map(item => [item.id, item]));
            localData = localData.map(item => { const masterVersion = masterMap.get(item.id); return masterVersion ? { ...masterVersion } : item; });
            localData = localData.filter(item => masterMap.has(item.id));
        }
        
        let finalInventory: GameEvent[] = [];
        if (!initialSyncComplete && cloudData.length === 0 && localData.length > 0) {
             setSyncStatus('restoring');
             await apiService.restoreInventory(userEmail, localData);
             finalInventory = localData;
             setInitialSyncComplete(true);
        } else {
             if (!isAdmin && adminData.length > 0) {
                const masterMap = new Map(adminData.map(item => [item.id, item]));
                cloudData = cloudData.map(item => { const master = masterMap.get(item.id); if (!master) return null; return {...master}; }).filter((item): item is GameEvent => item !== null);
             }
             finalInventory = cloudData;
             setInitialSyncComplete(true);
        }
        setInventory(finalInventory);
        saveToLocalBackup(userEmail, finalInventory);
        setSyncStatus('synced');
      } catch (e) { setInventory(localData); setSyncStatus('offline'); } finally { setLoadingInventory(false); }
    } else { setInventory([]); }
  }, [userEmail, isAdmin, isGuest, initialSyncComplete]);

  useEffect(() => {
    if (activeTab === Tab.INVENTORY && !isGuest && userEmail) loadInventory();
  }, [activeTab, isGuest, userEmail, loadInventory]);

  // --- HEARTBEAT ---
  useEffect(() => {
      if (isGuest || !userEmail) {
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
          return;
      }
      if (!isServerReady) return;

      const performHeartbeat = async () => {
          const isAlive = await apiService.checkHealth();
          if (!isAlive) setSyncStatus('offline');
          else setSyncStatus(prev => (prev === 'offline' || prev === 'error') ? 'synced' : prev);
      };
      
      performHeartbeat(); 
      heartbeatInterval.current = window.setInterval(performHeartbeat, 15000);
      return () => { if (heartbeatInterval.current) clearInterval(heartbeatInterval.current); };
  }, [userEmail, isGuest, isServerReady]);

  // --- POLLING LOGIC ---
  const clearIntervals = () => {
      if (roomPollInterval.current) { clearInterval(roomPollInterval.current); roomPollInterval.current = null; }
      if (statusUpdateInterval.current) { clearInterval(statusUpdateInterval.current); statusUpdateInterval.current = null; }
  };

  const fetchRoomData = useCallback(async (roomId: string) => {
      if (syncStatus === 'offline') return;
      try {
          const [msgs, members, raidStatus] = await Promise.all([
              apiService.getRoomMessages(roomId),
              apiService.getRoomMembers(roomId),
              apiService.getRaidState(roomId) 
          ]);

          if (raidStatus && raidStatus.isActive) {
               setActiveRaid(raidStatus);
               if (!prevRaidActiveRef.current) {
                   setShowRaidIntro(true);
                   setCurrentEvent(null); 
                   setTimeout(() => {
                       setShowRaidIntro(false);
                       setIsRaidScreenVisible(true);
                   }, 4000);
               } else {
                   if (!showRaidIntro && !isRaidScreenVisible && !isAdmin) {
                       setIsRaidScreenVisible(true);
                   }
               }
               prevRaidActiveRef.current = true;
          } else {
               setActiveRaid(null);
               setIsRaidScreenVisible(false);
               prevRaidActiveRef.current = false;
          }

          setRoomState(prev => {
               let newMessages = prev.messages;
               if (msgs && msgs.length > 0) {
                    const lastPrev = prev.messages[prev.messages.length - 1];
                    const lastNew = msgs[msgs.length - 1];
                    if (!lastPrev || (lastNew && lastNew.id !== lastPrev.id) || prev.messages.length !== msgs.length) {
                        newMessages = msgs;
                    }
               }
               const newMembers = members || prev.members;
               return { ...prev, messages: newMessages, members: newMembers };
          });
      } catch (e) { }
  }, [syncStatus, isRaidScreenVisible, isAdmin, showRaidIntro]);

  useEffect(() => {
      if (isAdmin) { clearIntervals(); return; }
      if (roomState.isInRoom && roomState.id) {
          fetchRoomData(roomState.id);
          
          if (!roomPollInterval.current) {
               roomPollInterval.current = window.setInterval(() => fetchRoomData(roomState.id), 2000);
          }
          if (!statusUpdateInterval.current) {
              statusUpdateInterval.current = window.setInterval(() => {
                 if (roomState.nickname) apiService.updatePlayerStatus(roomState.id, roomState.nickname, playerHp);
              }, 5000); 
          }
      } else { clearIntervals(); }
      return () => clearIntervals();
  }, [roomState.isInRoom, roomState.id, roomState.nickname, playerHp, isAdmin, fetchRoomData]);

  // --- NOTIFICATIONS & MESSAGES ---
  useEffect(() => {
      if (roomState.messages.length === 0) return;
      const lastMsg = roomState.messages[roomState.messages.length - 1];
      if (lastMsg.id === lastMessageIdRef.current) return;
      lastMessageIdRef.current = lastMsg.id;

      const isMyMessage = lastMsg.sender === roomState.nickname;
      const isSystem = lastMsg.isSystem;
      const isRecent = (Date.now() - lastMsg.timestamp) < 5000;

      if (!isMyMessage && !isSystem && isRecent) {
          if (lastMsg.text.includes('|||')) return;
          showNotification(`${lastMsg.sender}: ${lastMsg.text}`, 'message');
          if (activeTab !== Tab.ROOM) {
              setUnreadMessagesCount(prev => prev + 1);
          }
      }
  }, [roomState.messages, roomState.nickname, activeTab]);

  // --- ACTIONS ---
  const handleRemoveLocalItem = (id: string) => {
      setInventory(prev => {
          const updated = prev.filter(i => i.id !== id);
          if (userEmail) saveToLocalBackup(userEmail, updated);
          return updated;
      });
  };

  const performDelete = async (idToDelete: string): Promise<boolean> => {
      if (!userEmail) return false;
      handleRemoveLocalItem(idToDelete);
      if (isGuest) return true;
      try {
          await apiService.deleteCard(userEmail, idToDelete);
          setSyncStatus('synced');
          return true;
      } catch (apiErr) {
          setSyncStatus('offline');
          return true;
      }
  };

  const handleLogin = (email: string) => { 
      localStorage.setItem('nexus_current_user', email); 
      setUserEmail(email); 
      playSound('success'); 
      if (email !== 'guest') setIsServerReady(false);
  };

  const handleLeaveRoom = async () => {
      if (roomState.id && roomState.nickname && syncStatus !== 'offline') await apiService.leaveRoom(roomState.id, roomState.nickname);
      clearIntervals();
      setRoomState(prev => ({ ...prev, id: '', isInRoom: false, messages: [], members: [] }));
      setIsSoloMode(false); 
      setGiftTarget(null);
      playSound('click');
  };

  const handleLogout = () => {
    handleLeaveRoom();
    localStorage.removeItem('nexus_current_user');
    setUserEmail(null);
    setInventory([]);
    setInitialSyncComplete(false); 
    setAdminNightOverride(null); 
    setPlayerClass(null);
    setActiveTab(isAdmin ? Tab.GENERATOR : Tab.SCANNER);
    playSound('click');
    if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  };

  const handleHpChange = (amount: number) => {
      setPlayerHp(prev => { const newVal = Math.max(0, Math.min(MAX_PLAYER_HP, prev + amount)); return newVal; });
      if (amount < 0) { setScreenFlash('red'); playSound('damage'); vibrate([200]); setTimeout(() => setScreenFlash(null), 500); } 
      else if (amount > 0) { setScreenFlash('green'); playSound('heal'); setTimeout(() => setScreenFlash(null), 500); }
  };

  const handleGoldChange = (amount: number) => { setPlayerGold(prev => Math.max(0, prev + amount)); if (amount > 0) playSound('success'); else playSound('click'); };

  const handleSaveEvent = async (event: GameEvent) => {
    if (!userEmail) throw new Error("Not logged in");
    const isImporting = isAdminPreview || activeMerchant;
    try {
      setInventory(prev => {
          const exists = prev.some(i => i.id === event.id);
          const updated = exists ? prev.map(i => i.id === event.id ? event : i) : [...prev, event];
          if (userEmail) saveToLocalBackup(userEmail, updated);
          return updated;
      });
      if (isImporting) { setIsAdminPreview(false); if (!activeMerchant) setCurrentEvent(event); }
      if (isGuest) return;
      try {
        if (isImporting) await apiService.saveCard(userEmail, event);
        else { const existingItem = await apiService.getCardById(userEmail, event.id); if (existingItem) await apiService.updateCard(userEmail, event.id, event); else await apiService.saveCard(userEmail, event); }
        setSyncStatus('synced'); playSound('success');
      } catch (apiError) { setSyncStatus('offline'); }
    } catch (error) { setSyncStatus('error'); throw error; }
  };

  const handleDeleteEvent = async (id: string) => {
    setCurrentEvent(null);
    try { await performDelete(id); } catch (error) {}
  };

  const handleUseEvent = async (event: GameEvent) => {
      if (event.stats) { event.stats.forEach(stat => { const val = parseInt(String(stat.value)); if (isNaN(val)) return; const label = stat.label.toUpperCase(); if (['HP', 'ZDRAVÍ', 'HEALTH', 'ŽIVOTY', 'HEAL', 'LÉČENÍ'].some(k => label.includes(k))) handleHpChange(val); else if (['DMG', 'POŠKOZENÍ', 'POSKOZENI', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => label.includes(k))) handleHpChange(-Math.abs(val)); else if (['GOLD', 'KREDITY', 'PENÍZE', 'MINCE'].some(k => label.includes(k))) handleGoldChange(val); }); }
      if (isAdminPreview || !inventory.some(i => i.id === event.id)) { setCurrentEvent(null); setIsAdminPreview(false); setInstantEffectValue(null); if (!event.stats?.some(s => ['HP', 'ZDRAVÍ', 'HEALTH'].some(k => s.label.toUpperCase().includes(k)))) { setScreenFlash('green'); playSound('success'); setTimeout(() => setScreenFlash(null), 500); } return; }
      if (event.isConsumable) await handleDeleteEvent(event.id); else { setScreenFlash('green'); playSound('success'); vibrate([50, 50]); setTimeout(() => setScreenFlash(null), 500); alert(`Efekt předmětu "${event.title}" aktivován! Předmět zůstává v inventáři.`); }
  };

  const handleResolveDilemma = (option: DilemmaOption) => {
      if (option.effectType === 'hp') handleHpChange(option.effectValue);
      else if (option.effectType === 'gold') handleGoldChange(option.effectValue);
      playSound('click');
  };

  const handleScanCode = async (code: string) => {
    if (scanMode === 'friend') {
        if (!userEmail || isGuest) { alert("Pro přidání přátel se musíte přihlásit."); setScanMode('item'); return; }
        if (code.startsWith('friend:')) {
            const friendEmail = code.replace('friend:', '');
            if (friendEmail.toLowerCase() === userEmail.toLowerCase()) { setFriendRequestStatus("Nemůžete si přidat sami sebe!"); playSound('error'); setTimeout(() => setFriendRequestStatus(null), 2000); return; }
            try { await apiService.sendFriendRequest(userEmail, friendEmail); setFriendRequestStatus(`Žádost odeslána uživateli ${friendEmail}`); playSound('success'); setTimeout(() => { setFriendRequestStatus(null); setScanMode('item'); setActiveTab(Tab.ROOM); }, 2000);
            } catch (e: any) { setFriendRequestStatus(e.message || "Chyba při odesílání žádosti"); playSound('error'); setTimeout(() => setFriendRequestStatus(null), 2000); }
        } else { setFriendRequestStatus("Neplatný QR kód přítele."); playSound('error'); setTimeout(() => setFriendRequestStatus(null), 2000); }
        return;
    }
    if (!userEmail) { alert("Pro skenování kódů se prosím přihlašte."); return; }
    if (scanError === code) return;
    try {
      const localItem = inventory.find(i => i.id === code);
      if (localItem) { 
          setScanError(null); 
          const itemToDisplay = getAdjustedItem(localItem, isNight, playerClass);
          setCurrentEvent(itemToDisplay); 
          setIsAdminPreview(false); 
          setInstantEffectValue(null); 
          return; 
      }
      if (isGuest) { setScanError(code); playSound('error'); return; }
      
      let foundItem = await apiService.getCardById(userEmail, code);
      if (foundItem) { 
          setScanError(null); 
          const updatedInventory = [...inventory, foundItem]; 
          setInventory(updatedInventory); 
          saveToLocalBackup(userEmail, updatedInventory); 
          const itemToDisplay = getAdjustedItem(foundItem, isNight, playerClass);
          setCurrentEvent(itemToDisplay); 
          setIsAdminPreview(false); 
          setInstantEffectValue(null); 
          return; 
      }
      
      if (userEmail !== ADMIN_EMAIL) {
        try {
           let adminItem = await apiService.getCardById(ADMIN_EMAIL, code);
           if (adminItem) {
             setScanError(null);
             adminItem = getAdjustedItem(adminItem, isNight, playerClass);
             if (adminItem.type === GameEventType.BOSS && roomState.isInRoom) { setCurrentEvent(adminItem); setIsAdminPreview(true); return; }
             if (adminItem.type === GameEventType.ENCOUNTER && roomState.isInRoom) { setCurrentEvent(adminItem); setIsAdminPreview(true); return; }
             if (adminItem.type === GameEventType.MERCHANT) { setActiveMerchant(adminItem); playSound('open'); return; }
             if (adminItem.type === GameEventType.TRAP) {
                 let isSimpleTrap = adminItem.type === GameEventType.TRAP;
                 let effectVal = 0;
                 if (isSimpleTrap && adminItem.stats) {
                     const dmgStat = adminItem.stats.find(s => ['DMG', 'POŠKOZENÍ', 'ÚTOK'].includes(s.label.toUpperCase()));
                     const hpStat = adminItem.stats.find(s => ['HP', 'ZDRAVÍ', 'HEALTH'].includes(s.label.toUpperCase()));
                     if (dmgStat) effectVal = -Math.abs(parseInt(String(dmgStat.value)));
                     else if (hpStat) effectVal = parseInt(String(hpStat.value));
                 }
                 if (isSimpleTrap && effectVal !== 0) { setInstantEffectValue(effectVal); handleHpChange(effectVal); } else { setInstantEffectValue(null); }
             } else { setInstantEffectValue(null); }
             setCurrentEvent(adminItem); setIsAdminPreview(true); return;
           }
        } catch (err) { }
      }
      setScanError(code); playSound('error');
    } catch (error) { setScanError(code); playSound('error'); }
  };

  const handleStartRaid = async (bossItem: GameEvent) => {
      if (!roomState.isInRoom || !roomState.id) { alert("Pro zahájení Raidu musíte být v místnosti!"); return; }
      let baseHp = 1000; 
      if (bossItem.stats) {
          const hpStat = bossItem.stats.find(s => ['HP', 'ZDRAVÍ', 'HEALTH'].includes(s.label.toUpperCase()));
          if (hpStat) baseHp = parseInt(String(hpStat.value));
      }
      const playerCount = Math.max(1, roomState.members.length);
      const scaledHp = baseHp * playerCount * 3;
      setCurrentEvent(null); 
      await apiService.startRaid(roomState.id, bossItem.title, bossItem.id, scaledHp);
  };

  const handleJoinRoom = async (roomId: string, nick: string, password?: string) => {
      try {
          await apiService.joinRoom(roomId, nick, playerHp, password); 
          setRoomState(prev => ({ ...prev, id: roomId, isInRoom: true, messages: [] }));
          playSound('success');
      } catch (e: any) { 
          playSound('error'); 
          throw e;
      }
  };

  const handleGameSetup = async (nick: string, pClass: PlayerClass, action: string | 'create' | 'solo', password?: string) => {
      if (userEmail && !isGuest) {
          localStorage.setItem(`nexus_nickname_${userEmail}`, nick);
          apiService.saveNickname(userEmail, nick);
      } else if (isGuest) localStorage.setItem(`nexus_nickname_guest`, nick);
      
      setRoomState(prev => ({ ...prev, nickname: nick, isNicknameSet: true }));
      setPlayerClass(pClass);

      if (action === 'solo') { setIsSoloMode(true); playSound('success'); return; }
      if (action === 'create') await handleCreateRoom(nick, password); else await handleJoinRoom(action, nick, password);
  };

  const handleCreateRoom = async (nick: string, password?: string) => {
      const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      try {
          await apiService.createRoom(newRoomId, nick, password);
          setRoomState(prev => ({ ...prev, id: newRoomId, isInRoom: true, messages: [] }));
          const sysMsg: Message = { id: 'sys-start', sender: 'SYSTEM', text: `Místnost ${newRoomId} vytvořena.`, timestamp: Date.now(), isSystem: true };
          setRoomState(prev => ({...prev, messages: [sysMsg]}));
          playSound('success');
      } catch (e) { 
          setRoomState(prev => ({ ...prev, id: newRoomId, isInRoom: true, messages: [] })); 
      }
  };

  const handleSendMessage = async (text: string) => {
      if (!roomState.id || !text.trim()) return;
      const tempMsg: Message = { id: Date.now().toString(), sender: roomState.nickname, text, timestamp: Date.now() };
      setRoomState(prev => ({ ...prev, messages: [...prev.messages, tempMsg] }));
      try { await apiService.sendMessage(roomState.id, roomState.nickname, text); } catch (e) { }
  };

  const updateNickname = (nick: string) => { setRoomState(prev => ({ ...prev, nickname: nick, isNicknameSet: true })); };

  // --- GIFT LOGIC ---
  const handleInitiateGift = (targetEmail: string) => {
      setGiftTarget(targetEmail);
      setActiveTab(Tab.INVENTORY);
      playSound('open');
  };

  const cancelGiftMode = () => {
      setGiftTarget(null);
      setPendingGiftItem(null);
      setGiftTransferStatus('idle');
      setActiveTab(Tab.ROOM); 
      playSound('click');
  };

  const handleConfirmGift = async () => {
      if (!userEmail || !giftTarget || !pendingGiftItem) return;
      setGiftTransferStatus('processing');
      const itemToSend = pendingGiftItem;
      try {
          if (roomState.isInRoom && roomState.id) {
              const recipientName = giftTarget.split('@')[0];
              const visibleText = `>> 📦 Odeslal balíček s aktivem [${itemToSend.title}] pro hráče ${recipientName}`;
              const payload = { targetEmail: giftTarget, item: itemToSend, timestamp: Date.now() };
              const fullMessage = `${visibleText}|||${JSON.stringify(payload)}`;
              await apiService.sendMessage(roomState.id, roomState.nickname, fullMessage);
              const tempMsg: Message = { id: Date.now().toString(), sender: roomState.nickname, text: fullMessage, timestamp: Date.now() };
              setRoomState(prev => ({ ...prev, messages: [...prev.messages, tempMsg] }));
          }
          await performDelete(itemToSend.id);
          setGiftTransferStatus('success');
          playSound('success');
          setTimeout(() => {
              setPendingGiftItem(null);
              setGiftTarget(null);
              setGiftTransferStatus('idle');
              setActiveTab(Tab.ROOM);
          }, 1500);
      } catch (e) {
          setGiftTransferStatus('error');
          playSound('error');
      }
  };

  const handleReceiveGift = async (item: GameEvent) => {
      try { setInventory(prev => { const updated = [...prev, item]; if (userEmail) saveToLocalBackup(userEmail, updated); return updated; }); if (!isGuest && userEmail) try { await apiService.saveCard(userEmail, item); } catch (e) {} } catch (e) {}
      showNotification(`Obdržen předmět: ${item.title}`, 'gift');
  };

  const handleBuyItem = async (item: GameEvent) => {
      if (!item.price) return;
      if (playerGold < item.price) { alert("Nedostatek kreditů!"); playSound('error'); return; }
      handleGoldChange(-item.price);
      await handleSaveEvent(item);
      alert(`Zakoupeno: ${item.title}`);
      playSound('success');
  };

  const initiateFriendScan = () => { setScanMode('friend'); setActiveTab(Tab.SCANNER); playSound('click'); };

  const handleTabChange = (tab: Tab) => { 
      setActiveTab(tab); 
      playSound('click'); 
      if (tab === Tab.ROOM) { setUnreadMessagesCount(0); }
  };

  const handleEditEvent = (event: GameEvent) => { setEditingEvent(event); setCurrentEvent(null); setActiveTab(Tab.GENERATOR); };
  const closeEvent = () => { setCurrentEvent(null); setIsAdminPreview(false); setInstantEffectValue(null); playSound('click'); };
  const handleRefreshDatabase = async () => { setIsRefreshing(true); playSound('click'); await loadInventory(); setIsRefreshing(false); };
  const toggleFullscreen = async () => { try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); else if (document.exitFullscreen) await document.exitFullscreen(); } catch (err) {} };

  const isItemInInventory = currentEvent ? inventory.some(i => i.id === currentEvent.id) : false;
  const isScannerPaused = !!currentEvent || !!activeMerchant || !!scanError || !!friendRequestStatus || !!pendingGiftItem || isRaidScreenVisible || showRaidIntro;

  // --- RETURN OBJECT ---
  return {
      userEmail, isAdmin, isGuest, isServerReady, setIsServerReady,
      isNight, adminNightOverride, setAdminNightOverride, showTimeInfo, setShowTimeInfo,
      activeTab, setActiveTab: handleTabChange,
      currentEvent, setCurrentEvent, editingEvent, setEditingEvent,
      activeMerchant, setActiveMerchant, instantEffectValue,
      screenFlash, scanError, inventory, loadingInventory,
      isRefreshing, isFullscreen, syncStatus,
      notification, setNotification, unreadMessagesCount,
      giftTarget, pendingGiftItem, giftTransferStatus, setPendingGiftItem,
      activeRaid, isRaidScreenVisible, setIsRaidScreenVisible, showRaidIntro,
      playerHp, playerGold, playerClass,
      roomState, isSoloMode,
      scanMode, friendRequestStatus, setFriendRequestStatus, isScannerPaused,
      
      // Handlers
      handleLogin, handleLogout, handleGameSetup, handleCreateRoom, handleJoinRoom, handleLeaveRoom,
      handleSendMessage, updateNickname, handleScanCode, handleSaveEvent, handleDeleteEvent, handleUseEvent,
      handleResolveDilemma, handleHpChange, handleGoldChange, handleBuyItem, handleStartRaid,
      handleInitiateGift, handleConfirmGift, cancelGiftMode, handleReceiveGift,
      initiateFriendScan, handleEditEvent, closeEvent, handleRefreshDatabase, toggleFullscreen,
      getAdjustedItem, handleRemoveLocalItem, ADMIN_EMAIL
  };
};
