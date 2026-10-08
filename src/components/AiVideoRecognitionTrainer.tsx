import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Upload, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  RotateCcw, 
  ShieldCheck, 
  Search, 
  Volume2, 
  ArrowRight,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ALL_GAMES_DATABASE, GameCategory, GameEntry, searchGames } from '../data/allGamesDatabase';
import { speakCue } from '../utils/audioCoach';

interface RecognizedResult {
  recognizedGame: string;
  recognizedCategory: string;
  detectedAction: string;
  confidenceScore: number;
  overallFormScore: number;
  movementEfficiency: string;
  detectedPhases: {
    phase: string;
    timestampSec: number;
    keypointSummary: string;
    coachingCue: string;
  }[];
  jointAnglesDetected: {
    joint: string;
    observedAngle: string;
    idealTargetAngle: string;
    deviationDegrees: number;
    isFault: boolean;
  }[];
  identifiedFaults: {
    faultName: string;
    severity: string;
    impact: string;
    correctionCue: string;
  }[];
  trainingRecommendations: string[];
}

interface TrainingResult {
  trainingStatus: string;
  accuracyImprovementPercent: number;
  calibratedModelVersion: string;
  totalTrainingSamples: number;
  learnedBiomechanicalRules: string[];
  updatedJointThresholds: {
    joint: string;
    calibratedTolerance: string;
    athleteBaseline: string;
  }[];
  modelConfirmationSummary: string;
}

interface Props {
  onOpenThreeDPosture?: (gameName: string) => void;
}

