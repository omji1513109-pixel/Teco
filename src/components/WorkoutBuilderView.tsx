import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  Sparkles, 
  Flame, 
  Timer, 
  Heart, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  Zap
} from 'lucide-react';
import { SportDiscipline, WorkoutPlan } from '../types';
import { speakCue } from '../utils/audioCoach';

interface WorkoutBuilderViewProps {
  currentWorkout: WorkoutPlan;
  onUpdateWorkout: (workout: WorkoutPlan) => void;
  isLiveModeActive: boolean;
  onCloseLiveMode: () => void;
}

export const WorkoutBuilderView: React.FC<WorkoutBuilderViewProps> = ({
  currentWorkout,
  onUpdateWorkout,
  isLiveModeActive,
  onCloseLiveMode,
}) => {
  // Generation state
  const [sport, setSport] = useState<SportDiscipline>('Running');
  const [goal, setGoal] = useState('Threshold & VO2 Max');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [fatigueLevel, setFatigueLevel] = useState(3);
  const [experienceLevel, setExperienceLevel] = useState('Competitive Age-Grouper');
  const [equipment, setEquipment] = useState('Standard Track & Gym');
  const [focusNotes, setFocusNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Adaptation state
  const [adaptPrompt, setAdaptPrompt] = useState('');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptSuccessNote, setAdaptSuccessNote] = useState<string | null>(null);

  // Live workout execution timer state
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(480); // 8 mins default
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  // Timer interval hook
  useEffect(() => {
    let interval: any = null;
    if (isLiveRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            speakCue('Block complete. Transition to designated recovery interval.');
            return 0;
          }
          if (prev === 60) {
            speakCue('One minute remaining in block. Maintain posture and cadence.');
          } else if (prev === 10) {
            speakCue('Ten seconds! Drive to the finish line!');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLiveRunning, timerSeconds]);

  // Format seconds to MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    setAdaptSuccessNote(null);

    try {
      const res = await fetch('/api/workout/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport,
          goal,
          durationMinutes,
          experienceLevel,
          fatigueLevel,
          equipment,
          focusNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate protocol');
      }

      onUpdateWorkout(data.workout);
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'Generation failed. Check server status.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdapt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adaptPrompt.trim()) return;

    setIsAdapting(true);
    setAdaptSuccessNote(null);

    try {
      const res = await fetch('/api/workout/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalWorkout: currentWorkout,
          athleteFeedback: adaptPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to adapt protocol');
      }

      onUpdateWorkout(data.workout);
      setAdaptSuccessNote(data.workout.adaptationRationale || 'Session successfully adapted to physiological constraints.');
      setAdaptPrompt('');
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'Adaptation failed.');
    } finally {
      setIsAdapting(false);
    }
  };

  const handlePlayCue = (cueText: string) => {
    setIsVoiceActive(true);
    speakCue(cueText, () => setIsVoiceActive(false));
  };

  const currentBlock = currentWorkout.mainBlocks[currentBlockIndex] || currentWorkout.mainBlocks[0];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/40 pb-6">
        <div>
          <div className="text-xs font-semibold text-lime-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(163,230,53,0.3)]">
            Athletic Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-sm">
            Periodized Session Builder & Live Engine
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Generate target-driven interval blocks or run live with audible biometric cues.
          </p>
        </div>

        {/* Mode status indicator */}
        <div className="flex items-center gap-2">
          {isLiveModeActive && (
            <div className="neu-inset-subtle flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-lime-400/30 text-lime-400 text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
              </span>
              <span>Live Engine Running</span>
            </div>
          )}
        </div>
      </div>

      {/* LIVE WORKOUT EXECUTION HUD (Neumorphic Elevated Command Console) */}
      <div className="neu-card rounded-3xl p-6 sm:p-8 shadow-[8px_8px_24px_rgba(0,0,0,0.7),-6px_-6px_18px_rgba(255,255,255,0.035)] relative overflow-hidden border border-lime-400/20">
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Active Interval Readout */}
          <div className="space-y-2 text-center lg:text-left w-full lg:w-auto">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-lime-400 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Current Block ({currentBlockIndex + 1} of {currentWorkout.mainBlocks.length})</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
              {currentBlock?.title || 'Active Interval'}
            </h2>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-neutral-300 font-mono tabular-nums">
              <span className="text-lime-400 font-semibold">{currentBlock?.intensity}</span>
              <span className="text-neutral-600">·</span>
              <span>{currentBlock?.intervalsOrReps}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">Rest: {currentBlock?.restInterval}</span>
            </div>
          </div>

          {/* Central Neumorphic Sunken Digital Chamber */}
          <div className="neu-inset px-8 py-5 rounded-2xl flex flex-col items-center border border-black/60 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.85),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]">
            <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
              {formatTime(timerSeconds)}
            </div>
            <span className="text-[10px] font-mono text-lime-400 mt-1 uppercase tracking-wider font-semibold">
              Interval Target Countdown
            </span>
          </div>

          {/* Controls Bar with tactile buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLiveRunning(!isLiveRunning)}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all ${
                isLiveRunning
                  ? 'bg-amber-500 text-neutral-950 shadow-[5px_5px_14px_rgba(0,0,0,0.7),-3px_-3px_8px_rgba(245,158,11,0.25)] hover:bg-amber-400'
                  : 'neu-btn-primary'
              }`}
            >
              {isLiveRunning ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
              <span>{isLiveRunning ? 'Pause' : 'Start Interval'}</span>
            </button>

            <button
              onClick={() => {
                setIsLiveRunning(false);
                setTimerSeconds(480);
              }}
              className="neu-btn p-3.5 rounded-2xl text-neutral-300 hover:text-white"
              title="Reset current interval timer"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={() => {
                const nextIdx = (currentBlockIndex + 1) % currentWorkout.mainBlocks.length;
                setCurrentBlockIndex(nextIdx);
                setTimerSeconds(480);
                speakCue(`Entering ${currentWorkout.mainBlocks[nextIdx]?.title || 'Next block'}`);
              }}
              className="neu-btn p-3.5 rounded-2xl text-neutral-300 hover:text-white"
              title="Skip to next block"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

        </div>

        {/* Live Audio Cues for current interval */}
        {currentBlock?.coachingCues && currentBlock.coachingCues.length > 0 && (
          <div className="neu-inset-subtle mt-6 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <span className="font-bold text-lime-400">Kinematic Focus:</span>
              <span>{currentBlock.coachingCues[0]}</span>
            </div>
            <button
              onClick={() => handlePlayCue(currentBlock.coachingCues[0])}
              className="neu-btn px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-lime-400 hover:text-lime-300 font-bold shrink-0"
            >
              <Volume2 className="h-4 w-4" />
              <span>Broadcast Cue to Earbuds</span>
            </button>
          </div>
        )}
      </div>

      {/* Two Column Layout: Workout Generator Configurator & Active Structured Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI Workout Generator Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="neu-card rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-black/40 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-lime-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Protocol Generator
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Gemini 3.8 Flash</span>
            </div>

            {/* Sport selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Sport & Discipline
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['Running', 'Hyrox & Functional', 'Strength & Powerlifting', 'Cycling', 'Triathlon & Endurance', 'Sprints & Plyometrics'] as SportDiscipline[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={`p-2.5 rounded-xl text-left font-semibold transition-all ${
                      sport === s
                        ? 'neu-btn-active text-lime-400 border border-lime-400/30'
                        : 'neu-btn text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Objective */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-2">
                Target Physiological Objective
              </label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="neu-inset w-full rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="Threshold & VO2 Max">Threshold & VO2 Max Development</option>
                <option value="Aerobic Base Building">Aerobic Base Building (Zone 2 Steady-State)</option>
                <option value="Lactate Tolerance & Glycolytic Capacity">Lactate Tolerance & Glycolytic Capacity</option>
                <option value="Maximal Strength & Neural Drive">Maximal Strength & Neural Drive (1-5 RM)</option>
                <option value="Hypertrophy & Work Capacity">Hypertrophy & Work Capacity</option>
                <option value="Speed Endurance & Top Velocity">Speed Endurance & Top Velocity</option>
                <option value="Race-Specific Taper Priming">Race-Specific Taper Priming</option>
                <option value="Active Recovery & Metabolic Flush">Active Recovery & Metabolic Flush</option>
              </select>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Available Time</span>
                <span className="font-mono text-lime-400 tabular-nums">{durationMinutes} minutes</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                <span>20 min (Quick)</span>
                <span>60 min (Standard)</span>
                <span>120 min (Long)</span>
              </div>
            </div>

            {/* Current Fatigue Level */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-neutral-300 mb-1.5">
                <span>Pre-Session Fatigue (1-10)</span>
                <span className="font-mono text-amber-400 tabular-nums">{fatigueLevel} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={fatigueLevel}
                onChange={(e) => setFatigueLevel(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                {fatigueLevel <= 3 ? 'Fresh & primed for high neuro-muscular strain' : fatigueLevel <= 6 ? 'Normal moderate fatigue; standard volume' : 'High central fatigue; engine will auto-scale interval density'}
              </p>
            </div>

            {/* Equipment Available */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Available Equipment
              </label>
              <input
                type="text"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g. 400m Track, Barbell, Dumbbells, Treadmill"
                className="neu-inset w-full rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Custom Notes / Specific Focus */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Specific Athlete Focus / Guardrails
              </label>
              <textarea
                rows={2}
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="e.g. Focus on cadence >180, avoid deep knee flexion, emphasize downhill control"
                className="neu-inset w-full rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none resize-none"
              />
            </div>

            {/* Error banner if any */}
            {genError && (
              <div className="neu-inset p-3 rounded-xl border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>{genError}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="neu-btn-primary w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-bold disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Synthesizing Physiological Protocol...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Periodized Protocol</span>
                </>
              )}
            </button>

          </div>

          {/* REAL-TIME WORKOUT ADAPTATION CARD */}
          <div className="neu-card rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <RefreshCw className="h-3.5 w-3.5 text-lime-400" />
              <span>Real-Time On-The-Fly Adaptation</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Unexpected fatigue? Weather change? Time cut in half? Tell Techo and your session will be scientifically restructured while keeping the main training adaptation intact.
            </p>

            <form onSubmit={handleAdapt} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={adaptPrompt}
                  onChange={(e) => setAdaptPrompt(e.target.value)}
                  placeholder="e.g. Tight hamstrings, drop sprints to zone 2 flush"
                  className="neu-inset flex-1 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isAdapting || !adaptPrompt.trim()}
                  className="neu-btn rounded-xl px-4 py-2.5 text-xs font-bold text-white hover:text-lime-300 disabled:opacity-50 whitespace-nowrap"
                >
                  {isAdapting ? 'Adapting...' : 'Adapt'}
                </button>
              </div>
            </form>

            {adaptSuccessNote && (
              <div className="neu-inset p-3.5 rounded-xl border border-lime-400/30 text-xs text-lime-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" />
                  <span>Physiological Adaptation Rationale:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-lime-200/90">{adaptSuccessNote}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Structured Workout Protocol Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="neu-card rounded-3xl p-6 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="space-y-2 border-b border-black/40 pb-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-lime-400">
                <span>{currentWorkout.sport}</span>
                <span className="text-neutral-600">·</span>
                <span>Target RPE {currentWorkout.targetRPE}/10</span>
                <span className="text-neutral-600">·</span>
                <span>{currentWorkout.targetHeartRateZone}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white drop-shadow-sm">
                {currentWorkout.workoutName}
              </h2>
              <div className="neu-inset rounded-xl p-3.5 text-xs text-neutral-300 leading-relaxed">
                <span className="font-semibold text-lime-400">Metabolic Mechanism: </span>
                {currentWorkout.physiologicalAdaptation}
              </div>
            </div>

            {/* Dynamic Warmup */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]" />
                <span>Phase 1: Dynamic Prep & Mobility ({currentWorkout.warmup.length} drills)</span>
              </div>
              <div className="space-y-2.5">
                {currentWorkout.warmup.map((item, idx) => (
                  <div key={idx} className="neu-inset-subtle p-3.5 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-neutral-400 text-[11px] mt-0.5">{item.cue}</div>
                    </div>
                    <div className="neu-btn px-2.5 py-1 rounded-md font-mono text-neutral-200 text-xs tabular-nums shrink-0 ml-4 font-semibold">
                      {item.durationOrReps}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Working Blocks */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                <span>Phase 2: Main Working Blocks & Intervals</span>
              </div>
              <div className="space-y-3">
                {currentWorkout.mainBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl transition-all ${
                      currentBlockIndex === idx
                        ? 'neu-inset border border-lime-400/40 bg-[#111319]'
                        : 'neu-card-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Block {idx + 1}: {block.title}</span>
                          <span className="text-xs font-mono text-lime-400 tabular-nums">({block.sets})</span>
                        </div>
                        <div className="text-xs text-neutral-300 font-mono tabular-nums">
                          {block.intervalsOrReps} · Rest: {block.restInterval}
                        </div>
                      </div>
                      <span className="neu-btn px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-400 font-bold">
                        {block.intensity}
                      </span>
                    </div>

                    {block.coachingCues && block.coachingCues.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-black/40">
                        <div className="text-[11px] text-neutral-400 space-y-1">
                          {block.coachingCues.map((cue, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-1.5">
                              <span className="text-lime-400">›</span>
                              <span>{cue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cool-Down & Downregulation */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span>Phase 3: Cool-Down & Vagal Reactivation</span>
              </div>
              <div className="space-y-2.5">
                {currentWorkout.cooldown.map((item, idx) => (
                  <div key={idx} className="neu-inset-subtle p-3.5 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{item.exercise}</div>
                      <div className="text-neutral-400 text-[11px] mt-0.5">{item.purpose}</div>
                    </div>
                    <div className="neu-btn px-2.5 py-1 rounded-md font-mono text-neutral-200 text-xs tabular-nums shrink-0 ml-4 font-semibold">
                      {item.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coach Voice Cues */}
            {currentWorkout.audioCoachCues && currentWorkout.audioCoachCues.length > 0 && (
              <div className="neu-card-sm p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-lime-400" />
                    <span>Audible In-Ear Coaching Cues</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">Click to listen</span>
                </div>
                <div className="space-y-2">
                  {currentWorkout.audioCoachCues.map((cue, idx) => (
                    <div
                      key={idx}
                      onClick={() => handlePlayCue(cue)}
                      className="neu-btn p-3 rounded-xl cursor-pointer flex items-center justify-between text-xs text-neutral-300 transition-colors"
                    >
                      <span className="line-clamp-1 italic">"{cue}"</span>
                      <Volume2 className="h-3.5 w-3.5 text-lime-400 shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition & Fueling Advice */}
            <div className="neu-inset rounded-2xl p-4 text-xs text-neutral-300 space-y-1">
              <span className="font-semibold text-white">Fueling & Hydration Guidance: </span>
              <span>{currentWorkout.nutritionHydrationAdvice}</span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
