import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, ThemeId } from './types';
import { ChamomileField, THEMES } from './components/ChamomileField';
import { ControlPanel } from './components/ControlPanel';
import { 
  Volume2, 
  VolumeX, 
  Compass, 
  HelpCircle, 
  CloudSun 
} from 'lucide-react';
import { audioInstance } from './utils/audio';

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    rainMode: 'hover',
    intensity: 65,
    windStrength: 30,
    windAngle: -35, // diagonal wind heading
    soundEnabled: false, // Default off to comply with browser autocomplete/autoplay policy
    soundVolume: 40,
    flowerDensity: 'normal',
    theme: 'meadow',
  });

  const [stats, setStats] = useState({
    flowerCount: 80,
    dropletsCount: 0,
    ripplesCount: 0,
    windMph: 12,
  });

  const activeTheme = THEMES[settings.theme] || THEMES.meadow;

  const handleAudioQuickToggle = () => {
    const nextEnabled = !settings.soundEnabled;
    setSettings((prev) => ({
      ...prev,
      soundEnabled: nextEnabled,
    }));
    audioInstance.updateParameters(
      settings.rainMode === 'none' ? 0 : settings.intensity,
      settings.windStrength,
      nextEnabled
    );
  };

  return (
    <div 
      className="relative w-screen h-screen overflow-hidden font-sans select-none bg-[#1c2217] flex flex-col items-center justify-center text-[#F5F2ED]"
      id="root-field-app"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={settings.theme}
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
          id="immersive-background-shield"
        >
          {/* Main interactive Chamomile Canvas Field Render */}
          <ChamomileField 
            settings={settings} 
            activeTheme={activeTheme} 
            setStats={setStats} 
          />
        </motion.div>
      </AnimatePresence>

      {/* EDITORIAL OVERLAY: HEADER */}
      <header className="absolute top-10 left-10 right-10 z-10 pointer-events-none flex justify-between items-start" id="editorial-header">
        <div className="max-w-md pointer-events-auto">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light italic leading-[0.9] text-white/95 drop-shadow-md tracking-tight mb-4 select-text">
            The Rain <br />
            At Midday
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm tracking-[0.25em] uppercase font-sans text-emerald-300 drop-shadow-sm">
            Matricaria chamomilla • Interactive Study
          </p>
        </div>
        <div className="text-right pointer-events-auto hidden sm:block">
          <div className="text-4xl md:text-5xl lg:text-6xl font-serif italic text-white/90">01</div>
          <div className="h-px w-16 md:w-24 bg-white/20 ml-auto my-3"></div>
          <div className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] text-white/60">
            Volume IV / Sanctuary
          </div>
        </div>
      </header>

      {/* Floating Control Hub (Restyled inside with Editorial theme accents) */}
      <ControlPanel 
        settings={settings} 
        setSettings={setSettings} 
        stats={stats} 
      />

      {/* EDITORIAL OVERLAY: FOOTER GRID */}
      <footer className="absolute bottom-16 left-10 right-10 z-10 pointer-events-none grid grid-cols-12 gap-6 items-end" id="editorial-footer">
        {/* Project Objective Box */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 pointer-events-auto">
          <div className="bg-[#1c2217]/85 backdrop-blur-md p-5 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Fine border visual details */}
            <div className="absolute top-0 left-0 w-8 h-[1px] bg-emerald-400"></div>
            <div className="absolute top-0 left-0 w-[1px] h-8 bg-emerald-400"></div>
            
            <h2 className="text-[10px] uppercase tracking-[0.2em] mb-2.5 font-bold text-emerald-400 font-mono">
              Project Objective
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed font-light text-slate-200 font-sans">
              An immersive exploration of tactile interface through environmental simulation. Move your cursor to precipitate rainfall; click anywhere to foster blooms.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              </div>
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-300">
                Tap or Hover meadow
              </span>
            </div>
          </div>
        </div>

        {/* Quiet Botanical Quote */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 flex flex-col justify-end text-right pointer-events-auto hidden md:flex">
          <div className="font-serif text-lg md:text-xl lg:text-2xl italic text-white/90 leading-relaxed max-w-xl ml-auto drop-shadow-md select-text">
            "The chamomile does not fear the downpour; it yields to the weight only to drink from the earth."
          </div>
        </div>
      </footer>

      {/* Quick Actions & Sound Controller */}
      <div 
        className="absolute bottom-5 right-10 z-10 flex flex-col sm:flex-row items-end sm:items-center gap-2.5 pointer-events-none"
        id="interactive-quick-actions"
      >
        {/* Floating Quick Sound Toggle */}
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={handleAudioQuickToggle}
          className={`pointer-events-auto p-2.5 rounded-full border shadow-xl flex items-center justify-center transition-all ${
            settings.soundEnabled 
              ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white animate-pulse' 
              : 'bg-slate-900/90 hover:bg-slate-800 border-white/10 text-slate-300'
          }`}
          id="quick-sound-toggle"
          title={settings.soundEnabled ? 'Mute procedural audio environment' : 'Unmute procedural botanical sounds'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </motion.button>
      </div>

      {/* Center Bottom Micro Details bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-[8.5px] uppercase tracking-[0.35em] text-[#F5F2ED]/55 pointer-events-none text-center font-mono" id="editorial-micro-metadata">
        <span>Atmospheric Pressure: 1012 hPa</span>
        <span className="hidden xs:inline">•</span>
        <span>Rain Fall Level: {settings.rainMode === 'none' ? '0.0' : (settings.intensity * 0.08).toFixed(1)} mm/h</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">Soil Saturation: {settings.rainMode === 'none' ? '45' : Math.min(98, 45 + Math.round(settings.intensity * 0.54))}%</span>
      </div>

      {/* Environmental Horizon Lighting Glow Filter Overlay */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${activeTheme.skyGradientStart} 0%, transparent 70%)`
        }}
        id="top-horizon-lens-glow"
      />
    </div>
  );
}
