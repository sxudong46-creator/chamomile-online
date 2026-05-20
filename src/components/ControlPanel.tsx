import React, { useState } from 'react';
import { Settings, ThemeId, ThemeSettings } from '../types';
import { 
  Wind, 
  CloudRain, 
  Volume2, 
  VolumeX, 
  Flower, 
  Palette, 
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { THEMES } from './ChamomileField';

interface ControlPanelProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  stats: {
    flowerCount: number;
    dropletsCount: number;
    ripplesCount: number;
    windMph: number;
  };
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ settings, setSettings, stats }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getThemeDescription = (id: ThemeId) => {
    switch (id) {
      case 'meadow': return 'Warm sun-kissed meadow under a bright blue morning.';
      case 'indigo': return 'Moody overcast navy sky with glowing turquoise shadows.';
      case 'sunset': return 'Dramatic warm amber light catching wet copper petals.';
      case 'moonrise': return 'Bioluminescent nocturnal silver, with neon green drifting fireflies!';
    }
  };

  return (
    <div 
      className="absolute top-36 right-10 z-20 w-[calc(100%-5rem)] sm:w-80 transition-all duration-300 pointer-events-auto"
      id="control-panel-wrapper"
    >
      <div className={`bg-[#20261a]/90 backdrop-blur-xl border border-white/10 rounded-none shadow-2xl p-4 text-[#F5F2ED] overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-14 opacity-90'}`}>
        
        {/* Panel Header */}
        <div 
          className="flex items-center justify-between cursor-pointer pb-2"
          onClick={() => setIsOpen(!isOpen)}
          id="panel-header"
        >
          <div className="flex items-center gap-2">
            <div className="bg-emerald-800/20 p-1.5 rounded-none border border-emerald-500/20">
              <Flower className="w-5 h-5 text-emerald-400 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xs font-semibold tracking-wider font-sans">Lab Controls</h2>
              <p className="text-[9px] text-[#F5F2ED]/60 font-mono">FLOWERS & RAIN INTERACTIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              className="p-1 hover:bg-[#2C3325] rounded text-slate-400 hover:text-white transition"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(!showTooltip);
              }}
              title="Show Instructions"
              id="help-button"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-[#2C3325] rounded text-slate-300 transition" id="toggle-panel-button py-0.5">
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Instructions Overlay */}
        {showTooltip && isOpen && (
          <div className="bg-[#2a3224]/95 border border-emerald-500/20 text-[11px] p-3 rounded-none mt-1 mb-3 text-slate-200" id="instructions-tooltip">
            <p className="font-semibold text-emerald-400 mb-1">💡 Interaction Study:</p>
            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-300">
              <li><strong>Move cursor</strong> anywhere to concentrate water drops.</li>
              <li><strong>Click on meadow</strong> to trigger ripples and plant additions.</li>
              <li>Toggle parameters to observe physical spring sways.</li>
            </ul>
          </div>
        )}

        {isOpen && (
          <div className="mt-4 space-y-4 text-[11px] max-h-[440px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-800 scrollbar-track-transparent">
            
            {/* Weather Mode Buttons */}
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-[#F5F2ED]/60 font-semibold mb-2 flex items-center gap-1">
                <CloudRain className="w-3 h-3" /> Rain State
              </span>
              <div className="grid grid-cols-3 gap-1.5" id="rain-mode-selectors">
                {(['hover', 'always', 'none'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('rainMode', mode)}
                    className={`py-1 bg-[#2C3325]/40 hover:bg-[#2C3325]/75 text-[10px] font-medium capitalize border transition-all rounded-none ${
                      settings.rainMode === mode
                        ? 'bg-emerald-800/30 text-emerald-300 border-emerald-500'
                        : 'text-slate-300 border-[#2C3325]'
                    }`}
                    id={`rain-mode-${mode}`}
                  >
                    {mode === 'hover' ? 'Hover' : mode === 'always' ? 'Ambient' : 'Clear'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Rain & Wind */}
            {settings.rainMode !== 'none' && (
              <div>
                <div className="flex justify-between items-center text-[9px] text-[#F5F2ED]/60 font-semibold uppercase tracking-wider mb-1">
                  <span>Precipitation Volume</span>
                  <span className="font-mono text-emerald-300">{settings.intensity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={settings.intensity}
                  onChange={(e) => updateSetting('intensity', parseInt(e.target.value))}
                  className="w-full h-1 bg-[#2C3325] rounded-none appearance-none cursor-pointer accent-emerald-500"
                  id="intensity-slider"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between items-center text-[9px] text-[#F5F2ED]/60 font-semibold uppercase tracking-wider mb-1">
                <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> Wind Velocity</span>
                <span className="font-mono text-emerald-300">{settings.windStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.windStrength}
                onChange={(e) => updateSetting('windStrength', parseInt(e.target.value))}
                className="w-full h-1 bg-[#2C3325] rounded-none appearance-none cursor-pointer accent-emerald-500"
                id="wind-strength-slider"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[9px] text-[#F5F2ED]/60 font-semibold uppercase tracking-wider mb-1">
                <span>Wind Heading</span>
                <span className="font-mono text-emerald-300">{settings.windAngle}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={settings.windAngle}
                onChange={(e) => updateSetting('windAngle', parseInt(e.target.value))}
                className="w-full h-1 bg-[#2C3325] rounded-none appearance-none cursor-pointer accent-emerald-500"
                id="wind-angle-slider"
              />
            </div>

            {/* Density Selector */}
            <div>
              <span className="block text-[9px] uppercase tracking-wider text-[#F5F2ED]/60 font-semibold mb-2 flex items-center gap-1">
                <Flower className="w-3 h-3" /> Botanical Density
              </span>
              <div className="grid grid-cols-3 gap-1.5" id="density-selectors">
                {(['sparse', 'normal', 'lush'] as const).map((density) => (
                  <button
                    key={density}
                    onClick={() => updateSetting('flowerDensity', density)}
                    className={`py-1 bg-[#2C3325]/40 hover:bg-[#2C3325]/75 text-[10px] font-medium capitalize border transition-all rounded-none ${
                      settings.flowerDensity === density
                        ? 'bg-emerald-800/30 text-emerald-300 border-emerald-500'
                        : 'text-slate-300 border-[#2C3325]'
                    }`}
                    id={`density-${density}`}
                  >
                    {density === 'sparse' ? 'Sparse' : density === 'normal' ? 'Normal' : 'Lush'}
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Section */}
            <div className="border-t border-white/5 pt-3">
              <span className="block text-[9px] uppercase tracking-wider text-[#F5F2ED]/60 font-semibold mb-2">
                Solfeggio Synthesis
              </span>
              <div className="flex items-center justify-between gap-3 bg-[#1c2217] p-2 rounded-none border border-white/5" id="audio-panel">
                <button
                  onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                  className={`flex items-center gap-1.5 py-0.5 px-2 rounded-none text-[10px] font-medium border transition-all ${
                    settings.soundEnabled
                      ? 'bg-emerald-800/30 text-emerald-300 border-emerald-500'
                      : 'bg-black/20 text-slate-400 border-transparent'
                  }`}
                  id="sound-toggle-button"
                >
                  {settings.soundEnabled ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Audio ON
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5" /> Muted
                    </>
                  )}
                </button>
                {settings.soundEnabled && (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-[8px] text-slate-400">Vol</span>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={settings.soundVolume}
                      onChange={(e) => updateSetting('soundVolume', parseInt(e.target.value))}
                      className="w-full h-0.5 bg-[#2C3325] rounded-none appearance-none cursor-pointer accent-emerald-500"
                      id="volume-slider"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Theme Presets */}
            <div className="border-t border-white/5 pt-3" id="themes-section">
              <span className="block text-[9px] uppercase tracking-wider text-[#F5F2ED]/60 font-semibold mb-2 flex items-center gap-1">
                <Palette className="w-3 h-3" /> Environment Mood
              </span>
              <div className="grid grid-cols-2 gap-1.5" id="theme-button-grid">
                {(Object.keys(THEMES) as ThemeId[]).map((themeId) => {
                  const t = THEMES[themeId];
                  return (
                    <button
                      key={themeId}
                      onClick={() => updateSetting('theme', themeId)}
                      className={`text-left p-1.5 rounded-none border transition-all flex flex-col justify-between h-12 ${
                        settings.theme === themeId
                          ? 'bg-emerald-800/30 border-emerald-500 text-emerald-250 shadow-md'
                          : 'bg-black/10 border-transparent text-slate-300 hover:bg-[#2C3325]/30'
                      }`}
                      id={`theme-select-${themeId}`}
                    >
                      <span className="font-semibold text-[10px] flex items-center gap-1">
                        <span 
                          className="w-2 h-2 rounded-full inline-block border border-white/10" 
                          style={{ background: `linear-gradient(135deg, ${t.skyGradientStart}, ${t.groundColor})` }}
                        />
                        {t.label}
                      </span>
                      <span className="text-[8px] text-slate-400 leading-tight line-clamp-1">
                        {themeId === 'moonrise' ? '🌙 Nocturnal Silver' : themeId === 'sunset' ? '🌇 Amber Archive' : themeId === 'indigo' ? '☔ Overcast navy' : '🍀 Botanical Green'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[8.5px] text-[#F5F2ED]/60 italic mt-2 text-center" id="theme-explanation">
                {getThemeDescription(settings.theme)}
              </p>
            </div>

            {/* Digital Sensor Physics Telemetry (Human-centered stats) */}
            <div className="border-t border-white/5 pt-3" id="telemetry-section">
              <span className="block text-[9px] uppercase tracking-wider text-[#F5F2ED]/60 font-semibold mb-2 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" /> Core Metrics
              </span>
              <div className="grid grid-cols-2 gap-1.5 bg-black/10 p-2 rounded-none border border-white/5 font-mono text-[9px] text-slate-300" id="stats-display">
                <div className="flex flex-col">
                  <span className="text-[#F5F2ED]/40 text-[8px] uppercase">Flora In Bloom</span>
                  <span className="text-[11px] font-bold text-emerald-400">{stats.flowerCount} stems</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#F5F2ED]/40 text-[8px] uppercase">Drizzle Droplets</span>
                  <span className="text-[11px] font-bold text-sky-450">{stats.dropletsCount} drops</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#F5F2ED]/40 text-[8px] uppercase">Wave Fronts</span>
                  <span className="text-[11px] font-bold text-blue-300">{stats.ripplesCount} rings</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#F5F2ED]/40 text-[8px] uppercase">Wind Velocity</span>
                  <span className="text-[11px] font-bold text-indigo-300">{stats.windMph} MPH</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
