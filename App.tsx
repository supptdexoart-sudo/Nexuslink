
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScanLine, Database, Settings, AlertTriangle, LogOut, User, RefreshCw, SquarePen, Maximize, Minimize, Cloud, CloudOff, UploadCloud, Mail, WifiOff, Box, Layers, Heart, Coins, Loader2, Zap, Skull, MapPin, Split, Star, Ghost, ShoppingBag, BookOpen, Gift, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Scanner from './components/Scanner';
import EventCard from './components/EventCard';
import MerchantScreen from './components/MerchantScreen';
import LoginScreen from './components/LoginScreen';
import Generator from './components/Generator';
import Room, { Message } from './components/Room';
import GameSetup from './components/GameSetup'; 
import Toast, { ToastData, ToastType } from './components/Toast'; // IMPORT TOAST
import { GameEvent, GameEventType, DilemmaOption } from './types';
import * as apiService from './services/apiService';
import { playSound, vibrate } from './services/soundService';

// --- CONFIGURATION ---
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';
const MAX_PLAYER_HP = 100;
const INITIAL_GOLD = 100;

enum Tab {
  SCANNER = 'scanner',
  INVENTORY = 'inventory',
  GENERATOR = 'generator',
  ROOM = 'room',
  SETTINGS = 'settings'
}

