import React, { useRef, useEffect, useState } from 'react';
import { Flower, Raindrop, Splash, Ripple, Settings, ThemeSettings } from '../types';
import { audioInstance } from '../utils/audio';

interface ChamomileFieldProps {
  settings: Settings;
  activeTheme: ThemeSettings;
  setStats: React.Dispatch<React.SetStateAction<{
    flowerCount: number;
    dropletsCount: number;
    ripplesCount: number;
    windMph: number;
  }>>;
}

export const THEMES: Record<string, ThemeSettings> = {
  meadow: {
    id: 'meadow',
    label: 'Botanical Olive',
    skyGradientStart: '#3D4435',
    skyGradientEnd: '#2C3325',
    groundColor: '#181E13',
    fieldGlow: 'rgba(255, 255, 255, 0.08)',
    ambientLight: 0.85,
    petalColor: '#ffffff',
    centerColor: '#FFD700',
    accentGlow: 'rgba(255, 215, 0, 0.45)',
  },
  indigo: {
    id: 'indigo',
    label: 'Rainy Twilight',
    skyGradientStart: '#1d2a44',
    skyGradientEnd: '#131927',
    groundColor: '#0a101d',
    fieldGlow: 'rgba(100, 180, 255, 0.12)',
    ambientLight: 0.45,
    petalColor: '#e3ecf5',
    centerColor: '#e0a500',
    accentGlow: 'rgba(120, 200, 255, 0.3)',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset Archive',
    skyGradientStart: '#fc5a50',
    skyGradientEnd: '#3a1129',
    groundColor: '#1F0B15',
    fieldGlow: 'rgba(245, 242, 237, 0.12)',
    ambientLight: 0.65,
    petalColor: '#F5F2ED',
    centerColor: '#ffa200',
    accentGlow: 'rgba(255, 110, 50, 0.35)',
  },
  moonrise: {
    id: 'moonrise',
    label: 'Midnight Flora',
    skyGradientStart: '#080d1a',
    skyGradientEnd: '#02050c',
    groundColor: '#010503',
    fieldGlow: 'rgba(160, 255, 200, 0.1)',
    ambientLight: 0.3,
    petalColor: '#fcfbf9',
    centerColor: '#ffd700',
    accentGlow: 'rgba(255, 255, 255, 0.35)',
  },
};

interface Firefly {
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  life: number;
  phase: number;
  size: number;
}

