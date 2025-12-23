import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertTriangle, Check, WifiOff, Eye, EyeOff, ShieldAlert, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as apiService from '../services/apiService';
import * as bioService from '../services/biometricService';
import ServerLoader from './ServerLoader';
import { playSound, vibrate } from '../services/soundService';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showBioOffer, setShowBioOffer] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [isBioLinked] = useState(localStorage.getItem('nexus_biometric_linked') === 'true');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bioService.isBiometricAvailable().then(setBioAvailable);
  }, []);

  const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
        setError("Zadejte platný identifikátor (Email).");
        return;
    }
    if (isAdmin && !password.trim()) {
        setError("Admin protokol vyžaduje přístupový klíč.");
        return;
    }
    setError(null);
    setShowConsentModal(true);
  };

  const handleBiometricLogin = async () => {
    playSound('click');
    const user = await bioService.authenticateBiometric();
    if (user) {
        vibrate([50, 50]);
        setIsConnecting(true);
        setTimeout(() => onLogin(user), 1000);
    } else {
        setError("Biometrické ověření selhalo.");
    }
  };

  const handleConsentAndLogin = async () => {
    setShowConsentModal(false);
    setIsConnecting(true);
    setError(null);
    try {
        await apiService.loginUser(email, password);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (bioAvailable && !isBioLinked) {
            setIsConnecting(false);
            setShowBioOffer(true);
        } else {
            onLogin(email);
        }
    } catch (err: any) {
        setIsConnecting(false);
        if (err.message && err.message.includes('401')) setError("Nesprávný Master_Key.");
        else setError("Nelze se spojit se sektorem.");
    }
  };

  const handleLinkBiometrics = async () => {
    const success = await bioService.registerBiometrics(email);
    if (success) {
        playSound('success');
        onLogin(email);
    } else {
        setShowBioOffer(false);
        onLogin(email);
    }
  };

  if (isConnecting) return <ServerLoader onConnected={() => {}} onSwitchToOffline={() => { setIsConnecting(false); setError("Odkaz přerušen."); }} />;

  return (
    <div className="h-screen w-screen bg-[#0a0b0d] flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="flex justify-between w-full p-8 font-mono text-[10px] text-signal-cyan">
           <span>SIGNÁL: VYHLEDÁVÁNÍ...</span>
           <span>POZ: HLAVNÍ_BRÁNA</span>
        </div>
      </div>

      <motion.div 
        {...({ initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } } as any)}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-12">
           <div className="relative inline-block mb-10">
              <div className="w-24 h-24 tactical-card flex items-center justify-center border-signal-cyan/40 bg-black/40">
                <div className="corner-accent top-left !border-2"></div>
                <div className="corner-accent bottom-right !border-2"></div>
                <ShieldAlert className="w-12 h-12 text-signal-cyan" />
              </div>
           </div>
           <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-2 chromatic-text">Nexus_Auth</h1>
           <p className="text-signal-cyan font-mono text-[10px] uppercase tracking-[0.5em] font-black">Hybridní desková hra</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-white/50 uppercase tracking-[0.2em] ml-1 font-mono">Váš EMAIL</label>
            <div className="tactical-card p-0 overflow-hidden border-white/10 focus-within:border-signal-cyan/60 transition-colors bg-white/5">
              <div className="flex items-center px-5 py-5 gap-4">
                <User className="w-6 h-6 text-signal-cyan" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-white/20 focus:outline-none font-mono text-sm uppercase font-bold"
                  placeholder="Zadejte váš - EMAIL.."
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className={`text-[11px] font-black uppercase tracking-[0.2em] ml-1 font-mono ${isAdmin ? 'text-signal-amber' : 'text-white/50'}`}>
                {isAdmin ? 'Vyžadován_Master_Key' : 'Volitelný_vaše_HESLO'}
            </label>
            <div className={`tactical-card p-0 overflow-hidden border-white/10 transition-colors bg-white/5 ${isAdmin ? 'focus-within:border-signal-amber' : 'focus-within:border-signal-cyan/60'}`}>
              <div className="flex items-center px-5 py-5 gap-4">
                <Lock className={`w-6 h-6 ${isAdmin ? 'text-signal-amber' : 'text-signal-cyan'}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-white/10 focus:outline-none font-mono text-sm font-bold"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/20 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
            
          {error && (
              <div className="p-4 bg-signal-hazard/10 border border-signal-hazard/40 text-signal-hazard text-[11px] uppercase font-black tracking-widest text-center">
                  <AlertTriangle className="w-4 h-4 inline mr-2 mb-0.5" /> {error}
              </div>
          )}

          <div className="flex gap-4">
            <button type="submit" className="button-primary flex-1 font-black text-base py-5 flex items-center justify-center gap-4">
                Navázat_Spojení <ArrowRight className="w-6 h-6" />
            </button>
            {isBioLinked && bioAvailable && (
                <button 
                    type="button" 
                    onClick={handleBiometricLogin}
                    className="p-5 tactical-card bg-signal-cyan/10 border-signal-cyan/40 text-signal-cyan hover:bg-signal-cyan/20 transition-all rounded-lg"
                    title="Biometrické přihlášení"
                >
                    <Fingerprint className="w-8 h-8" />
                </button>
            )}
          </div>
        </form>

        <div className="mt-12 flex flex-col items-center gap-8">
            <div className="w-full flex items-center gap-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[10px] text-white/30 uppercase font-mono tracking-widest font-black italic">SOLO</span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            <button onClick={() => onLogin('guest')} className="text-white/40 hover:text-signal-cyan text-[11px] uppercase font-black tracking-[0.3em] transition-colors flex items-center gap-3">
                <WifiOff className="w-5 h-5" /> Offline_Nasazení
            </button>
        </div>
      </motion.div>

      {/* BIOMETRIC OFFER MODAL */}
      <AnimatePresence>
      {showBioOffer && (
          <div className="fixed inset-0 z-[250] bg-[#0a0b0d]/98 backdrop-blur-xl flex items-center justify-center p-6 text-center">
            <motion.div {...({ initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 } } as any)} className="tactical-card max-w-sm border-signal-cyan">
                <div className="corner-accent top-left !border-2"></div>
                <div className="mb-6 flex justify-center">
                    <div className="p-6 bg-signal-cyan/10 rounded-full border border-signal-cyan/30 animate-pulse">
                        <Fingerprint className="w-16 h-16 text-signal-cyan" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Biometrický_Zámek</h3>
                <p className="text-sm text-white/60 mb-8 leading-relaxed">Chcete pro příště povolit rychlé přihlášení pomocí otisku prstu nebo obličeje?</p>
                <div className="space-y-4">
                    <button onClick={handleLinkBiometrics} className="button-primary w-full py-4 text-sm font-black">AKTIVOVAT SENZOR</button>
                    <button onClick={() => onLogin(email)} className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors">PŘESKOČIT</button>
                </div>
            </motion.div>
          </div>
      )}
      </AnimatePresence>

      {/* TERMS MODAL */}
      <AnimatePresence>
      {showConsentModal && (
        <div className="fixed inset-0 z-[200] bg-[#0a0b0d]/95 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div 
              {...({
                initial: { scale: 0.96, opacity: 0 },
                animate: { scale: 1, opacity: 1 },
                exit: { scale: 0.96, opacity: 0 }
              } as any)}
              className="tactical-card w-full max-w-sm border-signal-cyan/40 p-0 overflow-hidden bg-black/90 shadow-[0_0_60px_rgba(0,242,255,0.1)]"
            >
                <div className="corner-accent top-left !border-2"></div>
                <div className="corner-accent bottom-right !border-2"></div>
                
                <div className="bg-white/[0.04] p-8 border-b border-white/10 flex items-center gap-6">
                    <ShieldCheck className="w-12 h-12 text-signal-cyan" />
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Podmínky_Nasazení</h3>
                      <p className="text-signal-cyan font-mono text-[10px] uppercase tracking-[0.4em] font-black mt-2">Bezpečnostní_Protokol</p>
                    </div>
                </div>
                
                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto text-[13px] text-white/70 leading-relaxed font-sans scrollbar-thin">
                    <div className="p-5 bg-signal-amber/10 border border-signal-amber/30 rounded-sm">
                      <p className="text-signal-amber font-black uppercase tracking-widest mb-3 flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4" /> Datové_Upozornění
                      </p>
                      <p className="font-bold">Identifikátor <span className="text-white font-mono bg-white/10 px-1.5 py-0.5 rounded">{email}</span> bude použit k synchronizaci v reálném čase.</p>
                    </div>
                    
                    <ul className="space-y-6 font-bold">
                        <li className="flex gap-4">
                            <Check className="w-5 h-5 text-signal-cyan shrink-0 mt-0.5" />
                            <span>Vstupem do sektoru souhlasíte se sdílením statistik s ostatními jednotkami v místnosti.</span>
                        </li>
                        <li className="flex gap-4">
                            <Check className="w-5 h-5 text-signal-cyan shrink-0 mt-0.5" />
                            <span>Veškeré skenované assety budou archivovány ve vašem privátním trezoru (Vault).</span>
                        </li>
                        {isAdmin && (
                            <li className="flex gap-4 p-4 bg-signal-hazard/10 border border-signal-hazard/30">
                                <ShieldAlert className="w-6 h-6 text-signal-hazard shrink-0" />
                                <span className="font-black text-signal-hazard uppercase text-[10px] tracking-widest">ADMIN_VAROVÁNÍ: Veškeré operace zápisu do DB budou logovány pod vaší autoritou.</span>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="p-8 bg-white/[0.03] border-t border-white/10 flex flex-col gap-4">
                    <button onClick={handleConsentAndLogin} className="button-primary w-full text-base py-5">
                        Přijmout_&_Nasadit
                    </button>
                    <button onClick={() => setShowConsentModal(false)} className="w-full py-2 text-white/30 hover:text-white text-[11px] uppercase font-black tracking-[0.4em] transition-colors">
                        Přerušit_Operaci
                    </button>
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
};

export default LoginScreen;