type SyncStatus = 'synced' | 'offline' | 'restoring' | 'error' | 'guest';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button 
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center w-full h-full transition-all duration-300
        ${active ? 'text-neon-blue' : 'text-zinc-600 hover:text-zinc-400'}
      `}
    >
      {active && (
        <motion.div
          layoutId="nav-glow"
          className="absolute -top-1 w-12 h-1 bg-neon-blue rounded-full shadow-[0_0_15px_#00f3ff]"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      <div className={`mb-1 relative z-10 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-display font-bold tracking-widest relative z-10 ${active ? 'opacity-100' : 'opacity-70'}`}>
        {label}
      </span>
    </button>
  );
};

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const getRarityColor = (rarity: string, type: string) => {
    if (type === GameEventType.TRAP || type === GameEventType.ENCOUNTER) return 'border-red-500 shadow-red-900/20';
    if (type === GameEventType.DILEMA) return 'border-neon-purple shadow-neon-purple/20';
    switch (rarity) {
        case 'Legendary': return 'border-yellow-500 shadow-yellow-900/30 bg-yellow-950/10';
        case 'Epic': return 'border-purple-500 shadow-purple-900/30 bg-purple-950/10';
        case 'Rare': return 'border-blue-500 shadow-blue-900/30 bg-blue-950/10';
        default: return 'border-zinc-700 shadow-zinc-900/50 bg-zinc-900/50';
    }
};

const getEventIcon = (type: GameEventType) => {
    switch (type) {
        case GameEventType.ITEM: return <Box className="w-5 h-5" />;
        case GameEventType.TRAP: return <Zap className="w-5 h-5" />;
        case GameEventType.ENCOUNTER: return <Skull className="w-5 h-5" />;
        case GameEventType.LOCATION: return <MapPin className="w-5 h-5" />;
        case GameEventType.DILEMA: return <Split className="w-5 h-5" />;
        case GameEventType.MERCHANT: return <ShoppingBag className="w-5 h-5" />;
        default: return <Star className="w-5 h-5" />;
    }
};

const App: React.FC = () => {
  // Auth State
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('nexus_current_user');
  });

  const isAdmin = userEmail === ADMIN_EMAIL;
  const isGuest = userEmail === 'guest';

  const [activeTab, setActiveTab] = useState<Tab>(() => {
     if (userEmail === ADMIN_EMAIL) return Tab.GENERATOR;
     return Tab.SCANNER;
  });

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
  
  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState<ToastData | null>(null);

  // --- GIFTING STATE ---
  const [giftTarget, setGiftTarget] = useState<string | null>(null);
  const [pendingGiftItem, setPendingGiftItem] = useState<GameEvent | null>(null);
  const [giftTransferStatus, setGiftTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const [playerHp, setPlayerHp] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_player_hp');
    return saved ? parseInt(saved, 10) : MAX_PLAYER_HP;
  });

  const [playerGold, setPlayerGold] = useState<number>(() => {
    const saved = localStorage.getItem('nexus_player_gold');
    return saved ? parseInt(saved, 10) : INITIAL_GOLD;
  });

  useEffect(() => { localStorage.setItem('nexus_player_hp', playerHp.toString()); }, [playerHp]);
  useEffect(() => { localStorage.setItem('nexus_player_gold', playerGold.toString()); }, [playerGold]);

  useEffect(() => {
      if (isAdmin && (activeTab === Tab.SCANNER || activeTab === Tab.ROOM)) {
          setActiveTab(Tab.GENERATOR);
      }
  }, [isAdmin, activeTab]);

  // GLOBAL ROOM STATE
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

  const roomPollInterval = useRef<number | null>(null);
  const statusUpdateInterval = useRef<number | null>(null);
  const heartbeatInterval = useRef<number | null>(null);
  const lastMessageIdRef = useRef<string | null>(null); // Track last message for notifications

  // GLOBAL SCANNER STATE
  const [scanMode, setScanMode] = useState<'item' | 'friend'>('item');
  const [friendRequestStatus, setFriendRequestStatus] = useState<string | null>(null);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const isScannerPaused = !!currentEvent || !!activeMerchant || !!scanError || !!friendRequestStatus || !!pendingGiftItem;

  // --- INITIALIZATION ---
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

  useEffect(() => {
    if (activeTab === Tab.INVENTORY && !isGuest && userEmail) loadInventory();
  }, [activeTab, isGuest, userEmail]);

  useEffect(() => {
      if (isGuest || !userEmail) {
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
          return;
      }
      const performHeartbeat = async () => {
          const isAlive = await apiService.checkHealth();
          if (!isAlive) setSyncStatus('offline');
          else setSyncStatus(prev => (prev === 'offline' || prev === 'error') ? 'synced' : prev);
      };
      performHeartbeat();
      heartbeatInterval.current = window.setInterval(performHeartbeat, 15000);
      return () => { if (heartbeatInterval.current) clearInterval(heartbeatInterval.current); };
  }, [userEmail, isGuest]);

  useEffect(() => {
      if (isAdmin) { clearIntervals(); return; }
      if (roomState.isInRoom && roomState.id) {
          fetchRoomData(roomState.id);
          if (!roomPollInterval.current) roomPollInterval.current = window.setInterval(() => fetchRoomData(roomState.id), 2000);
          if (!statusUpdateInterval.current) statusUpdateInterval.current = window.setInterval(() => {
                 if (roomState.nickname) apiService.updatePlayerStatus(roomState.id, roomState.nickname, playerHp);
          }, 5000); 
      } else { clearIntervals(); }
      return () => clearIntervals();
  }, [roomState.isInRoom, roomState.id, roomState.nickname, playerHp, isAdmin]);

  const clearIntervals = () => {
      if (roomPollInterval.current) { clearInterval(roomPollInterval.current); roomPollInterval.current = null; }
      if (statusUpdateInterval.current) { clearInterval(statusUpdateInterval.current); statusUpdateInterval.current = null; }
  };

  const fetchRoomData = async (roomId: string) => {
      if (syncStatus === 'offline') return;
      try {
          const [msgs, members] = await Promise.all([
              apiService.getRoomMessages(roomId),
              apiService.getRoomMembers(roomId)
          ]);
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
  };

  // --- NOTIFICATION HELPER ---
  const showNotification = (message: string, type: ToastType = 'info') => {
      setNotification({
          id: Date.now().toString(),
          message,
          type
      });
      if (type === 'gift') playSound('success');
      else if (type === 'message') playSound('message');
      else playSound('click');
  };

  // --- BACKGROUND MESSAGE LISTENER ---
  useEffect(() => {
      // If we are IN the room tab, we don't need toasts (user sees the chat)
      if (activeTab === Tab.ROOM) {
          // Update ref so we don't get toasts when leaving room later for old messages
          if (roomState.messages.length > 0) {
              lastMessageIdRef.current = roomState.messages[roomState.messages.length - 1].id;
          }
          return;
      }

      // If no messages, nothing to do
      if (roomState.messages.length === 0) return;

      const lastMsg = roomState.messages[roomState.messages.length - 1];
      
      // If same message as last checked, ignore
      if (lastMsg.id === lastMessageIdRef.current) return;
      lastMessageIdRef.current = lastMsg.id;

      // Don't toast my own messages or system messages or old messages (loaded on init)
      const isMyMessage = lastMsg.sender === roomState.nickname;
      const isSystem = lastMsg.isSystem;
      const isRecent = (Date.now() - lastMsg.timestamp) < 5000; // Only notify if less than 5s old

      if (!isMyMessage && !isSystem && isRecent) {
          // Check if it is a gift (contains hidden JSON separator)
          if (lastMsg.text.includes('|||')) {
              // Gifts are handled by onReceiveGift callback -> triggerToast called there
              return;
          }
          
          showNotification(`${lastMsg.sender}: ${lastMsg.text}`, 'message');
      }

  }, [roomState.messages, activeTab, roomState.nickname]);

  // --- CORE DELETE LOGIC (SHARED) ---
  const performDelete = async (idToDelete: string): Promise<boolean> => {
      if (!userEmail) return false;

      // 1. Local update immediately
      handleRemoveLocalItem(idToDelete);

      if (isGuest) return true;

      // 2. Server update
      try {
          await apiService.deleteCard(userEmail, idToDelete);
          setSyncStatus('synced');
          return true;
      } catch (apiErr) {
          setSyncStatus('offline');
          console.error("Delete failed on server, but removed locally.", apiErr);
          // Return true anyway because local removal is what matters to user
          return true;
      }
  };

  // --- GIFTING LOGIC ---
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
          // 1. Odeslání zprávy do chatu (Příjemce dostane item)
          if (roomState.isInRoom && roomState.id) {
              const recipientName = giftTarget.split('@')[0];
              const visibleText = `>> 📦 Odeslal balíček s aktivem [${itemToSend.title}] pro hráče ${recipientName}`;
              const payload = { targetEmail: giftTarget, item: itemToSend, timestamp: Date.now() };
              const fullMessage = `${visibleText}|||${JSON.stringify(payload)}`;
              
              // Direct send message via API call
              await apiService.sendMessage(roomState.id, roomState.nickname, fullMessage);
              
              // Optimistic update for chat
              const tempMsg: Message = { id: Date.now().toString(), sender: roomState.nickname, text: fullMessage, timestamp: Date.now() };
              setRoomState(prev => ({ ...prev, messages: [...prev.messages, tempMsg] }));
          }

          // 2. MAZÁNÍ - Použití sdílené funkce 'performDelete'
          // Toto je stejná funkce, kterou používá ikona koše.
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

  // --- EXISTING HANDLERS ---
  const handleGameSetup = async (nick: string, action: string | 'create' | 'solo') => {
      if (userEmail && !isGuest) {
          localStorage.setItem(`nexus_nickname_${userEmail}`, nick);
          apiService.saveNickname(userEmail, nick);
      } else if (isGuest) localStorage.setItem(`nexus_nickname_guest`, nick);
      setRoomState(prev => ({ ...prev, nickname: nick, isNicknameSet: true }));

      if (action === 'solo') { setIsSoloMode(true); playSound('success'); return; }
      if (action === 'create') await handleCreateRoom(nick); else await handleJoinRoom(action, nick);
  };

  const handleCreateRoom = async (nick: string) => {
      const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
      try {
          await apiService.createRoom(newRoomId, nick);
          setRoomState(prev => ({ ...prev, id: newRoomId, isInRoom: true, messages: [] }));
          const sysMsg: Message = { id: 'sys-start', sender: 'SYSTEM', text: `Místnost ${newRoomId} vytvořena.`, timestamp: Date.now(), isSystem: true };
          setRoomState(prev => ({...prev, messages: [sysMsg]}));
          playSound('success');
      } catch (e) { setRoomState(prev => ({ ...prev, id: newRoomId, isInRoom: true, messages: [] })); }
  };

  const handleJoinRoom = async (roomId: string, nick: string) => {
      try {
          await apiService.joinRoom(roomId, nick, playerHp); 
          setRoomState(prev => ({ ...prev, id: roomId, isInRoom: true, messages: [] }));
          playSound('success');
      } catch (e) { alert("Místnost nenalezena."); playSound('error'); }
  };

  const handleLeaveRoom = async () => {
      if (roomState.id && roomState.nickname && syncStatus !== 'offline') await apiService.leaveRoom(roomState.id, roomState.nickname);
      clearIntervals();
      setRoomState(prev => ({ ...prev, id: '', isInRoom: false, messages: [], members: [] }));
      setIsSoloMode(false); 
      setGiftTarget(null); // Clear gift mode
      playSound('click');
  };

  const handleSendMessage = async (text: string) => {
      if (!roomState.id || !text.trim()) return;
      const tempMsg: Message = { id: Date.now().toString(), sender: roomState.nickname, text, timestamp: Date.now() };
      setRoomState(prev => ({ ...prev, messages: [...prev.messages, tempMsg] }));
      try { await apiService.sendMessage(roomState.id, roomState.nickname, text); } catch (e) { }
  };

  const updateNickname = (nick: string) => { setRoomState(prev => ({ ...prev, nickname: nick, isNicknameSet: true })); };

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

  useEffect(() => { loadInventory(); }, [loadInventory]);
  
  const handleRemoveLocalItem = (id: string) => {
      console.log("Removing all local items with ID:", id);
      setInventory(prev => {
          const updated = prev.filter(i => i.id !== id);
          if (userEmail) saveToLocalBackup(userEmail, updated);
          return updated;
      });
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else if (document.exitFullscreen) await document.exitFullscreen();
    } catch (err) {}
  };
  const handleRefreshDatabase = async () => { setIsRefreshing(true); playSound('click'); await loadInventory(); setIsRefreshing(false); };
  const handleLogin = (email: string) => { localStorage.setItem('nexus_current_user', email); setUserEmail(email); playSound('success'); };
  const handleLogout = () => {
    handleLeaveRoom();
    localStorage.removeItem('nexus_current_user');
    setUserEmail(null);
    setInventory([]);
    setInitialSyncComplete(false); 
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
  const handleResolveDilemma = (option: DilemmaOption) => {
      if (option.effectType === 'hp') handleHpChange(option.effectValue);
      else if (option.effectType === 'gold') handleGoldChange(option.effectValue);
      playSound('click');
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
      if (localItem) { setScanError(null); setCurrentEvent(localItem); setIsAdminPreview(false); setInstantEffectValue(null); return; }
      if (isGuest) { setScanError(code); playSound('error'); return; }
      
      let foundItem = await apiService.getCardById(userEmail, code);
      if (foundItem) { setScanError(null); const updatedInventory = [...inventory, foundItem]; setInventory(updatedInventory); saveToLocalBackup(userEmail, updatedInventory); setCurrentEvent(foundItem); setIsAdminPreview(false); setInstantEffectValue(null); return; }
      
      if (userEmail !== ADMIN_EMAIL) {
        try {
           const adminItem = await apiService.getCardById(ADMIN_EMAIL, code);
           if (adminItem) {
             setScanError(null);
             if (adminItem.type === GameEventType.MERCHANT) { setActiveMerchant(adminItem); playSound('open'); return; }
             if (adminItem.type === GameEventType.TRAP || adminItem.type === GameEventType.ENCOUNTER) {
                 let effectVal = 0;
                 if (adminItem.stats) {
                     const dmgStat = adminItem.stats.find(s => ['DMG', 'POŠKOZENÍ', 'ÚTOK'].includes(s.label.toUpperCase()));
                     const hpStat = adminItem.stats.find(s => ['HP', 'ZDRAVÍ', 'HEALTH'].includes(s.label.toUpperCase()));
                     if (dmgStat) effectVal = -Math.abs(parseInt(String(dmgStat.value)));
                     else if (hpStat) effectVal = parseInt(String(hpStat.value));
                 }
                 if (effectVal !== 0) { setInstantEffectValue(effectVal); handleHpChange(effectVal); } else { setInstantEffectValue(null); }
             } else { setInstantEffectValue(null); }
             setCurrentEvent(adminItem); setIsAdminPreview(true); return;
           }
        } catch (err) { }
      }
      setScanError(code); playSound('error');
    } catch (error) { setScanError(code); playSound('error'); }
  };

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

  const handleUseEvent = async (event: GameEvent) => {
      if (event.stats) { event.stats.forEach(stat => { const val = parseInt(String(stat.value)); if (isNaN(val)) return; const label = stat.label.toUpperCase(); if (['HP', 'ZDRAVÍ', 'HEALTH', 'ŽIVOTY', 'HEAL', 'LÉČENÍ'].some(k => label.includes(k))) handleHpChange(val); else if (['DMG', 'POŠKOZENÍ', 'POSKOZENI', 'ÚTOK', 'UTOK', 'ATTACK'].some(k => label.includes(k))) handleHpChange(-Math.abs(val)); else if (['GOLD', 'KREDITY', 'PENÍZE', 'MINCE'].some(k => label.includes(k))) handleGoldChange(val); }); }
      if (isAdminPreview || !inventory.some(i => i.id === event.id)) { setCurrentEvent(null); setIsAdminPreview(false); setInstantEffectValue(null); if (!event.stats?.some(s => ['HP', 'ZDRAVÍ', 'HEALTH'].some(k => s.label.toUpperCase().includes(k)))) { setScreenFlash('green'); playSound('success'); setTimeout(() => setScreenFlash(null), 500); } return; }
      if (event.isConsumable) await handleDeleteEvent(event.id); else { setScreenFlash('green'); playSound('success'); vibrate([50, 50]); setTimeout(() => setScreenFlash(null), 500); alert(`Efekt předmětu "${event.title}" aktivován! Předmět zůstává v inventáři.`); }
  };

  const handleDeleteEvent = async (id: string) => {
    setCurrentEvent(null);
    try { 
        await performDelete(id); 
    } catch (error) {}
  };

  const handleEditEvent = (event: GameEvent) => { setEditingEvent(event); setCurrentEvent(null); setActiveTab(Tab.GENERATOR); };
  const closeEvent = () => { setCurrentEvent(null); setIsAdminPreview(false); setInstantEffectValue(null); playSound('click'); };
  const isItemInInventory = currentEvent ? inventory.some(i => i.id === currentEvent.id) : false;

  const handleReceiveGift = async (item: GameEvent) => {
      try { setInventory(prev => { const updated = [...prev, item]; if (userEmail) saveToLocalBackup(userEmail, updated); return updated; }); if (!isGuest && userEmail) try { await apiService.saveCard(userEmail, item); } catch (e) {} } catch (e) {}
      
      // SHOW GIFT NOTIFICATION
      showNotification(`Obdržen předmět: ${item.title}`, 'gift');

      // Auto-open logic (optional, but requested in previous steps, let's keep it mostly subtle now via Toast)
      // setCurrentEvent(item); // Removed auto-modal open to be less intrusive, Toast is enough
      // setIsAdminPreview(false); 
      // setScreenFlash('green');
      // playSound('success'); 
  };

  const handleTabChange = (tab: Tab) => { setActiveTab(tab); playSound('click'); };

  const handleItemClick = (event: GameEvent) => {
      if (giftTarget) {
          if (event.isShareable) {
            setPendingGiftItem(event);
            playSound('open');
          } else {
            alert("Tento předmět nelze darovat (není směnitelný).");
            playSound('error');
          }
      } else {
          setCurrentEvent(event);
          playSound('click');
      }
  };

  if (!userEmail) return <LoginScreen onLogin={handleLogin} />;

  if (!isAdmin && !roomState.isInRoom && !isSoloMode) {
      return (
          <GameSetup 
              initialNickname={roomState.nickname}
              onConfirmSetup={handleGameSetup}
              isGuest={isGuest}
          />
      );
  }

  const SyncIndicator = () => {
     if (isGuest) return <div className="flex items-center gap-1 text-zinc-500"><WifiOff className="w-4 h-4" /><span className="text-[10px] font-mono">OFFLINE</span></div>;
     if (syncStatus === 'restoring') return <div className="flex items-center gap-1 text-yellow-500 animate-pulse"><UploadCloud className="w-4 h-4" /><span className="text-[10px] font-mono">OBNOVA</span></div>;
     if (syncStatus === 'offline') return <div className="flex items-center gap-1 text-red-500"><CloudOff className="w-4 h-4" /><span className="text-[10px] font-mono">ODPOJENO</span></div>;
     if (syncStatus === 'error') return <div className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-4 h-4" /><span className="text-[10px] font-mono">CHYBA</span></div>;
     return <div className="flex items-center gap-1 text-emerald-500"><Cloud className="w-4 h-4" /><span className="text-[10px] font-mono">ONLINE</span></div>;
  };

  const renderInventorySection = (title: string, items: GameEvent[], icon: React.ReactNode) => {
      if (items.length === 0) return null;
      return (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                  <div className="text-neon-blue">{icon}</div>
                  <h3 className="text-sm font-display font-bold uppercase tracking-widest text-zinc-300">{title}</h3>
                  <span className="text-[10px] text-zinc-600 font-mono bg-zinc-900 px-2 rounded-full">{items.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 content-start">
                  {items.map((event) => (
                      <motion.div
                          key={event.id}
                          layoutId={event.id}
                          onClick={() => handleItemClick(event)}
                          whileTap={{ scale: 0.96 }}
                          className={`
                              relative rounded-xl p-3 flex flex-col gap-2 overflow-hidden backdrop-blur-sm border
                              ${getRarityColor(event.rarity, event.type)}
                              ${giftTarget && !event.isShareable ? 'opacity-30 grayscale cursor-not-allowed' : ''}
                              transition-all duration-200 hover:scale-[1.02]
                          `}
                      >
                          <div className="flex justify-between items-start relative z-10">
                              <div className={`p-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 ${event.rarity === 'Legendary' ? 'text-yellow-500' : 'text-zinc-400'}`}>
                                  {getEventIcon(event.type)}
                              </div>
                              {event.isConsumable && (
                                  <div className="bg-red-500/80 p-1 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                                      <Ghost className="w-3 h-3 text-white" />
                                  </div>
                              )}
                          </div>
                          
                          <div className="mt-auto relative z-10">
                              <h3 className="font-display font-bold text-sm leading-tight text-white mb-1 line-clamp-2">{event.title}</h3>
                              <div className="flex justify-between items-end">
                                  <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">{event.type}</span>
                                  {event.price && event.price > 0 && (
                                      <span className="text-[10px] text-yellow-500 font-mono font-bold flex items-center gap-1 bg-black/50 px-1.5 rounded">
                                          <Coins className="w-3 h-3" /> {event.price}
                                      </span>
                                  )}
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="relative h-screen bg-zinc-950 overflow-hidden flex flex-col font-sans text-white">
      {/* TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
          {notification && (
              <Toast 
                  data={notification} 
                  onClose={() => setNotification(null)} 
              />
          )}
      </AnimatePresence>

      {/* GIFT TRANSFER CONFIRMATION MODAL */}
      {pendingGiftItem && giftTarget && (
        <div className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-zinc-900 border-2 border-red-500/50 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <div className="bg-red-900/20 p-4 border-b border-red-500/30 flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                    <h3 className="font-display font-bold text-white uppercase tracking-wider">Potvrzení Přenosu</h3>
                </div>
                
                <div className="p-6 text-center space-y-4">
                    <p className="text-zinc-400 text-sm">
                        Chystáte se odeslat předmět hráči <br/>
                        <span className="text-neon-blue font-bold text-base">{giftTarget}</span>
                    </p>
                    
                    <div className="bg-black p-4 rounded-xl border border-zinc-700">
                        <p className="text-neon-purple font-display font-bold text-lg mb-1">{pendingGiftItem.title}</p>
                        <p className="text-zinc-600 text-xs font-mono uppercase">{pendingGiftItem.rarity} • {pendingGiftItem.type}</p>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-xs font-bold leading-relaxed">
                            POZOR: Pro dokončení přenosu bude tento předmět <span className="underline">trvale odstraněn</span> z vašeho zařízení.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        {giftTransferStatus === 'success' ? (
                            <div className="py-3 bg-green-500/20 border border-green-500 rounded-xl text-green-500 font-bold uppercase flex items-center justify-center gap-2">
                                <Check className="w-5 h-5" /> Odesláno
                            </div>
                        ) : (
                            <button 
                                onClick={handleConfirmGift}
                                disabled={giftTransferStatus === 'processing'}
                                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {giftTransferStatus === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                {giftTransferStatus === 'processing' ? "Mazání a Odesílání..." : "ODSTRANIT A ODESLAT"}
                            </button>
                        )}
                        
                        {giftTransferStatus !== 'success' && giftTransferStatus !== 'processing' && (
                            <button 
                                onClick={() => setPendingGiftItem(null)}
                                className="w-full py-3 bg-zinc-800 text-zinc-400 font-bold uppercase rounded-xl hover:bg-zinc-700"
                            >
                                Zpět
                            </button>
                        )}
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
          {screenFlash && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className={`fixed inset-0 z-[100] pointer-events-none ${screenFlash === 'red' ? 'bg-red-600' : 'bg-green-500'}`}
              />
          )}
      </AnimatePresence>

      <header className="flex-none p-4 pb-2 z-50 flex justify-between items-center safe-area-top relative">
        <div className="flex flex-col">
            <h1 className="text-xl font-display font-black tracking-widest text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                NEXUS <span className="text-neon-blue text-[10px] align-top">SYS v0.6</span>
            </h1>
            <SyncIndicator />
        </div>
        
        <div className="flex items-center gap-3">
            {!isAdmin && (
                <>
                    <div className="flex items-center gap-1 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <Heart className={`w-4 h-4 ${playerHp < 30 ? 'text-red-500 animate-pulse' : 'text-red-500'}`} fill="currentColor" />
                        <span className={`text-sm font-mono font-bold ${playerHp < 30 ? 'text-red-500' : 'text-white'}`}>{playerHp}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-700 shadow-[0_0_10px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <Coins className="w-4 h-4 text-yellow-500" fill="currentColor" />
                        <span className="text-sm font-mono font-bold text-yellow-500">{playerGold}</span>
                    </div>
                </>
            )}
            {isAdmin && <span className="text-xs font-bold text-neon-purple uppercase border border-neon-purple px-2 py-1 rounded bg-neon-purple/10">GM MODE</span>}

            <button onClick={() => handleTabChange(Tab.SETTINGS)} className="p-2 bg-zinc-900/50 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800">
                <Settings className="w-5 h-5 text-zinc-400" />
            </button>
        </div>
      </header>

      <main className="flex-1 relative z-0 overflow-hidden">
        <AnimatePresence>
          
          {activeTab === Tab.SCANNER && (
            <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
               <Scanner 
                   onScanCode={handleScanCode} 
                   inventoryCount={inventory.length} 
                   scanMode={scanMode} 
                   isPaused={isScannerPaused} 
                />
            </motion.div>
          )}

          {activeTab === Tab.INVENTORY && (
            <motion.div key="inventory" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full flex flex-col p-4 bg-zinc-950 overflow-hidden">
               {/* GIFT MODE BANNER */}
               {giftTarget && (
                   <div className="mb-4 bg-neon-purple/20 border border-neon-purple p-3 rounded-lg flex justify-between items-center animate-pulse">
                        <div className="flex items-center gap-2">
                             <Gift className="w-5 h-5 text-neon-purple" />
                             <div>
                                 <p className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">Režim Darování</p>
                                 <p className="text-xs text-white">Vyberte předmět pro: <span className="font-bold">{giftTarget}</span></p>
                             </div>
                        </div>
                        <button onClick={cancelGiftMode} className="bg-zinc-900 p-2 rounded hover:bg-zinc-800">
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                   </div>
               )}

               <div className="flex justify-between items-end mb-6 px-1">
                   <div>
                       <h2 className="text-3xl font-display font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 drop-shadow-sm">Inventář</h2>
                       <div className="h-1 w-20 bg-neon-blue rounded-full shadow-[0_0_10px_#00f3ff]"></div>
                   </div>
                   <button 
                       onClick={handleRefreshDatabase} 
                       disabled={isRefreshing}
                       className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-neon-blue hover:text-white transition-colors shadow-lg"
                   >
                       <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                   </button>
               </div>
               
               {loadingInventory ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4">
                       <Loader2 className="w-12 h-12 animate-spin text-neon-blue" />
                       <span className="text-sm font-mono uppercase tracking-widest font-bold text-neon-blue animate-pulse">Načítám Data...</span>
                   </div>
               ) : inventory.length === 0 ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 opacity-50">
                       <Database className="w-20 h-20 mb-4 text-zinc-800" />
                       <p className="font-mono text-sm uppercase tracking-widest">Žádná data</p>
                   </div>
               ) : (
                   <div className="flex-1 overflow-y-auto pb-24 px-1 no-scrollbar">
                       {/* KATEGORIE 1: PŘEDMĚTY */}
                       {renderInventorySection(
                           "Vybavení & Předměty", 
                           inventory.filter(i => i.type === GameEventType.ITEM), 
                           <Box className="w-5 h-5"/>
                       )}
                       
                       {/* KATEGORIE 2: OBCHODNÍCI */}
                       {renderInventorySection(
                           "Obchodníci & Služby", 
                           inventory.filter(i => i.type === GameEventType.MERCHANT), 
                           <ShoppingBag className="w-5 h-5"/>
                       )}

                       {/* KATEGORIE 3: OSTATNÍ (DILEMA, TRAP, ENCOUNTER...) */}
                       {renderInventorySection(
                           "Příběh & Události", 
                           inventory.filter(i => i.type !== GameEventType.ITEM && i.type !== GameEventType.MERCHANT), 
                           <BookOpen className="w-5 h-5"/>
                       )}
                   </div>
               )}
            </motion.div>
          )}

          {activeTab === Tab.GENERATOR && (
            <motion.div key="generator" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
              <Generator 
                onSaveCard={handleSaveEvent} 
                userEmail={userEmail} 
                initialData={editingEvent}
                onClearData={() => setEditingEvent(null)}
              />
            </motion.div>
          )}

          {activeTab === Tab.ROOM && (
            <motion.div key="room" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full bg-zinc-950">
                <Room 
                    userEmail={userEmail}
                    roomState={roomState}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onLeaveRoom={handleLeaveRoom}
                    onSendMessage={handleSendMessage}
                    onUpdateNickname={updateNickname}
                    onScanFriend={initiateFriendScan}
                    onReceiveGift={handleReceiveGift}
                    onInitiateGift={handleInitiateGift} // NEW CALLBACK
                />
            </motion.div>
          )}

          {activeTab === Tab.SETTINGS && (
             <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="absolute inset-0 w-full h-full p-6 flex flex-col bg-zinc-950 overflow-y-auto">
                <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-8 text-white">Nastavení</h2>
                
                <div className="space-y-6">
                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center border border-zinc-700 shadow-inner">
                                 <User className="w-6 h-6 text-neon-blue" />
                             </div>
                             <div>
                                 <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Identita</p>
                                 <p className="font-mono text-white text-lg">{userEmail}</p>
                             </div>
                        </div>
                        {userEmail !== ADMIN_EMAIL && !isGuest && (
                             <div className="pt-4 border-t border-zinc-800">
                                 <div className="flex items-center gap-2 mb-3">
                                     <Mail className="w-4 h-4 text-neon-blue" />
                                     <span className="text-xs font-bold text-white tracking-widest">QR VIZITKA (PŘÁTELÉ)</span>
                                 </div>
                                 <div className="bg-white p-2 rounded-xl w-fit mx-auto mb-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                     <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=000000&bgcolor=ffffff&data=friend:${userEmail}`} 
                                        alt="Friend QR" 
                                        className="w-32 h-32"
                                     />
                                 </div>
                                 <p className="text-[10px] text-zinc-500 text-center font-mono">Nechte kamaráda naskenovat tento kód v sekci "Chat &rarr; Burza &rarr; + Přítel".</p>
                             </div>
                        )}
                    </div>

                    <div className="bg-zinc-900/80 p-5 rounded-2xl border border-zinc-800 shadow-lg backdrop-blur-sm">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-4 tracking-widest">Systém</p>
                        <button onClick={toggleFullscreen} className="w-full flex items-center justify-between p-3 bg-black/50 rounded-lg mb-2 text-sm font-bold text-zinc-300 border border-zinc-700 hover:border-neon-blue transition-colors">
                            {isFullscreen ? 'Ukončit Fullscreen' : 'Zapnout Fullscreen'}
                            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                         {userEmail === ADMIN_EMAIL && (
                             <button 
                                onClick={() => {
                                    if(confirm("Opravdu smazat všechna lokální data a odhlásit se?")) {
                                        localStorage.clear();
                                        window.location.reload();
                                    }
                                }} 
                                className="w-full mt-4 p-3 bg-red-900/10 text-red-500 border border-red-900/30 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-red-900/20 transition-colors"
                             >
                                 <AlertTriangle className="w-4 h-4" /> Hard Reset App
                             </button>
                         )}
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 mt-auto tracking-widest"
                    >
                        <LogOut className="w-5 h-5" /> Odhlásit se
                    </button>
                    
                    <div className="text-center mt-4">
                        <p className="text-[10px] text-zinc-600 font-mono">NEXUS COMPANION v0.6</p>
                        <p className="text-[10px] text-zinc-700 font-mono">ID: {userEmail ? userEmail.split('@')[0] : 'GUEST'}</p>
                    </div>
                </div>
             </motion.div>
          )}

        </AnimatePresence>
      </main>

      <nav className="flex-none h-24 bg-zinc-950/90 border-t border-zinc-800 backdrop-blur-lg flex justify-around items-center px-4 safe-area-bottom z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className={`w-full grid gap-4 h-full py-2 ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {!isAdmin && (
                <NavButton 
                    active={activeTab === Tab.SCANNER} 
                    onClick={() => handleTabChange(Tab.SCANNER)} 
                    icon={<ScanLine className="w-6 h-6" />} 
                    label="SKEN" 
                />
            )}

            <NavButton 
                active={activeTab === Tab.INVENTORY} 
                onClick={() => handleTabChange(Tab.INVENTORY)} 
                icon={<Box className="w-6 h-6" />} 
                label="BATOH" 
            />

            {!isAdmin && !isGuest && (
                <NavButton 
                    active={activeTab === Tab.ROOM} 
                    onClick={() => handleTabChange(Tab.ROOM)} 
                    icon={<Layers className="w-6 h-6" />} 
                    label={isSoloMode ? "SOLO" : "MÍSTNOST"} 
                />
            )}

            {isAdmin && (
                <NavButton 
                active={activeTab === Tab.GENERATOR} 
                onClick={() => handleTabChange(Tab.GENERATOR)} 
                icon={<SquarePen className="w-6 h-6" />} 
                label="ADMIN" 
                />
            )}
        </div>
      </nav>

      <AnimatePresence>
        {currentEvent && !pendingGiftItem && (
          <EventCard 
            event={currentEvent} 
            onClose={closeEvent} 
            onSave={() => handleSaveEvent(currentEvent)}
            onUse={() => handleUseEvent(currentEvent)} 
            onDelete={() => handleDeleteEvent(currentEvent.id)}
            onEdit={isAdmin && isItemInInventory ? () => handleEditEvent(currentEvent) : undefined}
            onResolveDilemma={handleResolveDilemma}
            isSaved={isItemInInventory}
            isAdmin={isAdmin}
            isInstantEffect={instantEffectValue !== null}
            effectValue={instantEffectValue || 0}
          />
        )}

        {activeMerchant && userEmail && (
            <MerchantScreen 
                merchant={activeMerchant}
                userGold={playerGold}
                adminEmail={ADMIN_EMAIL}
                onClose={() => setActiveMerchant(null)}
                onBuy={handleBuyItem}
            />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