export const ChamomileField: React.FC<ChamomileFieldProps> = ({ settings, activeTheme, setStats }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Core physics arrays
  const flowersPoolRef = useRef<Flower[]>([]);
  const raindropsRef = useRef<Raindrop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);

  // Interaction tracking state
  const mouseRef = useRef<{ x: number; y: number; isOver: boolean; lastX: number; lastY: number }>({
    x: 0,
    y: 0,
    isOver: false,
    lastX: 0,
    lastY: 0,
  });

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const animationFrameId = useRef<number | null>(null);
  const nextIdRef = useRef<number>(1);

  // Trigger audio updates when parameters alter
  useEffect(() => {
    audioInstance.updateParameters(
      settings.rainMode === 'none' ? 0 : settings.intensity,
      settings.windStrength,
      settings.soundEnabled
    );
    audioInstance.setVolume(settings.soundVolume);
  }, [settings.rainMode, settings.intensity, settings.windStrength, settings.soundEnabled, settings.soundVolume]);

  // Adjust density dynamically by changing opacity mapping in real-time, matching normal, sparse, lush count limits
  useEffect(() => {
    let targetCount = 80;
    if (settings.flowerDensity === 'sparse') targetCount = 35;
    if (settings.flowerDensity === 'lush') targetCount = 150;

    const currentCount = flowersPoolRef.current.length;
    
    if (currentCount < targetCount) {
      // Add more flowers
      const toAdd = targetCount - currentCount;
      for (let i = 0; i < toAdd; i++) {
        flowersPoolRef.current.push(createRandomFlower(nextIdRef.current++, 1));
      }
    } else if (currentCount > targetCount) {
      // Flag excess flowers to fade out rather than abrupt deletion
      let flagged = 0;
      const toRemove = currentCount - targetCount;
      
      // Select random candidates to fade out
      for (let i = flowersPoolRef.current.length - 1; i >= 0 && flagged < toRemove; i--) {
        const flower = flowersPoolRef.current[i];
        if (flower.opacity > 0) {
          // Accelerate decay
          flower.targetAngle = -9.9; // Hack indicator to fade out
          flagged++;
        }
      }
    }
  }, [settings.flowerDensity]);

  // Handle Plant-A-Flower manual interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Relative coords
    const rx = clickX / canvasRef.current.width;
    const ry = clickY / canvasRef.current.height;

    // Force a powerful splash ripple
    spawnRipple(clickX, clickY, 35, 2.5);
    audioInstance.playDrip(1.0);

    // Spawn 10 splash particles
    for (let i = 0; i < 12; i++) {
      splashesRef.current.push({
        id: nextIdRef.current++,
        x: clickX,
        y: clickY,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: 1.5 + Math.random() * 2,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        alpha: 1,
      });
    }

    // Plant chamomile right there!
    // Give it size = 0 and animate scale-up
    const flowerId = nextIdRef.current++;
    const newFlower: Flower = {
      id: flowerId,
      x: rx,
      y: ry,
      size: 0.1, // starts tiny
      stemLength: 25 + Math.random() * 30,
      angle: 0,
      targetAngle: 0,
      angularVel: 0,
      rotation: Math.random() * Math.PI * 2,
      petalCount: 13 + Math.floor(Math.random() * 7),
      swaySpeed: 1.2 + Math.random() * 2,
      swayPhase: Math.random() * Math.PI * 2,
      dripTimer: 0,
      dripsAccumulated: 0,
      opacity: 0.05, // fades in
    };

    flowersPoolRef.current.push(newFlower);

    // Trigger subtle wind chime
    audioInstance.tryPlayWindChime();
  };

  // Helper constructors
  const createRandomFlower = (id: number, startOpacity: number = 0): Flower => {
    return {
      id,
      x: 0.05 + Math.random() * 0.9,
      y: 0.05 + Math.random() * 0.9,
      size: 0.7 + Math.random() * 0.65,
      stemLength: 25 + Math.random() * 35,
      angle: 0,
      targetAngle: 0,
      angularVel: 0,
      rotation: Math.random() * Math.PI * 2,
      petalCount: 13 + Math.floor(Math.random() * 7),
      swaySpeed: 1.3 + Math.random() * 1.8,
      swayPhase: Math.random() * Math.PI * 2,
      dripTimer: Math.random() * 300,
      dripsAccumulated: 0,
      opacity: startOpacity,
    };
  };

  const spawnRipple = (x: number, y: number, maxRad: number = 20, strength: number = 1.0) => {
    ripplesRef.current.push({
      id: nextIdRef.current++,
      x,
      y,
      radius: 2,
      maxRadius: maxRad,
      strength,
      speed: 1.2 + Math.random() * 1.2,
      life: 0,
      maxLife: 45 + Math.random() * 25,
    });
  };

  // Setup Responsive Canvas Node via element ResizeObserver
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent || !canvasRef.current) return;

    const spawnInitialState = (w: number, h: number) => {
      // Setup flowers pool
      let initialCount = 80;
      if (settings.flowerDensity === 'sparse') initialCount = 35;
      if (settings.flowerDensity === 'lush') initialCount = 150;

      if (flowersPoolRef.current.length === 0) {
        const pool: Flower[] = [];
        for (let i = 0; i < initialCount; i++) {
          pool.push(createRandomFlower(nextIdRef.current++, 1.0));
        }
        flowersPoolRef.current = pool;
      }

      // Initialize fireflies
      const flies: Firefly[] = [];
      for (let i = 0; i < 20; i++) {
        flies.push({
          rx: Math.random(),
          ry: Math.random(),
          vx: (Math.random() - 0.5) * 0.0015,
          vy: (Math.random() - 0.5) * 0.0015,
          life: Math.random() * 100,
          phase: Math.random() * Math.PI * 2,
          size: 1 + Math.random() * 2,
        });
      }
      firefliesRef.current = flies;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      const w = Math.max(280, Math.floor(width));
      const h = Math.max(250, Math.floor(height));

      setDimensions({ width: w, height: h });
      if (canvasRef.current) {
        canvasRef.current.width = w;
        canvasRef.current.height = h;
      }
      spawnInitialState(w, h);
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Main Physics & Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrameId: number;

    const frame = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. PHYSICAL UPDATES
      const windAngleRad = (settings.windAngle * Math.PI) / 180;
      const maxWindForce = (settings.windStrength / 100) * 0.35;
      
      // Modulate wind force slowly using sine time oscillation
      const timeSec = Date.now() / 1000;
      const windMod = 0.6 + Math.sin(timeSec * 0.7) * 0.35 + Math.cos(timeSec * 2.1) * 0.15;
      const activeWindX = Math.cos(windAngleRad) * maxWindForce * windMod;
      const activeWindY = Math.sin(windAngleRad) * maxWindForce * windMod;

      // Update Hover states & localized hover events (Rain spawning)
      const mouse = mouseRef.current;
      const rainRange = 170; // radius of mouse-cast storm

      if (mouse.isOver && settings.rainMode !== 'none') {
        const dX = mouse.x - mouse.lastX;
        const dY = mouse.y - mouse.lastY;
        const speed = Math.sqrt(dX * dX + dY * dY);
        
        // Dynamic cursor ripple cast from drag movement
        if (speed > 1.5 && Math.random() < 0.15) {
          spawnRipple(mouse.x + (Math.random() - 0.5) * 15, mouse.y + (Math.random() - 0.5) * 15, 12, 0.4);
        }

        // Spawn localized cursor rain particle streams
        const dropSpawnRate = Math.floor((settings.intensity / 100) * 8) + 1;
        for (let i = 0; i < dropSpawnRate; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.sqrt(Math.random()) * rainRange;
          const targetX = mouse.x + Math.cos(angle) * dist;
          const targetY = mouse.y + Math.sin(angle) * dist;

          if (targetX >= 0 && targetX <= w && targetY >= 0 && targetY <= h) {
            raindropsRef.current.push({
              id: nextIdRef.current++,
              targetX,
              targetY,
              z: 300 + Math.random() * 200, // Sky altitude
              vz: 11 + (settings.intensity / 100) * 5 + Math.random() * 4,
              length: 12 + Math.random() * 15,
              alpha: 0.2 + Math.random() * 0.6,
              isCursorRain: true,
            });
          }
        }

        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
      }

      // Spawn ambient drops if mode set to always
      if (settings.rainMode === 'always') {
        const ambientSpawnCount = Math.floor((settings.intensity / 100) * 4) + 1;
        for (let i = 0; i < ambientSpawnCount; i++) {
          raindropsRef.current.push({
            id: nextIdRef.current++,
            targetX: Math.random() * w,
            targetY: Math.random() * h,
            z: 350 + Math.random() * 200,
            vz: 10 + (settings.intensity / 100) * 4 + Math.random() * 4,
            length: 10 + Math.random() * 12,
            alpha: 0.15 + Math.random() * 0.4,
            isCursorRain: false,
          });
        }
      }

      // Update Raindrops Ref
      const activeDrops: Raindrop[] = [];
      const windPushMagnitude = Math.cos(windAngleRad) * (settings.windStrength / 100) * 5;

      raindropsRef.current.forEach((drop) => {
        // Fall down
        drop.z -= drop.vz;

        // Apply wind deflection to falling path
        const windScaleOffset = drop.z * 0.05 * windPushMagnitude;

        if (drop.z <= 0) {
          // HIT! Target Plane reached
          // Correct for coordinate mapping shift
          const landX = drop.targetX;
          const landY = drop.targetY;

          // Sound triggers and micro-ripples
          if (landX >= 0 && landX <= w && landY >= 0 && landY <= h) {
            // Trigger procedural water ripples
            const isClickRain = (settings.intensity > 70 && Math.random() < 0.02) || (Math.random() < 0.003);
            const ripRad = drop.isCursorRain ? 12 + Math.random() * 8 : 10 + Math.random() * 6;
            spawnRipple(landX, landY, ripRad, drop.isCursorRain ? 0.8 : 0.4);

            // Occasional splash drips audio
            if (Math.random() < 0.04) {
              audioInstance.playDrip(drop.isCursorRain ? 0.35 : 0.15);
            }

            // Spawn Splash fragments
            const splashCount = 2 + Math.floor(Math.random() * 3);
            for (let j = 0; j < splashCount; j++) {
              splashesRef.current.push({
                id: nextIdRef.current++,
                x: landX,
                y: landY,
                vx: (Math.random() - 0.5) * 3 + windPushMagnitude * 0.2,
                vy: (Math.random() - 0.5) * 2 - (0.5 + Math.random() * 2.5), // bounce upward vertically
                radius: 0.8 + Math.random() * 1.2,
                life: 0,
                maxLife: 15 + Math.random() * 15,
                alpha: drop.alpha,
              });
            }

            // Physics transfer to flowers!
            // Check closeness to any flower
            flowersPoolRef.current.forEach((flower) => {
              const flX = flower.x * w;
              const flY = flower.y * h;
              const fRad = flower.size * 25;
              const distSqr = (landX - flX) * (landX - flX) + (landY - flY) * (landY - flY);

              if (distSqr < (fRad + 12) * (fRad + 12)) {
                // Impressive direct impact force!
                const forceStr = (1.5 + Math.random() * 2.5) * (1 - Math.sqrt(distSqr) / (fRad + 12));
                const deflectAngle = Math.random() * Math.PI * 2;
                
                // Add velocity to flower spring
                flower.angularVel += (Math.cos(deflectAngle) * forceStr * 0.04) / (flower.size + 0.5);
                
                // Dew accumulation
                if (Math.random() < 0.4 && flower.dripsAccumulated < 6) {
                  flower.dripsAccumulated += 0.25;
                }

                // If massive hit, play delicate chime occasionally
                if (Math.random() < 0.004 && settings.rainMode !== 'none') {
                  audioInstance.tryPlayWindChime();
                }
              }
            });
          }
        } else {
          activeDrops.push(drop);
        }
      });
      raindropsRef.current = activeDrops;

      // Update Splashes Ref (water droplet fragments bounces on hit)
      const activeSplashes: Splash[] = [];
      splashesRef.current.forEach((sp) => {
        sp.life++;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.15; // simple gravity curve
        sp.alpha = 1 - sp.life / sp.maxLife;

        if (sp.life < sp.maxLife && sp.y < h + 20) {
          activeSplashes.push(sp);
        }
      });
      splashesRef.current = activeSplashes;

      // Update Ripples Ref
      const activeRipples: Ripple[] = [];
      ripplesRef.current.forEach((rp) => {
        rp.life++;
        rp.radius += rp.speed;
        const decayRatio = rp.life / rp.maxLife;
        rp.strength = (1 - decayRatio) * (1 - decayRatio);

        if (rp.life < rp.maxLife) {
          activeRipples.push(rp);
        }
      });
      ripplesRef.current = activeRipples;

      // Update Flowers Ref (Sway dynamics, density fading)
      const liveFlowers: Flower[] = [];
      flowersPoolRef.current.forEach((fl) => {
        // Density fade-in handler
        if (fl.opacity < 1 && fl.targetAngle !== -9.9) {
          fl.opacity = Math.min(1.0, fl.opacity + 0.02);
        }
        
        // Density fade-out indicator (targetAngle = -9.9 is our special decay marker)
        if (fl.targetAngle === -9.9) {
          fl.opacity -= 0.02;
          if (fl.opacity <= 0.0) {
            return; // Completely prune
          }
        }

        // Animate initial growth popped from manual planting click
        if (fl.size < 1.0 && fl.opacity > 0 && fl.targetAngle !== -9.9) {
          // Smooth asymptotic scale-up limit matching size pool
          fl.size = Math.min(1.1, fl.size + 0.04);
        }

        // Natural sway oscillator
        const osc = Math.sin(timeSec * fl.swaySpeed + fl.swayPhase) * 0.08 * (1 + settings.windStrength / 55);
        
        // Wind bend alignment
        const targetWindBend = (settings.windStrength / 100) * 0.45;
        const targetXAngle = Math.cos(windAngleRad) * targetWindBend + osc;

        // Oscillative spring physics:
        // stiffness restoring, velocity damping
        const stiffness = 0.065;
        const damping = 0.88;
        const diffAngle = targetXAngle - fl.angle;
        
        // Hooke's Law approximation
        const restoringForce = diffAngle * stiffness;
        fl.angularVel = fl.angularVel * damping + restoringForce;
        fl.angle += fl.angularVel;

        // Water ripple bobbing logic!
        // If a water wave front rolls past, wobble the flower scale and position!
        let ripBobX = 0;
        let ripBobY = 0;
        const flXPx = fl.x * w;
        const flYPx = fl.y * h;

        ripplesRef.current.forEach((rp) => {
          const dx = flXPx - rp.x;
          const dy = flYPx - rp.y;
          const rDist = Math.sqrt(dx * dx + dy * dy);
          
          // Is water wave front hitting flower stem?
          const waveFrontDiff = Math.abs(rDist - rp.radius);
          if (waveFrontDiff < 30) {
            const influence = (1 - waveFrontDiff / 30) * rp.strength * 0.08;
            // Push flower head outwards along wave expansion normal
            const ang = Math.atan2(dy, dx);
            ripBobX += Math.cos(ang) * influence;
            ripBobY += Math.sin(ang) * influence;
          }
        });

        // Save computed transient bobs inside transient variables during drawing
        (fl as any).bobX = ripBobX;
        (fl as any).bobY = ripBobY;

        // Handle dew accumulation drops draining
        if (settings.rainMode !== 'none') {
          fl.dripTimer += 0.5 + Math.random() * (settings.intensity / 40);
          if (fl.dripTimer > 450) {
            fl.dripTimer = 0;
            if (fl.dripsAccumulated > 0.5) {
              fl.dripsAccumulated = Math.max(0, fl.dripsAccumulated - 1);
              // Fall off, spawn micro ripple at stem root, and play drip audio
              spawnRipple(fl.x * w, fl.y * h, 14, 0.45);
              if (Math.random() < 0.2) {
                audioInstance.playDrip(0.2);
              }
            }
          }
        }

        liveFlowers.push(fl);
      });
      flowersPoolRef.current = liveFlowers;

      // Update fireflies in Moonlight Mist
      if (activeTheme.id === 'moonrise') {
        firefliesRef.current.forEach((ff) => {
          ff.phase += 0.02;
          
          // Apply drift
          ff.rx += ff.vx + Math.cos(ff.phase) * 0.0002 + activeWindX * 0.0004;
          ff.ry += ff.vy + Math.sin(ff.phase * 0.7) * 0.0002 + activeWindY * 0.0004;

          // Wall bounds check
          if (ff.rx < 0) ff.rx = 1;
          if (ff.rx > 1) ff.rx = 0;
          if (ff.ry < 0) ff.ry = 1;
          if (ff.ry > 1) ff.ry = 0;
        });
      }

      // Sync stats with UI once/twice a second to preserve CPU
      if (Math.random() < 0.15) {
        setStats({
          flowerCount: flowersPoolRef.current.filter(f => f.opacity > 0.1).length,
          dropletsCount: raindropsRef.current.length,
          ripplesCount: ripplesRef.current.length,
          windMph: Math.round(settings.windStrength * 0.45),
        });
      }


      // 2. RENDERING CANVAS
      ctx.clearRect(0, 0, w, h);

      // Sky/Meadow background gradients
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, activeTheme.skyGradientStart);
      skyGrad.addColorStop(1, activeTheme.skyGradientEnd);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Rain hover cloud glowing shadow
      if (mouse.isOver && settings.rainMode !== 'none') {
        const hGlow = ctx.createRadialGradient(mouse.x, mouse.y, 20, mouse.x, mouse.y, rainRange);
        hGlow.addColorStop(0, 'rgba(0,0,0,0.06)');
        hGlow.addColorStop(0.5, 'rgba(0,0,0,0.02)');
        hGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = hGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, rainRange, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw active Water ripples underneath chamomile heads to mimic surface water layer depth
      // But above background field
      ctx.save();
      ripplesRef.current.forEach((rp) => {
        const alph = rp.strength * 0.45;

        // Rippling refraction ring highlight
        ctx.strokeStyle = `rgba(255, 255, 255, ${alph})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Rippling dark shadow refraction trough
        ctx.strokeStyle = `rgba(0, 0, 0, ${alph * 0.45})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, Math.max(0.5, rp.radius - 3.5), 0, Math.PI * 2);
        ctx.stroke();

        // Inner soft secondary wave echoing
        if (rp.radius > 15) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alph * 0.25})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.radius - 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.restore();


      // SORT AND DRAW FLOWERS (by Y coordinate so higher depth renders correctly)
      const sortedFlowers = [...flowersPoolRef.current].sort((a, b) => a.y - b.y);

      sortedFlowers.forEach((flower) => {
        ctx.save();
        ctx.globalAlpha = flower.opacity;

        const flX = flower.x * w;
        const flY = flower.y * h;
        const stemLen = flower.stemLength;
        const fSize = flower.size;

        // Retrieve transient wave bob offsets computed earlier
        const bX = (flower as any).bobX || 0;
        const bY = (flower as any).bobY || 0;

        // Chamomile sway head calculations
        // headX and headY are computed relative to stem root (flX, flY)
        const bendX = Math.sin(flower.angle) * stemLen;
        const bendY = -Math.cos(flower.angle) * (stemLen * 0.2); // slight 3D foreshortening

        const headX = flX + bendX + bX * 300;
        const headY = flY + bendY + bY * 300;

        // 2A. Stem Rendering
        ctx.strokeStyle = activeTheme.id === 'moonrise' ? '#0f341d' : '#2f5b35';
        ctx.lineWidth = (1.8 + fSize * 0.8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(flX, flY + 5); // stem anchor base on soil ground plane
        
        // Curved green stem
        ctx.quadraticCurveTo(
          flX + bendX * 0.4, 
          flY + bendY * 0.5, 
          headX, 
          headY
        );
        ctx.stroke();

        // 2B. Soft Shadow Casting (lifted look)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        // Shift shadow right/down depending on light height
        ctx.ellipse(
          flX + bendX * 0.6 + (activeTheme.ambientLight < 0.5 ? 5 : 12), 
          flY + 3, 
          12 * fSize, 
          5 * fSize, 
          0, 
          0, 
          Math.PI * 2
        );
        ctx.fill();

        // 2C. Draw Chamomile Petals (Facing upwards)
        // Draw 14-22 soft white rounded rays
        const petCount = flower.petalCount;
        const pRadius = 14 * fSize;
        const pWidth = 4.2 * fSize;

        // Compute head-pointing ellipse compression to achieve 3D tilt perspective
        // Tilt axis corresponds to current sway vector displacement direction
        const swayStrength = Math.abs(flower.angle);
        const tiltScaleX = 1 - swayStrength * 0.38;
        const tiltScaleY = 1 - swayStrength * 0.12;

        ctx.translate(headX, headY);
        ctx.rotate(flower.rotation);
        ctx.scale(tiltScaleX, tiltScaleY);

        ctx.shadowBlur = activeTheme.id === 'moonrise' ? 8 : 0;
        ctx.shadowColor = activeTheme.accentGlow;

        for (let i = 0; i < petCount; i++) {
          const rotAngle = (i / petCount) * Math.PI * 2;
          ctx.save();
          ctx.rotate(rotAngle);

          // Chamomile petal shape path (oblong, slightly wider, narrowing at tip and center base)
          ctx.fillStyle = activeTheme.petalColor;
          ctx.beginPath();
          ctx.moveTo(0, 0); // starting from center base
          
          ctx.bezierCurveTo(
            -pWidth * 0.7, -pRadius * 0.35, 
            -pWidth * 1.1, -pRadius * 0.85, 
            0, -pRadius
          );
          ctx.bezierCurveTo(
            pWidth * 1.1, -pRadius * 0.85, 
            pWidth * 0.7, -pRadius * 0.35, 
            0, 0
          );
          ctx.closePath();
          ctx.fill();

          // Petal delicate center spine cream highlights
          ctx.fillStyle = 'rgba(255, 255, 230, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, -pRadius * 0.45, pWidth * 0.25, pRadius * 0.42, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        ctx.shadowBlur = 0; // reset shadows

        // 2D. Large Golden center disk (floret dome)
        const dRadius = 6.2 * fSize;
        
        // Puffy 3D hemispherical shading
        const radGrad = ctx.createRadialGradient(-dRadius * 0.25, -dRadius * 0.25, dRadius * 0.1, 0, 0, dRadius);
        radGrad.addColorStop(0, '#fff450');
        radGrad.addColorStop(0.3, activeTheme.centerColor);
        radGrad.addColorStop(1, activeTheme.id === 'moonrise' ? '#cc9e00' : '#8f6800');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, dRadius * 1.1, dRadius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glistening texture (detailed tubulous floret florets ring overlay)
        ctx.strokeStyle = activeTheme.id === 'moonrise' ? 'rgba(255,255,255,0.7)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, dRadius * 0.65, dRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.ellipse(0, 2, dRadius * 0.9, dRadius * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Render glistening dew droplets on yellow center!
        if (flower.dripsAccumulated > 0.5 && settings.rainMode !== 'none') {
          const dropletsNum = Math.min(5, Math.floor(flower.dripsAccumulated));
          ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
          ctx.shadowBlur = 1.2;
          ctx.shadowColor = '#fff';

          for (let d = 0; d < dropletsNum; d++) {
            const dAngle = (d / dropletsNum) * Math.PI * 2 + timeSec * 0.5;
            const dropDist = dRadius * 0.45;
            const drX = Math.cos(dAngle) * dropDist;
            const drY = Math.sin(dAngle) * dropDist;

            ctx.beginPath();
            ctx.arc(drX, drY, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // 2E. Draw slow fireflies in Moonlight theme
      if (activeTheme.id === 'moonrise') {
        firefliesRef.current.forEach((ff) => {
          const lX = ff.rx * w;
          const lY = ff.ry * h;
          const glowAlph = (0.22 + Math.sin(ff.phase) * 0.45) * 0.95;

          if (glowAlph > 0) {
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = 'rgba(120, 255, 120, 0.9)';

            const glowGrad = ctx.createRadialGradient(lX, lY, 0.5, lX, lY, ff.size * 6.5);
            glowGrad.addColorStop(0, `rgba(220, 255, 200, ${glowAlph})`);
            glowGrad.addColorStop(0.35, `rgba(140, 255, 120, ${glowAlph * 0.45})`);
            glowGrad.addColorStop(1, 'rgba(140, 255, 120, 0)');

            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(lX, lY, ff.size * 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        });
      }


      // 2F. Draw rain streaks in foreground
      ctx.save();
      // Rotate drawing to align with wind direction during linear render
      raindropsRef.current.forEach((drop) => {
        // Wind horizontal skew coordinates mapping
        const slantX = Math.cos(windAngleRad) * (settings.windStrength / 90);
        const altitudeSkewX = drop.z * 0.16 * slantX;

        // Translate plane coordinates to actual 3D projecting position
        const drawX = drop.targetX + altitudeSkewX;
        const drawY = drop.targetY - drop.z * 0.4; // 0.4 squash factor matches camera tilt

        const lenX = Math.cos(windAngleRad + Math.PI / 2) * drop.length * 0.35;
        const lenY = Math.sin(windAngleRad + Math.PI / 2) * drop.length;

        // Render sleek rain light streaks
        const lineGrad = ctx.createLinearGradient(drawX, drawY, drawX - lenX, drawY - lenY);
        const col = activeTheme.id === 'moonrise' ? '180, 255, 235' : (activeTheme.id === 'indigo' ? '140, 195, 255' : '230, 245, 255');
        lineGrad.addColorStop(0, `rgba(${col}, ${drop.alpha})`);
        lineGrad.addColorStop(1, `rgba(${col}, 0)`);

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = drop.isCursorRain ? 1.5 : 1.1;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(drawX, drawY);
        ctx.lineTo(drawX - lenX, drawY - lenY);
        ctx.stroke();
      });
      ctx.restore();

      // Draw splash particles
      ctx.save();
      splashesRef.current.forEach((sp) => {
        ctx.fillStyle = activeTheme.id === 'moonrise' ? `rgba(200, 255, 240, ${sp.alpha})` : `rgba(255, 255, 255, ${sp.alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Render outer field mist fog overlay
      if (activeTheme.id === 'moonrise' || activeTheme.id === 'indigo') {
        const mistGrad = ctx.createLinearGradient(0, 0, 0, h);
        mistGrad.addColorStop(0, 'rgba(10, 30, 25, 0.08)');
        mistGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.0)');
        mistGrad.addColorStop(1, 'rgba(8, 20, 35, 0.12)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, 0, w, h);
      } else if (activeTheme.id === 'sunset') {
        const glowGrad = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, Math.max(w, h));
        glowGrad.addColorStop(0, 'rgba(253, 90, 50, 0.05)');
        glowGrad.addColorStop(1, 'rgba(70, 10, 35, 0.1)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, w, h);
      }


      // Hook onto next frame recursively
      localFrameId = requestAnimationFrame(frame);
    };

    // Kickoff frame loop
    localFrameId = requestAnimationFrame(frame);
    animationFrameId.current = localFrameId;

    return () => {
      if (localFrameId) {
        cancelAnimationFrame(localFrameId);
      }
    };
  }, [settings, activeTheme]);

  // Track Mouse Move Events safely inside canvas parent
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.x = x;
    mouseRef.current.y = y;
    mouseRef.current.isOver = true;
  };

  const handleMouseEnter = () => {
    mouseRef.current.isOver = true;
    if (settings.soundEnabled && settings.rainMode !== 'none') {
      // Gentle audio kick
      audioInstance.updateParameters(settings.intensity, settings.windStrength, true);
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.isOver = false;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full rounded-2xl overflow-hidden glass-depth shadow-2xl border border-white/10"
      id="chamomile-field-container"
    >
      <canvas
        ref={canvasRef}
        id="chamomile-canvas"
        className="block w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      />
      {settings.rainMode !== 'none' && mouseRef.current.isOver && (
        <div 
          className="absolute pointer-events-none rounded-full border border-dashed border-white/20 flex items-center justify-center animate-pulse"
          style={{
            left: mouseRef.current.x - 170,
            top: mouseRef.current.y - 170,
            width: 340,
            height: 340,
            background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 70%)',
          }}
          id="rain-ring-indicator"
        />
      )}
    </div>
  );
};
