import React, { useState, useEffect, useCallback } from 'react';
import { ScanLine, Database, Settings, AlertTriangle, LogOut, User, RefreshCw, SquarePen } from 'lucide-react'; // Removed X, Trash2
import Scanner from './components/Scanner';
import EventCard from './components/EventCard';
import LoginScreen from './components/LoginScreen';
import Generator from './components/Generator'; // Import the new Generator component
import { GameEvent } from './types';
import * as apiService from './services/apiService'; // Import the new API service

// Tab definitions
enum Tab {
  SCANNER = 'scanner',
  INVENTORY = 'inventory',
  GENERATOR = 'generator', // Added new Generator tab
  SETTINGS = 'settings'
}

// NavButtonProps interface definition
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

// NavButton component definition
const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  const isScannerTab = label === "SKEN";
  return (
    <button 
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300
        ${active
          ? `text-neon-blue scale-110 shadow-[0_0_15px_rgba(0,243,255,0.2)] ${isScannerTab ? '' : 'bg-neon-blue/10'}`
          : 'text-zinc-600 hover:text-zinc-400'
        }
      `}
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  // Auth State
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    // Attempt to load user from localStorage on app start
    return localStorage.getItem('nexus_current_user');
  });

  const [activeTab, setActiveTab] = useState<Tab>(Tab.SCANNER);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<GameEvent[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Load Inventory Logic
  const loadInventory = useCallback(async () => {
    if (userEmail) {
      setLoadingInventory(true);
      try {
        const data = await apiService.getInventory(userEmail);
        setInventory(data);
      } catch (e) {
        console.error("Failed to load inventory from backend:", e);
        setInventory([]);
        // Optionally show a user-facing error message
        // alert("Failed to load inventory. Please try again or check your network connection.");
      } finally {
        setLoadingInventory(false);
      }
    } else {
      setInventory([]); // Clear inventory if no user
    }
  }, [userEmail]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]); // Depend on loadInventory memoized function

  const handleRefreshDatabase = async () => {
    setIsRefreshing(true);
    await loadInventory(); // Directly call loadInventory which fetches from backend
    setIsRefreshing(false);
  };

  const handleLogin = (email: string) => {
    localStorage.setItem('nexus_current_user', email);
    setUserEmail(email);
    // loadInventory will be called via useEffect due to userEmail change
  };

  const handleLogout = () => {
    localStorage.removeItem('nexus_current_user');
    setUserEmail(null);
    setInventory([]); // Clear inventory immediately
    setActiveTab(Tab.SCANNER);
  };

  // Main logic: Handle raw code from scanner
  const handleScanCode = async (code: string) => {
    if (!userEmail) {
      alert("Please log in to scan codes.");
      return;
    }
    
    // Attempt to find the item in the backend database
    try {
      const foundItem = await apiService.getCardById(userEmail, code);
      
      if (foundItem) {
        console.log("Item found in database:", foundItem);
        setScanError(null);
        setCurrentEvent(foundItem);
      } else {
        // Item not found in database, set error
        console.log("Item not found in database for ID:", code);
        setScanError(code);
      }
    } catch (error) {
      console.error("Error fetching card by ID:", error);
      setScanError(code); // Still show error for user even if API call failed
      // alert("Error communicating with the database. Please try again.");
    }
  };

  const handleSaveEvent = async (event: GameEvent) => {
    if (!userEmail) {
      throw new Error("Pro uložení události se musíte přihlásit.");
    }

    try {
      // Check if item exists in current local state (optimistic update / pre-check)
      // This is a client-side check, backend should also validate
      const existingItem = await apiService.getCardById(userEmail, event.id);

      if (existingItem) {
        // Update existing item
        await apiService.updateCard(userEmail, event.id, event);
        // alert("Asset data updated in database.");
      } else {
        // Save new item
        await apiService.saveCard(userEmail, event);
        // alert("Asset fabricated and stored in database.");
      }
      
      await loadInventory(); // Refresh inventory from backend
      // If the currently displayed card (from scanner or inventory) is the one being edited, update it
      if (currentEvent && currentEvent.id === event.id) {
        setCurrentEvent(event); 
      }
    } catch (error: any) {
      console.error("Error saving event:", error);
      // alert(`Failed to save asset: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Selhalo uložení aktiva: ${error.message || String(error)}`);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!userEmail) {
      alert("Please log in to delete assets.");
      return;
    }

    if (window.confirm("WARNING: Confirm deletion of asset from secure database? This action cannot be undone.")) {
      try {
        await apiService.deleteCard(userEmail, id);
        alert("Asset successfully deleted from database.");
        await loadInventory(); // Refresh inventory from backend
        setCurrentEvent(null); // Close the card
      } catch (error) {
        console.error("Error deleting event:", error);
        alert(`Failed to delete asset: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const closeEvent = () => {
    setCurrentEvent(null);
  };

  const isItemInInventory = currentEvent ? inventory.some(i => i.id === currentEvent.id) : false;

  // Render Login Screen if no user
  if (!userEmail) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 font-sans text-white overflow-hidden">
      
      {/* Top Bar (Only visible on non-scanner pages for clean look) */}
      {activeTab !== Tab.SCANNER && (
        <header className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
            <span className="font-display font-bold tracking-widest text-lg">NEXUS LINK</span>
          </div>
          <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
            <span className="max-w-[100px] truncate">{userEmail}</span>
            <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-white">{inventory.length}</span>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === Tab.SCANNER && (
          <Scanner 
            onScanCode={handleScanCode} 
            inventoryCount={inventory.length} // Pass inventory length for display purposes
          />
        )}
        
        {activeTab === Tab.INVENTORY && (
          <div className="h-full overflow-y-auto p-6 pb-24">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
              <h1 className="text-3xl font-display font-bold">Asset <span className="text-neon-blue">Database</span></h1>
              <button 
                onClick={handleRefreshDatabase}
                disabled={isRefreshing || loadingInventory}
                className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-neon-blue hover:bg-zinc-800 hover:border-neon-blue transition-all active:scale-95"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing || loadingInventory ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            {loadingInventory && (
              <div className="text-center text-neon-blue mt-20 flex flex-col items-center">
                <Database className="w-12 h-12 mb-4 animate-pulse" />
                <p>Loading Database...</p>
              </div>
            )}

            {!loadingInventory && inventory.length === 0 ? (
              <div className="text-center text-zinc-600 mt-20 flex flex-col items-center">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>Database Empty</p>
                <p className="text-xs mt-2">Scan barcodes or fabricate assets to populate.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inventory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setCurrentEvent(item)} 
                    className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 active:bg-zinc-800 transition-colors group relative overflow-hidden cursor-pointer"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      item.rarity === 'Legendary' ? 'bg-yellow-500' : 
                      item.rarity === 'Epic' ? 'bg-purple-500' : 
                      item.rarity === 'Rare' ? 'bg-blue-500' : 'bg-zinc-600'
                    }`}></div>
                    
                    <div className="flex-1 pl-2">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-bold text-lg font-display uppercase">{item.title}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 rounded border ${
                           item.rarity === 'Legendary' ? 'text-yellow-500 border-yellow-500/30' : 
                           item.rarity === 'Epic' ? 'text-purple-500 border-purple-500/30' : 
                           'text-zinc-500 border-zinc-500/30'
                        }`}>{item.type}</span>
                      </div>
                      <p className="text-zinc-500 text-xs truncate">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-mono text-zinc-600">ID REF</span>
                       <span className="text-xs font-mono text-neon-blue">#{item.id?.substring(0,6) || '???'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === Tab.GENERATOR && (
          <Generator onSaveCard={handleSaveEvent} userEmail={userEmail} />
        )}

        {activeTab === Tab.SETTINGS && (
          <div className="h-full p-6 flex flex-col items-center justify-center text-zinc-500">
            <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User className="text-zinc-400" />
                </div>
                <div>
                  <div className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Current Operator</div>
                  <div className="text-white font-mono">{userEmail}</div>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Disconnect Session
              </button>
            </div>

            <Settings className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-8">System Configuration v2.5</p>
            
            <button 
              onClick={() => {
                if(confirm("WARNING: This will purge all local data and potentially lead to desynchronization with the backend. Continue?")) {
                  // For a fully backend-driven app, this would be less about "local cache" and more about
                  // confirming a server-side wipe or specific user data reset.
                  // For now, removing `localStorage` entry for current user if any.
                  localStorage.removeItem(`nexus_inventory_${userEmail}`); // This key is no longer used, but good to clean up
                  setInventory([]); // Clear current state
                  alert("Local data purged. Data on backend remains unless specifically deleted.");
                }
              }}
              className="px-4 py-2 border border-red-900 text-red-900 text-xs hover:bg-red-900/10 rounded"
            >
              PURGE LOCAL CACHE (LEGACY)
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="h-20 bg-black border-t border-zinc-800 flex items-center justify-around px-2 pb-safe z-20">
        <NavButton 
          active={activeTab === Tab.SCANNER} 
          onClick={() => setActiveTab(Tab.SCANNER)} 
          icon={<ScanLine />} 
          label="SKEN" 
        />
        <NavButton 
          active={activeTab === Tab.INVENTORY} 
          onClick={() => setActiveTab(Tab.INVENTORY)} 
          icon={<Database />} 
          label="INVENTÁŘ" 
        />
        <NavButton // New Generator Tab
          active={activeTab === Tab.GENERATOR} 
          onClick={() => setActiveTab(Tab.GENERATOR)} 
          icon={<SquarePen />} 
          label="FABRIKACE" 
        />
        <NavButton 
          active={activeTab === Tab.SETTINGS} 
          onClick={() => setActiveTab(Tab.SETTINGS)} 
          icon={<Settings />} 
          label="SYSTEM" 
        />
      </nav>

      {/* Result Modal Overlay */}
      {currentEvent && (
        <EventCard 
          event={currentEvent} 
          onClose={closeEvent} 
          onSave={() => handleSaveEvent(currentEvent)}
          onDelete={() => handleDeleteEvent(currentEvent.id)}
          isSaved={isItemInInventory}
        />
      )}

      {/* Error Modal Overlay */}
      {scanError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-zinc-900 border border-red-500/50 p-8 rounded-2xl w-full max-w-xs text-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-white mb-2 tracking-wide">NEZNÁMÝ KÓD</h3>
              <p className="text-zinc-400 text-sm mb-2">ID: <span className="font-mono text-red-400 bg-red-900/20 px-1 rounded">{scanError}</span></p>
              <p className="text-zinc-500 text-xs mb-6">Tento předmět není v databázi. Pro jeho přidání kontaktujte správce systému.</p>
              <button 
                onClick={() => setScanError(null)}
                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg font-bold uppercase tracking-widest text-xs transition-colors"
              >
                Zavřít
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;