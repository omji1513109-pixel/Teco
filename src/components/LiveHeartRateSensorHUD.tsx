import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Mic, 
  MicOff, 
  Activity, 
  Volume2, 
  VolumeX, 
  Flame, 
  Zap, 
  Sliders, 
  Sparkles, 
  Info, 
  Radio
} from 'lucide-react';
import { AthleteProfile } from '../types';

interface LiveHeartRateSensorHUDProps {
  athlete: AthleteProfile;
}

export type IntensityPreset = 'resting' | 'aerobic' | 'tempo' | 'threshold' | 'surge';

export const LiveHeartRateSensorHUD: React.FC<LiveHeartRateSensorHUDProps> = ({ athlete }) => {
  // Sensor & Audio Context states
  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [isMicConnected, setIsMicConnected] = useState<boolean>(false);
  const [isHeartSoundEnabled, setIsHeartSoundEnabled] = useState<boolean>(false);
  const [audioInputLevel, setAudioInputLevel] = useState<number>(0); // 0 to 100
  const [sensorStatusMsg, setSensorStatusMsg] = useState<string>('Sensor in standby. Connect mic or run live simulation.');

  // Live physiological state
  const [currentBpm, setCurrentBpm] = useState<number>(142);
  const [targetBpm, setTargetBpm] = useState<number>(142);
  const [rrIntervalMs, setRrIntervalMs] = useState<number>(422);
  const [liveHrvMs, setLiveHrvMs] = useState<number>(68);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isBeating, setIsBeating] = useState<boolean>(false);

  // Manual override slider
  const [manualExertionPercent, setManualExertionPercent] = useState<number>(65);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastBeatTimeRef = useRef<number>(performance.now());
  const ecgHistoryRef = useRef<number[]>([]);

  const maxHr = athlete.maxHeartRate || 192;
  const restingHr = athlete.restingHeartRate || 46;

  // Determine current heart rate zone based on athlete's lactate thresholds
  const getHrZone = (bpm: number) => {
    const pct = Math.round((bpm / maxHr) * 100);
    if (bpm < 135) {
      return {
        zone: 1,
        name: 'Zone 1: Active Recovery',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        badgeColor: 'bg-blue-500',
        desc: 'Parasympathetic flush, conversational effort',
        percent: pct,
      };
    }
    if (bpm <= 152) {
      return {
        zone: 2,
        name: 'Zone 2: Aerobic Base',
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/10 border-lime-500/20',
        badgeColor: 'bg-lime-400',
        desc: 'Mitochondrial biogenesis & lipid oxidation',
        percent: pct,
      };
    }
    if (bpm <= 165) {
      return {
        zone: 3,
        name: 'Zone 3: Aerobic Tempo',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
        badgeColor: 'bg-amber-400',
        desc: 'Sustained endurance, moderate lactate accumulation',
        percent: pct,
      };
    }
    if (bpm <= 175) {
      return {
        zone: 4,
        name: 'Zone 4: Lactate Threshold',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10 border-orange-500/20',
        badgeColor: 'bg-orange-400',
        desc: 'Critical velocity, MCT-1 transporter clearance',
        percent: pct,
      };
    }
    return {
      zone: 5,
      name: 'Zone 5: Anaerobic Surge / VO2 Max',
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      badgeColor: 'bg-rose-500',
      desc: 'Maximal cardiac output & glycolytic surge',
      percent: pct,
    };
  };

  const zoneInfo = getHrZone(currentBpm);

  // Play synthetic cardiac acoustic click via Web Audio API oscillator
  const playCardiacBeep = () => {
    if (!isHeartSoundEnabled) return;
    try {
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  };

  // Toggle Microphone Sensor Stream
  const handleToggleMicSensor = async () => {
    if (isMicConnected) {
      // Disconnect
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      setIsMicConnected(false);
      setAudioInputLevel(0);
      setSensorStatusMsg('Microphone sensor disconnected. Running autonomous biometric loop.');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        setIsMicConnected(true);
        setIsSensorActive(true);
        setSensorStatusMsg('Microphone sensor linked. Acoustic breathing & vocal effort modulates live HR.');
      } catch (err) {
        console.warn('Microphone permission not granted:', err);
        setSensorStatusMsg('Microphone access denied or unavailable. Simulating sensor input.');
        setIsSensorActive(true);
      }
    }
  };

  // Preset buttons
  const applyPreset = (preset: IntensityPreset) => {
    setIsSensorActive(true);
    if (preset === 'resting') {
      setTargetBpm(athlete.restingHeartRate || 48);
      setManualExertionPercent(10);
    } else if (preset === 'aerobic') {
      setTargetBpm(142);
      setManualExertionPercent(45);
    } else if (preset === 'tempo') {
      setTargetBpm(160);
      setManualExertionPercent(68);
    } else if (preset === 'threshold') {
      setTargetBpm(athlete.lactateThresholdHR || 172);
      setManualExertionPercent(84);
    } else {
      setTargetBpm(185);
      setManualExertionPercent(95);
    }
  };

  // Physiological drift & smoothing loop
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);

      // Analyze microphone volume if connected
      let micEnergy = 0;
      if (isMicConnected && analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, v) => acc + v, 0);
        micEnergy = Math.min(100, Math.round((sum / dataArray.length) * 1.8));
        setAudioInputLevel(micEnergy);

        // If high acoustic volume (e.g. heavy breathing, shouting, music), elevate target BPM
        if (micEnergy > 20) {
          const acousticElevated = Math.round(120 + (micEnergy / 100) * 65);
          setTargetBpm((prev) => Math.max(prev, acousticElevated));
        }
      }

      // Smoothly drift current BPM toward target BPM
      setCurrentBpm((prev) => {
        const diff = targetBpm - prev;
        const drift = (Math.random() - 0.5) * 1.5; // Natural autonomic sinus arrhythmia
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 1.8) + drift;
        const nextBpm = Math.max(restingHr, Math.min(maxHr, Math.round(prev + step)));
        
        // Calculate RR interval (ms between beats = 60,000 / BPM)
        const newRr = Math.round(60000 / nextBpm);
        setRrIntervalMs(newRr);

        // Live simulated HRV variation
        const hrvFluctuation = Math.round(55 + (1 - nextBpm / maxHr) * 35 + (Math.random() - 0.5) * 8);
        setLiveHrvMs(Math.max(25, hrvFluctuation));

        return nextBpm;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetBpm, isMicConnected, restingHr, maxHr]);

  // Cardiac beat animation & sound trigger
  useEffect(() => {
    const beatIntervalMs = Math.round(60000 / Math.max(40, currentBpm));
    const beatTimer = setInterval(() => {
      setIsBeating(true);
      playCardiacBeep();
      setTimeout(() => setIsBeating(false), 140);
    }, beatIntervalMs);

    return () => clearInterval(beatTimer);
  }, [currentBpm, isHeartSoundEnabled]);

  // Real-time Canvas ECG / PPG Pulse Line Animator
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x = 0;
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Initialize blank buffer
    ecgHistoryRef.current = new Array(width).fill(centerY);

    let phase = 0;

    const renderWaveform = () => {
      animFrameIdRef.current = requestAnimationFrame(renderWaveform);

      // Speed of waveform scroll based on BPM
      const speed = (currentBpm / 60) * 1.8;
      phase += 0.08 * speed;

      // Generate P-Q-R-S-T cardiac waveform profile
      let y = centerY;
      const beatCycle = phase % (Math.PI * 2);

      // Normal sinus rhythm formula
      if (beatCycle > 1.2 && beatCycle < 1.6) {
        // P-wave (atrial depolarization)
        y -= Math.sin((beatCycle - 1.2) * (Math.PI / 0.4)) * 9;
      } else if (beatCycle >= 1.9 && beatCycle < 2.05) {
        // Q-wave (downward dip)
        y += 7;
      } else if (beatCycle >= 2.05 && beatCycle < 2.25) {
        // R-peak (ventricular depolarization spike)
        const peakT = (beatCycle - 2.05) / 0.2;
        y -= Math.sin(peakT * Math.PI) * 44;
      } else if (beatCycle >= 2.25 && beatCycle < 2.4) {
        // S-wave (sharp downward dip)
        y += 14;
      } else if (beatCycle > 2.8 && beatCycle < 3.5) {
        // T-wave (ventricular repolarization)
        y -= Math.sin((beatCycle - 2.8) * (Math.PI / 0.7)) * 14;
      } else {
        // Isoelectric baseline with subtle sensor noise
        y += (Math.random() - 0.5) * 1.8;
      }

      // Shift history and push new point
      ecgHistoryRef.current.push(y);
      if (ecgHistoryRef.current.length > width) {
        ecgHistoryRef.current.shift();
      }

      // Draw onto canvas
      ctx.fillStyle = '#111319';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background medical grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx < width; gx += 20) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = 0; gy < height; gy += 20) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      // Draw Center Baseline
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.12)';
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Glowing Phosphor ECG Trail
      const isHighZone = currentBpm >= 166;
      const strokeColor = isHighZone ? '#f43f5e' : currentBpm >= 153 ? '#fbbf24' : '#a3e635';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      for (let i = 0; i < ecgHistoryRef.current.length; i++) {
        const px = i;
        const py = ecgHistoryRef.current[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Reset shadow for performance
      ctx.shadowBlur = 0;

      // Draw scanning leader head point
      const lastY = ecgHistoryRef.current[ecgHistoryRef.current.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width - 2, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
    };

    renderWaveform();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [currentBpm]);

  // Handle slider adjustment
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setManualExertionPercent(val);
    const newTarget = Math.round(restingHr + (val / 100) * (maxHr - restingHr));
    setTargetBpm(newTarget);
    setIsSensorActive(true);
  };

  return (
    <section className="neu-card rounded-3xl p-6 sm:p-7 space-y-6">
      
      {/* Sensor HUD Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/40 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-3 rounded-2xl bg-[#111319] border border-white/5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.8)] transition-all ${
              isBeating ? 'scale-110 shadow-[0_0_16px_rgba(244,63,94,0.6)]' : ''
            }`}>
              <Heart className={`h-6 w-6 text-rose-500 fill-rose-500 transition-transform ${isBeating ? 'scale-125' : 'scale-100'}`} />
            </div>
            {/* Live pulsating dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Live Physiological Intensity Monitor</span>
              </h3>
              <span className="neu-btn px-2 py-0.5 rounded text-[10px] font-mono text-lime-400 font-bold uppercase tracking-wider">
                Real-Time Telemetry
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <span>Sensor:</span>
              <span className="text-neutral-200 font-medium">
                {isMicConnected ? 'Acoustic Mic Sensor (Active)' : 'Autonomic Algorithm Loop'}
              </span>
              <span>·</span>
              <span>Max HR: {maxHr} bpm</span>
            </p>
          </div>
        </div>

        {/* Action Toolstrip: Connect Mic Sensor & Audio Beeper */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={handleToggleMicSensor}
            className={`neu-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              isMicConnected 
                ? 'text-lime-400 border border-lime-400/40 bg-lime-950/20 shadow-[0_0_12px_rgba(163,230,53,0.25)]' 
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Access microphone to track breathing cadence and vocal strain"
          >
            {isMicConnected ? (
              <>
                <Mic className="h-3.5 w-3.5 text-lime-400 animate-pulse" />
                <span>Mic Sensor Linked</span>
              </>
            ) : (
              <>
                <MicOff className="h-3.5 w-3.5 text-neutral-400" />
                <span>Link Mic Sensor</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsHeartSoundEnabled(!isHeartSoundEnabled)}
            className={`neu-btn p-2 rounded-xl text-xs transition-colors ${
              isHeartSoundEnabled ? 'text-lime-400' : 'text-neutral-400 hover:text-white'
            }`}
            title={isHeartSoundEnabled ? 'Mute Heart Beat Audio' : 'Enable Cardiac Pulse Audio Click'}
          >
            {isHeartSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

        </div>
      </div>

      {/* Main Real-Time Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: Big BPM Readout & Heart Rate Zone Card (4 cols) */}
        <div className="lg:col-span-4 neu-card-sm rounded-3xl p-5 space-y-4 border border-white/5">
          
          {/* Top Heart Rate Numerals */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Instantaneous Heart Rate
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`font-mono text-5xl font-black tabular-nums tracking-tight ${zoneInfo.color} drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]`}>
                  {currentBpm}
                </span>
                <span className="font-mono text-sm text-neutral-400 font-bold uppercase">
                  BPM
                </span>
              </div>
            </div>

            {/* Target HR / % of Max HR */}
            <div className="text-right">
              <span className="font-mono text-xl font-extrabold text-white tabular-nums">
                {zoneInfo.percent}%
              </span>
              <div className="text-[10px] font-mono text-neutral-400 uppercase">
                of HRmax
              </div>
            </div>
          </div>

          {/* Current Zone Badge */}
          <div className={`p-3 rounded-2xl border ${zoneInfo.bgColor} space-y-1`}>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={zoneInfo.color}>{zoneInfo.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-neutral-300">
                Zone {zoneInfo.zone}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-snug">
              {zoneInfo.desc}
            </p>
          </div>

          {/* Physiological Micro-telemetry Strip */}
          <div className="neu-inset-subtle p-3 rounded-xl grid grid-cols-3 gap-2 text-center font-mono text-xs">
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">RR Interval</div>
              <div className="text-white font-bold tabular-nums mt-0.5">{rrIntervalMs} ms</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Live HRV</div>
              <div className="text-emerald-400 font-bold tabular-nums mt-0.5">{liveHrvMs} ms</div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase">Elapsed</div>
              <div className="text-neutral-300 font-bold tabular-nums mt-0.5">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Acoustic Decibel Sensor Level (when mic connected) */}
          {isMicConnected && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                <span>Acoustic Exertion Meter</span>
                <span className="text-lime-400 font-bold">{audioInputLevel}%</span>
              </div>
              <div className="neu-inset h-2 w-full rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-lime-400 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                  style={{ width: `${audioInputLevel}%` }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Real-Time ECG / PPG Oscilloscope & Zone Controller (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* ECG Oscilloscope Screen */}
          <div className="neu-inset rounded-2xl p-3 sm:p-4 relative overflow-hidden border border-black/60 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.9)]">
            
            {/* Top Oscilloscope Screen Metadata */}
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                <span className="text-white font-bold">LEAD II ELECTROCARDIOGRAM (ECG) SIMULATOR</span>
              </div>
              <div className="flex items-center gap-3">
                <span>GAIN: 1.0x</span>
                <span>SWEEP: 25mm/s</span>
                <span className={zoneInfo.color}>STATUS: SYNCHRONIZED</span>
              </div>
            </div>

            {/* Canvas ECG Waveform */}
            <div className="h-36 sm:h-44 w-full relative rounded-xl overflow-hidden bg-[#111319]">
              <canvas
                ref={canvasRef}
                width={700}
                height={176}
                className="w-full h-full block"
              />
            </div>

            {/* Bottom Screen Indicator */}
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1">
              <span>RR PEAK DETECTOR: PASSIVE</span>
              <span>FILTER: 0.05Hz - 150Hz</span>
              <span className="text-neutral-300">ATHLETE: {athlete.name}</span>
            </div>

          </div>

          {/* Interactive Intensity Presets & Manual Exertion Slider */}
          <div className="neu-card-sm p-4 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-lime-400" />
                <span>Simulate Athletic Intensity & Cardiovascular Load:</span>
              </span>

              {/* Intensity Presets */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: 'resting', label: 'Rest', bpm: 48 },
                  { id: 'aerobic', label: 'Z2 Base', bpm: 142 },
                  { id: 'tempo', label: 'Z3 Tempo', bpm: 160 },
                  { id: 'threshold', label: 'Z4 Threshold', bpm: 172 },
                  { id: 'surge', label: 'Z5 Surge', bpm: 185 },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id as IntensityPreset)}
                    className="neu-btn px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-neutral-300 hover:text-white transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exertion Range Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Effort Level (Borg Exertion Spectrum)</span>
                <span className="text-lime-400 font-bold tabular-nums">
                  {manualExertionPercent}% Effort → Target {targetBpm} BPM
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualExertionPercent}
                onChange={handleSliderChange}
                className="w-full"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Sensor Health Status Banner */}
      <div className="neu-inset-subtle rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-neutral-300">
        <div className="flex items-center gap-2.5">
          <Radio className={`h-4 w-4 ${isMicConnected ? 'text-lime-400 animate-pulse' : 'text-neutral-400'}`} />
          <span>{sensorStatusMsg}</span>
        </div>

        <div className="font-mono text-[11px] text-neutral-400">
          Target Ceiling: <strong className="text-rose-400">{maxHr} BPM</strong> · Baseline: <strong className="text-blue-400">{restingHr} BPM</strong>
        </div>
      </div>

    </section>
  );
};
