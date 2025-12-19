
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Scan, Sun, Moon, Heart, Zap, 
  Users, ArrowLeft,
  Info, Activity,
  Sword, Wand2, Footprints, Cross, ShieldAlert,
  Smartphone
} from 'lucide-react';

interface ManualViewProps {
  onBack: () => void;
}

const ManualSection: React.FC<{ 
  icon: React.ReactNode, 
  title: string, 
  children: React.ReactNode,
  color: string 
}> = ({ icon, title, children, color }) => (
  <div className="mb-8 group">
    <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
      <div className={`${color} p-2 bg-zinc-900 rounded-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-display font-bold uppercase tracking-widest text-white">{title}</h3>
    </div>
    <div className="pl-12 text-sm text-zinc-400 leading-relaxed space-y-2">
      {children}
    </div>
  </div>
);

const ManualView: React.FC<ManualViewProps> = ({ onBack }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="absolute inset-0 bg-zinc-950 z-[120] flex flex-col p-6 overflow-y-auto no-scrollbar"
    >
      <div className="flex items-center gap-4 mb-8 sticky top-0 bg-zinc-950/90 backdrop-blur pb-4 z-10 border-b border-white/5">
        <button onClick={onBack} className="p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors active:scale-90">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-display font-black uppercase tracking-tighter text-white">Manuál <span className="text-neon-blue">Nexus</span></h2>
      </div>

      <div className="pb-24">
        <ManualSection icon={<Smartphone className="w-5 h-5" />} title="Multi-Device Systém" color="text-neon-blue">
          <p>Nexus OS je navržen pro plynulé hraní na mobilech, tabletech i desktopech.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-white font-bold">Synchronizace:</span> Díky Room ID (např. A1B2C) jsou všechna zařízení u stolu propojena. Pokud vám klesnou životy, vaši spoluhráči to uvidí na svých zařízeních v reálném čase.</li>
            <li><span className="text-white font-bold">Křížové hraní:</span> Můžete kombinovat iOS, Android a PC. Systém nerozlišuje platformu, pouze vaši identitu.</li>
          </ul>
        </ManualSection>

        <ManualSection icon={<Scan className="w-5 h-5" />} title="Skenování Karet" color="text-neon-blue">
          <p>Systém Nexus interpretuje fyzické čárové kódy z deskové hry. Stačí namířit kameru na kód.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-white font-bold">Automatika:</span> Kamera kód rozpozná a okamžitě vyvolá kartu.</li>
            <li><span className="text-white font-bold">Manuální ID:</span> Pokud kamera nefunguje, použijte ikonu klávesnice a zadejte kód (např. ITEM-01) ručně.</li>
          </ul>
        </ManualSection>

        <ManualSection icon={<ShieldAlert className="w-5 h-5" />} title="Třídy a Specializace" color="text-neon-purple">
          <p>Každá postava v Nexus OS má unikátní roli, která ovlivňuje hratelnost a interakci s NPC.</p>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <div className="bg-zinc-900/50 p-3 rounded-xl border-l-2 border-red-500">
               <div className="flex items-center gap-2 mb-1">
                  <Sword className="w-4 h-4 text-red-500" />
                  <span className="text-white font-bold uppercase text-xs">Válečník</span>
               </div>
               <p className="text-[11px] text-zinc-500 italic mb-2">"Hrubá síla a respekt."</p>
               <p className="text-[11px]">Získává <span className="text-red-400">slevu 10%</span> na vybavení u obchodníků.</p>
            </div>
            
            <div className="bg-zinc-900/50 p-3 rounded-xl border-l-2 border-blue-400">
               <div className="flex items-center gap-2 mb-1">
                  <Wand2 className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-bold uppercase text-xs">Mág</span>
               </div>
               <p className="text-[11px] text-zinc-500 italic mb-2">"Arkánní znalosti."</p>
               <p className="text-[11px]">Má <span className="text-blue-300">slevu 25%</span> na spotřební předměty a svitky.</p>
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-xl border-l-2 border-green-500">
               <div className="flex items-center gap-2 mb-1">
                  <Footprints className="w-4 h-4 text-green-500" />
                  <span className="text-white font-bold uppercase text-xs">Zloděj</span>
               </div>
               <p className="text-[11px] text-zinc-500 italic mb-2">"Šance na lup."</p>
               <p className="text-[11px]"><span className="text-green-400">30% šance</span> na ukradení zboží zdarma při nákupu.</p>
            </div>

            <div className="bg-zinc-900/50 p-3 rounded-xl border-l-2 border-yellow-500">
               <div className="flex items-center gap-2 mb-1">
                  <Cross className="w-4 h-4 text-yellow-500" />
                  <span className="text-white font-bold uppercase text-xs">Kněz</span>
               </div>
               <p className="text-[11px] text-zinc-500 italic mb-2">"Požehnání."</p>
               <p className="text-[11px]">Má <span className="text-yellow-400">slevu 45%</span> na léčivé a očistné předměty.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection icon={<div className="flex gap-1"><Sun className="w-4 h-4" /><Moon className="w-4 h-4" /></div>} title="Cyklus Den a Noc" color="text-yellow-500">
          <p>Nexus OS sleduje reálný čas nebo nastavení administrátora. Svět se mění podle denní doby.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-orange-400 font-bold">DEN:</span> Standardní efekty, bezpečnější cestování.</li>
            <li><span className="text-indigo-400 font-bold">NOC:</span> Karty mění své vlastnosti. Monstra jsou agresivnější.</li>
          </ul>
        </ManualSection>

        <ManualSection icon={<Activity className="w-5 h-5" />} title="Vysvětlení Statistik" color="text-neon-green">
          <div className="grid grid-cols-1 gap-4 mt-2">
            <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <Heart className="w-4 h-4 text-red-500 shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold text-xs uppercase">HP (Zdraví)</p>
                <p className="text-[11px]">Body výdrže. Při 0 je postava vyřazena.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              <Zap className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
              <div>
                <p className="text-white font-bold text-xs uppercase">Mana (Energie)</p>
                <p className="text-[11px]">Energie pro schopnosti a magické karty.</p>
              </div>
            </div>
          </div>
        </ManualSection>

        <ManualSection icon={<Users className="w-5 h-5" />} title="Týmová Hra & Tahy" color="text-neon-purple">
          <p>V režimu "Tým" se synchronizujete s ostatními hráči u stolu.</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><span className="text-white font-bold">Tahový Systém:</span> Aplikace hlídá, kdo je na řadě.</li>
            <li><span className="text-white font-bold">Lobby:</span> V sekci Tým vidíte HP všech spoluhráčů.</li>
          </ul>
        </ManualSection>

        <div className="mt-12 bg-neon-blue/5 border border-neon-blue/20 p-6 rounded-2xl text-center">
          <div className="flex justify-center mb-3 text-neon-blue">
            <Info className="w-10 h-10" />
          </div>
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-[0.2em] mb-2">Nexus Operating System</p>
          <p className="text-[10px] text-zinc-600">Verze Jádra: 0.6.6_STABLE<br/>Vyvinuto by: DeXoArt.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ManualView;
