import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Crosshair, 
  Volume2, 
  RefreshCw, 
  Sliders, 
  ArrowRight,
  Info,
  Layers,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { GAME_DRILLS, GameDrill, MovementPhase } from '../data/gameKinematicsData';
import { ThreeDPostureGuide } from './ThreeDPostureGuide';
import { speakCue } from '../utils/audioCoach';

export const GameVideoAnalyzer: React.FC = () => {
  const [selectedDrill, setSelectedDrill] = useState<GameDrill>(GAME_DRILLS[0]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [viewLayout, setViewLayout] = useState<'split' | '3d-focus' | 'video-focus'>('split');
  
  // Video & camera states
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoPlaybackRate, setVideoPlaybackRate] = useState<number>(0.5);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordCountdown, setRecordCountdown] = useState<number | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [customUploadedVideoUrl, setCustomUploadedVideoUrl] = useState<string | null>(null);
  const [isAiAuditing, setIsAiAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // References
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const videoOverlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activePhase = selectedDrill.phases[activePhaseIndex] || selectedDrill.phases[0];

  // Draw on-video 2D skeletal keypoints matching the active phase
  useEffect(() => {
    const canvas = videoOverlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Draw coordinate grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h);
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    // Center of Mass plumb line in dotted red/lime
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h * 0.15);
    ctx.lineTo(w * 0.52, h * 0.92);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw skeletal nodes based on selected game and phase
    let joints: [number, number, string, boolean][] = [];

    if (selectedDrill.id === 'basketball-jumpshot') {
      if (activePhaseIndex === 0) {
        joints = [
          [w * 0.52, h * 0.22, 'Head', false],
          [w * 0.51, h * 0.32, 'Shoulder', false],
          [w * 0.62, h * 0.40, 'Elbow (Flared 68°)', true],
          [w * 0.58, h * 0.28, 'Wrist Ball Pocket', false],
          [w * 0.50, h * 0.55, 'Hip Crest', false],
          [w * 0.54, h * 0.72, 'Knee Valgus', true],
          [w * 0.50, h * 0.90, 'Ankle Base', false],
        ];
      } else if (activePhaseIndex === 2) {
        joints = [
          [w * 0.51, h * 0.18, 'Head', false],
          [w * 0.51, h * 0.26, 'Shoulder', false],
          [w * 0.58, h * 0.16, 'High Elbow', true],
          [w * 0.60, h * 0.08, 'Release Point', true],
          [w * 0.50, h * 0.48, 'Pelvis Airborne', false],
          [w * 0.52, h * 0.66, 'Extended Knees', false],
          [w * 0.51, h * 0.85, 'Plantar Ankles', false],
        ];
      } else {
        joints = [
          [w * 0.52, h * 0.20, 'Head', false],
          [w * 0.51, h * 0.30, 'Shoulder', false],
          [w * 0.60, h * 0.36, 'Elbow', true],
          [w * 0.57, h * 0.22, 'Hand', false],
          [w * 0.50, h * 0.52, 'Hip', false],
          [w * 0.53, h * 0.70, 'Knee', false],
          [w * 0.50, h * 0.88, 'Foot', false],
        ];
      }
    } else if (selectedDrill.id === 'soccer-penalty') {
      joints = [
        [w * 0.46, h * 0.25, 'Head (Lean Back)', true],
        [w * 0.48, h * 0.36, 'Thorax', true],
        [w * 0.50, h * 0.55, 'Hips Open', false],
        [w * 0.42, h * 0.72, 'Plant Knee', false],
        [w * 0.40, h * 0.92, 'Plant Foot', true],
        [w * 0.64, h * 0.68, 'Striking Leg', false],
        [w * 0.72, h * 0.85, 'Striking Foot Sweetspot', true],
      ];
    } else {
      joints = [
        [w * 0.50, h * 0.22, 'Cervical Spine', false],
        [w * 0.50, h * 0.34, 'Upper Torso', false],
        [w * 0.44, h * 0.58, 'Hip Crease', false],
        [w * 0.56, h * 0.70, 'Knee Tracking', true],
        [w * 0.48, h * 0.88, 'Midfoot Tripod', false],
      ];
    }

    // Connect limbs with neon kinematic lines
    ctx.strokeStyle = '#a3e635';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    joints.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw joint dots (red if fault, lime if optimal)
    joints.forEach(([x, y, label, isFault]) => {
      // Glow circle
      ctx.fillStyle = isFault ? 'rgba(244, 63, 94, 0.4)' : 'rgba(163, 230, 53, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();

      // Core point
      ctx.fillStyle = isFault ? '#f43f5e' : '#a3e635';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = isFault ? '#fda4af' : '#d9f99d';
      ctx.fillText(label, x + 12, y + 4);
    });

  }, [selectedDrill, activePhaseIndex]);

  // Handle webcam start / stop
  const handleToggleWebcam = async () => {
    if (isWebcamActive) {
      if (videoElementRef.current && videoElementRef.current.srcObject) {
        const stream = videoElementRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElementRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
          videoElementRef.current.play();
        }
        setIsWebcamActive(true);
        setRecordedVideoUrl(null);
        setCustomUploadedVideoUrl(null);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setErrorMsg('Webcam access was not granted or is unavailable in this environment.');
      }
    }
  };

  // Start 5-second video recording of student rep
  const handleStartRecording = () => {
    if (!videoElementRef.current || !videoElementRef.current.srcObject) return;

    let countdown = 3;
    setRecordCountdown(countdown);

    const timer = setInterval(() => {
      countdown -= 1;
      if (countdown > 0) {
        setRecordCountdown(countdown);
      } else {
        clearInterval(timer);
        setRecordCountdown(null);
        startMediaRecording();
      }
    }, 1000);
  };

  const startMediaRecording = () => {
    if (!videoElementRef.current || !videoElementRef.current.srcObject) return;
    const stream = videoElementRef.current.srcObject as MediaStream;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setRecordedVideoUrl(videoUrl);
      setIsWebcamActive(false);
      setIsRecording(false);

      // Stop camera stream
      stream.getTracks().forEach((track) => track.stop());
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = null;
        videoElementRef.current.src = videoUrl;
        videoElementRef.current.play();
      }
    };

    mediaRecorder.start();
    setIsRecording(true);

    // Record for 4.5 seconds
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }, 4500);
  };

  // Custom Video File Upload (.mp4, .mov, .webm)
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomUploadedVideoUrl(url);
    setRecordedVideoUrl(null);
    setIsWebcamActive(false);

    if (videoElementRef.current) {
      videoElementRef.current.src = url;
      videoElementRef.current.play();
    }
  };

  // Execute Gemini AI Biomechanical Audit for this game frame
  const handleExecuteAiAudit = async () => {
    setIsAiAuditing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/form/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: `${selectedDrill.sportCategory} - ${selectedDrill.gameTitle}`,
          notes: `Movement phase: ${activePhase.name}. Primary focus: ${activePhase.coachingCue}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Biomechanical audit failed');
      }

      setAuditResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Audit service unavailable');
    } finally {
      setIsAiAuditing(false);
    }
  };

  const activeVideoSource = customUploadedVideoUrl || recordedVideoUrl;

  return (
    <div className="space-y-8 pb-14">
      
      {/* Header with Game Selection Badges */}
      <div className="border-b border-black/40 pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="neu-btn px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-lime-400 tracking-wider uppercase">
              3D AI Video Kinematics
            </span>
            <span className="text-neutral-500 text-xs">·</span>
            <span className="text-xs text-neutral-400 font-mono">Olympic Method Posture Guide</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm flex items-center gap-3">
            <span>Game Video Analyzer & 3D Guidance</span>
          </h1>
          <p className="text-sm text-neutral-300 mt-1 max-w-3xl leading-relaxed">
            Take or upload game video of any sport, analyze biomechanical movement phases, and use an interactive 3D mannequin animation to guide the student toward optimal posture.
          </p>
        </div>

        {/* View Layout Switcher */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="neu-inset-subtle p-1 rounded-2xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewLayout('split')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                viewLayout === 'split' ? 'neu-btn text-lime-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewLayout('3d-focus')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                viewLayout === '3d-focus' ? 'neu-btn text-lime-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              3D Focus
            </button>
            <button
              onClick={() => setViewLayout('video-focus')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                viewLayout === 'video-focus' ? 'neu-btn text-lime-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Video Focus
            </button>
          </div>
        </div>
      </div>

      {/* Game Drill Selector Bar (Zero-pill horizontal list) */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Select Game / Sport Technique to Analyze:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GAME_DRILLS.map((drill) => (
            <button
              key={drill.id}
              onClick={() => {
                setSelectedDrill(drill);
                setActivePhaseIndex(0);
                setRecordedVideoUrl(null);
                setCustomUploadedVideoUrl(null);
                if (isWebcamActive) handleToggleWebcam();
              }}
              className={`neu-card group text-left rounded-2xl p-3.5 transition-all hover:scale-[1.02] ${
                selectedDrill.id === drill.id
                  ? 'border-lime-400/40 shadow-[6px_6px_16px_rgba(0,0,0,0.8),-4px_-4px_12px_rgba(163,230,53,0.15)] bg-[#191e28]'
                  : 'hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                <span className="text-lime-400 font-bold">{drill.sportCategory}</span>
                <span className="tabular-nums font-semibold">{drill.biomechanicalScore}/100</span>
              </div>
              <div className="text-xs font-bold text-white line-clamp-1 group-hover:text-lime-300">
                {drill.gameTitle.split('—')[1]?.trim() || drill.gameTitle}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400">
                <span className={`w-1.5 h-1.5 rounded-full ${drill.injuryRiskLevel === 'High' ? 'bg-red-400' : drill.injuryRiskLevel === 'Medium' ? 'bg-amber-400' : 'bg-lime-400'}`} />
                <span className="truncate">{drill.efficiencyTier.split('(')[0]?.trim()}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Analysis Chamber: Split (Video HUD on Left + 3D Animation Guide on Right) */}
      <div className={`grid gap-8 ${
        viewLayout === 'split' 
          ? 'grid-cols-1 lg:grid-cols-12' 
          : viewLayout === '3d-focus' 
          ? 'grid-cols-1' 
          : 'grid-cols-1'
      }`}>
        
        {/* Left Column: Game Video Player & Scrubbing HUD (6 or 7 cols) */}
        {(viewLayout === 'split' || viewLayout === 'video-focus') && (
          <div className={`${viewLayout === 'split' ? 'lg:col-span-6' : 'col-span-12'} space-y-5`}>
            
            {/* Video Viewport Frame */}
            <div className="neu-card rounded-3xl p-2.5 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
              <div className="relative aspect-16/9 w-full rounded-2xl bg-black overflow-hidden shadow-inner flex items-center justify-center">
                
                {/* 1. Live Webcam Feed */}
                {isWebcamActive ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoElementRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Countdown Overlay */}
                    {recordCountdown !== null && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                        <span className="font-mono text-7xl font-extrabold text-lime-400 animate-bounce">
                          {recordCountdown}
                        </span>
                        <span className="text-xs font-mono text-neutral-300 mt-2 uppercase tracking-widest">
                          Get in position...
                        </span>
                      </div>
                    )}

                    {/* Recording in progress banner */}
                    {isRecording && (
                      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 neu-inset px-3 py-1.5 rounded-full border border-red-500/50 bg-red-950/40">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        <span className="text-xs font-mono text-red-300 font-bold uppercase tracking-wider">
                          Recording Rep (5s)...
                        </span>
                      </div>
                    )}
                  </div>
                ) : activeVideoSource ? (
                  /* 2. Custom Uploaded or Recorded Video */
                  <video
                    ref={videoElementRef}
                    src={activeVideoSource}
                    playsInline
                    controls={false}
                    className="w-full h-full object-cover"
                    onTimeUpdate={() => {
                      if (videoElementRef.current) {
                        setCurrentTimeSec(videoElementRef.current.currentTime);
                      }
                    }}
                  />
                ) : (
                  /* 3. Preset Game Action Photography with Kinematics Overlay */
                  <div className="relative w-full h-full">
                    <img
                      src={selectedDrill.coverImage}
                      alt={selectedDrill.gameTitle}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center filter brightness-95"
                    />
                    
                    {/* Kinematic vector canvas overlay */}
                    <canvas
                      ref={videoOverlayCanvasRef}
                      width={800}
                      height={450}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    />
                  </div>
                )}

                {/* Video HUD Overlays */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <span className="neu-inset-subtle px-3 py-1 rounded-xl text-[11px] font-mono text-lime-400 font-bold shadow-md">
                    {selectedDrill.gameTitle.split('—')[0]?.trim()}
                  </span>
                  <span className="neu-inset-subtle px-2.5 py-1 rounded-xl text-[10px] font-mono text-neutral-300">
                    PHASE 0{activePhaseIndex + 1}: {activePhase.name.split(':')[1]?.trim() || activePhase.name}
                  </span>
                </div>

                {/* Score badge top-right */}
                <div className="absolute top-3 right-3 z-20">
                  <div className="neu-inset px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">Score:</span>
                    <span className="text-xs font-mono font-black text-lime-400 tabular-nums">
                      {selectedDrill.biomechanicalScore}/100
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Video Recording & Upload Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleWebcam}
                  className={`neu-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    isWebcamActive ? 'text-red-400 border border-red-500/40 bg-red-950/20' : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Camera className="h-4 w-4 text-lime-400" />
                  <span>{isWebcamActive ? 'Close Camera' : 'Record Student Rep'}</span>
                </button>

                {isWebcamActive && !isRecording && (
                  <button
                    onClick={handleStartRecording}
                    className="neu-btn-primary inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-md"
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    <span>Record 5s Drill</span>
                  </button>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  <Upload className="h-4 w-4 text-neutral-400" />
                  <span>Upload Game Video</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>

              <button
                onClick={handleExecuteAiAudit}
                disabled={isAiAuditing}
                className="neu-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold disabled:opacity-50 whitespace-nowrap shadow-md"
              >
                {isAiAuditing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Auditing Kinematics...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Execute AI Game Audit</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <div className="neu-inset p-3.5 rounded-xl border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Video Phase Scrubber & Timing Indicators */}
            <div className="neu-card-sm p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Movement Timeline & Phase Markers</span>
                <span className="font-mono text-lime-400 text-[11px]">
                  Phase {activePhaseIndex + 1} of {selectedDrill.phases.length}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {selectedDrill.phases.map((phase, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhaseIndex(idx)}
                    className={`p-2 rounded-xl text-left transition-all ${
                      activePhaseIndex === idx
                        ? 'neu-btn-active text-lime-400 font-bold border border-lime-400/30'
                        : 'neu-btn text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[9px] font-mono text-neutral-400 uppercase">Phase {idx + 1}</div>
                    <div className="text-xs truncate">{phase.name.split(':')[1]?.trim() || phase.name}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Right Column: Interactive 3D Posture Guide (6 or 12 cols) */}
        {(viewLayout === 'split' || viewLayout === '3d-focus') && (
          <div className={`${viewLayout === 'split' ? 'lg:col-span-6' : 'col-span-12'}`}>
            <ThreeDPostureGuide
              drill={selectedDrill}
              activePhaseIndex={activePhaseIndex}
              onPhaseChange={(newIdx) => setActivePhaseIndex(newIdx)}
            />
          </div>
        )}

      </div>

      {/* Suggested Right Method & Posture Critique Breakdown */}
      <section className="neu-card rounded-3xl p-6 sm:p-7 space-y-6">
        
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/40 pb-4">
          <div>
            <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-0.5">
              Kinematic Prescription & Correction
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Biomechanical Posture Critique for Student
            </h3>
          </div>

          <div className="neu-inset-subtle px-4 py-2 rounded-xl flex items-center gap-3 text-xs">
            <span className="text-neutral-400 font-medium">Primary Power Leak:</span>
            <span className="text-amber-400 font-semibold">{selectedDrill.primaryPowerLeak}</span>
          </div>
        </div>

        {/* Side-by-Side: Student Flawed Posture vs Right Method (Gold Standard) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left: What the Student Did (Detected Faults) */}
          <div className="neu-inset p-5 rounded-2xl space-y-4 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <h4 className="font-bold text-white text-sm">
                  Student's Observed Flaws ({activePhase.name.split(':')[1]?.trim() || activePhase.name})
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Needs Correction
              </span>
            </div>

            {/* List of Faults */}
            <div className="space-y-2">
              {activePhase.detectedFaults.map((fault, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-neutral-900/60 text-xs text-rose-200 border border-rose-500/20 flex items-start gap-2">
                  <span className="text-rose-400 font-bold font-mono">⚠️</span>
                  <span className="leading-relaxed">{fault}</span>
                </div>
              ))}
            </div>

            {/* Measured Joint Angles */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Joint Angle Kinematics
              </div>
              <div className="space-y-1 text-xs font-mono">
                {activePhase.studentJointAngles.map((angle, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/30">
                    <span className="text-neutral-300">{angle.label}</span>
                    <span className={`font-bold tabular-nums ${angle.isFault ? 'text-rose-400' : 'text-neutral-300'}`}>
                      {angle.studentAngle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: The Right Method & Gold Standard Technique */}
          <div className="neu-inset p-5 rounded-2xl space-y-4 border border-lime-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-lime-400" />
                <h4 className="font-bold text-white text-sm">
                  The Right Method (Gold Standard Guidance)
                </h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono bg-lime-500/10 text-lime-400 border border-lime-500/20">
                Olympic Standard
              </span>
            </div>

            {/* Step-by-Step Right Method Prescriptions */}
            <div className="space-y-2">
              {activePhase.rightMethodPrescription.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-neutral-900/60 text-xs text-lime-200 border border-lime-500/20 flex items-start gap-2">
                  <span className="text-lime-400 font-bold font-mono">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            {/* Ideal Target Angles */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Ideal Target Plumb & Alignment
              </div>
              <div className="space-y-1 text-xs font-mono">
                {activePhase.studentJointAngles.map((angle, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/30">
                    <span className="text-neutral-300">{angle.label}</span>
                    <span className="text-lime-400 font-bold tabular-nums">
                      {angle.idealAngle}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Kinetic Chain Alignment Check & Corrective Drill Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Kinetic Chain Verification */}
          <div className="neu-card-sm p-5 rounded-2xl space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-lime-400" />
              <span>Kinetic Chain Alignment Check</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div className="neu-inset-subtle p-2.5 rounded-xl flex justify-between gap-2">
                <span className="text-neutral-400 font-semibold">Head & Cervical Spine:</span>
                <span className="text-neutral-200 text-right">{selectedDrill.kineticChainSummary.headSpine}</span>
              </div>
              <div className="neu-inset-subtle p-2.5 rounded-xl flex justify-between gap-2">
                <span className="text-neutral-400 font-semibold">Shoulders & Arms:</span>
                <span className="text-neutral-200 text-right">{selectedDrill.kineticChainSummary.shouldersArms}</span>
              </div>
              <div className="neu-inset-subtle p-2.5 rounded-xl flex justify-between gap-2">
                <span className="text-neutral-400 font-semibold">Hips & Pelvis:</span>
                <span className="text-neutral-200 text-right">{selectedDrill.kineticChainSummary.hipsPelvis}</span>
              </div>
              <div className="neu-inset-subtle p-2.5 rounded-xl flex justify-between gap-2">
                <span className="text-neutral-400 font-semibold">Knees & Ankles:</span>
                <span className="text-neutral-200 text-right">{selectedDrill.kineticChainSummary.kneesAnkles}</span>
              </div>
            </div>
          </div>

          {/* Corrective Exercise Prescription */}
          <div className="neu-card-sm p-5 rounded-2xl space-y-3 border border-lime-400/20">
            <div className="text-xs font-bold text-lime-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-lime-400" />
              <span>Prescribed Corrective Drill</span>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-extrabold text-white">
                {selectedDrill.drillPrescription.name}
              </h4>
              <div className="neu-inset-subtle px-3 py-1.5 rounded-xl text-xs font-mono text-lime-300">
                {selectedDrill.drillPrescription.setsReps}
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed pt-1">
                <span className="font-semibold text-neutral-200">Target Deficit: </span>
                {selectedDrill.drillPrescription.purpose}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => speakCue(`Focus on this corrective drill: ${selectedDrill.drillPrescription.name}. ${selectedDrill.drillPrescription.purpose}`)}
                className="neu-btn px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-all"
              >
                <Volume2 className="h-3.5 w-3.5 text-lime-400" />
                <span>Hear Drill Protocol</span>
              </button>
            </div>
          </div>

        </div>

      </section>

    </div>
  );
};
