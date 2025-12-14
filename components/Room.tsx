
import React, { useState, useEffect, useRef } from 'react';
import { Users, Send, UserPlus, Gift, QrCode, Trash2, Check, X, User, ShieldAlert, Activity, PackageCheck, Backpack } from 'lucide-react';
import * as apiService from '../services/apiService';
import { GameEvent } from '../types';
import { playSound } from '../services/soundService';

export interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface RoomProps {
  userEmail: string | null;
  // Inventory props removed as they are handled in App.tsx now
  roomState: {
      id: string;
      isInRoom: boolean;
      messages: Message[];
      nickname: string;
      isNicknameSet: boolean;
      members: {name: string, hp: number}[];
  };
  onCreateRoom: (nick: string) => void;
  onJoinRoom: (id: string, nick: string) => void;
  onLeaveRoom: () => void;
  onSendMessage: (text: string) => void;
  onUpdateNickname: (nick: string) => void;
  onScanFriend: () => void;
  onReceiveGift: (item: GameEvent) => void; 
  onInitiateGift: (targetEmail: string) => void; 
}

type RoomTab = 'chat' | 'party' | 'trade';

const Room: React.FC<RoomProps> = ({ 
    userEmail, 
    roomState, onLeaveRoom, onSendMessage, onScanFriend, onReceiveGift, onInitiateGift
}) => {
  const [activeTab, setActiveTab] = useState<RoomTab>('party');
  const [newMessage, setNewMessage] = useState('');
  
  const [friends, setFriends] = useState<string[]>([]);
  const [requests, setRequests] = useState<apiService.FriendRequest[]>([]);
  
  const [selectedFriend, setSelectedFriend] = useState<string>('');
  
  const [processedGiftIds, setProcessedGiftIds] = useState<Set<string>>(() => {
      try {
          const saved = localStorage.getItem('nexus_processed_gifts');
          return saved ? new Set(JSON.parse(saved)) : new Set();
      } catch (e) {
          return new Set();
      }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isGuest = userEmail === 'guest';
  const isAdmin = userEmail === 'zbynekbal97@gmail.com';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomState.messages, activeTab, roomState.nickname]);

  useEffect(() => {
      if(userEmail && !isGuest) {
          fetchFriendsData();
      }
  }, [userEmail, isGuest, activeTab]);

  useEffect(() => {
      if (!userEmail || !roomState.isInRoom) return;

      let hasUpdates = false;
      const newProcessed = new Set(processedGiftIds);

      roomState.messages.forEach(msg => {
          if (newProcessed.has(msg.id)) return;
          if (msg.text.includes('|||')) {
              try {
                  const parts = msg.text.split('|||');
                  if (parts.length < 2) return;
                  
                  const hiddenJson = parts[1];
                  const giftData = JSON.parse(hiddenJson);
                  
                  if (giftData && giftData.targetEmail === userEmail && giftData.item) {
                       newProcessed.add(msg.id);
                       hasUpdates = true;
                       onReceiveGift(giftData.item);
                  }
              } catch (e) {}
          }
      });

      if (hasUpdates) {
          setProcessedGiftIds(newProcessed);
          localStorage.setItem('nexus_processed_gifts', JSON.stringify(Array.from(newProcessed)));
      }
  }, [roomState.messages, userEmail, processedGiftIds, onReceiveGift]);


  const fetchFriendsData = async () => {
      if (!userEmail || isGuest) return;
      try {
          const [friendsList, requestsList] = await Promise.all([
              apiService.getFriends(userEmail),
              apiService.getFriendRequests(userEmail)
          ]);
          setFriends(friendsList);
          setRequests(requestsList);
      } catch (e) { }
  };

  const handleSendClick = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newMessage.trim()) return;
      onSendMessage(newMessage);
      setNewMessage('');
      playSound('click');
  };

  const handleAcceptRequest = async (targetEmail: string) => {
      if(!userEmail) return;
      await apiService.respondToFriendRequest(userEmail, targetEmail, true);
      fetchFriendsData();
      playSound('success');
  };

  const handleRejectRequest = async (targetEmail: string) => {
      if(!userEmail) return;
      await apiService.respondToFriendRequest(userEmail, targetEmail, false);
      fetchFriendsData();
      playSound('click');
  };

  // Trigger the gift flow in App.tsx
  const handleGiftButtonClick = () => {
      if (selectedFriend) {
          onInitiateGift(selectedFriend);
      }
  };

  const renderMessageText = (text: string) => {
      if (text.includes('|||')) {
          return (
              <div className="flex flex-col gap-1">
                  <span>{text.split('|||')[0]}</span>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-400 bg-black/20 p-1 rounded w-fit">
                      <PackageCheck className="w-3 h-3" />
                      <span>Obsahuje data</span>
                  </div>
              </div>
          );
      }
      return text;
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 overflow-hidden relative">
        <div className="bg-black/80 backdrop-blur-md border-b border-zinc-800">
            <div className="flex justify-between items-center p-4 pb-2">
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                     <User className="w-3 h-3 text-zinc-500" />
                     <span className="text-xs font-mono text-zinc-300 font-bold">{roomState.nickname}</span>
                </div>
                {roomState.id && (
                    <button 
                        onClick={onLeaveRoom}
                        className="flex items-center gap-1 text-red-500 hover:text-red-400 px-2 py-1 bg-red-900/10 rounded border border-red-900/20"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase">Opustit</span>
                    </button>
                )}
            </div>

            <div className="flex px-2">
                <button onClick={() => {setActiveTab('party'); playSound('click');}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'party' ? 'border-neon-blue text-white' : 'border-transparent text-zinc-600'}`}>
                    Tým ({roomState.members?.length || 1})
                </button>
                <button onClick={() => {setActiveTab('chat'); playSound('click');}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'chat' ? 'border-neon-blue text-white' : 'border-transparent text-zinc-600'}`}>
                    Chat
                </button>
                <button onClick={() => {setActiveTab('trade'); playSound('click');}} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeTab === 'trade' ? 'border-neon-blue text-white' : 'border-transparent text-zinc-600'}`}>
                    Burza
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {activeTab === 'party' && (
                <div className="p-4 space-y-4">
                    {!roomState.isInRoom ? (
                        <div className="text-center py-10 opacity-50">
                            <Users className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                            <p>Hrajete v režimu sólo/offline.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase text-zinc-500">Kód Místnosti</span>
                                    <span className="text-neon-blue font-mono font-bold text-xl tracking-widest">{roomState.id}</span>
                                </div>
                                <p className="text-[10px] text-zinc-600">Sdílejte tento kód s ostatními hráči u stolu.</p>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-white uppercase tracking-widest pl-1">Stav Jednotky</h3>
                                {roomState.members?.map((member, idx) => (
                                    <div key={idx} className="bg-black border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${member.name === roomState.nickname ? 'border-neon-blue bg-neon-blue/10 text-neon-blue' : 'border-zinc-700 bg-zinc-900 text-zinc-400'}`}>
                                            {member.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`font-bold ${member.name === roomState.nickname ? 'text-white' : 'text-zinc-300'}`}>{member.name}</span>
                                                <span className={`font-mono font-bold ${member.hp < 30 ? 'text-red-500' : 'text-green-500'}`}>{member.hp} HP</span>
                                            </div>
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${member.hp < 30 ? 'bg-red-600' : 'bg-green-500'}`} 
                                                    style={{ width: `${Math.min(100, Math.max(0, member.hp))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'chat' && (
                roomState.isInRoom ? (
                    <div className="flex flex-col h-full">
                         <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {roomState.messages.map((msg) => {
                                const isMe = msg.sender === roomState.nickname;
                                if(msg.isSystem) return <div key={msg.id} className="text-center"><span className="text-[10px] bg-zinc-900 px-2 py-1 rounded text-zinc-500 font-mono">{msg.text}</span></div>;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className={`text-[10px] font-bold ${isMe ? 'text-neon-purple' : 'text-zinc-400'}`}>{msg.sender}</span>
                                        </div>
                                        <div className={`p-3 rounded-xl text-sm max-w-[85%] break-words shadow-sm ${isMe ? 'bg-neon-purple text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                                            {renderMessageText(msg.text)}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                         </div>
                         <form onSubmit={handleSendClick} className="p-3 bg-black border-t border-zinc-800 flex gap-2 pb-safe">
                             <input type="text" value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} placeholder="Napsat zprávu..." className="flex-1 bg-zinc-900 border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-neon-purple" />
                             <button type="submit" disabled={!newMessage.trim()} className="bg-neon-purple text-white p-2 rounded-lg hover:bg-fuchsia-600 transition-colors"><Send className="w-4 h-4"/></button>
                         </form>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center">
                        <Activity className="w-12 h-12 mb-4 opacity-50" />
                        <p>Chat je dostupný pouze v místnosti.</p>
                    </div>
                )
            )}

            {activeTab === 'trade' && (
                <div className="p-6">
                    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                        <button 
                            onClick={onScanFriend}
                            className="shrink-0 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg flex items-center gap-2 text-xs font-bold uppercase hover:bg-zinc-800 whitespace-nowrap"
                        >
                            <QrCode className="w-4 h-4" /> + Přítel (QR)
                        </button>
                        {requests.length > 0 && (
                            <div className="shrink-0 px-4 py-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue rounded-lg text-xs font-bold uppercase flex items-center gap-2">
                                <UserPlus className="w-4 h-4" /> {requests.length} Žádostí
                            </div>
                        )}
                    </div>
                    
                    {requests.map((req, i) => (
                        <div key={i} className="mb-4 p-3 bg-zinc-900 border border-neon-blue/30 rounded-lg flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs text-white truncate max-w-[150px]">{req.fromEmail}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleAcceptRequest(req.fromEmail)} className="p-1.5 bg-green-900/20 text-green-500 rounded hover:bg-green-900/40"><Check className="w-4 h-4"/></button>
                                <button onClick={() => handleRejectRequest(req.fromEmail)} className="p-1.5 bg-red-900/20 text-red-500 rounded hover:bg-red-900/40"><X className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}

                    <div className="h-px bg-zinc-800 my-6"></div>

                    {isAdmin ? (
                        <div className="text-center p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
                            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-400 text-xs font-bold uppercase">Admin nemůže obchodovat</p>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Gift className="w-5 h-5 text-neon-purple" /> Poslat Kartu</h3>
                            
                            <div className="mb-6">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Příjemce (Přítel)</label>
                                <select 
                                    value={selectedFriend} 
                                    onChange={(e) => setSelectedFriend(e.target.value)}
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white text-sm outline-none focus:border-neon-purple"
                                >
                                    <option value="">-- Vybrat --</option>
                                    {friends.filter(f => f !== userEmail).map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>

                            {/* ZMĚNĚNO NA ODKAZ DO BATOHU */}
                            <button 
                                onClick={handleGiftButtonClick}
                                disabled={!selectedFriend}
                                className="w-full py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all bg-zinc-800 border border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <Backpack className="w-5 h-5"/> VYBRAT KARTU Z BATOHU
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default Room;
