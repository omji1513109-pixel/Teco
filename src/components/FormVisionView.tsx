import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  RefreshCw, 
  Crosshair, 
  Activity,
  Layers,
  Info,
  Box
} from 'lucide-react';
import { FormAnalysisResult, FormPreset } from '../types';
import { formPresets } from '../data/mockData';
import { GameVideoAnalyzer } from './GameVideoAnalyzer';
import { AiVideoRecognitionTrainer } from './AiVideoRecognitionTrainer';

export const FormVisionView: React.FC = () => {
  const [activeToolMode, setActiveToolMode] = useState<'ai-video-trainer' | '3d-game-coach' | 'single-frame-audit'>('ai-video-trainer');
  const [selectedPreset, setSelectedPreset] = useState<FormPreset>(formPresets[0]);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [athleteDrillNotes, setAthleteDrillNotes] = useState('Heavy working set, checking depth and torso angle');
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial demo analysis if none performed yet
  useEffect(() => {
    if (!analysisResult) {
      setAnalysisResult({
        exerciseAnalyzed: selectedPreset.name,
        formScore: 88,
        movementEfficiencyTier: 'Proficient (Minor compensatory torque)',
        kineticChainCheck: {
          headAndSpine: 'Neutral cervical spine, minor thoracic flexion past 95° knee flexion.',
          hipAndPelvis: 'Optimal posterior pelvic tilt control; hips break parallel cleanly.',
          kneeTracking: 'Mild valgus drift (3° inward torque) on initial concentric turnaround.',
          ankleAndFoot: 'Adequate dorsiflexion; heel stays grounded on platform.',
          barOrLimbPath: 'Bar path stays within 2.5cm of mid-foot center of mass.',
        },
        identifiedFaults: [
          {
            fault: 'Concentric knee valgus collapse (inward knee drift)',
            severity: 'Medium',
            biomechanicalConsequence: 'Transfers shear stress to anterior cruciate ligament (ACL) and decreases gluteus medius force generation.',
          },
          {
            fault: 'Slight early lumbar flexion at sticking point',
            severity: 'Low',
            biomechanicalConsequence: 'Increases compressive shear on L4-L5 intervertebral discs under maximal loads.',
          },
        ],
        strengths: [
          'Excellent hip depth achieving below-parallel without pelvic wink',
          'Stable tripod foot pressure maintained throughout eccentric descent',
          'Controlled 2.5-second eccentric tempo with crisp stretch-shortening reversal',
        ],
        immediateCues: [
          'Actively spread the floor apart with the lateral edges of your feet as you reverse direction.',
          'Keep your chest proud and drive your upper back straight up into the bar.',
        ],
        correctivePrescription: {
          drillName: 'Banded Box Squats with External Abduction Isometric',
          protocol: '3 sets of 8 reps with light resistance band looped below knee caps, 3-sec pause on box.',
          targetDeficit: 'Gluteus medius and piriformis motor unit recruitment to stabilize lateral knee tracking.',
        },
      });
    }
  }, [selectedPreset]);

  // Handle camera start/stop
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraActive(true);
        setCustomImageBase64(null);
      } catch (err: any) {
        console.error('Camera access denied:', err);
        setErrorMsg('Camera access unavailable. You can upload an image or use the pre-loaded athletic motion frames.');
      }
    }
  };

  // Capture snapshot from webcam
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCustomImageBase64(dataUrl);
      handleToggleCamera();
    }
  };

  // Upload image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCustomImageBase64(reader.result as string);
      setIsCameraActive(false);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Form Analysis
  const handleRunFormAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const activeImage = customImageBase64 || null;

      const res = await fetch('/api/form/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseName: selectedPreset.name,
          notes: athleteDrillNotes,
          imageBase64: activeImage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Biomechanical evaluation failed');
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Render skeletal vector overlay on top of frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showSkeletonOverlay) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;

    // Draw simulated kinematic biomechanical vectors
    ctx.strokeStyle = '#a3e635'; // neon lime
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    let joints: [number, number][] = [];
    if (selectedPreset.id === 'squat') {
      joints = [
        [w * 0.52, h * 0.22],
        [w * 0.51, h * 0.32],
        [w * 0.44, h * 0.58],
        [w * 0.58, h * 0.68],
        [w * 0.48, h * 0.88],
        [w * 0.58, h * 0.90],
      ];
    } else {
      joints = [
        [w * 0.55, h * 0.20],
        [w * 0.50, h * 0.35],
        [w * 0.46, h * 0.50],
        [w * 0.60, h * 0.65],
        [w * 0.58, h * 0.86],
      ];
    }

    ctx.beginPath();
    joints.forEach(([x, y], idx) => {
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    joints.forEach(([x, y]) => {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w * 0.51, h * 0.15);
    ctx.lineTo(w * 0.51, h * 0.92);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText('COM VECTOR (0.0° PLUMB)', w * 0.53, h * 0.18);

  }, [selectedPreset, showSkeletonOverlay, customImageBase64]);

  const displayImage = customImageBase64 || selectedPreset.image;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Level Mode Switcher: 200+ Games AI Trainer vs 3D Game Video Coach vs Single Frame Audit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-300/70 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-lime-700 uppercase tracking-wider">
            Kinematic Modality:
          </span>
        </div>

        <div className="neu-inset p-1 rounded-2xl flex flex-wrap items-center gap-1 text-xs self-start sm:self-center shadow-inner">
          <button
            onClick={() => setActiveToolMode('ai-video-trainer')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeToolMode === 'ai-video-trainer'
                ? 'neu-btn text-lime-800 shadow-sm border border-lime-500/40 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-lime-700" />
            <span>200+ Games & AI Video Trainer</span>
          </button>

          <button
            onClick={() => setActiveToolMode('3d-game-coach')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeToolMode === '3d-game-coach'
                ? 'neu-btn text-lime-800 shadow-sm border border-lime-500/40 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="h-3.5 w-3.5 text-lime-700" />
            <span>3D Posture Guide & Mannequin</span>
          </button>

          <button
            onClick={() => setActiveToolMode('single-frame-audit')}
            className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all ${
              activeToolMode === 'single-frame-audit'
                ? 'neu-btn text-lime-800 shadow-sm border border-lime-500/40 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Single Rep Audit</span>
          </button>
        </div>
      </div>

      {activeToolMode === 'ai-video-trainer' ? (
        <AiVideoRecognitionTrainer onOpenThreeDPosture={() => setActiveToolMode('3d-game-coach')} />
      ) : activeToolMode === '3d-game-coach' ? (
        <GameVideoAnalyzer />
      ) : (
        <>
          {/* Page Header */}
          <div className="border-b border-black/40 pb-6">
            <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
              FormVision Kinematics
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">
              Biomechanical Form & Movement Analysis
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Computer vision posture critique. Inspect joint vectors, compensatory torque, and injury power leaks with Gemini 3.8 Flash.
            </p>
          </div>

      {/* Main Analysis Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Video/Image Frame & Kinematics Canvas HUD (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Preset Drill Switcher Bar with Neumorphic buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {formPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedPreset(preset);
                  setCustomImageBase64(null);
                  if (isCameraActive) handleToggleCamera();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedPreset.id === preset.id && !customImageBase64 && !isCameraActive
                    ? 'neu-btn-active text-lime-400 border border-lime-400/30'
                    : 'neu-btn text-neutral-400 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Interactive Frame Viewport in Neumorphic Card Housing */}
          <div className="neu-card rounded-3xl p-2 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.03)]">
            <div className="relative aspect-4/3 w-full rounded-2xl bg-neutral-950 overflow-hidden shadow-inner">
              
              {/* Live Camera View */}
              {isCameraActive ? (
                <div className="relative h-full w-full">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={handleCaptureFrame}
                      className="neu-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-md"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      <span>Capture Rep</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Still image */
                <div className="relative h-full w-full">
                  <img
                    src={displayImage}
                    alt={selectedPreset.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />

                  {/* Canvas Kinematic Vector Overlay */}
                  {showSkeletonOverlay && (
                    <canvas
                      ref={canvasRef}
                      width={800}
                      height={600}
                      className="absolute inset-0 h-full w-full pointer-events-none"
                    />
                  )}
                </div>
              )}

              {/* Overlaid HUD status */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs">
                <span className="neu-inset-subtle rounded-lg px-3 py-1 font-mono text-lime-400 text-[11px] font-semibold">
                  {selectedPreset.name}
                </span>
                {showSkeletonOverlay && (
                  <span className="neu-inset-subtle rounded-lg px-3 py-1 font-mono text-neutral-300 text-[11px]">
                    KINEMATICS OVERLAY ACTIVE
                  </span>
                )}
              </div>

              {/* Bottom HUD metadata */}
              <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
                <div className="neu-inset-subtle rounded-xl px-3.5 py-1.5 text-xs text-neutral-300">
                  <span className="text-neutral-400">Target Range: </span>
                  <span className="font-mono text-white tabular-nums font-semibold">{selectedPreset.keyAngles.normalRange}</span>
                </div>

                <button
                  onClick={() => setShowSkeletonOverlay(!showSkeletonOverlay)}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs text-neutral-200 hover:text-white flex items-center gap-1.5 font-medium"
                >
                  <Layers className="h-3.5 w-3.5 text-lime-400" />
                  <span>{showSkeletonOverlay ? 'Hide Vectors' : 'Show Vectors'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Media Capture / Upload Toolstrip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleCamera}
                className={`neu-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                  isCameraActive
                    ? 'text-red-400 border border-red-500/40 bg-red-950/20'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <Camera className="h-4 w-4 text-lime-400" />
                <span>{isCameraActive ? 'Stop Camera' : 'Live Webcam Coach'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                <Upload className="h-4 w-4 text-neutral-400" />
                <span>Upload Rep Video/Photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <button
              onClick={handleRunFormAnalysis}
              disabled={isAnalyzing}
              className="neu-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold disabled:opacity-50 whitespace-nowrap"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Computing Joint Kinematics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execute AI Biomechanical Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Drill Context Input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Athlete Execution Context & Sticking Points
            </label>
            <input
              type="text"
              value={athleteDrillNotes}
              onChange={(e) => setAthleteDrillNotes(e.target.value)}
              placeholder="e.g. Set 4 of 5 at 85% 1RM. Felt slight knee cave on rep 3."
              className="neu-inset w-full rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="neu-inset p-3.5 rounded-xl border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: AI Biomechanical Audit Report (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {analysisResult ? (
            <div className="neu-card rounded-3xl p-6 sm:p-7 space-y-6 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)]">
              
              {/* Score header */}
              <div className="flex items-center justify-between border-b border-black/40 pb-5">
                <div>
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                    Biomechanical Score
                  </div>
                  <h3 className="text-xl font-extrabold text-white drop-shadow-sm">
                    {analysisResult.exerciseAnalyzed}
                  </h3>
                  <p className="text-xs text-lime-400 font-semibold mt-1">
                    {analysisResult.movementEfficiencyTier}
                  </p>
                </div>
                
                {/* Sunken Score Well */}
                <div className="neu-inset px-4 py-3 rounded-2xl flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-4xl font-black text-white tabular-nums drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                      {analysisResult.formScore}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">/100</span>
                  </div>
                  <span className="text-[9px] text-lime-400 uppercase font-mono font-bold mt-0.5">
                    Kinematic Index
                  </span>
                </div>
              </div>

              {/* Immediate Mental Cues for Next Rep */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-lime-400" />
                  <span>Immediate Mental Cues for Next Rep</span>
                </div>
                <div className="space-y-2">
                  {analysisResult.immediateCues.map((cue, idx) => (
                    <div key={idx} className="neu-inset-subtle p-3 rounded-xl text-xs text-lime-200 flex items-start gap-2 border border-lime-400/20">
                      <span className="text-lime-400 font-bold font-mono">0{idx + 1}.</span>
                      <span className="leading-snug">{cue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kinetic Chain Verification Breakdown */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  Kinetic Chain Alignment Check
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="neu-inset-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-neutral-400 font-semibold">Head & Spine</span>
                    <span className="text-neutral-200 sm:text-right">{analysisResult.kineticChainCheck.headAndSpine}</span>
                  </div>
                  <div className="neu-inset-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-neutral-400 font-semibold">Hip & Pelvis</span>
                    <span className="text-neutral-200 sm:text-right">{analysisResult.kineticChainCheck.hipAndPelvis}</span>
                  </div>
                  <div className="neu-inset-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-neutral-400 font-semibold">Knee Tracking</span>
                    <span className="text-neutral-200 sm:text-right">{analysisResult.kineticChainCheck.kneeTracking}</span>
                  </div>
                  <div className="neu-inset-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-neutral-400 font-semibold">Ankle & Foot</span>
                    <span className="text-neutral-200 sm:text-right">{analysisResult.kineticChainCheck.ankleAndFoot}</span>
                  </div>
                  <div className="neu-inset-subtle p-3 rounded-xl flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span className="text-neutral-400 font-semibold">Bar Path Plumb</span>
                    <span className="text-neutral-200 sm:text-right">{analysisResult.kineticChainCheck.barOrLimbPath}</span>
                  </div>
                </div>
              </div>

              {/* Identified Faults & Consequence */}
              {analysisResult.identifiedFaults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Identified Faults & Injury Risk</span>
                  </div>
                  <div className="space-y-2">
                    {analysisResult.identifiedFaults.map((fault, idx) => (
                      <div key={idx} className="neu-inset p-3.5 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-200">{fault.fault}</span>
                          <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-md ${
                            fault.severity === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : fault.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {fault.severity} Severity
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px] leading-relaxed">
                          {fault.biomechanicalConsequence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrective Mobility Prescription */}
              <div className="neu-card-sm p-4 rounded-2xl space-y-2 border border-lime-400/20">
                <div className="flex items-center gap-2 text-xs font-bold text-lime-400 uppercase tracking-wider">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Corrective Exercise Prescription</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {analysisResult.correctivePrescription.drillName}
                </div>
                <div className="text-xs text-neutral-300 font-mono">
                  {analysisResult.correctivePrescription.protocol}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed pt-1">
                  <span className="font-semibold text-neutral-300">Targeting Deficit: </span>
                  {analysisResult.correctivePrescription.targetDeficit}
                </p>
              </div>

            </div>
          ) : (
            <div className="neu-card rounded-3xl p-8 text-center space-y-3">
              <Info className="h-8 w-8 text-neutral-500 mx-auto" />
              <h3 className="text-base font-bold text-white">Ready for Biomechanical Audit</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Select a drill preset or record your movement with your camera, then click "Execute AI Biomechanical Audit" to receive instant joint angles and corrective cues.
              </p>
            </div>
          )}
        </div>

      </div>
      </>
      )}

    </div>
  );
};