export const AiVideoRecognitionTrainer: React.FC<Props> = ({ onOpenThreeDPosture }) => {
  // 200+ Games Directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'All'>('All');
  const [selectedGame, setSelectedGame] = useState<GameEntry>(ALL_GAMES_DATABASE[0]);

  // Video state
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [userContextNotes, setUserContextNotes] = useState<string>('');

  // AI Recognition state
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognizedResult | null>(null);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  // AI Training & Calibration state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingFeedbackNotes, setTrainingFeedbackNotes] = useState<string>('');
  const [correctedActionName, setCorrectedActionName] = useState<string>('');
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [trainedSampleCount, setTrainedSampleCount] = useState<number>(() => {
    return parseInt(localStorage.getItem('techo_trained_sample_count') || '12', 10);
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredGames = searchGames(searchQuery, selectedCategory);

  // Handle Video file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedVideoUrl(url);
    setIsWebcamActive(false);
    setRecognitionResult(null);
    setTrainingResult(null);

    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.play();
    }
  };

  // Toggle live webcam recording
  const handleToggleWebcam = async () => {
    if (isWebcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
        setUploadedVideoUrl(null);
        setRecognitionResult(null);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setRecognitionError('Webcam access was not granted or is unavailable.');
      }
    }
  };

  // Run AI Video Recognition
  const handleRunRecognition = async () => {
    setIsRecognizing(true);
    setRecognitionError(null);

    try {
      // Capture current video frame to base64 if available
      let frameBase64: string | undefined = undefined;
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          frameBase64 = canvas.toDataURL('image/jpeg', 0.85);
        }
      }

      const res = await fetch('/api/games/recognize-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameImageBase64: frameBase64,
          userNotes: `${userContextNotes || selectedGame.name} - Key movement: ${selectedGame.keyMovement}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Video recognition failed');
      }

      setRecognitionResult(data.recognition);
      setCorrectedActionName(data.recognition.detectedAction || selectedGame.keyMovement);
    } catch (err: any) {
      console.error(err);
      setRecognitionError(err.message || 'Video recognition service unavailable.');
    } finally {
      setIsRecognizing(false);
    }
  };

  // Train & Calibrate the AI Model with user's feedback
  const handleTrainAiModel = async () => {
    setIsTraining(true);
    try {
      const nextCount = trainedSampleCount + 1;
      const res = await fetch('/api/ai/train-recognition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGame.id,
          gameName: selectedGame.name,
          correctedActionLabel: correctedActionName || selectedGame.keyMovement,
          userFeedbackNotes: trainingFeedbackNotes || 'Calibrated joint tracking and release point accuracy for student biomechanics.',
          calibratedJointAngles: recognitionResult?.jointAnglesDetected || [],
          trainingSampleCount: nextCount,
        }),
      });

      const data = await res.json();
      if (data.success && data.trainingProfile) {
        setTrainingResult(data.trainingProfile);
        setTrainedSampleCount(nextCount);
        localStorage.setItem('techo_trained_sample_count', nextCount.toString());
      }
    } catch (err) {
      console.error('AI training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const categories: (GameCategory | 'All')[] = [
    'All',
    'Ball & Invasion Games',
    'Racket & Paddle Sports',
    'Bat & Striking Games',
    'Track & Field Athletics',
    'Combat & Martial Arts',
    'Strength & Powerlifting',
    'Aquatic & Water Sports',
    'Cycling & Wheel Sports',
    'Winter Sports',
    'Gymnastics & Calisthenics',
    'Target & Precision Sports',
    'Action & Adventure Sports',
    'Traditional & Emerging Games',
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* 200+ Games Library Search & Selection Header */}
      <div className="neu-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-lime-700 uppercase tracking-wider mb-2">
              <Layers className="h-4 w-4" />
              <span>Olympic & International Sports Library (200+ Disciplines)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              200+ Games & AI Video Recognition Studio
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Select any game from the comprehensive 230+ catalog, upload user video, and train the AI model to recognize and critique performance technique.
            </p>
          </div>

          <div className="neu-inset rounded-2xl p-4 flex items-center gap-4 text-xs font-semibold text-slate-700">
            <ShieldCheck className="h-7 w-7 text-lime-600 shrink-0" />
            <div>
              <div className="text-slate-500 uppercase text-[10px]">Trained AI Samples</div>
              <div className="text-lg font-black text-slate-900">{trainedSampleCount} video calibrations</div>
              <div className="text-lime-700 text-[11px] font-bold">Model v3.8 Active</div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by game name, movement (e.g. Jump Shot, Snatch, Forehand, Lunge), or joint..."
              className="neu-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-medium text-slate-800 bg-[#eef2f6]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="neu-input px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-800 bg-[#eef2f6]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Games Horizontal Scroller / Grid */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-3 scrollbar-none">
          {filteredGames.slice(0, 18).map((game) => {
            const isSelected = selectedGame.id === game.id;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className={`neu-card shrink-0 w-64 text-left p-3.5 rounded-2xl transition-all ${
                  isSelected ? 'border-2 border-lime-600 shadow-md bg-lime-50/30' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lime-800 bg-lime-100 px-2 py-0.5 rounded-md">
                    {game.energySystem}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">{game.olympicStatus}</span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{game.name}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{game.keyMovement}</p>
                <div className="mt-2 text-[10px] text-slate-500 font-medium truncate">
                  Fault: {game.primaryFault}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio: Video Input & AI Recognition Trainer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Video Capture & Player (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="neu-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-lime-700 uppercase tracking-wider">
                  Target Sport: {selectedGame.name}
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  User Sports Video Feed
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="neu-btn px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5 text-lime-700" />
                  <span>Upload Video</span>
                </button>
                <button
                  onClick={handleToggleWebcam}
                  className={`neu-btn px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isWebcamActive ? 'text-rose-600' : 'text-slate-700'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5 text-lime-700" />
                  <span>{isWebcamActive ? 'Stop Camera' : 'Live Camera'}</span>
                </button>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div className="neu-inset relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                loop
                muted
                controls
                className="w-full h-full object-cover"
              />

              {!uploadedVideoUrl && !isWebcamActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white">
                  <Camera className="h-12 w-12 text-lime-400 mb-3 animate-pulse" />
                  <h3 className="text-base font-bold">Provide Your Sports Video Clip</h3>
                  <p className="text-xs text-slate-300 max-w-md mt-1 mb-4">
                    Upload a video recording or start your webcam. The AI will inspect kinematics for <span className="text-lime-300 font-semibold">{selectedGame.name}</span>.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      Choose Video File
                    </button>
                    <button
                      onClick={handleToggleWebcam}
                      className="neu-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    >
                      Use Camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Context & Run Recognition Bar */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={userContextNotes}
                onChange={(e) => setUserContextNotes(e.target.value)}
                placeholder={`Athlete note (e.g. practicing ${selectedGame.keyMovement} with heavy load)`}
                className="neu-input flex-1 px-4 py-2.5 rounded-xl text-xs text-slate-800 bg-[#eef2f6]"
              />
              <button
                onClick={handleRunRecognition}
                disabled={isRecognizing}
                className="neu-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap shadow-md"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isRecognizing ? 'AI Vision Processing...' : 'Recognize Video With AI'}</span>
              </button>
            </div>

            {recognitionError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{recognitionError}</span>
              </div>
            )}
          </div>

          {/* AI Training & Fine-Tuning Box */}
          <div className="neu-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-lime-700" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Train the AI on This Video
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Ground-Truth Calibration
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Teach the AI engine your custom technique preferences, coach cues, and verified sport actions. The model updates its neural biomechanics matrix specifically for your movement profile.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Verified / Corrected Action Label
                </label>
                <input
                  type="text"
                  value={correctedActionName}
                  onChange={(e) => setCorrectedActionName(e.target.value)}
                  placeholder="e.g. High-Release Jump Shot with Staggered Base"
                  className="neu-input w-full px-3.5 py-2 rounded-xl text-xs font-medium text-slate-800 bg-[#eef2f6]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Coach Calibration Feedback & Joint Correction Notes
                </label>
                <textarea
                  rows={2}
                  value={trainingFeedbackNotes}
                  onChange={(e) => setTrainingFeedbackNotes(e.target.value)}
                  placeholder="e.g. Calibrate elbow angle tolerance to 88-92°. Flag any forward pelvis drift exceeding 5cm. Emphasize fingertip roll."
                  className="neu-input w-full px-3.5 py-2 rounded-xl text-xs font-medium text-slate-800 bg-[#eef2f6]"
                />
              </div>

              <button
                onClick={handleTrainAiModel}
                disabled={isTraining}
                className="neu-btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{isTraining ? 'Calibrating Neural Weights...' : 'Train & Calibrate AI Recognition Model'}</span>
              </button>

              {trainingResult && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Model Successfully Trained
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      +{trainingResult.accuracyImprovementPercent}% Accuracy Gain
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{trainingResult.modelConfirmationSummary}</p>
                  <div className="text-[11px] text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Learned Rule:</span>{' '}
                    {trainingResult.learnedBiomechanicalRules[0] || 'Calibrated joint angle sensitivity'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Recognition & Biomechanical Results (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="neu-card rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                AI Recognition Analysis
              </h3>
              {recognitionResult && (
                <span className="text-xs font-extrabold text-lime-700 bg-lime-100 px-2.5 py-1 rounded-md">
                  {Math.round(recognitionResult.confidenceScore * 100)}% Confidence
                </span>
              )}
            </div>

            {recognitionResult ? (
              <div className="space-y-4">
                {/* Recognition Badge */}
                <div className="neu-inset rounded-2xl p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Detected Sport & Action
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {recognitionResult.recognizedGame}
                  </div>
                  <div className="text-xs font-semibold text-lime-700 mt-0.5">
                    {recognitionResult.detectedAction} · {recognitionResult.recognizedCategory}
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-300/70 text-xs">
                    <span className="font-bold text-slate-700">Form Score:</span>
                    <span className="text-base font-black text-slate-900">{recognitionResult.overallFormScore} / 100</span>
                  </div>
                </div>

                {/* Detected Movement Phases */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Detected Kinetic Phases
                  </h4>
                  <div className="space-y-2">
                    {recognitionResult.detectedPhases.map((phase, idx) => (
                      <div key={idx} className="neu-inset rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{phase.phase}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{phase.timestampSec}s</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{phase.keypointSummary}</p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-lime-800 font-semibold text-[11px]">
                          <Volume2
                            className="h-3 w-3 cursor-pointer shrink-0"
                            onClick={() => speakCue(phase.coachingCue)}
                          />
                          <span>Cue: {phase.coachingCue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detected Joint Angles */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Protractor Joint Angles
                  </h4>
                  <div className="neu-inset rounded-2xl p-3 text-xs space-y-2">
                    {recognitionResult.jointAnglesDetected.map((j, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 last:border-none">
                        <div>
                          <span className="font-semibold text-slate-800">{j.joint}</span>
                          {j.isFault && (
                            <span className="ml-1.5 text-[10px] text-rose-600 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                              Fault
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">{j.observedAngle}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">(Target: {j.idealTargetAngle})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Identified Faults */}
                {recognitionResult.identifiedFaults.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Identified Power Leaks
                    </h4>
                    <div className="space-y-2">
                      {recognitionResult.identifiedFaults.map((f, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                          <div className="flex items-center justify-between font-bold text-amber-900">
                            <span>{f.faultName}</span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-200/70">{f.severity}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 mt-1">{f.impact}</p>
                          <div className="mt-1 text-emerald-800 font-semibold text-[11px]">
                            Fix: {f.correctionCue}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                <Sparkles className="h-8 w-8 text-slate-400 mx-auto mb-2 animate-bounce" />
                <p className="font-bold text-slate-700">No Video Analysis Yet</p>
                <p className="mt-1 max-w-xs mx-auto text-slate-500">
                  Upload user footage or turn on your camera and click "Recognize Video With AI" to detect technique and joint mechanics.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
